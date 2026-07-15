import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCTION-HARDENED AI Quiz Generator Edge Function
   ═══════════════════════════════════════════════════════════════════════════ */

// ── CORS ──
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  Deno.env.get("ALLOWED_ORIGIN") || "",
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ── Structured error responses (never throw raw) ──
function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number, corsHeaders: Record<string, string>) {
  console.error(`[generate-quiz] ${status}: ${message}`);
  return jsonResponse({ error: message, status }, status, corsHeaders);
}

// ── Per-admin rate limiter (in-memory, resets on cold start) ──
const RATE_LIMIT_MAX = 5;           // max requests per window
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: RATE_LIMIT_WINDOW_MS - (now - entry.windowStart) };
}

// ── Safe RPC call — returns null if function doesn't exist ──
async function safeRpc(client: any, fnName: string, params: Record<string, unknown>) {
  try {
    const { data, error } = await client.rpc(fnName, params);
    if (error) {
      console.warn(`[RPC] ${fnName} failed (non-fatal): ${error.message}`);
      return null;
    }
    return data;
  } catch (e) {
    console.warn(`[RPC] ${fnName} threw (non-fatal):`, e);
    return null;
  }
}

// ── Safe table insert — silently skips if table doesn't exist ──
async function safeInsert(client: any, table: string, row: Record<string, unknown>) {
  try {
    const { error } = await client.from(table).insert(row);
    if (error) console.warn(`[INSERT] ${table} failed (non-fatal): ${error.message}`);
  } catch (e) {
    console.warn(`[INSERT] ${table} threw (non-fatal):`, e);
  }
}

// ── Build Gemini-native request ──
function buildGeminiNativeRequest(apiKey: string, model: string, systemPrompt: string, userPrompt: string, schema: object) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
  return { url, body, headers: { "Content-Type": "application/json" } };
}

// ── Build OpenAI-compatible request ──
function buildOpenAICompatRequest(gatewayUrl: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string, toolSchema: object) {
  return {
    url: gatewayUrl,
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_quiz_questions",
          description: "Return generated quiz questions in structured format",
          parameters: toolSchema,
        },
      }],
      tool_choice: { type: "function", function: { name: "return_quiz_questions" } },
    },
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
}

/* ═══════════════════════════ MAIN HANDLER ═══════════════════════════ */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return errorResponse("Method not allowed. Use POST.", 405, corsHeaders);
  }

  try {
    /* ══════════════════ STEP 1: Authentication ══════════════════ */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing Authorization header.", 401, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse("Server misconfigured: missing SUPABASE_URL or SUPABASE_ANON_KEY.", 500, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[AUTH] getUser failed:", authError.message);
      return errorResponse(`Authentication failed: ${authError.message}`, 401, corsHeaders);
    }
    if (!user) {
      return errorResponse("Invalid or expired token.", 401, corsHeaders);
    }

    console.log(`[AUTH] User authenticated: ${user.id} (${user.email})`);

    /* ══════════════════ STEP 2: Admin Role Check ══════════════════ */
    let isAuthorized = false;

    // Primary: check via has_role RPC
    const isAdmin = await safeRpc(supabase, "has_role", { _user_id: user.id, _role: "admin" });
    const isSuperAdmin = await safeRpc(supabase, "has_role", { _user_id: user.id, _role: "super_admin" });
    const isSchoolAdmin = await safeRpc(supabase, "has_role", { _user_id: user.id, _role: "school_admin" });

    if (isAdmin || isSuperAdmin || isSchoolAdmin) {
      isAuthorized = true;
      console.log(`[AUTH] Role check passed via RPC: admin=${isAdmin}, super=${isSuperAdmin}, school=${isSchoolAdmin}`);
    }

    // Fallback: check user_roles table directly
    if (!isAuthorized) {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (roleRows || []).map((r: any) => r.role);
      if (roles.includes("admin") || roles.includes("super_admin") || roles.includes("school_admin")) {
        isAuthorized = true;
        console.log(`[AUTH] Role check passed via direct query: ${roles.join(", ")}`);
      }
    }

    if (!isAuthorized) {
      return errorResponse("Admin access required. Your account does not have admin privileges.", 403, corsHeaders);
    }

    /* ══════════════════ STEP 3: Rate Limiting ══════════════════ */
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      const resetMinutes = Math.ceil(rateCheck.resetIn / 60000);
      return jsonResponse({
        error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} quiz generations per hour. Try again in ${resetMinutes} minutes.`,
        remaining: 0,
        resetInMinutes: resetMinutes,
      }, 429, corsHeaders);
    }

    /* ══════════════════ STEP 4: Input Validation ══════════════════ */
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON in request body.", 400, corsHeaders);
    }

    const { lesson_id, class_level } = body;
    const num_mcq = Number(body.num_mcq ?? 5);
    const num_true_false = Number(body.num_true_false ?? 3);
    const num_fill_blank = Number(body.num_fill_blank ?? 2);

    // Validate lesson_id
    if (!lesson_id || typeof lesson_id !== "string") {
      return errorResponse("lesson_id is required and must be a string (UUID).", 400, corsHeaders);
    }

    // Validate question counts are numbers ≥ 0
    if ([num_mcq, num_true_false, num_fill_blank].some((n) => isNaN(n) || n < 0)) {
      return errorResponse("Question counts must be non-negative numbers.", 400, corsHeaders);
    }

    // Enforce max total limit
    const totalQuestions = num_mcq + num_true_false + num_fill_blank;
    if (totalQuestions === 0) {
      return errorResponse("At least 1 question must be requested.", 400, corsHeaders);
    }
    if (totalQuestions > 20) {
      return errorResponse(`Total questions (${totalQuestions}) exceeds maximum of 20. Reduce your counts.`, 400, corsHeaders);
    }

    // Validate class_level if provided
    if (class_level !== undefined && class_level !== null) {
      const cl = Number(class_level);
      if (isNaN(cl) || cl < 1 || cl > 12) {
        return errorResponse("class_level must be between 1 and 12.", 400, corsHeaders);
      }
    }

    console.log(`[INPUT] lesson=${lesson_id}, mcq=${num_mcq}, tf=${num_true_false}, fb=${num_fill_blank}, total=${totalQuestions}`);

    /* ══════════════════ STEP 5: Fetch Lesson Content ══════════════════ */
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("title, content, title_tamil, content_tamil")
      .eq("id", lesson_id)
      .single();

    if (lessonError) {
      console.error("[LESSON] Fetch error:", lessonError.message);
      return errorResponse(`Lesson not found: ${lessonError.message}`, 404, corsHeaders);
    }
    if (!lesson) {
      return errorResponse("Lesson not found.", 404, corsHeaders);
    }
    if (!lesson.content && !lesson.title) {
      return errorResponse("Lesson has no content to generate questions from. Add content to the lesson first.", 400, corsHeaders);
    }

    console.log(`[LESSON] Title: "${lesson.title}", content length: ${(lesson.content || "").length} chars`);

    /* ══════════════════ STEP 6: AI API Key Validation ══════════════════ */
    // Support both AI_API_KEY and GEMINI_API_KEY as env names
    const AI_API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!AI_API_KEY) {
      return errorResponse(
        "AI API key not configured. Set AI_API_KEY (or GEMINI_API_KEY) in Supabase Dashboard → Edge Functions → generate-quiz → Secrets.",
        500, corsHeaders
      );
    }

    // Quick format validation
    if (AI_API_KEY.length < 20) {
      return errorResponse("AI_API_KEY appears invalid (too short). Check your Gemini API key.", 500, corsHeaders);
    }

    /* ══════════════════ STEP 7: School Quota Check (optional) ══════════════════ */
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let schoolId: string | null = null;

    if (serviceRoleKey) {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey);
      schoolId = await safeRpc(serviceClient, "get_user_school_id", { _user_id: user.id });

      if (schoolId) {
        const currentUsage = await safeRpc(serviceClient, "get_school_ai_usage", { _school_id: schoolId });
        const maxQuota = await safeRpc(serviceClient, "get_school_ai_quota", { _school_id: schoolId });

        if (currentUsage !== null && maxQuota !== null && maxQuota !== -1 && currentUsage >= maxQuota) {
          return errorResponse(
            `Monthly AI quota exceeded (${currentUsage}/${maxQuota}). Upgrade your plan for more.`,
            429, corsHeaders
          );
        }
      }
    }

    /* ══════════════════ STEP 8: Build AI Prompt ══════════════════ */
    const classLevelNum = class_level ? Number(class_level) : 5;
    const classInfo = class_level
      ? `for Class ${class_level} students (age ~${classLevelNum + 5} years)`
      : "for primary school students";

    // Dynamic, grade-level academic complexity guidelines supporting all subjects (Math, Science, Social Science, Language, etc.)
    let ageAppropriateInstructions = "";
    if (classLevelNum >= 6 && classLevelNum <= 8) {
      ageAppropriateInstructions = `
CRITICAL FOR MIDDLE SCHOOL (GRADES 6-8):
- Do NOT generate simple arithmetic, childish spelling, or trivial recall questions (e.g., "what is 2 + 2" or simple word matching).
- Questions MUST test intermediate concept comprehension, application, and mathematical/conceptual reasoning suitable for CBSE/State Board middle school curriculum.
- For Math/Science: Include multi-step problem solving, algebra formulas, physics/chemistry properties, and logical deduction.
- For Language/Social Studies: Focus on grammar syntax, context analysis, historical timelines, and geographical relationships.`;
    } else if (classLevelNum >= 9) {
      ageAppropriateInstructions = `
CRITICAL FOR HIGH SCHOOL (GRADES 9-12):
- Questions MUST be intellectually challenging and conceptually rich. Absolutely no basic definitions or trivial facts.
- Math/Science questions must involve formulas, equations, rigorous chemical or physical principles, or proof-oriented logic.
- Social Studies/Language questions should require analysis of causes and effects, critical literary terms, or complex comprehension.`;
    } else {
      ageAppropriateInstructions = `
CRITICAL FOR PRIMARY SCHOOL (GRADES 1-5):
- Questions should focus on core conceptual recall, basic arithmetic, elementary science, and vocabulary suited for younger learners (age-appropriate context).`;
    }

    const systemPrompt = "You are an expert academic curriculum developer and quiz creator for Indian school students. Your task is to generate challenging, high-quality, syllabus-aligned questions that test students' conceptual depth across subjects (Mathematics, Tamil, English, Science, Social Science). Return structured JSON only. No markdown, no code fences, no commentary.";

    const userPrompt = `Generate quiz questions based on this lesson content.

Lesson Title: ${lesson.title}
${lesson.title_tamil ? `Lesson Title (Tamil): ${lesson.title_tamil}` : ""}
Lesson Content: ${lesson.content || lesson.title}
${lesson.content_tamil ? `Lesson Content (Tamil): ${lesson.content_tamil}` : ""}

Generate exactly:
- ${num_mcq} Multiple Choice Questions (MCQ) with 4 options each
- ${num_true_false} True/False questions
- ${num_fill_blank} Fill in the Blank questions

Grade Level Alignment:
- Target: ${classInfo}
${ageAppropriateInstructions}

General Requirements:
- Questions must strictly align with the grade level cognitive requirements.
- Include a mix of easy, medium, and hard difficulty (relative to the target grade level).
- Each question must have a clear, unambiguous correct answer.
- For MCQ: provide exactly 4 options. Crucial: Make sure the correct answer is placed at a random position (option A, B, C, or D) for each question. Do NOT always place the correct answer as the first option!
- For True/False: options are ["True", "False"]
- For Fill in Blank: the blank should be indicated with _____ in the question
- Provide brief explanations for each answer
- If Tamil content is available, provide Tamil translations for questions and explanations`;

    const questionSchema = {
      type: "object" as const,
      properties: {
        questions: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              question_text: { type: "string" as const },
              question_text_tamil: { type: "string" as const },
              question_type: { type: "string" as const, enum: ["mcq", "true_false", "fill_blank"] },
              options: { type: "array" as const, items: { type: "string" as const } },
              correct_answer: { type: "string" as const },
              explanation: { type: "string" as const },
              explanation_tamil: { type: "string" as const },
              difficulty: { type: "string" as const, enum: ["easy", "medium", "hard"] },
              points: { type: "number" as const },
            },
            required: ["question_text", "question_type", "options", "correct_answer", "explanation", "points"],
          },
        },
      },
      required: ["questions"],
    };

    /* ══════════════════ STEP 9: Call AI ══════════════════ */
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL");
    const AI_MODEL = Deno.env.get("AI_MODEL") || "gemini-2.0-flash";
    let generated: { questions: any[] };
    let tokensUsed = 0;

    try {
      if (AI_GATEWAY_URL) {
        // ── OpenAI-compatible proxy ──
        console.log(`[AI] Using gateway: ${AI_GATEWAY_URL}, model: ${AI_MODEL}`);
        const request = buildOpenAICompatRequest(AI_GATEWAY_URL, AI_API_KEY, AI_MODEL, systemPrompt, userPrompt, questionSchema);

        const response = await fetch(request.url, {
          method: "POST",
          headers: request.headers,
          body: JSON.stringify(request.body),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[AI] Gateway error ${response.status}:`, errText);

          if (response.status === 429) {
            return errorResponse("AI rate limit exceeded. Please wait a moment and try again.", 429, corsHeaders);
          }
          if (response.status === 401 || response.status === 403) {
            return errorResponse("AI API key is invalid or unauthorized. Check AI_API_KEY in Edge Function secrets.", 500, corsHeaders);
          }
          return errorResponse(`AI service error (${response.status}): ${errText.substring(0, 300)}`, 502, corsHeaders);
        }

        const aiResult = await response.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

        if (toolCall) {
          generated = JSON.parse(toolCall.function.arguments);
        } else {
          const content = aiResult.choices?.[0]?.message?.content;
          if (content) {
            generated = JSON.parse(content);
          } else {
            console.error("[AI] Unexpected response:", JSON.stringify(aiResult).substring(0, 500));
            return errorResponse("AI returned unexpected response format. Try again.", 502, corsHeaders);
          }
        }
        tokensUsed = aiResult.usage?.total_tokens || 0;

      } else {
        // ── Direct Gemini API (default) ──
        console.log(`[AI] Using Gemini direct API, model: ${AI_MODEL}`);
        const request = buildGeminiNativeRequest(AI_API_KEY, AI_MODEL, systemPrompt, userPrompt, questionSchema);

        const response = await fetch(request.url, {
          method: "POST",
          headers: request.headers,
          body: JSON.stringify(request.body),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[AI] Gemini error ${response.status}:`, errText);

          if (response.status === 429) {
            return errorResponse("Gemini API rate limit exceeded. Please wait and try again.", 429, corsHeaders);
          }
          if (response.status === 400) {
            if (errText.includes("API_KEY") || errText.includes("API key")) {
              return errorResponse("Invalid Gemini API key. Update AI_API_KEY in Edge Function secrets.", 500, corsHeaders);
            }
            return errorResponse(`Gemini rejected the request: ${errText.substring(0, 300)}`, 400, corsHeaders);
          }
          if (response.status === 403) {
            return errorResponse("Gemini API key lacks permission. Enable the Generative Language API in Google Cloud Console.", 500, corsHeaders);
          }
          return errorResponse(`Gemini API error (${response.status}): ${errText.substring(0, 300)}`, 502, corsHeaders);
        }

        const aiResult = await response.json();
        const textContent = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
          const finishReason = aiResult.candidates?.[0]?.finishReason;
          console.error("[AI] No content. finishReason:", finishReason, "response:", JSON.stringify(aiResult).substring(0, 500));

          if (finishReason === "SAFETY") {
            return errorResponse("AI flagged the content as unsafe. Try a different lesson.", 400, corsHeaders);
          }
          return errorResponse("AI returned empty response. Try again.", 502, corsHeaders);
        }

        // Parse JSON response
        try {
          generated = JSON.parse(textContent);
        } catch (parseErr) {
          console.error("[AI] JSON parse failed. Raw text:", textContent.substring(0, 500));
          return errorResponse("AI returned malformed JSON. Try regenerating.", 502, corsHeaders);
        }

        tokensUsed = (aiResult.usageMetadata?.promptTokenCount || 0) + (aiResult.usageMetadata?.candidatesTokenCount || 0);
      }
    } catch (fetchErr) {
      console.error("[AI] Fetch exception:", fetchErr);
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);

      if (msg.includes("JSON")) {
        return errorResponse("AI returned malformed data. Try regenerating.", 502, corsHeaders);
      }
      return errorResponse(`AI service unreachable: ${msg.substring(0, 200)}`, 502, corsHeaders);
    }

    /* ══════════════════ STEP 10: Validate AI Output ══════════════════ */
    if (!generated?.questions || !Array.isArray(generated.questions) || generated.questions.length === 0) {
      console.error("[VALIDATE] Invalid output:", JSON.stringify(generated).substring(0, 500));
      return errorResponse("AI returned empty or invalid questions. Try regenerating.", 502, corsHeaders);
    }

    // Sanitize and shuffle each question
    const sanitizedQuestions = generated.questions.map((q: any, i: number) => {
      const question_text = String(q.question_text || `Question ${i + 1}`);
      const question_text_tamil = q.question_text_tamil ? String(q.question_text_tamil) : undefined;
      const question_type = ["mcq", "true_false", "fill_blank"].includes(q.question_type) ? q.question_type : "mcq";
      const correct_answer = String(q.correct_answer || "");
      const explanation = String(q.explanation || "");
      const explanation_tamil = q.explanation_tamil ? String(q.explanation_tamil) : undefined;
      const difficulty = ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium";
      const points = typeof q.points === "number" ? q.points : 10;

      let options: string[] = [];

      if (question_type === "mcq") {
        let rawOpts = Array.isArray(q.options) ? q.options.map(String) : ["A", "B", "C", "D"];
        
        // Ensure options has exactly or at least 4 items, and correct_answer is one of them
        if (correct_answer && !rawOpts.includes(correct_answer)) {
          if (rawOpts.length < 4) {
            rawOpts.push(correct_answer);
          } else {
            rawOpts[0] = correct_answer;
          }
        }

        // Standardize length to exactly 4 if it's mcq
        while (rawOpts.length < 4) {
          rawOpts.push(`Option ${rawOpts.length + 1}`);
        }
        if (rawOpts.length > 4) {
          rawOpts = rawOpts.slice(0, 4);
        }

        // Programmatically shuffle using Fisher-Yates algorithm
        const shuffled = [...rawOpts];
        for (let j = shuffled.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          const temp = shuffled[j];
          shuffled[j] = shuffled[k];
          shuffled[k] = temp;
        }
        options = shuffled;
      } else if (question_type === "true_false") {
        options = ["True", "False"];
      } else {
        options = [];
      }

      return {
        question_text,
        question_text_tamil,
        question_type,
        options,
        correct_answer,
        explanation,
        explanation_tamil,
        difficulty,
        points,
      };
    });

    console.log(`[SUCCESS] Generated ${sanitizedQuestions.length} questions, ${tokensUsed} tokens`);

    /* ══════════════════ STEP 11: Log Usage (fire-and-forget) ══════════════════ */
    if (serviceRoleKey) {
      const logClient = createClient(supabaseUrl, serviceRoleKey);
      Promise.allSettled([
        safeInsert(logClient, "ai_usage", {
          school_id: schoolId,
          user_id: user.id,
          function_name: "generate-quiz",
          tokens_used: tokensUsed,
          metadata: { lesson_id, num_questions: sanitizedQuestions.length },
        }),
        safeInsert(logClient, "audit_log", {
          school_id: schoolId,
          user_id: user.id,
          action: "quiz.ai_generate",
          resource_type: "quiz",
          metadata: { lesson_id, questions_generated: sanitizedQuestions.length, tokens: tokensUsed },
        }),
      ]).catch(() => { }); // completely silent
    }

    /* ══════════════════ STEP 12: Return Success ══════════════════ */
    return jsonResponse({
      questions: sanitizedQuestions,
      usage: {
        tokens: tokensUsed,
        questions_generated: sanitizedQuestions.length,
        rate_limit_remaining: rateCheck.remaining,
      },
    }, 200, corsHeaders);

  } catch (e) {
    // Catch-all safety net (should rarely reach here)
    const message = e instanceof Error ? e.message : "An unexpected error occurred";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[FATAL] Unhandled error:", message);
    if (stack) console.error("[FATAL] Stack:", stack);
    return errorResponse(message, 500, corsHeaders);
  }
});
