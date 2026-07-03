/**
 * Local Fallback System for Fun Corner
 * 
 * When the Supabase DB has no questions for a given subject/grade,
 * this module converts the local question banks (GK, Vocab, Science)
 * into the MultilingualQuestion format expected by the FunCorner quiz renderer.
 */

import type { MultilingualQuestion } from "@/hooks/useMultilingualQuestions";
import { GK_QUESTIONS, VOCAB_WORDS, SCIENCE_EXPERIMENTS } from "./gameData";
import { GK_QUESTIONS_BANK } from "./gkQuestions";
import { VOCAB_WORDS_BANK } from "./vocabQuestions";
import { SCIENCE_QUESTIONS as SCIENCE_BANK_EXPANDED } from "./scienceQuestions";

// Merge original + expanded question banks
const GK_BANK = [...GK_QUESTIONS, ...GK_QUESTIONS_BANK];
const VOCAB_BANK = [...VOCAB_WORDS, ...VOCAB_WORDS_BANK];
const SCIENCE_BANK = [...SCIENCE_EXPERIMENTS, ...SCIENCE_BANK_EXPANDED];

/** Filter items by classRange */
function filterByClass<T extends { classRange: [number, number] }>(items: T[], classLevel: number): T[] {
  return items.filter(item => classLevel >= item.classRange[0] && classLevel <= item.classRange[1]);
}

/** Shuffle array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Convert GK questions to MultilingualQuestion format */
function convertGK(classLevel: number, lang: string): MultilingualQuestion[] {
  const filtered = filterByClass(GK_BANK, classLevel);
  const shuffled = shuffle(filtered).slice(0, 10);
  const isTamil = lang === "ta";

  return shuffled.map((q, idx) => {
    const opts = isTamil ? q.options_ta : q.options;
    const answer = isTamil ? q.answer_ta : q.answer;
    const answerIdx = opts.indexOf(answer);
    const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;

    return {
      id: `local-gk-${idx}`,
      subject: "gk_quiz",
      grade_level: classLevel,
      correct_option_key: optionKeys[answerIdx >= 0 ? answerIdx : 0],
      language_code: lang,
      question_text: isTamil ? q.q_ta : q.q,
      option_a: opts[0],
      option_b: opts[1],
      option_c: opts[2],
      option_d: opts[3],
    };
  });
}

/** Convert Vocab words to MultilingualQuestion format */
function convertVocab(classLevel: number, lang: string): MultilingualQuestion[] {
  const filtered = filterByClass(VOCAB_BANK, classLevel);
  const shuffled = shuffle(filtered).slice(0, 10);
  const isTamil = lang === "ta";

  return shuffled.map((w, idx) => {
    const opts = isTamil ? w.options_ta : w.options;
    const meaning = isTamil ? w.meaning_ta : w.meaning;
    const answerIdx = opts.indexOf(meaning);
    const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;

    return {
      id: `local-vocab-${idx}`,
      subject: "vocabulary",
      grade_level: classLevel,
      correct_option_key: optionKeys[answerIdx >= 0 ? answerIdx : 0],
      language_code: lang,
      question_text: isTamil 
        ? `"${w.word_ta}" — இதன் பொருள் என்ன?`
        : `What does "${w.word}" mean?`,
      option_a: opts[0],
      option_b: opts[1],
      option_c: opts[2],
      option_d: opts[3],
    };
  });
}

/** Convert Science questions to MultilingualQuestion format */
function convertScience(classLevel: number, lang: string): MultilingualQuestion[] {
  const filtered = filterByClass(SCIENCE_BANK, classLevel);
  const shuffled = shuffle(filtered);
  const isTamil = lang === "ta";

  return shuffled.map((q, idx) => {
    const opts = isTamil ? q.options_ta : q.options;
    const answer = isTamil ? q.answer_ta : q.answer;
    const answerIdx = opts.indexOf(answer);
    const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;

    return {
      id: `local-sci-${idx}`,
      subject: "science_lab",
      grade_level: classLevel,
      correct_option_key: optionKeys[answerIdx >= 0 ? answerIdx : 0],
      language_code: lang,
      question_text: isTamil ? q.question_ta : q.question,
      option_a: opts[0],
      option_b: opts[1],
      option_c: opts[2],
      option_d: opts[3],
      explanation: isTamil ? q.explanation_ta : q.explanation,
    };
  });
}

/** Main fallback function — returns local questions when DB is empty */
export function getLocalFallback(
  subject: "gk_quiz" | "vocabulary" | "science_lab",
  classLevel: number,
  lang: string
): MultilingualQuestion[] {
  switch (subject) {
    case "gk_quiz": return convertGK(classLevel, lang);
    case "vocabulary": return convertVocab(classLevel, lang);
    case "science_lab": return convertScience(classLevel, lang);
    default: return [];
  }
}
