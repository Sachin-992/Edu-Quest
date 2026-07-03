import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY! || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SCIENCE_TRANS: Record<string, { q_ta: string; opts_ta: string[] }> = {
    // Easy
    "Which is the closest star to Earth?": { q_ta: "பூமிக்கு மிக அருகில் உள்ள நட்சத்திரம் எது?", opts_ta: ["சூரியன்", "நிலவு", "செவ்வாய்", "சுக்கிரன்"] },
    "Water boils at what temperature (°C)?": { q_ta: "நீர் எந்த வெப்பநிலையில் (°C) கொதிக்கிறது?", opts_ta: ["100°C", "50°C", "0°C", "200°C"] },
    "Which gas do plants absorb?": { q_ta: "தாவரங்கள் எந்த வாயுவை உறிஞ்சுகின்றன?", opts_ta: ["கார்பன் டை ஆக்சைடு", "ஆக்ஸிஜன்", "நைட்ரஜன்", "ஹைட்ரஜன்"] },
    "How many legs does an insect have?": { q_ta: "ஒரு பூச்சிக்கு எத்தனை கால்கள் உள்ளன?", opts_ta: ["6", "8", "4", "10"] },
    "Which organ pumps blood?": { q_ta: "எந்த உறுப்பு இரத்தத்தை செலுத்துகிறது?", opts_ta: ["இதயம்", "நுரையீரல்", "மூளை", "கல்லீரல்"] },
    "The Earth revolves around the _____.": { q_ta: "பூமி _____ ஐ சுற்றி வருகிறது.", opts_ta: ["சூரியன்", "நிலவு", "நட்சத்திரங்கள்", "செவ்வாய்"] },
    "Which sense organ detects smell?": { q_ta: "எந்த உணர்வு உறுப்பு வாசனையை கண்டறியும்?", opts_ta: ["மூக்கு", "கண்கள்", "காதுகள்", "நாக்கு"] },
    "Ice is the _____ form of water.": { q_ta: "பனிக்கட்டி என்பது நீரின் _____ வடிவம்.", opts_ta: ["திட", "திரவ", "வாயு", "பிளாஸ்மா"] },
    "Plants make food through _____.": { q_ta: "தாவரங்கள் _____ மூலம் உணவு தயாரிக்கின்றன.", opts_ta: ["ஒளிச்சேர்க்கை", "சுவாசம்", "செரிமானம்", "நீராவிப்போக்கு"] },
    "The Moon gets light from the _____.": { q_ta: "நிலவுக்கு _____ இருந்து வெளிச்சம் கிடைககிறது.", opts_ta: ["சூரியன்", "பூமி", "நட்சத்திரங்கள்", "அது சொந்தமாக உருவாக்குகிறது"] },

    // Medium
    "Photosynthesis occurs in chloroplasts.": { q_ta: "குளோரோபிளாஸ்ட்களில் ஒளிச்சேர்க்கை நடைபெறுகிறது.", opts_ta: ["சரி", "தவறு"] },
    "Sound travels fastest in:": { q_ta: "ஒலி எதில் வேகமாகப் பயணிக்கிறது:", opts_ta: ["திடப்பொருட்கள்", "திரவங்கள்", "வாயுக்கள்", "வெற்றிடம்"] },
    "The chemical formula of water is _____.": { q_ta: "நீரின் வேதியியல் வாய்ப்பாடு _____.", opts_ta: ["H₂O", "CO₂", "O₂", "NaCl"] },
    "Which planet is known as the Red Planet?": { q_ta: "சிவப்பு கிரகம் என்று அழைக்கப்படும் கிரகம் எது?", opts_ta: ["செவ்வாய்", "வெள்ளி", "வியாழன்", "சனி"] },
    "Humans have 206 bones in their body.": { q_ta: "மனித உடலில் 206 எலும்புகள் உள்ளன.", opts_ta: ["சரி", "தவறு"] },
    "The process of liquid turning to gas is called _____.": { q_ta: "திரவம் வாயுவாக மாறும் செயல்முறை _____ எனப்படும்.", opts_ta: ["ஆவியாதல்", "ஒடுக்கம்", "உருகுதல்", "உறைதல்"] },
    "Which vitamin is produced by sunlight?": { q_ta: "சூரிய ஒளியால் எந்த வைட்டமின் உற்பத்தி செய்யப்படுகிறது?", opts_ta: ["வைட்டமின் டி", "வைட்டமின் ஏ", "வைட்டமின் சி", "வைட்டமின் பி12"] },
    "The smallest unit of life is:": { q_ta: "உயிரின் மிகச்சிறிய அலகு:", opts_ta: ["செல்", "அணு", "மூலக்கூறு", "உறுப்பு"] },
    "Magnets have _____ poles.": { q_ta: "காந்தங்களுக்கு _____ துருவங்கள் உள்ளன.", opts_ta: ["இரண்டு", "மூன்று", "ஒன்று", "நான்கு"] },
    "Friction slows down moving objects.": { q_ta: "உராய்வு நகரும் பொருட்களை மெதுவாக்குகிறது.", opts_ta: ["சரி", "தவறு"] },

    // Hard
    "What is the unit of electric current?": { q_ta: "மின்னோட்டத்தின் அலகு என்ன?", opts_ta: ["ஆம்பியர்", "வோல்ட்", "வாட்", "ஓம்"] },
    "DNA stands for _____.": { q_ta: "DNA என்பதன் விரிவாக்கம் _____.", opts_ta: ["டியாக்சிரைபோநியூக்ளிக் ஆசிட்", "டியாக்சி நியூக்ளிக் ஆசிட்", "டைரக்ட் நியூக்ளிக் ஆசிட்", "டபுள் நியூக்ளியர் ஆசிட்"] },
    "Newton's First Law is also called the Law of:": { q_ta: "நியூட்டனின் முதல் விதி _____ விதி என்றும் அழைக்கப்படுகிறது:", opts_ta: ["நிலைமம்", "ஈர்ப்பு", "முடுக்கம்", "எதிர்வினை"] },
    "Protons have a positive charge.": { q_ta: "புரோட்டான்கள் நேர்மறை மின்னூட்டம் கொண்டுள்ளன.", opts_ta: ["சரி", "தவறு"] },
    "The pH of a neutral solution is _____.": { q_ta: "நடுநிலை கரைசலின் pH மதிப்பு _____ ஆகும்.", opts_ta: ["7", "0", "14", "1"] },
    "Which gas makes up most of Earth's atmosphere?": { q_ta: "பூமியின் வளிமண்டலத்தில் எந்த வாயு அதிகமாக உள்ளது?", opts_ta: ["நைட்ரஜன்", "ஆக்ஸிஜன்", "கார்பன் டை ஆக்சைடு", "ஆர்கான்"] },
    "Light travels in straight lines.": { q_ta: "ஒளி ஒரு நேர்கோட்டில் பயணிக்கிறது.", opts_ta: ["சரி", "தவறு"] },
    "The powerhouse of the cell is the:": { q_ta: "செல்லின் ஆற்றல் மையம் எது:", opts_ta: ["மைட்டோகாண்ட்ரியா", "உட்கரு", "ரைபோசோம்", "கோல்கி உடல்"] },
    "An atom's nucleus contains protons and _____.": { q_ta: "ஒரு அணுவின் உட்கரு புரோட்டான்கள் மற்றும் _____ ஆகியவற்றைக் கொண்டுள்ளது.", opts_ta: ["நியூட்ரான்கள்", "எலக்ட்ரான்கள்", "ஃபோட்டான்கள்", "அயனிகள்"] },
    "Sound can travel through a vacuum.": { q_ta: "ஒலியால் வெற்றிடத்தில் பயணிக்க முடியும்.", opts_ta: ["சரி", "தவறு"] }
};

function translateMaths(qText: string): string {
    let t = qText;
    t = t.replace(/What is ([0-9]+) \+ ([0-9]+)\?/g, "$1 + $2 இன் மதிப்பு என்ன?");
    t = t.replace(/What is ([0-9]+) × ([0-9]+)\?/g, "$1 × $2 இன் மதிப்பு என்ன?");
    t = t.replace(/([0-9]+) is an even number\./g, "$1 ஓர் இரட்டைப்படை எண்.");
    t = t.replace(/What is ([0-9]+) ÷ ([0-9]+)\?/g, "$1 ÷ $2 இன் மதிப்பு என்ன?");
    t = t.replace(/([0-9]+) is a prime number\./g, "$1 ஒரு பகா எண்.");
    t = t.replace(/If x \+ ([0-9]+) = ([0-9]+), then x = _____/g, "x + $1 = $2 எனில், x = _____");
    return t;
}

function translateEnglish(qText: string, opts: string[]): { q: string, opts: string[] } {
    let q = qText;
    let newOpts = [...opts];

    // Noun Naming Word
    const nounMatch = qText.match(/What part of speech is the word "(.*?)"\?/);
    if (nounMatch) {
        q = `"${nounMatch[1]}" என்ற சொல் எவ்வகைச் சொல்?`;
        newOpts = newOpts.map(o => o === "Noun" ? "பெயர்ச்சொல்" : o === "Verb" ? "வினைச்சொல்" : o === "Adjective" ? "பெயரடை" : o === "Adverb" ? "வினையடை" : o);
        return { q, opts: newOpts };
    }

    // Verb
    const verbMatch = qText.match(/"(.*?)" is a verb\./);
    if (verbMatch) {
        q = `"${verbMatch[1]}" ஒரு வினைச்சொல்.`;
        newOpts = newOpts.map(o => o === "True" ? "சரி" : "தவறு");
        return { q, opts: newOpts };
    }

    // Synonym
    const synMatch = qText.match(/A synonym of "(.*?)" is _____\./);
    if (synMatch) return { q: `"${synMatch[1]}" என்பதன் ஒத்த சொல் _____.`, opts };

    // Antonym
    const antMatch = qText.match(/What is the antonym of "(.*?)"\?/);
    if (antMatch) return { q: `"${antMatch[1]}" என்பதன் எதிர்ச்சொல் என்ன?`, opts };

    // Adjective
    const adjMatch = qText.match(/"(.*?)" is an adjective\./);
    if (adjMatch) {
        return { q: `"${adjMatch[1]}" ஒரு பெயரடை.`, opts: opts.map(o => o === "True" ? "சரி" : "தவறு") };
    }

    // Adverb
    const advMatch = qText.match(/She ran _____\. \(Choose: (.*?)\)/);
    if (advMatch) return { q: `அவள் _____ ஓடினாள். (தேர்வு: ${advMatch[1]})`, opts };

    // Hard English types
    if (qText === "Choose the correct sentence:") return { q: "சரியான வாக்கியத்தைத் தேர்ந்தெடு:", opts };
    if (qText === 'Identify the type: "What a beautiful day!"') {
        q = `வகைப்படுத்துக: "What a beautiful day!"`;
        newOpts = newOpts.map(o => o === "Exclamatory" ? "வியப்பு வாக்கியம்" : o === "Interrogative" ? "வினா வாக்கியம்" : o === "Imperative" ? "கட்டளை வாக்கியம்" : o === "Declarative" ? "செய்தி வாக்கியம்" : o);
        return { q, opts: newOpts };
    }
    if (qText === "Which word is a conjunction?") return { q: "எது இணைப்புச்சொல்?", opts };
    if (qText === 'The passive voice of "She writes a letter" is:') return { q: `"She writes a letter" என்பதன் செயப்பாட்டு வினை:`, opts };
    if (qText === "Pick the correctly spelled word:") return { q: "சரியாக உச்சரிக்கப்பட்ட சொல்லைத் தேர்வு செய்:", opts };

    const nounVerbMatch = qText.match(/"(.*?)" can be used as both a noun and a verb\./);
    if (nounVerbMatch) return { q: `"${nounVerbMatch[1]}" பெயர்ச்சொல்லாகவும் வினைச்சொல்லாகவும் பயன்படலாம்.`, opts: opts.map(o => o === "True" ? "சரி" : "தவறு") };

    const wordMeanMatch = qText.match(/A word meaning "(.*?)" is _____\./);
    if (wordMeanMatch) return { q: `"${wordMeanMatch[1]}" என்று பொருள்படும் சொல் _____.`, opts };

    return { q: qText, opts }; // Fallback
}

async function runDeepTranslationAll() {
    console.log("Fetching all quiz questions to apply smart deep translations...");
    const { data: questions, error } = await supabase.from("quiz_questions").select("id, question_text, options, quiz_id");
    if (error || !questions) return;

    console.log(`Analyzing ${questions.length} questions...`);
    let translatedCount = 0;

    for (const q of questions) {
        let qTa = q.question_text;
        let optsTa = [...q.options];
        let wasTranslated = false;

        // 1. Science check
        if (SCIENCE_TRANS[q.question_text]) {
            qTa = SCIENCE_TRANS[q.question_text].q_ta;
            optsTa = SCIENCE_TRANS[q.question_text].opts_ta;
            wasTranslated = true;
        }
        // 2. Maths check
        else if (q.question_text.includes("+") || q.question_text.includes("×") || q.question_text.includes("÷") || q.question_text.includes("even") || q.question_text.includes("prime") || q.question_text.includes("x +")) {
            qTa = translateMaths(q.question_text);
            if (qTa !== q.question_text) {
                optsTa = optsTa.map(o => o === "True" ? "சரி" : o === "False" ? "தவறு" : o);
                wasTranslated = true;
            }
        }
        // 3. English Check
        else {
            const result = translateEnglish(q.question_text, q.options);
            if (result.q !== q.question_text) {
                qTa = result.q;
                optsTa = result.opts;
                wasTranslated = true;
            }
        }

        // Remove fake tags if we couldn't translate it
        if (!wasTranslated) {
            qTa = qTa.replace(" (தமிழில்)", "").replace(" (தா)", "");
            optsTa = optsTa.map(o => typeof o === "string" ? o.replace(" (தா)", "").replace(" (தமிழில்)", "") : o);

            // Apply simple True/False just in case
            optsTa = optsTa.map(o => o === "True" ? "சரி" : o === "False" ? "தவறு" : o);
        }

        await supabase.from("quiz_questions").update({
            question_text_tamil: qTa,
            options_tamil: optsTa
        }).eq("id", q.id);

        translatedCount++;
        if (translatedCount % 50 === 0) console.log(`Processed ${translatedCount}/${questions.length}`);
    }

    console.log(`✅ Deep Translation Complete for all ${translatedCount} questions!`);
}

runDeepTranslationAll();
