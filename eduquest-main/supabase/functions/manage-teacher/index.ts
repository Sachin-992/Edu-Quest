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

const MIN_PASSWORD_LENGTH = 6;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify caller is authenticated
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

    // 2. Verify caller has admin privileges
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

    // 3. Parse the request body
    const body = await req.json();
    const { action } = body;

    // ─── ACTION: create-teacher ───
    if (action === "create-teacher") {
      const { full_name, email, password, school_id } = body;

      if (!full_name || !email || !password) {
        return jsonResponse({ error: "full_name, email, and password are required" }, 400, corsHeaders);
      }
      if (String(password).length < MIN_PASSWORD_LENGTH) {
        return jsonResponse({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, 400, corsHeaders);
      }

      // Create auth user
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return jsonResponse({ error: createError.message }, 400, corsHeaders);
      }

      const newUserId = newUser.user.id;

      // Update profile
      await serviceClient
        .from("profiles")
        .update({ full_name, school_id: school_id || null })
        .eq("user_id", newUserId);

      // Assign teacher role
      await serviceClient.from("user_roles").insert({
        user_id: newUserId,
        role: "teacher",
      });

      // Audit log
      const { data: adminSchool } = await serviceClient.rpc("get_user_school_id", { _user_id: adminId });
      if (adminSchool) {
        await serviceClient.from("audit_log").insert({
          school_id: adminSchool,
          user_id: adminId,
          action: "teacher.create",
          resource_type: "teacher",
          resource_id: newUserId,
          metadata: { full_name, email },
        });
      }

      return jsonResponse({ success: true, user_id: newUserId }, 200, corsHeaders);
    }

    // ─── ACTION: remove-teacher ───
    if (action === "remove-teacher") {
      const { teacher_id } = body;

      if (!teacher_id) {
        return jsonResponse({ error: "teacher_id is required" }, 400, corsHeaders);
      }

      // Delete user role
      await serviceClient
        .from("user_roles")
        .delete()
        .eq("user_id", teacher_id)
        .eq("role", "teacher");

      // Deactivate profile
      await serviceClient
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", teacher_id);

      // Audit log
      const { data: adminSchool } = await serviceClient.rpc("get_user_school_id", { _user_id: adminId });
      if (adminSchool) {
        await serviceClient.from("audit_log").insert({
          school_id: adminSchool,
          user_id: adminId,
          action: "teacher.remove",
          resource_type: "teacher",
          resource_id: teacher_id,
          metadata: {},
        });
      }

      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400, corsHeaders);
  } catch (err) {
    console.error("[manage-teacher] Error:", err);
    return jsonResponse({ error: "Internal server error" }, 500, getCorsHeaders(req));
  }
});
