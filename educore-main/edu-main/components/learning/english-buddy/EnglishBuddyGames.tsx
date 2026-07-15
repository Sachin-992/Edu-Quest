/**
 * EnglishBuddyGames — Hub component for English Buddy mini-games
 * Provides entry points to: Sentence Builder, Missing Word Challenge, Scenario Roleplay
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Puzzle,
  BookOpen,
  MessageCircle,
  Star,
  Trophy,
  Sparkles,
  Flame,
  ChevronRight,
} from "lucide-react";
import SentenceBuilder from "./SentenceBuilder";
import MissingWordChallenge from "./MissingWordChallenge";
import ScenarioRoleplay from "./ScenarioRoleplay";

interface EnglishBuddyGamesProps {
  onBack: () => void;
}

type ActiveGame = "hub" | "sentence_builder" | "missing_word" | "scenario_roleplay";

const GAMES = [
  {
    id: "sentence_builder" as const,
    title: "Sentence Builder",
    subtitle: "Arrange jumbled words into correct sentences",
    emoji: "🧩",
    icon: Puzzle,
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/10",
    borderGlow: "border-violet-500/30 hover:border-violet-400/50",
    xpRange: "15-40 XP",
    difficulty: "Easy → Hard",
  },
  {
    id: "missing_word" as const,
    title: "Missing Word",
    subtitle: "Fill in the blanks with the correct vocabulary",
    emoji: "📝",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/10",
    borderGlow: "border-emerald-500/30 hover:border-emerald-400/50",
    xpRange: "10-30 XP",
    difficulty: "Grammar & Vocab",
  },
  {
    id: "scenario_roleplay" as const,
    title: "Scenario Roleplay",
    subtitle: "Practice real-world English conversations",
    emoji: "🎭",
    icon: MessageCircle,
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
    borderGlow: "border-amber-500/30 hover:border-amber-400/50",
    xpRange: "20-50 XP",
    difficulty: "Interactive Dialogue",
  },
];

const EnglishBuddyGames = ({ onBack }: EnglishBuddyGamesProps) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>("hub");
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  // Load stats from localStorage
  useState(() => {
    const xp = parseInt(localStorage.getItem("eq_ebg_total_xp") || "0");
    const played = parseInt(localStorage.getItem("eq_ebg_games_played") || "0");
    setTotalXPEarned(xp);
    setGamesPlayed(played);
  });

  const handleGameComplete = (score: number, xpEarned: number) => {
    const newXP = totalXPEarned + xpEarned;
    const newPlayed = gamesPlayed + 1;
    setTotalXPEarned(newXP);
    setGamesPlayed(newPlayed);
    localStorage.setItem("eq_ebg_total_xp", String(newXP));
    localStorage.setItem("eq_ebg_games_played", String(newPlayed));
    setActiveGame("hub");
  };

  const handleBackFromGame = () => setActiveGame("hub");

  // Render active game
  if (activeGame === "sentence_builder") {
    return (
      <SentenceBuilder
        onComplete={handleGameComplete}
        onBack={handleBackFromGame}
      />
    );
  }

  if (activeGame === "missing_word") {
    return (
      <MissingWordChallenge
        onComplete={handleGameComplete}
        onBack={handleBackFromGame}
      />
    );
  }

  if (activeGame === "scenario_roleplay") {
    return (
      <ScenarioRoleplay
        onComplete={handleGameComplete}
        onBack={handleBackFromGame}
      />
    );
  }

  // Hub view
  return (
    <div className="min-h-[80vh] pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            🎮 English Games
          </h1>
          <p className="text-sm text-muted-foreground">
            Practice English through fun mini-games!
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mb-6"
      >
        <div className="flex-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Total XP</div>
            <div className="font-black text-sm text-foreground">{totalXPEarned}</div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Games Played</div>
            <div className="font-black text-sm text-foreground">{gamesPlayed}</div>
          </div>
        </div>
      </motion.div>

      {/* Game cards */}
      <div className="space-y-4">
        {GAMES.map((game, idx) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveGame(game.id)}
            className={`w-full bg-card/80 backdrop-blur-sm border ${game.borderGlow} rounded-2xl p-5 flex items-center gap-4 text-left transition-all shadow-lg hover:shadow-xl group`}
          >
            {/* Icon */}
            <div className={`h-14 w-14 rounded-2xl ${game.bgGlow} border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <span className="text-3xl">{game.emoji}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                {game.title}
                <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {game.subtitle}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${game.gradient} text-white`}>
                  {game.xpRange}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {game.difficulty}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Motivational footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/30 text-xs text-muted-foreground font-semibold">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          Play daily to build your English streak!
        </div>
      </motion.div>
    </div>
  );
};

export default EnglishBuddyGames;
