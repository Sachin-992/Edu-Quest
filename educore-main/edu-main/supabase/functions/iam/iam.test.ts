import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";

// Use deployed Supabase Edge Function URL
const BASE_URL = Deno.env.get("SUPABASE_FUNCTIONS_URL") || "https://vfxvvovudyaofgdbkfua.supabase.co/functions/v1/iam";
const ADMIN_JWT = Deno.env.get("ADMIN_JWT") || "";

async function call(action: string, payload = {}) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (ADMIN_JWT) {
        headers["Authorization"] = `Bearer ${ADMIN_JWT}`;
    }

    const res = await fetch(BASE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, payload }),
    });
    return res.json();
}

console.log("\n🧪 Running IAM Edge Function Tests...\n");
console.log("Target URL:", BASE_URL);
console.log("JWT configured:", ADMIN_JWT ? "Yes" : "No (auth tests will verify rejection)");
console.log("");

Deno.test("Missing Authorization header returns 401", async () => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "createStudent", payload: {} }),
    });
    const data = await res.json();
    // Supabase gateway returns {code: 401, message: ...} or our function returns {error: ...}
    const hasAuthError = data.code === 401 || data.error?.includes("Authorization") || data.message?.includes("authorization");
    assertEquals(hasAuthError, true, `Expected auth error, got: ${JSON.stringify(data)}`);
});

Deno.test("CORS OPTIONS returns ok", async () => {
    const res = await fetch(BASE_URL, {
        method: "OPTIONS",
    });
    const text = await res.text();
    assertEquals(text, "ok");
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("Request without JWT gets rejected", async () => {
    const res = await call("randomAction");
    // Either Supabase gateway rejects (code 401) or function rejects (error field)
    const rejected = res.code === 401 || res.error !== undefined;
    assertEquals(rejected, true, `Expected rejection, got: ${JSON.stringify(res)}`);
});

Deno.test("Edge function is reachable", async () => {
    const res = await fetch(BASE_URL, {
        method: "OPTIONS",
    });
    await res.text(); // Consume response body to avoid resource leak
    assertEquals(res.status, 200);
});
