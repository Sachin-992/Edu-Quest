/**
 * Question Bank Validator
 * Checks all quiz_questions in the database for null values, schema violations
 * 
 * Usage: npx tsx scripts/validate-question-bank.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function main() {
    // Sign in as admin to pass RLS
    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: process.env.ADMIN_EMAIL!,
        password: process.env.ADMIN_PASSWORD!,
    });
    if (authErr) { console.error("❌ Auth failed:", authErr.message); process.exit(1); }

    console.log("🔍 Question Bank Validator\n");

    const { data: questions, error } = await supabase
        .from("quiz_questions")
        .select("id, quiz_id, question_text, question_type, options, correct_answer, explanation, question_order, points");

    if (error) { console.error("❌ Failed to fetch:", error.message); process.exit(1); }
    if (!questions?.length) { console.log("⚠️ No questions found."); return; }

    console.log(`📊 Total questions: ${questions.length}\n`);

    let passed = 0, failed = 0;
    const errors: string[] = [];

    for (const q of questions) {
        const issues: string[] = [];
        if (!q.question_text) issues.push("question_text is null/empty");
        if (!q.quiz_id) issues.push("quiz_id is null");
        if (!["mcq", "true_false", "fill_blank"].includes(q.question_type || "")) issues.push(`invalid question_type: "${q.question_type}"`);

        const opts = Array.isArray(q.options) ? q.options : [];
        if (opts.length < 2) issues.push(`options has ${opts.length} items (need ≥2)`);
        if (!q.correct_answer) issues.push("correct_answer is null/empty");
        if (q.correct_answer && opts.length > 0 && !opts.includes(q.correct_answer)) issues.push(`correct_answer "${q.correct_answer}" not in options`);
        if (q.points == null || q.points <= 0) issues.push(`invalid points: ${q.points}`);
        if (q.question_order == null) issues.push("question_order is null");

        if (issues.length > 0) {
            errors.push(`  ❌ ${q.id}: ${issues.join(", ")}`);
            failed++;
        } else {
            passed++;
        }
    }

    // Summary by type
    const byType: Record<string, number> = {};
    questions.forEach(q => { byType[q.question_type] = (byType[q.question_type] || 0) + 1; });
    console.log("📋 By Type:");
    Object.entries(byType).forEach(([t, c]) => console.log(`   ${t}: ${c}`));

    // Summary by points (proxy for difficulty)
    const byDiff: Record<number, number> = {};
    questions.forEach(q => { byDiff[q.points] = (byDiff[q.points] || 0) + 1; });
    console.log("\n📋 By Points (5=Easy, 10=Medium, 15=Hard):");
    Object.entries(byDiff).sort(([a], [b]) => +a - +b).forEach(([p, c]) => console.log(`   ${p} pts: ${c}`));

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    if (errors.length > 0) {
        console.log("\nFailures:");
        errors.forEach(e => console.log(e));
    } else {
        console.log("\n🎉 All questions passed validation!");
    }
}

main().catch(console.error);
