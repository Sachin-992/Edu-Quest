/**
 * SentenceBuilder — Interactive sentence arrangement mini-game
 * Players arrange jumbled words into correct sentences
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, Star, Flame, Trophy,
  Clock, Sparkles, RotateCcw,
} from "lucide-react";

interface SentenceBuilderProps {
  difficulty?: "easy" | "medium" | "hard";
  onComplete: (score: number, xpEarned: number) => void;
  onBack: () => void;
}

interface SentenceData {
  id: string;
  words: string[];
  correct: string[];
  hint: string;
  difficulty: "easy" | "medium" | "hard";
}

const SENTENCES: SentenceData[] = [
  // Easy (4-5 words)
  { id: "e1", words: ["is", "cat", "The", "sleeping"], correct: ["The", "cat", "is", "sleeping"], hint: "An animal resting", difficulty: "easy" },
  { id: "e2", words: ["apple", "I", "an", "eat"], correct: ["I", "eat", "an", "apple"], hint: "A healthy snack", difficulty: "easy" },
  { id: "e3", words: ["are", "friends", "We", "best"], correct: ["We", "are", "best", "friends"], hint: "Friendship", difficulty: "easy" },
  { id: "e4", words: ["bright", "sun", "The", "is"], correct: ["The", "sun", "is", "bright"], hint: "Daytime sky", difficulty: "easy" },
  { id: "e5", words: ["play", "Let's", "together", "games"], correct: ["Let's", "play", "games", "together"], hint: "Fun time", difficulty: "easy" },
  // Medium (6-7 words)
  { id: "m1", words: ["going", "am", "school", "I", "to", "today"], correct: ["I", "am", "going", "to", "school", "today"], hint: "Morning routine", difficulty: "medium" },
  { id: "m2", words: ["reading", "She", "a", "book", "is", "interesting"], correct: ["She", "is", "reading", "a", "interesting", "book"], hint: "A student studying", difficulty: "medium" },
  { id: "m3", words: ["garden", "flowers", "in", "beautiful", "The", "are", "the"], correct: ["The", "flowers", "in", "the", "garden", "are", "beautiful"], hint: "Nature's beauty", difficulty: "medium" },
  { id: "m4", words: ["homework", "finished", "have", "my", "I", "already"], correct: ["I", "have", "already", "finished", "my", "homework"], hint: "After school task", difficulty: "medium" },
  { id: "m5", words: ["can", "very", "brother", "My", "fast", "run"], correct: ["My", "brother", "can", "run", "very", "fast"], hint: "Athletic family", difficulty: "medium" },
  // Hard (8+ words)
  { id: "h1", words: ["library", "borrowed", "from", "interesting", "the", "I", "an", "book"], correct: ["I", "borrowed", "an", "interesting", "book", "from", "the", "library"], hint: "Where you find books", difficulty: "hard" },
  { id: "h2", words: ["teacher", "explained", "the", "lesson", "clearly", "Our", "very", "today"], correct: ["Our", "teacher", "explained", "the", "lesson", "very", "clearly", "today"], hint: "Classroom learning", difficulty: "hard" },
  { id: "h3", words: ["every", "should", "exercise", "We", "day", "for", "health", "good"], correct: ["We", "should", "exercise", "every", "day", "for", "good", "health"], hint: "Healthy habits", difficulty: "hard" },
  { id: "h4", words: ["birthday", "a", "friend", "My", "surprise", "me", "gave", "on", "my"], correct: ["My", "friend", "gave", "me", "a", "surprise", "on", "my", "birthday"], hint: "Special celebration", difficulty: "hard" },
  { id: "h5", words: ["planets", "are", "eight", "There", "in", "the", "solar", "system"], correct: ["There", "are", "eight", "planets", "in", "the", "solar", "system"], hint: "Space science", difficulty: "hard" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUNDS_PER_GAME = 8;

const SentenceBuilder = ({ difficulty = "medium", onComplete, onBack }: SentenceBuilderProps) => {
  const [gameState, setGameState] = useState<"playing" | "feedback" | "complete">("playing");
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [rounds, setRounds] = useState<SentenceData[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Initialize game
  useEffect(() => {
    const filtered = SENTENCES.filter((s) => s.difficulty === difficulty);
    const shuffled = shuffleArray(filtered).slice(0, ROUNDS_PER_GAME);
    // If not enough for difficulty, fill with others
    if (shuffled.length < ROUNDS_PER_GAME) {
      const others = shuffleArray(SENTENCES.filter((s) => s.difficulty !== difficulty));
      shuffled.push(...others.slice(0, ROUNDS_PER_GAME - shuffled.length));
    }
    setRounds(shuffled);
    if (shuffled.length > 0) {
      setAvailableWords(shuffleArray([...shuffled[0].words]));
    }
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const currentSentence = rounds[currentRound];

  const handleWordSelect = (word: string, index: number) => {
    setSelectedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => {
      const newArr = [...prev];
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const handleWordRemove = (word: string, index: number) => {
    setAvailableWords((prev) => [...prev, word]);
    setSelectedWords((prev) => {
      const newArr = [...prev];
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const handleSubmit = useCallback((timeout = false) => {
    if (!currentSentence) return;

    const correct = JSON.stringify(selectedWords) === JSON.stringify(currentSentence.correct);

    if (correct) {
      const streakBonus = Math.min(streak, 4);
      setScore((prev) => prev + 1 + streakBonus);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setIsCorrect(correct);
    setGameState("feedback");
  }, [selectedWords, currentSentence, streak]);

  const handleNextRound = () => {
    const nextRound = currentRound + 1;
    if (nextRound >= rounds.length) {
      setGameState("complete");
      return;
    }
    setCurrentRound(nextRound);
    setSelectedWords([]);
    setAvailableWords(shuffleArray([...rounds[nextRound].words]));
    setIsCorrect(null);
    setGameState("playing");
    setTimeLeft(difficulty === "hard" ? 30 : difficulty === "medium" ? 40 : 60);
  };

  const handleReset = () => {
    if (!currentSentence) return;
    setSelectedWords([]);
    setAvailableWords(shuffleArray([...currentSentence.words]));
  };

  const xpEarned = Math.max(5, score * 3 + bestStreak * 2);

  // Complete screen
  if (gameState === "complete") {
    const percentage = Math.round((score / rounds.length) * 100);
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
            {percentage >= 80 ? "🏆" : percentage >= 50 ? "⭐" : "📚"}
          </motion.div>

          <h2 className="text-2xl font-black text-foreground mb-2">
            {percentage >= 80 ? "Amazing!" : percentage >= 50 ? "Well Done!" : "Keep Practicing!"}
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            You arranged {score} of {rounds.length} sentences correctly
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{score}/{rounds.length}</div>
              <div className="text-[10px] font-bold text-muted-foreground">Score</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{bestStreak}x</div>
              <div className="text-[10px] font-bold text-muted-foreground">Best Streak</div>
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
              Back to Games
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onComplete(score, xpEarned)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-lg"
            >
              Collect XP! ⭐
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentSentence) return null;

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
            <h1 className="text-lg font-black text-foreground">🧩 Sentence Builder</h1>
            <p className="text-xs text-muted-foreground capitalize">{difficulty} Mode</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-black text-orange-500">{streak}x</span>
            </motion.div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-500">{score}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentRound + 1) / rounds.length) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {currentRound + 1}/{rounds.length}
        </span>
      </div>

      {/* Hint */}
      <motion.div
        key={currentRound}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-4 mb-5 text-center"
      >
        <p className="text-sm font-semibold text-muted-foreground">
          💡 Hint: <span className="text-foreground">{currentSentence.hint}</span>
        </p>
      </motion.div>

      {/* Selected words area (answer zone) */}
      <div className="mb-5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Your Sentence:
        </label>
        <div className="min-h-[72px] bg-card/60 backdrop-blur-sm border-2 border-dashed border-violet-500/30 rounded-2xl p-3 flex flex-wrap gap-2 items-start">
          <AnimatePresence mode="popLayout">
            {selectedWords.map((word, idx) => (
              <motion.button
                key={`selected-${idx}-${word}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => gameState === "playing" && handleWordRemove(word, idx)}
                className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${
                  gameState === "feedback"
                    ? isCorrect
                      ? "bg-green-500/20 border border-green-500/40 text-green-700 dark:text-green-400"
                      : "bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-400"
                    : "bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/25 cursor-pointer"
                }`}
                disabled={gameState !== "playing"}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
          {selectedWords.length === 0 && (
            <span className="text-sm text-muted-foreground/50 italic py-2">
              Tap words below to build your sentence...
            </span>
          )}
        </div>
      </div>

      {/* Available words (word bank) */}
      {gameState === "playing" && (
        <div className="mb-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            Word Bank:
          </label>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {availableWords.map((word, idx) => (
                <motion.button
                  key={`available-${idx}-${word}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleWordSelect(word, idx)}
                  className="px-4 py-2.5 rounded-xl bg-card border border-border/60 hover:border-violet-500/50 hover:bg-violet-500/10 font-bold text-sm text-foreground shadow-sm transition-all cursor-pointer"
                >
                  {word}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {gameState === "feedback" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl p-4 mb-5 border ${
              isCorrect
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-black text-sm">
                {isCorrect ? "Perfect! 🎉" : "Not quite! 🤔"}
              </span>
            </div>
            {!isCorrect && (
              <p className="text-xs text-muted-foreground">
                Correct answer: <span className="font-bold text-foreground">{currentSentence.correct.join(" ")}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        {gameState === "playing" && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex-1 py-3 rounded-2xl bg-muted hover:bg-muted/80 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubmit()}
              disabled={selectedWords.length !== currentSentence.words.length}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Check Answer
            </motion.button>
          </>
        )}
        {gameState === "feedback" && (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextRound}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          >
            {currentRound + 1 >= rounds.length ? "See Results 🏆" : "Next Sentence →"}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default SentenceBuilder;
