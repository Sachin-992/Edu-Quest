import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  Deno.env.get("ALLOWED_ORIGIN") || "",
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    }

    // Verify caller has admin privileges
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const adminId = user.id;

    const [{ data: isAdmin }, { data: isSuperAdmin }, { data: isSchoolAdmin }] = await Promise.all([
      serviceClient.rpc("has_role", { _user_id: adminId, _role: "admin" }),
      serviceClient.rpc("has_role", { _user_id: adminId, _role: "super_admin" }),
      serviceClient.rpc("has_role", { _user_id: adminId, _role: "school_admin" }),
    ]);

    if (!isAdmin && !isSuperAdmin && !isSchoolAdmin) {
      return jsonResponse({ error: "Forbidden: Admin access required" }, 403, corsHeaders);
    }

    const { student_id, new_pin } = await req.json();

    if (!student_id || !new_pin) {
      return jsonResponse({ error: "student_id and new_pin are required" }, 400, corsHeaders);
    }

    if (String(new_pin).length < 6) {
      return jsonResponse({ error: "PIN must be at least 6 characters" }, 400, corsHeaders);
    }

    // Update the student's password using admin API
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      student_id,
      { password: String(new_pin) }
    );

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400, corsHeaders);
    }

    // Audit log
    const { data: adminSchool } = await serviceClient.rpc("get_user_school_id", { _user_id: adminId });
    if (adminSchool) {
      await serviceClient.from("audit_log").insert({
        school_id: adminSchool,
        user_id: adminId,
        action: "student.reset_pin",
        resource_type: "student",
        resource_id: student_id,
        metadata: {},
      });
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error("[reset-student-pin] Error:", err);
    return jsonResponse({ error: "Internal server error" }, 500, getCorsHeaders(req));
  }
});
