import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_dummykey";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "dummyshadosecret";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return error("Missing Authorization header", 401);

        const supabase = createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const adminClient = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
        );

        // Get authenticated user
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) return error("Unauthorized", 401);

        // Get user role
        const { data: actor } = await adminClient
            .from("users")
            .select("id, role, status")
            .eq("auth_id", authData.user.id)
            .single();

        if (!actor || actor.status !== "active") {
            return error("User is not active", 403);
        }

        const body = await req.json();
        const { action, payload } = body;

        if (!action) return error("Missing action", 400);

        // =====================================================
        // 💳 CREATE ORDER
        // =====================================================
        if (action === "createOrder") {
            const { invoice_id } = payload;
            if (!invoice_id) return error("Missing invoice_id", 400);

            // Fetch the fee record (which holds amount and paid to compute due)
            const { data: feeRecord, error: feeErr } = await adminClient
                .from("fee_records")
                .select("id, student_id, fee_type, amount, paid, due, status")
                .eq("id", invoice_id)
                .single();

            if (feeErr || !feeRecord) {
                return error("Invoice/Fee record not found", 404);
            }

            if (feeRecord.status === "paid") {
                return error("Invoice is already fully paid", 400);
            }

            const dueAmount = Number(feeRecord.due);
            if (dueAmount <= 0) {
                return error("No outstanding balance due", 400);
            }

            const isSimulation = payload.simulate || RAZORPAY_KEY_ID === "rzp_test_dummykey";

            if (isSimulation) {
                const mockOrderId = `order_sim_${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}`;
                return json({
                    success: true,
                    order_id: mockOrderId,
                    amount: dueAmount,
                    currency: "INR",
                    simulate: true,
                    key_id: RAZORPAY_KEY_ID
                });
            }

            // Create actual Razorpay order
            const authStr = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
            const razorpayUrl = "https://api.razorpay.com/v1/orders";
            const response = await fetch(razorpayUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${authStr}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: Math.round(dueAmount * 100), // in paise
                    currency: "INR",
                    receipt: invoice_id,
                    notes: {
                        student_id: feeRecord.student_id,
                        fee_type: feeRecord.fee_type
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Razorpay order API failed:", errText);
                return error("Failed to initiate Razorpay order", 500);
            }

            const orderData = await response.json();
            return json({
                success: true,
                order_id: orderData.id,
                amount: dueAmount,
                currency: "INR",
                simulate: false,
                key_id: RAZORPAY_KEY_ID
            });
        }

        // =====================================================
        // 🔒 VERIFY PAYMENT & UPDATE STATE
        // =====================================================
        if (action === "verifyPayment") {
            const { invoice_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, simulate } = payload;
            if (!invoice_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return error("Missing verification details", 400);
            }

            const isSimulation = simulate || razorpay_order_id.startsWith("order_sim_") || RAZORPAY_KEY_ID === "rzp_test_dummykey";

            // Verify signature
            if (!isSimulation) {
                const msg = `${razorpay_order_id}|${razorpay_payment_id}`;
                const verified = await verifyHmacSha256(msg, razorpay_signature, RAZORPAY_KEY_SECRET);
                if (!verified) {
                    return error("Invalid signature verification failed", 400);
                }
            }

            // Fetch invoice & fee records
            const { data: feeRecord, error: feeErr } = await adminClient
                .from("fee_records")
                .select("id, student_id, fee_type, amount, paid, due, status")
                .eq("id", invoice_id)
                .single();

            if (feeErr || !feeRecord) {
                return error("Invoice/Fee record not found", 404);
            }

            if (feeRecord.status === "paid") {
                return json({ success: true, message: "Already paid" });
            }

            const paymentAmount = Number(feeRecord.due);

            // Fetch student parent details
            const { data: parentLink } = await adminClient
                .from("parent_student_links")
                .select("parent_id")
                .eq("student_id", feeRecord.student_id)
                .limit(1)
                .maybeSingle();

            // Insert into payments table
            const { data: paymentRow, error: payInsertErr } = await adminClient
                .from("payments")
                .insert({
                    fee_record_id: invoice_id,
                    amount: paymentAmount,
                    payment_method: "card", // Default to card (online payment)
                    transaction_id: razorpay_payment_id,
                    received_by: actor.id,
                    invoice_id: invoice_id,
                    student_id: feeRecord.student_id,
                    parent_id: parentLink?.parent_id || null,
                    razorpay_order_id: razorpay_order_id,
                    razorpay_payment_id: razorpay_payment_id,
                    razorpay_signature: razorpay_signature,
                    transaction_status: "successful",
                    paid_at: new Date().toISOString()
                })
                .select()
                .single();

            if (payInsertErr) {
                console.error("Payment insert error:", payInsertErr);
                return error("Failed to record payment transaction", 500);
            }

            // Update fee_records.paid
            const newPaid = Number(feeRecord.paid) + paymentAmount;
            const { error: feeUpdateErr } = await adminClient
                .from("fee_records")
                .update({
                    paid: newPaid,
                    updated_at: new Date().toISOString(),
                    updated_by: actor.id
                })
                .eq("id", invoice_id);

            if (feeUpdateErr) {
                console.error("Fee record update error:", feeUpdateErr);
                return error("Failed to update payment balance", 500);
            }

            // Generate receipt
            const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${razorpay_payment_id.slice(-6).toUpperCase()}`;
            const { error: recErr } = await adminClient
                .from("payment_receipts")
                .insert({
                    payment_id: paymentRow.id,
                    receipt_number: receiptNumber,
                    pdf_url: `https://dummy-receipt-url.com/${paymentRow.id}.pdf`
                });

            if (recErr) {
                console.error("Receipt generation error:", recErr);
            }

            // Create notification for student/parent
            await adminClient.rpc("create_notification", {
                p_user_id: actor.id,
                p_title: `Fee Payment Successful`,
                p_content: `Successfully paid ₹${paymentAmount.toFixed(2)} for ${feeRecord.fee_type} fee. Receipt: ${receiptNumber}`,
                p_type: "info"
            });

            // Write audit log
            await adminClient.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: actor.role,
                action: "FEE_PAYMENT_ONLINE",
                entity: "payments",
                entity_id: paymentRow.id,
                details: JSON.stringify({
                    invoice_id,
                    amount: paymentAmount,
                    method: "online_razorpay",
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    receipt: receiptNumber
                }),
                severity: "success"
            });

            return json({
                success: true,
                message: "Payment verified and processed successfully",
                receipt_number: receiptNumber,
                payment_id: paymentRow.id
            });
        }

        return error("Unknown action", 400);

    } catch (err) {
        console.error("Edge Function error:", err);
        return error("Internal server error", 500);
    }
});

// Helper for verifying HMAC-SHA256 signature
async function verifyHmacSha256(message: string, expectedSignature: string, secret: string): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            cryptoKey,
            messageData
        );

        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex === expectedSignature;
    } catch (e) {
        console.error("HMAC SHA256 error:", e);
        return false;
    }
}

function error(message: string, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function json(data: object) {
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}
