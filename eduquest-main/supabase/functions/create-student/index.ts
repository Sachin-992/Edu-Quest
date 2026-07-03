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

const MIN_PIN_LENGTH = 6;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT — Supabase will enforce this via config, but double-check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use getUser() instead of deprecated getClaims()
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = user.id;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });
    const { data: isSuperAdmin } = await serviceClient.rpc("has_role", {
      _user_id: adminId,
      _role: "super_admin",
    });
    const { data: isSchoolAdmin } = await serviceClient.rpc("has_role", {
      _user_id: adminId,
      _role: "school_admin",
    });

    if (!isAdmin && !isSuperAdmin && !isSchoolAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { full_name, roll_number, class_level, school_id, pin } = await req.json();

    if (!full_name || !roll_number || !pin || !class_level) {
      return new Response(
        JSON.stringify({ error: "full_name, roll_number, class_level and pin are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure class_level is a number
    const classLevelNum = Number(class_level);
    if (isNaN(classLevelNum) || classLevelNum < 1 || classLevelNum > 12) {
      return new Response(
        JSON.stringify({ error: "class_level must be a number between 1 and 12" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce minimum PIN length
    if (String(pin).length < MIN_PIN_LENGTH) {
      return new Response(
        JSON.stringify({ error: `PIN must be at least ${MIN_PIN_LENGTH} characters long` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generatedEmail = `${roll_number.toLowerCase().replace(/\s+/g, "")}@student.eduquest.local`;

    // Create auth user with service role
    const { data: newUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email: generatedEmail,
        password: String(pin),
        email_confirm: true,
        user_metadata: { full_name, roll_number },
      });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with school/class/roll
    await serviceClient
      .from("profiles")
      .update({
        roll_number,
        class_level,
        school_id: school_id || null,
        full_name,
      })
      .eq("user_id", newUser.user.id);

    // Assign student role
    await serviceClient.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "student",
    });

    // Audit log
    const { data: adminSchool } = await serviceClient.rpc("get_user_school_id", { _user_id: adminId });
    if (adminSchool) {
      await serviceClient.from("audit_log").insert({
        school_id: adminSchool,
        user_id: adminId,
        action: "student.create",
        resource_type: "student",
        resource_id: newUser.user.id,
        metadata: { full_name, roll_number, class_level },
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
