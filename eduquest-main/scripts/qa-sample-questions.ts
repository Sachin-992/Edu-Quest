/**
 * QA Sample Questions — 10 random questions per class
 * Prints a human-readable sample for manual review
 * 
 * Usage: npx tsx scripts/qa-sample-questions.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function main() {
    // Sign in as admin to pass RLS
    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: process.env.ADMIN_EMAIL!,
        password: process.env.ADMIN_PASSWORD!,
    });
    if (authErr) { console.error("❌ Auth failed:", authErr.message); process.exit(1); }

    console.log("🎯 QA Sample — 10 Questions Per Class\n");

    for (let cls = 1; cls <= 8; cls++) {
        // Get subjects for this class
        const { data: subjects } = await supabase
            .from("subjects")
            .select("id, name")
            .eq("class_level", cls);

        if (!subjects?.length) {
            console.log(`Class ${cls}: No subjects found.\n`);
            continue;
        }

        const subjectIds = subjects.map(s => s.id);
        const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name]));

        // Get lessons for these subjects
        const { data: lessons } = await supabase
            .from("lessons")
            .select("id, subject_id")
            .in("subject_id", subjectIds);

        if (!lessons?.length) continue;

        // Get quizzes
        const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id, lesson_id")
            .in("lesson_id", lessons.map(l => l.id));

        if (!quizzes?.length) continue;

        const lessonSubjectMap = Object.fromEntries(lessons.map(l => [l.id, l.subject_id]));
        const quizLessonMap = Object.fromEntries(quizzes.map(q => [q.id, q.lesson_id]));

        // Get all questions for these quizzes
        const { data: questions } = await supabase
            .from("quiz_questions")
            .select("*")
            .in("quiz_id", quizzes.map(q => q.id));

        if (!questions?.length) continue;

        // Sample 10
        const sample = shuffle(questions).slice(0, 10);

        console.log(`${"━".repeat(50)}`);
        console.log(`📚 CLASS ${cls} — ${questions.length} total questions`);
        console.log(`${"━".repeat(50)}`);

        sample.forEach((q, i) => {
            const lessonId = quizLessonMap[q.quiz_id];
            const subjectId = lessonSubjectMap[lessonId];
            const subjectName = subjectMap[subjectId] || "Unknown";
            const opts = Array.isArray(q.options) ? q.options : [];
            const diffLabel = q.points === 5 ? "Easy" : q.points === 10 ? "Medium" : "Hard";

            console.log(`\n  ${i + 1}. [${subjectName}] [${diffLabel}] [${q.question_type}]`);
            console.log(`     Q: ${q.question_text}`);
            if (opts.length > 0) console.log(`     Options: ${opts.join(" | ")}`);
            console.log(`     ✅ Answer: ${q.correct_answer}`);
            console.log(`     💡 ${q.explanation || "—"}`);
        });

        console.log("");
    }

    console.log("\n🏁 QA sampling complete. Review the above for accuracy.\n");
}

main().catch(console.error);
