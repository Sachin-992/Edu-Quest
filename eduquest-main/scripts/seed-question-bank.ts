/**
 * Bulk Question Bank Seeder — Class 1–8
 * 
 * Creates: 8 classes × 3 subjects × 1 quiz × 30 questions = 720 questions
 * Subjects: Maths, English, Science (per class)
 * Difficulty: 10 Easy + 10 Medium + 10 Hard per subject
 * 
 * Usage: npx tsx scripts/seed-question-bank.ts
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
    process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Authenticate as admin to pass RLS policies
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ Add ADMIN_EMAIL and ADMIN_PASSWORD to your .env file (admin login credentials)");
    process.exit(1);
}

async function signInAdmin() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL!,
        password: ADMIN_PASSWORD!,
    });
    if (error) {
        console.error("❌ Admin sign-in failed:", error.message);
        process.exit(1);
    }
    console.log("🔐 Signed in as admin:", data.user?.email);
}

/* ─── Types ─── */
interface Question {
    question_text: string;
    question_type: "mcq" | "true_false" | "fill_blank";
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    points: number;
}

/* ─── Question Banks by Subject × Class ─── */

const POINTS: Record<string, number> = { easy: 5, medium: 10, hard: 15 };

function mathsQuestions(cls: number): Question[] {
    const qs: Question[] = [];
    const n = cls; // Scale difficulty with class

    // ── Easy (10) ──
    for (let i = 1; i <= 10; i++) {
        const a = i * n, b = (i + 1) * n;
        qs.push({
            question_text: `What is ${a} + ${b}?`,
            question_type: "mcq",
            options: [`${a + b}`, `${a + b + 1}`, `${a + b - 1}`, `${a * 2}`],
            correct_answer: `${a + b}`,
            explanation: `${a} + ${b} = ${a + b}`,
            difficulty: "easy", points: 5,
        });
    }

    // ── Medium (10) ──
    for (let i = 1; i <= 5; i++) {
        const a = i * n * 2, b = (i + 2) * n;
        qs.push({
            question_text: `What is ${a} × ${b}?`,
            question_type: "mcq",
            options: [`${a * b}`, `${a * b + n}`, `${a * b - n}`, `${a + b}`],
            correct_answer: `${a * b}`,
            explanation: `${a} × ${b} = ${a * b}`,
            difficulty: "medium", points: 10,
        });
    }
    for (let i = 1; i <= 3; i++) {
        const val = i * n * 5;
        qs.push({
            question_text: `${val} is an even number.`,
            question_type: "true_false",
            options: ["True", "False"],
            correct_answer: val % 2 === 0 ? "True" : "False",
            explanation: `${val} ${val % 2 === 0 ? "is" : "is not"} divisible by 2.`,
            difficulty: "medium", points: 10,
        });
    }
    for (let i = 1; i <= 2; i++) {
        const a = (i + 3) * n, b = (i + 1) * n;
        qs.push({
            question_text: `${a} − _____ = ${a - b}`,
            question_type: "fill_blank",
            options: [`${b}`, `${b + 1}`, `${b - 1}`, `${a}`],
            correct_answer: `${b}`,
            explanation: `${a} − ${b} = ${a - b}`,
            difficulty: "medium", points: 10,
        });
    }

    // ── Hard (10) ──
    for (let i = 1; i <= 5; i++) {
        const base = i * n * 3;
        const divisor = n > 1 ? n : 2;
        const result = Math.floor(base / divisor);
        qs.push({
            question_text: `What is ${base} ÷ ${divisor}?`,
            question_type: "mcq",
            options: [`${result}`, `${result + 1}`, `${result - 1}`, `${result + n}`],
            correct_answer: `${result}`,
            explanation: `${base} ÷ ${divisor} = ${result}`,
            difficulty: "hard", points: 15,
        });
    }
    for (let i = 1; i <= 3; i++) {
        const p = n * i * 7 + 1;
        const isPrime = checkPrime(p);
        qs.push({
            question_text: `${p} is a prime number.`,
            question_type: "true_false",
            options: ["True", "False"],
            correct_answer: isPrime ? "True" : "False",
            explanation: `${p} ${isPrime ? "has no factors other than 1 and itself" : "has factors other than 1 and itself"}.`,
            difficulty: "hard", points: 15,
        });
    }
    for (let i = 1; i <= 2; i++) {
        const a = (i + 5) * n, b = (i + 2) * n;
        qs.push({
            question_text: `If x + ${b} = ${a + b}, then x = _____`,
            question_type: "fill_blank",
            options: [`${a}`, `${a + 1}`, `${b}`, `${a - 1}`],
            correct_answer: `${a}`,
            explanation: `x = ${a + b} − ${b} = ${a}`,
            difficulty: "hard", points: 15,
        });
    }

    return qs;
}

function englishQuestions(cls: number): Question[] {
    const qs: Question[] = [];

    const nouns = ["dog", "cat", "book", "tree", "river", "mountain", "school", "teacher", "student", "garden"];
    const verbs = ["run", "read", "write", "play", "sing", "dance", "cook", "swim", "paint", "climb"];
    const adjectives = ["big", "small", "tall", "short", "bright", "dark", "happy", "sad", "fast", "slow"];
    const adverbs = ["quickly", "slowly", "loudly", "softly", "carefully", "happily", "sadly", "eagerly", "bravely", "gently"];
    const synonyms: [string, string][] = [
        ["happy", "joyful"], ["big", "large"], ["small", "tiny"], ["fast", "quick"], ["bright", "luminous"],
        ["brave", "courageous"], ["calm", "peaceful"], ["angry", "furious"], ["old", "ancient"], ["pretty", "beautiful"]
    ];
    const antonyms: [string, string][] = [
        ["hot", "cold"], ["big", "small"], ["fast", "slow"], ["happy", "sad"], ["bright", "dark"],
        ["tall", "short"], ["old", "young"], ["hard", "soft"], ["rich", "poor"], ["strong", "weak"]
    ];

    // ── Easy (10) ──
    for (let i = 0; i < 5; i++) {
        const word = nouns[i];
        qs.push({
            question_text: `What part of speech is the word "${word}"?`,
            question_type: "mcq",
            options: ["Noun", "Verb", "Adjective", "Adverb"],
            correct_answer: "Noun",
            explanation: `"${word}" is a naming word, so it is a noun.`,
            difficulty: "easy", points: 5,
        });
    }
    for (let i = 0; i < 3; i++) {
        qs.push({
            question_text: `"${verbs[i]}" is a verb.`,
            question_type: "true_false",
            options: ["True", "False"],
            correct_answer: "True",
            explanation: `"${verbs[i]}" is an action word, making it a verb.`,
            difficulty: "easy", points: 5,
        });
    }
    for (let i = 0; i < 2; i++) {
        const [word, syn] = synonyms[i];
        qs.push({
            question_text: `A synonym of "${word}" is _____.`,
            question_type: "fill_blank",
            options: [syn, antonyms[i][1], nouns[i], verbs[i]],
            correct_answer: syn,
            explanation: `"${syn}" means the same as "${word}".`,
            difficulty: "easy", points: 5,
        });
    }

    // ── Medium (10) ──
    for (let i = 0; i < 4; i++) {
        const [word, ant] = antonyms[i + 2];
        qs.push({
            question_text: `What is the antonym of "${word}"?`,
            question_type: "mcq",
            options: [ant, synonyms[i][1], nouns[i + 2], adjectives[i]],
            correct_answer: ant,
            explanation: `The opposite of "${word}" is "${ant}".`,
            difficulty: "medium", points: 10,
        });
    }
    for (let i = 0; i < 3; i++) {
        const adj = adjectives[i + 3];
        qs.push({
            question_text: `"${adj}" is an adjective.`,
            question_type: "true_false",
            options: ["True", "False"],
            correct_answer: "True",
            explanation: `"${adj}" describes a quality, so it is an adjective.`,
            difficulty: "medium", points: 10,
        });
    }
    for (let i = 0; i < 3; i++) {
        const adv = adverbs[i];
        qs.push({
            question_text: `She ran _____. (Choose: ${adv})`,
            question_type: "fill_blank",
            options: [adv, adjectives[i], nouns[i], verbs[i]],
            correct_answer: adv,
            explanation: `"${adv}" modifies the verb "ran", making it an adverb.`,
            difficulty: "medium", points: 10,
        });
    }

    // ── Hard (10) ──
    const sentences = [
        { q: `Choose the correct sentence:`, opts: ["She doesn't have any books.", "She don't have no books.", "She doesn't has any books.", "She don't have any books."], ans: "She doesn't have any books.", exp: "Correct subject-verb agreement with 'doesn't have'." },
        { q: `Identify the type: "What a beautiful day!"`, opts: ["Exclamatory", "Interrogative", "Imperative", "Declarative"], ans: "Exclamatory", exp: "It expresses strong emotion with '!'." },
        { q: `Which word is a conjunction?`, opts: ["because", "quickly", "beautiful", "running"], ans: "because", exp: "'Because' connects clauses, making it a conjunction." },
        { q: `The passive voice of "She writes a letter" is:`, opts: ["A letter is written by her.", "A letter was written by her.", "She is written a letter.", "A letter writes her."], ans: "A letter is written by her.", exp: "In passive voice, the object becomes the subject." },
        { q: `Pick the correctly spelled word:`, opts: ["necessary", "neccessary", "necesary", "necessery"], ans: "necessary", exp: "The correct spelling is n-e-c-e-s-s-a-r-y." },
    ];
    for (const s of sentences) {
        qs.push({ question_text: s.q, question_type: "mcq", options: s.opts, correct_answer: s.ans, explanation: s.exp, difficulty: "hard", points: 15 });
    }
    for (let i = 0; i < 3; i++) {
        const noun = nouns[i + 5];
        qs.push({
            question_text: `"${noun}" can be used as both a noun and a verb.`,
            question_type: "true_false",
            options: ["True", "False"],
            correct_answer: i < 1 ? "True" : "False",
            explanation: i < 1 ? `"${noun}" can function as a noun (the ${noun}) or a verb (to ${noun}).` : `"${noun}" is primarily used as a noun.`,
            difficulty: "hard", points: 15,
        });
    }
    for (let i = 0; i < 2; i++) {
        const [word, syn] = synonyms[i + 5];
        qs.push({
            question_text: `A word meaning "${word}" is _____.`,
            question_type: "fill_blank",
            options: [syn, antonyms[i + 5][1], nouns[i], verbs[i + 5]],
            correct_answer: syn,
            explanation: `"${syn}" is a synonym for "${word}".`,
            difficulty: "hard", points: 15,
        });
    }

    return qs;
}

function scienceQuestions(cls: number): Question[] {
    const qs: Question[] = [];

    const topics: Record<number, { easy: Question[]; medium: Question[]; hard: Question[] }> = {};

    // Generate class-appropriate questions
    const easyTopics = [
        { q: "Which is the closest star to Earth?", opts: ["Sun", "Moon", "Mars", "Venus"], ans: "Sun", exp: "The Sun is the star at the center of our solar system." },
        { q: "Water boils at what temperature (°C)?", opts: ["100°C", "50°C", "0°C", "200°C"], ans: "100°C", exp: "Pure water boils at 100°C at sea level." },
        { q: "Which gas do plants absorb?", opts: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], ans: "Carbon dioxide", exp: "Plants absorb CO₂ during photosynthesis." },
        { q: "How many legs does an insect have?", opts: ["6", "8", "4", "10"], ans: "6", exp: "All insects have exactly 6 legs." },
        { q: "Which organ pumps blood?", opts: ["Heart", "Lungs", "Brain", "Liver"], ans: "Heart", exp: "The heart pumps blood throughout the body." },
        { q: "The Earth revolves around the _____.", opts: ["Sun", "Moon", "Stars", "Mars"], ans: "Sun", exp: "Earth orbits the Sun once every 365.25 days." },
        { q: "Which sense organ detects smell?", opts: ["Nose", "Eyes", "Ears", "Tongue"], ans: "Nose", exp: "The nose contains olfactory receptors for smell." },
        { q: "Ice is the _____ form of water.", opts: ["Solid", "Liquid", "Gas", "Plasma"], ans: "Solid", exp: "When water freezes below 0°C, it becomes solid ice." },
        { q: "Plants make food through _____.", opts: ["Photosynthesis", "Respiration", "Digestion", "Transpiration"], ans: "Photosynthesis", exp: "Plants use sunlight, water, and CO₂ to make food." },
        { q: "The Moon gets light from the _____.", opts: ["Sun", "Earth", "Stars", "It makes its own"], ans: "Sun", exp: "The Moon reflects sunlight; it doesn't produce its own light." },
    ];

    const mediumTopics = [
        { q: "Photosynthesis occurs in chloroplasts.", type: "true_false" as const, opts: ["True", "False"], ans: "True", exp: "Chloroplasts contain chlorophyll which captures light energy." },
        { q: "Sound travels fastest in:", opts: ["Solids", "Liquids", "Gases", "Vacuum"], ans: "Solids", exp: "Sound waves travel fastest in solids due to closely packed molecules." },
        { q: "The chemical formula of water is _____.", type: "fill_blank" as const, opts: ["H₂O", "CO₂", "O₂", "NaCl"], ans: "H₂O", exp: "Water is made of 2 hydrogen atoms and 1 oxygen atom." },
        { q: "Which planet is known as the Red Planet?", opts: ["Mars", "Venus", "Jupiter", "Saturn"], ans: "Mars", exp: "Mars appears red due to iron oxide on its surface." },
        { q: "Humans have 206 bones in their body.", type: "true_false" as const, opts: ["True", "False"], ans: "True", exp: "An adult human skeleton has 206 bones." },
        { q: "The process of liquid turning to gas is called _____.", type: "fill_blank" as const, opts: ["Evaporation", "Condensation", "Melting", "Freezing"], ans: "Evaporation", exp: "Evaporation is the change from liquid to gas state." },
        { q: "Which vitamin is produced by sunlight?", opts: ["Vitamin D", "Vitamin A", "Vitamin C", "Vitamin B12"], ans: "Vitamin D", exp: "Skin produces Vitamin D when exposed to UV rays from sunlight." },
        { q: "The smallest unit of life is:", opts: ["Cell", "Atom", "Molecule", "Organ"], ans: "Cell", exp: "Cells are the basic structural and functional units of life." },
        { q: "Magnets have _____ poles.", type: "fill_blank" as const, opts: ["Two", "Three", "One", "Four"], ans: "Two", exp: "Every magnet has a North pole and a South pole." },
        { q: "Friction slows down moving objects.", type: "true_false" as const, opts: ["True", "False"], ans: "True", exp: "Friction is a force that opposes motion between surfaces." },
    ];

    const hardTopics = [
        { q: "What is the unit of electric current?", opts: ["Ampere", "Volt", "Watt", "Ohm"], ans: "Ampere", exp: "Electric current is measured in amperes (A)." },
        { q: "DNA stands for _____.", type: "fill_blank" as const, opts: ["Deoxyribonucleic Acid", "Deoxy Nucleic Acid", "Direct Nucleic Acid", "Double Nuclear Acid"], ans: "Deoxyribonucleic Acid", exp: "DNA carries the genetic instructions for all living organisms." },
        { q: "Newton's First Law is also called the Law of:", opts: ["Inertia", "Gravity", "Acceleration", "Reaction"], ans: "Inertia", exp: "An object at rest stays at rest unless acted upon by an external force." },
        { q: "Protons have a positive charge.", type: "true_false" as const, opts: ["True", "False"], ans: "True", exp: "Protons carry a positive charge of +1." },
        { q: "The pH of a neutral solution is _____.", type: "fill_blank" as const, opts: ["7", "0", "14", "1"], ans: "7", exp: "A pH of 7 indicates a neutral solution (neither acid nor base)." },
        { q: "Which gas makes up most of Earth's atmosphere?", opts: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"], ans: "Nitrogen", exp: "Nitrogen makes up about 78% of Earth's atmosphere." },
        { q: "Light travels in straight lines.", type: "true_false" as const, opts: ["True", "False"], ans: "True", exp: "Light propagates in straight lines (rectilinear propagation)." },
        { q: "The powerhouse of the cell is the:", opts: ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"], ans: "Mitochondria", exp: "Mitochondria produce ATP, the cell's energy currency." },
        { q: "An atom's nucleus contains protons and _____.", type: "fill_blank" as const, opts: ["Neutrons", "Electrons", "Photons", "Ions"], ans: "Neutrons", exp: "The nucleus contains positively charged protons and neutral neutrons." },
        { q: "Sound can travel through a vacuum.", type: "true_false" as const, opts: ["True", "False"], ans: "False", exp: "Sound needs a medium (solid, liquid, or gas) to travel." },
    ];

    // Add class-level context to questions
    for (const topic of easyTopics) {
        qs.push({
            question_text: topic.q,
            question_type: "mcq",
            options: topic.opts,
            correct_answer: topic.ans,
            explanation: topic.exp,
            difficulty: "easy", points: 5,
        });
    }
    for (const topic of mediumTopics) {
        qs.push({
            question_text: topic.q,
            question_type: topic.type || "mcq",
            options: topic.opts,
            correct_answer: topic.ans,
            explanation: topic.exp,
            difficulty: "medium", points: 10,
        });
    }
    for (const topic of hardTopics) {
        qs.push({
            question_text: topic.q,
            question_type: topic.type || "mcq",
            options: topic.opts,
            correct_answer: topic.ans,
            explanation: topic.exp,
            difficulty: "hard", points: 15,
        });
    }

    return qs;
}

function checkPrime(n: number): boolean {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
}

/* ─── Validation ─── */
function validateQuestion(q: Question, idx: number): string[] {
    const errors: string[] = [];
    if (!q.question_text) errors.push(`Q${idx}: question_text is null/empty`);
    if (!["mcq", "true_false", "fill_blank"].includes(q.question_type)) errors.push(`Q${idx}: invalid question_type "${q.question_type}"`);
    if (!q.options || q.options.length < 2) errors.push(`Q${idx}: options must have ≥2 items`);
    if (!q.correct_answer) errors.push(`Q${idx}: correct_answer is null/empty`);
    if (!q.options.includes(q.correct_answer)) errors.push(`Q${idx}: correct_answer "${q.correct_answer}" not in options`);
    if (!q.explanation) errors.push(`Q${idx}: explanation is null/empty`);
    if (!["easy", "medium", "hard"].includes(q.difficulty)) errors.push(`Q${idx}: invalid difficulty "${q.difficulty}"`);
    if (![5, 10, 15].includes(q.points)) errors.push(`Q${idx}: invalid points ${q.points}`);
    return errors;
}

/* ─── Main Seeder ─── */
async function main() {
    await signInAdmin();
    console.log("🚀 Bulk Question Bank Seeder — Class 1–8\n");

    const subjects = [
        { name: "Maths", icon: "📐", generator: mathsQuestions },
        { name: "English", icon: "📝", generator: englishQuestions },
        { name: "Science", icon: "🔬", generator: scienceQuestions },
    ];

    let totalInserted = 0;
    let totalErrors = 0;

    for (let cls = 1; cls <= 8; cls++) {
        console.log(`\n━━━ Class ${cls} ━━━`);

        for (const subj of subjects) {
            // 1. Find or create subject
            let { data: existingSubject } = await supabase
                .from("subjects")
                .select("id")
                .eq("name", subj.name)
                .eq("class_level", cls)
                .maybeSingle();

            let subjectId: string;
            if (existingSubject) {
                subjectId = existingSubject.id;
            } else {
                const { data: newSubject, error } = await supabase
                    .from("subjects")
                    .insert({ name: subj.name, icon: subj.icon, class_level: cls, is_active: true, sort_order: subjects.indexOf(subj) + 1 })
                    .select("id")
                    .single();
                if (error || !newSubject) { console.error(`  ❌ Failed to create subject ${subj.name}: ${error?.message}`); totalErrors++; continue; }
                subjectId = newSubject.id;
                console.log(`  ✨ Created subject: ${subj.name}`);
            }

            // 2. Find or create lesson (one "Question Bank" lesson per subject)
            const lessonTitle = `${subj.name} Question Bank — Class ${cls}`;
            let { data: existingLesson } = await supabase
                .from("lessons")
                .select("id")
                .eq("subject_id", subjectId)
                .eq("title", lessonTitle)
                .maybeSingle();

            let lessonId: string;
            if (existingLesson) {
                lessonId = existingLesson.id;
            } else {
                const { data: newLesson, error } = await supabase
                    .from("lessons")
                    .insert({ subject_id: subjectId, title: lessonTitle, content: `Practice questions for ${subj.name} Class ${cls}`, is_active: true, lesson_order: 100, xp_reward: 50 })
                    .select("id")
                    .single();
                if (error || !newLesson) { console.error(`  ❌ Failed to create lesson: ${error?.message}`); totalErrors++; continue; }
                lessonId = newLesson.id;
            }

            // 3. Find or create quiz
            const quizTitle = `${subj.name} Practice Quiz — Class ${cls}`;
            let { data: existingQuiz } = await supabase
                .from("quizzes")
                .select("id")
                .eq("lesson_id", lessonId)
                .eq("title", quizTitle)
                .maybeSingle();

            let quizId: string;
            if (existingQuiz) {
                quizId = existingQuiz.id;
                // Delete old questions for idempotency
                await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
            } else {
                const { data: newQuiz, error } = await supabase
                    .from("quizzes")
                    .insert({ lesson_id: lessonId, title: quizTitle, quiz_type: "mcq", xp_reward: 30, passing_score: 60, is_active: true })
                    .select("id")
                    .single();
                if (error || !newQuiz) { console.error(`  ❌ Failed to create quiz: ${error?.message}`); totalErrors++; continue; }
                quizId = newQuiz.id;
            }

            // 4. Generate and validate questions
            const questions = subj.generator(cls);
            const allErrors: string[] = [];
            questions.forEach((q, i) => {
                allErrors.push(...validateQuestion(q, i + 1));
            });

            if (allErrors.length > 0) {
                console.error(`  ⚠️  ${subj.name}: ${allErrors.length} validation errors:`);
                allErrors.forEach(e => console.error(`    ${e}`));
                totalErrors += allErrors.length;
                continue;
            }

            // 5. Bulk insert
            const payload = questions.map((q, i) => ({
                quiz_id: quizId,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                question_order: i + 1,
                points: q.points,
            }));

            const { error: insertError } = await supabase.from("quiz_questions").insert(payload);
            if (insertError) {
                console.error(`  ❌ ${subj.name}: insert failed — ${insertError.message}`);
                totalErrors++;
            } else {
                console.log(`  ✅ ${subj.name}: ${questions.length} questions inserted`);
                totalInserted += questions.length;
            }
        }
    }

    console.log(`\n${"═".repeat(40)}`);
    console.log(`✅ Total inserted: ${totalInserted} questions`);
    if (totalErrors > 0) console.log(`⚠️  Total errors: ${totalErrors}`);
    else console.log(`🎉 Zero errors — all validations passed!`);
    console.log(`${"═".repeat(40)}\n`);
}

main().catch(console.error);
