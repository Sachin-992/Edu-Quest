import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const start = Date.now();
    const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

    // 1. Database connectivity
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const dbStart = Date.now();
        const { error } = await supabase.from("schools").select("id").limit(1);
        checks.database = { ok: !error, ms: Date.now() - dbStart };
        if (error) checks.database.error = error.message;
    } catch (e) {
        checks.database = { ok: false, error: e.message };
    }

    // 2. Auth service
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const authStart = Date.now();
        const { error } = await supabase.auth.getSession();
        checks.auth = { ok: true, ms: Date.now() - authStart };
    } catch (e) {
        checks.auth = { ok: false, error: e.message };
    }

    // 3. Edge Functions runtime
    checks.edge_functions = { ok: true, ms: 0 };

    // Summary
    const allOk = Object.values(checks).every(c => c.ok);
    const totalMs = Date.now() - start;

    const body = {
        status: allOk ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        response_time_ms: totalMs,
        version: Deno.env.get("DEPLOYMENT_VERSION") || "1.0.0",
        checks,
    };

    return new Response(JSON.stringify(body, null, 2), {
        status: allOk ? 200 : 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});
