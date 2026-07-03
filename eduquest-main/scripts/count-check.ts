import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function main() {
  await s.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const { count } = await s.from("quiz_questions").select("*", { count: "exact", head: true });
  console.log("TOTAL_QUESTIONS=" + count);
  const { count: c2 } = await s.from("quizzes").select("*", { count: "exact", head: true });
  console.log("TOTAL_QUIZZES=" + c2);
  const { count: c3 } = await s.from("subjects").select("*", { count: "exact", head: true });
  console.log("TOTAL_SUBJECTS=" + c3);
}
main();
