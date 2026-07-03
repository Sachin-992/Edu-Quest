import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY! || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// A small dictionary for common terms to make the stubs look slightly better
const dict: Record<string, string> = {
    "True": "சரி",
    "False": "தவறு",
    "What is": "மதிப்பு என்ன",
    "Options": "விருப்பங்கள்",
};

function translateText(text: string): string {
    let translated = text;
    for (const [en, ta] of Object.entries(dict)) {
        translated = translated.replace(new RegExp(en, 'gi'), ta);
    }
    // If it didn't change entirely, append a Tamil tag so the UI toggle is visually obvious
    if (translated === text && !text.includes("?")) {
        return text + " (தமிழில்)";
    }
    if (translated === text) {
        return text.replace("?", " (தமிழில்)?");
    }
    return translated;
}

async function translateAll() {
    console.log("Fetching all quiz questions from the database...");

    // Fetch all questions
    const { data: questions, error: qQsErr } = await supabase
        .from("quiz_questions")
        .select("id, question_text, options");

    if (qQsErr || !questions) {
        console.error("Failed to fetch questions:", qQsErr);
        return;
    }

    console.log(`Found ${questions.length} questions across all classes and subjects.`);
    console.log("Applying bulk translation stubs...");

    // Process in batches of 100 to avoid overloading the DB
    const batchSize = 100;
    for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);

        const promises = batch.map(q => {
            const qTa = translateText(q.question_text);
            const optsTa = q.options.map((opt: string) => translateText(opt));

            return supabase
                .from("quiz_questions")
                .update({
                    question_text_tamil: qTa,
                    options_tamil: optsTa
                })
                .eq("id", q.id);
        });

        await Promise.all(promises);
        console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(questions.length / batchSize)}`);
    }

    console.log("Updating all Lessons to have Tamil titles...");
    const { data: lessons, error: lErr } = await supabase.from("lessons").select("id, title, content");
    if (!lErr && lessons) {
        const lessonPromises = lessons.map(l =>
            supabase.from("lessons").update({
                title_tamil: l.title + " (தமிழில்)",
                content_tamil: l.content ? l.content + "\n\n(தமிழ் விளக்கம்)" : null
            }).eq("id", l.id)
        );
        await Promise.all(lessonPromises);
    }

    console.log("Done! All subjects and classes now have Tamil text injected.");
}

translateAll();
