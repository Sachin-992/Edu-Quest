/**
 * MissingWordChallenge — Fill-in-the-blank vocabulary and grammar game
 * Players pick the correct word to complete sentences
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, Star, BookOpen,
  Lightbulb, Trophy, Sparkles, ChevronRight,
} from "lucide-react";

interface MissingWordChallengeProps {
  category?: string;
  onComplete: (score: number, xpEarned: number) => void;
  onBack: () => void;
}

interface QuestionData {
  id: string;
  sentence: string; // Use ___ for blank
  options: string[];
  correct: string;
  explanation: string;
  tamilTranslation: string;
  category: "grammar" | "vocabulary" | "prepositions" | "articles" | "tenses";
}

const QUESTIONS: QuestionData[] = [
  // Grammar
  { id: "g1", sentence: "She ___ to the park every morning.", options: ["go", "goes", "going", "gone"], correct: "goes", explanation: "'Goes' is the correct third-person singular present tense form.", tamilTranslation: "அவள் தினமும் காலையில் பூங்காவுக்குப் போகிறாள்.", category: "grammar" },
  { id: "g2", sentence: "They ___ playing football yesterday.", options: ["was", "were", "is", "are"], correct: "were", explanation: "'Were' is used with plural subjects in past continuous tense.", tamilTranslation: "அவர்கள் நேற்று கால்பந்து விளையாடிக்கொண்டிருந்தார்கள்.", category: "grammar" },
  { id: "g3", sentence: "He has ___ finished his homework.", options: ["all ready", "already", "all ways", "always"], correct: "already", explanation: "'Already' means before now or before a particular time.", tamilTranslation: "அவன் ஏற்கனவே தனது வீட்டுப்பாடத்தை முடித்துவிட்டான்.", category: "grammar" },
  { id: "g4", sentence: "Neither Ram ___ Sita came to school.", options: ["or", "nor", "and", "but"], correct: "nor", explanation: "'Neither...nor' is the correct correlative conjunction pair.", tamilTranslation: "ராமும் சீதாவும் பள்ளிக்கு வரவில்லை.", category: "grammar" },
  // Vocabulary
  { id: "v1", sentence: "The scientist made an important ___.", options: ["discovery", "recover", "disguise", "discount"], correct: "discovery", explanation: "'Discovery' means finding something new or previously unknown.", tamilTranslation: "விஞ்ஞானி ஒரு முக்கியமான கண்டுபிடிப்பைச் செய்தார்.", category: "vocabulary" },
  { id: "v2", sentence: "Her ___ to help others is truly admirable.", options: ["willingness", "weakness", "wilderness", "witness"], correct: "willingness", explanation: "'Willingness' means being ready and eager to do something.", tamilTranslation: "மற்றவர்களுக்கு உதவ அவளின் விருப்பம் மிகவும் போற்றத்தக்கது.", category: "vocabulary" },
  { id: "v3", sentence: "The ___ view from the mountain was breathtaking.", options: ["scenic", "scientific", "skeptical", "scarce"], correct: "scenic", explanation: "'Scenic' describes a view that is beautiful or picturesque.", tamilTranslation: "மலையிலிருந்து அழகான காட்சி மூச்சையடக்கும்.", category: "vocabulary" },
  { id: "v4", sentence: "We must ___ our natural resources.", options: ["conserve", "consider", "consume", "convert"], correct: "conserve", explanation: "'Conserve' means to protect from harm or wasteful use.", tamilTranslation: "நாம் நமது இயற்கை வளங்களைப் பாதுகாக்க வேண்டும்.", category: "vocabulary" },
  // Prepositions
  { id: "p1", sentence: "The cat jumped ___ the table.", options: ["in", "on", "at", "onto"], correct: "onto", explanation: "'Onto' indicates movement to a position on the surface of something.", tamilTranslation: "பூனை மேசையின் மீது குதித்தது.", category: "prepositions" },
  { id: "p2", sentence: "She has been waiting ___ 3 o'clock.", options: ["since", "for", "from", "at"], correct: "since", explanation: "'Since' is used with a specific point in time.", tamilTranslation: "அவள் 3 மணி முதல் காத்திருக்கிறாள்.", category: "prepositions" },
  { id: "p3", sentence: "The book is ___ the shelf.", options: ["in", "on", "at", "under"], correct: "on", explanation: "'On' indicates position on a surface.", tamilTranslation: "புத்தகம் அடுக்கின் மீது உள்ளது.", category: "prepositions" },
  { id: "p4", sentence: "He is good ___ playing chess.", options: ["in", "on", "at", "for"], correct: "at", explanation: "'Good at' is the correct preposition collocation for skills.", tamilTranslation: "அவன் சதுரங்கம் விளையாடுவதில் திறமையானவன்.", category: "prepositions" },
  // Articles
  { id: "a1", sentence: "___ Eiffel Tower is in Paris.", options: ["A", "An", "The", "No article"], correct: "The", explanation: "'The' is used for unique/specific landmarks.", tamilTranslation: "ஈபிள் கோபுரம் பாரிஸில் உள்ளது.", category: "articles" },
  { id: "a2", sentence: "She is ___ honest girl.", options: ["a", "an", "the", "no article"], correct: "an", explanation: "'An' is used before words starting with a vowel sound.", tamilTranslation: "அவள் ஒரு நேர்மையான பெண்.", category: "articles" },
  { id: "a3", sentence: "I saw ___ elephant at the zoo.", options: ["a", "an", "the", "some"], correct: "an", explanation: "'An' is used before vowel sounds (elephant starts with 'e').", tamilTranslation: "நான் உயிரியல் பூங்காவில் ஒரு யானையைப் பார்த்தேன்.", category: "articles" },
  // Tenses
  { id: "t1", sentence: "By next year, she ___ graduated from college.", options: ["will have", "would have", "has", "had"], correct: "will have", explanation: "'Will have' is future perfect tense for completed future actions.", tamilTranslation: "அடுத்த ஆண்டுக்குள் அவள் கல்லூரியில் பட்டம் பெற்றிருப்பாள்.", category: "tenses" },
  { id: "t2", sentence: "I ___ to the market when it started raining.", options: ["walk", "walked", "was walking", "had walked"], correct: "was walking", explanation: "'Was walking' is past continuous — an ongoing action interrupted by another.", tamilTranslation: "மழை பெய்யத் தொடங்கியபோது நான் கடைக்கு நடந்துகொண்டிருந்தேன்.", category: "tenses" },
  { id: "t3", sentence: "They ___ in this city since 2015.", options: ["live", "lived", "have lived", "are living"], correct: "have lived", explanation: "'Have lived' is present perfect for actions starting in the past and continuing.", tamilTranslation: "அவர்கள் 2015 முதல் இந்த நகரத்தில் வாழ்கிறார்கள்.", category: "tenses" },
  { id: "t4", sentence: "She ___ dinner before the guests arrived.", options: ["cook", "cooked", "was cooking", "had cooked"], correct: "had cooked", explanation: "'Had cooked' is past perfect — completed before another past action.", tamilTranslation: "விருந்தினர்கள் வருவதற்கு முன்பே அவள் உணவு சமைத்துவிட்டாள்.", category: "tenses" },
  { id: "t5", sentence: "The sun ___ in the east.", options: ["rise", "rises", "rose", "rising"], correct: "rises", explanation: "'Rises' is simple present for universal/habitual truths.", tamilTranslation: "சூரியன் கிழக்கில் உதிக்கிறது.", category: "tenses" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUNDS = 10;

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  grammar: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
  vocabulary: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500" },
  prepositions: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500" },
  articles: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" },
  tenses: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-500" },
};

const MissingWordChallenge = ({ category, onComplete, onBack }: MissingWordChallengeProps) => {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "complete">("playing");

  useEffect(() => {
    let pool = category
      ? QUESTIONS.filter((q) => q.category === category)
      : QUESTIONS;
    const shuffled = shuffleArray(pool).slice(0, ROUNDS);
    if (shuffled.length < ROUNDS) {
      const extra = shuffleArray(QUESTIONS.filter((q) => !shuffled.includes(q)));
      shuffled.push(...extra.slice(0, ROUNDS - shuffled.length));
    }
    setQuestions(shuffled);
  }, [category]);

  const currentQ = questions[currentIdx];

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === currentQ.correct) {
      setScore((prev) => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    const next = currentIdx + 1;
    if (next >= questions.length) {
      setGameState("complete");
      return;
    }
    setCurrentIdx(next);
    setSelected(null);
    setShowExplanation(false);
  };

  const xpEarned = Math.max(5, score * 3);

  if (gameState === "complete") {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-[80vh] flex items-center justify-center pb-28 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/50 rounded-3xl p-8 text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-7xl mb-4"
          >
            {percentage >= 80 ? "🌟" : percentage >= 50 ? "📝" : "📖"}
          </motion.div>

          <h2 className="text-2xl font-black text-foreground mb-2">
            {percentage >= 80 ? "Excellent!" : percentage >= 50 ? "Good Job!" : "Keep Learning!"}
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            You got {score} of {questions.length} words correct
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{score}/{questions.length}</div>
              <div className="text-[10px] font-bold text-muted-foreground">Correct</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3">
              <Sparkles className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">+{xpEarned}</div>
              <div className="text-[10px] font-bold text-muted-foreground">XP Earned</div>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex-1 py-3 rounded-2xl bg-muted hover:bg-muted/80 font-bold text-sm transition-colors"
            >
              Back
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onComplete(score, xpEarned)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg"
            >
              Collect XP! ⭐
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentQ) return null;

  const catColors = CATEGORY_COLORS[currentQ.category] || CATEGORY_COLORS.grammar;

  // Render sentence with blank highlighted
  const renderSentence = () => {
    const parts = currentQ.sentence.split("___");
    return (
      <p className="text-xl font-bold text-foreground leading-relaxed text-center">
        {parts[0]}
        <span className={`inline-block min-w-[80px] mx-1 border-b-3 ${selected ? (selected === currentQ.correct ? "border-green-500 text-green-600 dark:text-green-400" : "border-red-500 text-red-600 dark:text-red-400") : "border-violet-500"} font-black text-lg pb-0.5 transition-colors`}>
          {selected || "___"}
        </span>
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="min-h-[80vh] pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-lg font-black text-foreground">📝 Missing Word</h1>
            <p className="text-xs text-muted-foreground">Fill in the blanks correctly</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-black text-amber-500">{score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {currentIdx + 1}/{questions.length}
        </span>
      </div>

      {/* Category badge */}
      <div className="flex justify-center mb-5">
        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${catColors.bg} ${catColors.border} ${catColors.text} border`}>
          {currentQ.category}
        </span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6 shadow-lg"
        >
          {renderSentence()}
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {currentQ.options.map((option) => {
          const isSelected = selected === option;
          const isCorrectOption = option === currentQ.correct;
          const showResult = selected !== null;

          let buttonClass = "bg-card border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-foreground";
          if (showResult) {
            if (isCorrectOption) {
              buttonClass = "bg-green-500/15 border-green-500/50 text-green-700 dark:text-green-400 shadow-green-500/10";
            } else if (isSelected && !isCorrectOption) {
              buttonClass = "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-400";
            } else {
              buttonClass = "bg-card/50 border-border/30 text-muted-foreground opacity-50";
            }
          }

          return (
            <motion.button
              key={option}
              whileHover={!selected ? { scale: 1.03 } : {}}
              whileTap={!selected ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all shadow-sm ${buttonClass}`}
            >
              <div className="flex items-center justify-center gap-2">
                {showResult && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {showResult && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-500" />}
                {option}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-5 overflow-hidden"
          >
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-foreground">{currentQ.explanation}</p>
            </div>
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/30">
              <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{currentQ.tamilTranslation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {selected && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
        >
          {currentIdx + 1 >= questions.length ? "See Results 🏆" : "Next Question"}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};

export default MissingWordChallenge;
