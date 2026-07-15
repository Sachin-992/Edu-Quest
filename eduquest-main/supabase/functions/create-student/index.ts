import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  Deno.env.get("ALLOWED_ORIGIN") || "",
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
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

    // Step 1: Ensure user row exists in users table (trigger may have run already)
    const newUserId = newUser.user.id;
    const { data: existingUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("auth_id", newUserId)
      .maybeSingle();

    let internalUserId = existingUser?.id;

    if (!internalUserId) {
      // Trigger didn't run yet — insert manually
      const { data: insertedUser } = await serviceClient
        .from("users")
        .insert({
          auth_id: newUserId,
          email: generatedEmail,
          name: full_name,
          role: "student",
          status: "active",
          school_id: school_id || null,
          first_login: true,
        })
        .select("id")
        .single();
      internalUserId = insertedUser?.id;
    }

    if (internalUserId) {
      // Step 2: Insert directly into students table (this is what profiles view reads from)
      await serviceClient.from("students").upsert({
        user_id: internalUserId,
        name: full_name,
        full_name,
        school_id: school_id || null,
        roll_number,
        roll_no: parseInt(roll_number.replace(/\D/g, "") || "0") || null,
        class: String(classLevelNum),
        status: "active",
      }, { onConflict: "user_id" });

      // Step 3: Update school_id on users row too (for profiles view COALESCE)
      if (school_id) {
        await serviceClient.from("users").update({ school_id }).eq("id", internalUserId);
      }
    }

    // Step 4: Ensure student role is set (user_roles is a view of users.role)
    await serviceClient.from("user_roles").upsert({
      user_id: newUserId,
      role: "student",
    }, { onConflict: "user_id" });

    // Audit log
    const { data: adminSchool } = await serviceClient.rpc("get_user_school_id", { _user_id: adminId });
    if (adminSchool) {
      await serviceClient.from("audit_log").insert({
        school_id: adminSchool,
        user_id: adminId,
        action: "student.create",
        resource_type: "student",
        resource_id: newUserId,
        metadata: { full_name, roll_number, class_level },
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
