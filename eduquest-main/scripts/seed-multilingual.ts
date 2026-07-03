import { createClient } from "@supabase/supabase-js";
import { GK_QUESTIONS } from "../src/components/learning/fun-corner/gameData";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMultilingualQuestions() {
    console.log("Seeding Multilingual GK_QUESTIONS into Supabase...");

    for (const q of GK_QUESTIONS) {
        // Determine options mapping
        const opsEn = q.options;
        const opsTa = q.options_ta;

        const optA = opsEn[0] || "";
        const optB = opsEn[1] || "";
        const optC = opsEn[2] || "";
        const optD = opsEn[3] || "";

        const optATa = opsTa[0] || "";
        const optBTa = opsTa[1] || "";
        const optCTa = opsTa[2] || "";
        const optDTa = opsTa[3] || "";

        let correctKey = "option_a";
        if (q.answer === optB) correctKey = "option_b";
        else if (q.answer === optC) correctKey = "option_c";
        else if (q.answer === optD) correctKey = "option_d";

        const gradeLevel = q.classRange[0]; // Map using the start of classRange for simplicity

        // Insert Core Question
        const { data: qData, error: qError } = await supabase
            .from("questions")
            .insert({
                subject: "gk",
                grade_level: gradeLevel,
                difficulty: "medium",
                correct_option_key: correctKey
            })
            .select()
            .single();

        if (qError || !qData) {
            console.error("Error inserting core question:", qError);
            continue;
        }

        const questionId = qData.id;

        // Insert English Translation
        const { error: trEnError } = await supabase
            .from("question_translations")
            .insert({
                question_id: questionId,
                language_code: "en",
                question_text: q.q,
                option_a: optA,
                option_b: optB,
                option_c: optC,
                option_d: optD,
                explanation: "Good job!"
            });

        if (trEnError) {
            console.error("Error inserting EN translation:", trEnError);
        }

        // Insert Tamil Translation
        const { error: trTaError } = await supabase
            .from("question_translations")
            .insert({
                question_id: questionId,
                language_code: "ta",
                question_text: q.q_ta,
                option_a: optATa,
                option_b: optBTa,
                option_c: optCTa,
                option_d: optDTa,
                explanation: "நன்று!"
            });

        if (trTaError) {
            console.error("Error inserting TA translation:", trTaError);
        }
    }

    console.log("Seeding complete! ✅");
}

seedMultilingualQuestions();
