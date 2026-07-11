import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Award,
  BookOpen,
  Play,
  Flame,
  Sparkles,
  Info,
  Calendar,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  CheckCircle,
  HelpCircle,
  Lightbulb
} from "lucide-react";
import { NMMS_STATIC_QUESTIONS } from "./questionsData";
import PracticeMode from "./modes/PracticeMode";
import DailyChallenge from "./modes/DailyChallenge";
import NMMSAnalytics from "./quiz/NMMSAnalytics";
import NMMSExamInfo from "./NMMSExamInfo";
import MockTestEngine from "./modes/MockTestEngine";
import PreviousYearPapers from "./modes/PreviousYearPapers";

interface NMMSHubProps {
  onBack: () => void;
}

export type NMMSView =
  | { screen: "lobby" }
  | { screen: "practice" }
  | { screen: "daily" }
  | { screen: "analytics" }
  | { screen: "info" }
  | { screen: "mock" }
  | { screen: "papers" };

export default function NMMSHub({ onBack }: NMMSHubProps) {
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  const [currentView, setCurrentView] = useState<NMMSView>({ screen: "lobby" });
  const [stats, setStats] = useState({
    totalSolved: 0,
    accuracy: 0,
    dailyStreak: 0,
    readinessScore: 0,
    xpEarned: 0,
    coinsEarned: 0
  });

  const [loading, setLoading] = useState(true);

  // Motivational Quotes
  const MOTIVATIONAL_QUOTES = [
    {
      en: "The secret to getting ahead is getting started. Perfect your NMMS preparation!",
      ta: "முன்னேறுவதற்கான ரகசியம் தொடங்குவதே ஆகும். உங்கள் NMMS தயாரிப்பை முழுமையாக்குங்கள்!"
    },
    {
      en: "Every correct answer brings you one step closer to the NMMS scholarship!",
      ta: "ஒவ்வொரு சரியான பதிலும் உங்களை NMMS உதவித்தொகைக்கு ஒரு படி மேலே கொண்டு செல்லும்!"
    },
    {
      en: "Train your mind with Mental Ability Tests (MAT) — logical thinking is a superpower!",
      ta: "மனத்திறன் தேர்வுகளுடன் (MAT) உங்கள் மூளைக்கு பயிற்சி அளிக்கவும் — தர்க்கரீதியான சிந்தனை ஒரு சூப்பர் பவர்!"
    }
  ];

  const [quoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const activeQuote = isTamil ? MOTIVATIONAL_QUOTES[quoteIndex].ta : MOTIVATIONAL_QUOTES[quoteIndex].en;

  useEffect(() => {
    if (!user) return;
    const fetchNMMSStats = async () => {
      try {
        setLoading(true);
        // Load sessions to calculate stats
        const { data: sessions, error } = await supabase
          .from("nmms_sessions")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        if (sessions && sessions.length > 0) {
          const totalSolved = sessions.reduce((sum, s) => sum + (s.answered || 0), 0);
          const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct || 0), 0);
          const xpEarned = sessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);
          const coinsEarned = sessions.reduce((sum, s) => sum + (s.coins_earned || 0), 0);
          const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

          // Calculate readiness score based on accuracy + volume
          const readinessScore = Math.min(
            100,
            Math.round((accuracy * 0.7) + (Math.min(totalSolved, 200) / 200 * 30))
          );

          // Get daily challenge completions for streak
          const { data: completions } = await supabase
            .from("nmms_daily_completions")
            .select("completed_at")
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false });

          let streak = 0;
          if (completions && completions.length > 0) {
            // Compute streak (simple consecutive day counter)
            const dates = completions.map(c => new Date(c.completed_at).toDateString());
            const uniqueDates = Array.from(new Set(dates));
            
            let current = new Date();
            let checkStr = current.toDateString();
            
            if (uniqueDates.includes(checkStr)) {
              streak++;
              while (true) {
                current.setDate(current.getDate() - 1);
                checkStr = current.toDateString();
                if (uniqueDates.includes(checkStr)) {
                  streak++;
                } else {
                  break;
                }
              }
            } else {
              // Try yesterday
              current.setDate(current.getDate() - 1);
              checkStr = current.toDateString();
              if (uniqueDates.includes(checkStr)) {
                streak++;
                while (true) {
                  current.setDate(current.getDate() - 1);
                  checkStr = current.toDateString();
                  if (uniqueDates.includes(checkStr)) {
                    streak++;
                  } else {
                    break;
                  }
                }
              }
            }
          }

          setStats({
            totalSolved,
            accuracy,
            dailyStreak: streak,
            readinessScore,
            xpEarned,
            coinsEarned
          });
        }
      } catch (err) {
        console.error("Error loading NMMS stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNMMSStats();
  }, [user, currentView]);

  const handleModeComplete = () => {
    setCurrentView({ screen: "lobby" });
  };

  return (
    <div className="w-full min-h-screen text-foreground select-none pb-24">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between mb-8 p-1">
        <button
          onClick={() => {
            if (currentView.screen === "lobby") {
              onBack();
            } else {
              setCurrentView({ screen: "lobby" });
            }
          }}
          className="flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground transition-colors bg-card/65 border border-border/30 backdrop-blur-md px-4 py-2 rounded-2xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentView.screen === "lobby" ? (isTamil ? "முகப்பு" : "Lobby") : (isTamil ? "பின்செல்" : "Back to Hub")}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 text-sm md:text-base tracking-wider uppercase">
            {isTamil ? "NMMS உதவித்தொகை தயாரிப்பு" : "NMMS Scholarship Preparation"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentView.screen === "lobby" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 border border-purple-500/25 p-6 md:p-8 shadow-[0_0_40px_rgba(108,60,225,0.25)] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl text-left">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full text-yellow-400 text-[10px] font-black tracking-widest uppercase">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  {isTamil ? "தேசிய திறனாய்வுத் தேர்வு" : "National Means-cum-Merit Scholarship"}
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                  {isTamil ? "உன் கனவு உதவித்தொகை உன்னை தேடி வரட்டும்!" : "Master the NMMS Exam & Win ₹48,000!"}
                </h1>
                <p className="text-xs md:text-sm text-purple-200 font-semibold leading-relaxed">
                  {activeQuote}
                </p>
              </div>

              {/* Readiness Circle */}
              <div className="flex flex-col items-center justify-center shrink-0 bg-background/35 border border-white/10 backdrop-blur-xl p-5 rounded-2xl w-40 h-40">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="text-white/10"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="text-yellow-400"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * stats.readinessScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-2xl font-black text-white">{stats.readinessScore}%</span>
                </div>
                <span className="text-[10px] font-black text-purple-200 mt-2 uppercase tracking-wider">
                  {isTamil ? "தயாரிப்பு நிலை" : "Readiness Score"}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: isTamil ? "தீர்க்கப்பட்டவை" : "Solved", val: stats.totalSolved, emoji: "🎯", color: "from-blue-500/10 to-blue-600/10 border-blue-500/20" },
                { label: isTamil ? "துல்லியம்" : "Accuracy", val: `${stats.accuracy}%`, emoji: "📈", color: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20" },
                { label: isTamil ? "தொடர் நாட்கள்" : "Streak", val: `${stats.dailyStreak} Days`, emoji: "🔥", color: "from-orange-500/10 to-orange-600/10 border-orange-500/20" },
                { label: isTamil ? "ஈட்டிய XP" : "XP Gained", val: stats.xpEarned, emoji: "⚡", color: "from-purple-500/10 to-purple-600/10 border-purple-500/20" }
              ].map((s, idx) => (
                <div key={idx} className={`p-4.5 rounded-2xl bg-gradient-to-br ${s.color} border text-center relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                  <span className="absolute -top-3 -right-3 text-3xl opacity-15">{s.emoji}</span>
                  <div className="text-xl md:text-2xl font-black text-foreground">{s.val}</div>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Modes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Practice Mode */}
              <div
                onClick={() => setCurrentView({ screen: "practice" })}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-purple-500/40 shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full group-hover:bg-purple-500/10 transition-colors" />
                <div className="flex gap-4">
                  <div className="p-3 bg-purple-500/15 border border-purple-500/20 rounded-2xl self-start">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">
                      {isTamil ? "வகுப்புவாரியாக பயிற்சி" : "Topic-wise Practice"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {isTamil
                        ? "மனத்திறன் (MAT) மற்றும் பாடம் சார்ந்த (SAT) தலைப்புகளில் வரம்பற்ற கேள்விகளைப் பயிற்சி செய்யத் தொடங்குங்கள்."
                        : "Practice unlimited bilingual questions sorted by MAT sections and SAT subjects (Maths, Science, Social)."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mt-2">
                      {isTamil ? "பயிற்சி செய்" : "Start Practicing"}
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Challenge */}
              <div
                onClick={() => setCurrentView({ screen: "daily" })}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-orange-500/40 shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full group-hover:bg-orange-500/10 transition-colors" />
                <div className="flex gap-4">
                  <div className="p-3 bg-orange-500/15 border border-orange-500/20 rounded-2xl self-start">
                    <Flame className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">
                      {isTamil ? "தினசரி சவால்கள்" : "Daily Challenge"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {isTamil
                        ? "தினமும் 10 கலப்பு கேள்விகள். உங்கள் தொடர் நாட்களைப் பாதுகாத்து, கூடுதல் XP மற்றும் நாணயங்களை வெல்லுங்கள்!"
                        : "Solve 10 mixed questions every day. Maintain your streak to earn premium reward chests, XP & coins!"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 mt-2">
                      {isTamil ? "சவாலை ஏற்றுக்கொள்" : "Take Challenge"}
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Analytics */}
              <div
                onClick={() => setCurrentView({ screen: "analytics" })}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-blue-500/40 shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors" />
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-500/15 border border-blue-500/20 rounded-2xl self-start">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">
                      {isTamil ? "செயல்திறன் பகுப்பாய்வு" : "Performance Analytics"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {isTamil
                        ? "உங்கள் பலவீனமான தலைப்புகளைக் கண்டறிந்து, தேர்வுக்கான முன்னேற்றத்தை வரைபடங்கள் மூலம் கண்காணிக்கவும்."
                        : "Track your subject accuracy, evaluate weak chapters, and analyze your mock test performance curves."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mt-2">
                      {isTamil ? "பகுப்பாய்வு செய்" : "View Insights"}
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Test */}
              <div
                onClick={() => setCurrentView({ screen: "mock" })}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-purple-600/40 shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-bl-full group-hover:bg-purple-600/10 transition-colors" />
                <div className="flex gap-4">
                  <div className="p-3 bg-purple-600/15 border border-purple-600/20 rounded-2xl self-start">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">
                      {isTamil ? "முழு மாதிரித் தேர்வு" : "Full Length Mock Exam"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {isTamil
                        ? "உண்மையான தேர்வு நேரத்தை அனுபவியுங்கள். 90 கேள்விகள், 90 நிமிடங்கள், எதிர்மறை மதிப்பெண்கள் இல்லை."
                        : "Experience the real NMMS exam conditions. 90-minute timed exam with full-length question grid."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mt-2">
                      {isTamil ? "மாதிரித் தேர்வு எழுது" : "Start Mock Exam"}
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Previous Papers */}
              <div
                onClick={() => setCurrentView({ screen: "papers" })}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-indigo-500/40 shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex gap-4">
                  <div className="p-3 bg-indigo-500/15 border border-indigo-500/20 rounded-2xl self-start">
                    <Calendar className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">
                      {isTamil ? "முந்தைய வினாத்தாள்கள்" : "Previous Year Papers"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {isTamil
                        ? "கடந்த ஆண்டுகளின் அதிகாரப்பூர்வ வினாத்தாள்களைக் கொண்டு தேர்வு எழுதிப் பழகுங்கள்."
                        : "Solve authentic board question papers from previous years under study or timed mode."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mt-2">
                      {isTamil ? "வினாத்தாள்களைக் காண்க" : "Browse Papers"}
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Info */}
              <div
                onClick={() => setCurrentView({ screen: "info" })}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-emerald-500/40 shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex gap-4">
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl self-start">
                    <Info className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">
                      {isTamil ? "தேர்வு விவரங்கள் & தகுதி" : "Exam Info & Eligibility"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {isTamil
                        ? "NMMS தகுதிகள், மதிப்பெண் வழங்கும் முறை மற்றும் பிற தேவையான விவரங்கள் அனைத்தையும் பற்றி அறிந்துகொள்ளுங்கள்."
                        : "Understand exam timing details, state qualifying thresholds, income limitations, and syllabus breakdown."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-2">
                      {isTamil ? "விவரங்களைக் காண்க" : "Read Info"}
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentView.screen === "practice" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <PracticeMode onBack={handleModeComplete} />
          </motion.div>
        )}

        {currentView.screen === "daily" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <DailyChallenge onBack={handleModeComplete} />
          </motion.div>
        )}

        {currentView.screen === "analytics" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <NMMSAnalytics onBack={handleModeComplete} />
          </motion.div>
        )}

        {currentView.screen === "info" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <NMMSExamInfo onBack={handleModeComplete} />
          </motion.div>
        )}

        {currentView.screen === "mock" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <MockTestEngine onBack={handleModeComplete} />
          </motion.div>
        )}

        {currentView.screen === "papers" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <PreviousYearPapers onBack={handleModeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
