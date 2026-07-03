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

// Simple in-memory rate limiter (resets on cold start — acceptable for edge functions)
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record) {
    // Check lockout
    if (record.lockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((record.lockedUntil - now) / 1000) };
    }
    // Reset window if expired
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: 0 });
      return { allowed: true };
    }
    // Increment
    record.count++;
    if (record.count > MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
      return { allowed: false, retryAfter: Math.ceil(LOCKOUT_MS / 1000) };
    }
    return { allowed: true };
  }

  loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: 0 });
  return { allowed: true };
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roll_number, pin, school_code } = await req.json();

    if (!roll_number || !pin) {
      return new Response(
        JSON.stringify({ error: "Roll number and PIN are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit by roll_number (case-insensitive)
    const rateLimitKey = `login:${roll_number.toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many login attempts. Please try again later.",
          retry_after: rateCheck.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter),
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find profile by roll number (and optionally school)
    let query = supabase
      .from("profiles")
      .select("user_id, full_name, roll_number, school_id, is_active")
      .eq("roll_number", roll_number)
      .eq("is_active", true);

    if (school_code) {
      const { data: school } = await supabase
        .from("schools")
        .select("id")
        .eq("code", school_code)
        .maybeSingle();
      if (school) {
        query = query.eq("school_id", school.id);
      }
    }

    const { data: profile, error: profileError } = await query.maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Invalid roll number or account not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Student accounts use a generated email
    const generatedEmail = `${roll_number.toLowerCase().replace(/\s+/g, "")}@student.eduquest.local`;

    // Try to sign in
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey);

    const { data: signInData, error: signInError } =
      await anonClient.auth.signInWithPassword({
        email: generatedEmail,
        password: pin,
      });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Invalid PIN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Successful login — clear rate limit
    clearRateLimit(rateLimitKey);

    // Audit log (fire-and-forget)
    if (profile.school_id) {
      await supabase.from("audit_log").insert({
        school_id: profile.school_id,
        user_id: profile.user_id,
        action: "login.student.success",
        resource_type: "session",
        metadata: { roll_number, school_code: school_code || null },
      });
    }

    return new Response(
      JSON.stringify({
        session: signInData.session,
        user: signInData.user,
        profile: {
          full_name: profile.full_name,
          roll_number: profile.roll_number,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
