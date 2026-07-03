import { createClient } from "@supabase/supabase-js";
import { GK_QUESTIONS, VOCAB_WORDS, SCIENCE_EXPERIMENTS } from "../src/components/learning/fun-corner/gameData";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAllMultilingualContent() {
    console.log("Seeding ALL Multilingual Content into Supabase...");

    // 1. Seed GK Questions
    console.log("Seeding GK Questions...");
    for (const q of GK_QUESTIONS) {
        const opsEn = q.options;
        const opsTa = q.options_ta;

        const optA = opsEn[0] || "";
        const optB = opsEn[1] || "";
        const optC = opsEn[2] || "";
        const optD = opsEn[3];

        const optATa = opsTa[0] || "";
        const optBTa = opsTa[1] || "";
        const optCTa = opsTa[2] || "";
        const optDTa = opsTa[3];

        let correctKey = "option_a";
        if (q.answer === optB) correctKey = "option_b";
        else if (q.answer === optC) correctKey = "option_c";
        else if (q.answer === optD) correctKey = "option_d";

        const gradeLevel = q.classRange[0];

        const { data: qData, error: qError } = await supabase
            .from("questions")
            .insert({
                subject: "gk_quiz",
                grade_level: gradeLevel,
                difficulty: "medium",
                correct_option_key: correctKey
            })
            .select()
            .single();

        if (qError || !qData) {
            console.error("Error inserting core question (GK):", qError);
            continue;
        }

        const questionId = qData.id;

        await supabase.from("question_translations").insert({
            question_id: questionId,
            language_code: "en",
            question_text: q.q,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            explanation: "Good job!"
        });

        await supabase.from("question_translations").insert({
            question_id: questionId,
            language_code: "ta",
            question_text: q.q_ta,
            option_a: optATa,
            option_b: optBTa,
            option_c: optCTa,
            option_d: optDTa,
            explanation: "நன்று!"
        });
    }

    // 2. Seed Vocabulary
    console.log("Seeding Vocabulary Words...");
    for (const q of VOCAB_WORDS) {
        const opsEn = q.options;
        const opsTa = q.options_ta;

        const optA = opsEn[0] || "";
        const optB = opsEn[1] || "";
        const optC = opsEn[2] || "";
        const optD = opsEn[3];

        const optATa = opsTa[0] || "";
        const optBTa = opsTa[1] || "";
        const optCTa = opsTa[2] || "";
        const optDTa = opsTa[3];

        let correctKey = "option_a";
        if (q.meaning === optB) correctKey = "option_b";
        else if (q.meaning === optC) correctKey = "option_c";
        else if (q.meaning === optD) correctKey = "option_d";

        const gradeLevel = q.classRange[0];

        const { data: qData, error: qError } = await supabase
            .from("questions")
            .insert({
                subject: "vocabulary",
                grade_level: gradeLevel,
                difficulty: "medium",
                correct_option_key: correctKey
            })
            .select()
            .single();

        if (qData) {
            await supabase.from("question_translations").insert({
                question_id: qData.id,
                language_code: "en",
                question_text: `What is the meaning of "${q.word}"?`,
                option_a: optA,
                option_b: optB,
                option_c: optC,
                option_d: optD,
                explanation: `The meaning of ${q.word} is ${q.meaning}.`
            });

            await supabase.from("question_translations").insert({
                question_id: qData.id,
                language_code: "ta",
                question_text: `"${q.word_ta}" என்பதன் பொருள் என்ன?`,
                option_a: optATa,
                option_b: optBTa,
                option_c: optCTa,
                option_d: optDTa,
                explanation: `${q.word_ta} என்பதன் பொருள் ${q.meaning_ta}.`
            });
        }
    }

    // 3. Seed Science Experiments
    console.log("Seeding Science Experiments...");
    for (const q of SCIENCE_EXPERIMENTS) {
        const opsEn = q.options;
        const opsTa = q.options_ta;

        const optA = opsEn[0] || "";
        const optB = opsEn[1] || "";
        const optC = opsEn[2] || "";
        const optD = opsEn[3];

        const optATa = opsTa[0] || "";
        const optBTa = opsTa[1] || "";
        const optCTa = opsTa[2] || "";
        const optDTa = opsTa[3];

        let correctKey = "option_a";
        if (q.answer === optB) correctKey = "option_b";
        else if (q.answer === optC) correctKey = "option_c";
        else if (q.answer === optD) correctKey = "option_d";

        const gradeLevel = q.classRange[0];

        const { data: qData, error: qError } = await supabase
            .from("questions")
            .insert({
                subject: "science_lab",
                grade_level: gradeLevel,
                difficulty: "medium",
                correct_option_key: correctKey
            })
            .select()
            .single();

        if (qData) {
            await supabase.from("question_translations").insert({
                question_id: qData.id,
                language_code: "en",
                question_text: q.question, // The experiment question
                option_a: optA,
                option_b: optB,
                option_c: optC,
                option_d: optD,
                explanation: q.explanation // The actual experiment explanation!
            });

            await supabase.from("question_translations").insert({
                question_id: qData.id,
                language_code: "ta",
                question_text: q.question_ta,
                option_a: optATa,
                option_b: optBTa,
                option_c: optCTa,
                option_d: optDTa,
                explanation: q.explanation_ta
            });
        }
    }

    console.log("All Multilingual seeding complete! ✅");
}

seedAllMultilingualContent();
