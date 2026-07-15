import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, Coins, Sparkles, CheckCircle2, Lock,
  Play, BookOpen, AlertTriangle, ShieldCheck, Heart, Users,
  ChevronRight, Award, Trophy, Compass, Zap, Gift, Target,
  ArrowRight, RotateCcw
} from "lucide-react";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

interface LifeSkillsProps {
  onBack: () => void;
  coins: number;
  setCoins: (c: number | ((prev: number) => number)) => void;
  buddyXP: number;
  setBuddyXP: (x: number | ((prev: number) => number)) => void;
}

// 4 Stories/Levels data
const STORIES = [
  {
    id: "money-management",
    level: 1,
    title: "Smart Saver",
    topic: "Money Management 💰",
    emoji: "🪙",
    color: "from-amber-400 via-orange-500 to-red-500",
    cardBg: "from-amber-500/15 to-orange-500/10",
    glow: "shadow-orange-500/30",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-600",
    badge: "Smart Saver 🏆",
    character: "Arun",
    description: "Help Arun decide between a giant melting chocolate volcano and a school notebook.",
    scenes: [
      {
        title: "The Birthday Gift",
        text: "Arun receives 100 pocket coins for his birthday! He is super excited and runs straight to the marketplace.",
        illustration: "🎁",
        bubble: "Yay! 100 coins! I can buy anything I want! What should I get first?"
      },
      {
        title: "The Dilemma",
        text: "At the shop, Arun sees a giant 'Chocolate Volcano' (a temporary sugary treat) for 80 coins. But he also needs a school notebook for 30 coins. He doesn't have enough for both!",
        illustration: "🌋",
        bubble: "The volcano looks so tasty! But my notebook is finished, and school starts tomorrow..."
      }
    ],
    choices: [
      {
        id: "volcano",
        text: "Buy the giant Chocolate Volcano first!",
        emoji: "🌋",
        nextScene: {
          title: "The Sticky Disaster",
          text: "Arun buys the chocolate volcano. It melts in 5 minutes, giving him a sticky stomach ache. The next day at school, he has no notebook and gets scolded by the teacher. Wants are nice, but Needs always come first!",
          illustration: "🤢",
          bubble: "Oh no... my tummy hurts and I don't have my notebook. I should have prioritized!",
          correct: false
        }
      },
      {
        id: "notebook",
        text: "Buy the notebook first, and save the rest!",
        emoji: "📓",
        nextScene: {
          title: "Smart Savings Win!",
          text: "Arun buys the school notebook first. He has 70 coins left. He saves them in his piggy bank. At school, he writes his lessons perfectly. Next week, he uses his savings to buy a small chocolate bar and still has coins left!",
          illustration: "🐷",
          bubble: "I did great at school and still got chocolate later! Saving money feels amazing!",
          correct: true
        }
      }
    ],
    summary: "Needs are things you must have to live and study (like food and notebooks). Wants are things that are nice to have but you can live without (like giant candies). Always secure your needs first!",
    xp_reward: 35,
    coin_reward: 20
  },
  {
    id: "kindness-empathy",
    level: 2,
    title: "Friendly Hero",
    topic: "Kindness & Empathy ❤️",
    emoji: "🤝",
    color: "from-rose-400 via-pink-500 to-fuchsia-500",
    cardBg: "from-rose-500/15 to-pink-500/10",
    glow: "shadow-pink-500/30",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-600",
    badge: "Kindness Hero 🏅",
    character: "Maya",
    description: "Maya sees her classmate Clara sitting alone at lunch because she dropped her sandwich.",
    scenes: [
      {
        title: "A Ruined Lunch",
        text: "During lunch break, Clara accidentally drops her sandwich on the floor. It is ruined, and she has nothing else to eat. She sits alone in a corner, crying softly.",
        illustration: "🥪",
        bubble: "I dropped my lunch... now I am going to be hungry all afternoon."
      },
      {
        title: "What to Do?",
        text: "Maya notices Clara sitting alone. Maya's friends are calling her to play tag on the playground.",
        illustration: "🏃‍♀️",
        bubble: "Clara looks so sad. But my friends are waiting to play my favorite game!"
      }
    ],
    choices: [
      {
        id: "ignore",
        text: "Run and play tag with your friends.",
        emoji: "🏃",
        nextScene: {
          title: "A Sad Afternoon",
          text: "Maya plays tag but keeps thinking about Clara. Clara stays hungry and sad. Maya feels guilty all day and doesn't enjoy her game. Ignoring someone in need hurts everyone.",
          illustration: "😔",
          bubble: "I won the game, but I feel terrible inside. Clara was so hungry...",
          correct: false
        }
      },
      {
        id: "share",
        text: "Share half of your lunch with Clara.",
        emoji: "🤝",
        nextScene: {
          title: "Double the Happiness",
          text: "Maya sits with Clara and shares her sandwich. Clara smiles happily and thanks her. They eat together and become best friends. Later, Clara helps Maya solve a very difficult math puzzle!",
          illustration: "👭",
          bubble: "Sharing made us both happy! Kindness always comes back to you in wonderful ways.",
          correct: true
        }
      }
    ],
    summary: "Empathy means understanding how someone else feels. When you see someone sad, taking a moment to help them not only makes them happy but fills you with joy too!",
    xp_reward: 35,
    coin_reward: 20
  },
  {
    id: "learn-say-no",
    level: 3,
    title: "Confidence Ninja",
    topic: "Learning to Say NO 🚫",
    emoji: "🛡️",
    color: "from-violet-400 via-purple-500 to-indigo-600",
    cardBg: "from-purple-500/15 to-indigo-500/10",
    glow: "shadow-indigo-500/30",
    iconBg: "bg-gradient-to-br from-violet-400 to-indigo-600",
    badge: "Safety Ninja ⚔️",
    character: "Raju",
    description: "A friend pressures Raju to sneak out of the school gates to buy sweet ice cream.",
    scenes: [
      {
        title: "The Temptation",
        text: "Raju's friend Vicky wants to get ice cream from a street vendor outside the school gates. He tells Raju to sneak out with him during recess.",
        illustration: "🍦",
        bubble: "Come on, Raju! The gate is open. Let's run out quickly, nobody will see us!"
      },
      {
        title: "Safety First",
        text: "Raju knows that leaving the school premises without permission is against the safety rules. Vicky calls him a 'scaredy-cat'.",
        illustration: "🚪",
        bubble: "I want ice cream, but going outside the school gates is unsafe. What should I do?"
      }
    ],
    choices: [
      {
        id: "agree",
        text: "Go with Vicky to look cool.",
        emoji: "😎",
        nextScene: {
          title: "Caught and Lost",
          text: "They sneak out. A stray dog scares them, and they get lost on the street. The teachers search for them, and their parents are called. Vicky blames Raju. Looking cool is never worth compromising your safety.",
          illustration: "🐕",
          bubble: "I was so scared... and now my parents are upset. I should have said no.",
          correct: false
        }
      },
      {
        id: "refuse",
        text: "Say NO firmly and suggest playing tag inside.",
        emoji: "🛡️",
        nextScene: {
          title: "Boundary Master!",
          text: "Raju says: 'No, Vicky, leaving school is dangerous. Let's play tag in the playground instead!' Vicky agrees and they have a great game. Raju stays safe, and Vicky respects Raju's confidence.",
          illustration: "🥋",
          bubble: "Saying 'No' was hard, but it kept us safe and we still had fun!",
          correct: true
        }
      }
    ],
    summary: "Peer pressure is when friends push you to do things you feel are wrong or unsafe. It takes real courage and confidence to stand firm, say NO, and suggest a safe alternative.",
    xp_reward: 40,
    coin_reward: 20
  },
  {
    id: "negotiation",
    level: 4,
    title: "Negotiation Master",
    topic: "Negotiation Skills 🤝",
    emoji: "🗣️",
    color: "from-emerald-400 via-teal-500 to-cyan-500",
    cardBg: "from-emerald-500/15 to-teal-500/10",
    glow: "shadow-teal-500/30",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
    badge: "Negotiator Specialist 👑",
    character: "Sam",
    description: "Two classmates both want to play with the only available school tablet.",
    scenes: [
      {
        title: "The Battle",
        text: "Sam and Leo both want to use the school tablet to play a coding game. They both grab the tablet and pull on it angrily.",
        illustration: "📱",
        bubble: "I had it first! No, I need it for my project! Let go!"
      },
      {
        title: "The Compromise",
        text: "The teacher walks over. If they keep fighting, the tablet will be taken away. Sam needs to find a negotiation strategy.",
        illustration: "👩‍🏫",
        bubble: "If we fight, neither of us gets to play. How can we both win?"
      }
    ],
    choices: [
      {
        id: "fight",
        text: "Keep pulling and fight for it.",
        emoji: "💢",
        nextScene: {
          title: "Broken Hopes",
          text: "They pull hard, the tablet slips, drops, and breaks. The teacher bans both of them from the computer lab. Fighting results in a lose-lose outcome where nobody wins.",
          illustration: "💥",
          bubble: "The screen is shattered... now we can't use it at all. This was a bad choice.",
          correct: false
        }
      },
      {
        id: "turns",
        text: "Suggest taking turns: 10 minutes each.",
        emoji: "⏳",
        nextScene: {
          title: "Win-Win Agreement!",
          text: "Sam suggests: 'Let's use a timer and play 10 minutes each. You can go first, Leo!' Leo agrees. They both play happily, help each other solve the coding levels, and double their score! A win-win negotiation!",
          illustration: "⏳",
          bubble: "Sharing and taking turns was awesome! We solved the levels faster together!",
          correct: true
        }
      }
    ],
    summary: "Negotiation is finding a solution where both sides feel happy. Instead of fighting for 100% of something, compromising and finding a win-win structure ensures long-term friendship and success.",
    xp_reward: 40,
    coin_reward: 20
  }
];

export default function LifeSkills({ onBack, coins, setCoins, buddyXP, setBuddyXP }: LifeSkillsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Navigation
  const [activeStory, setActiveStory] = useState<any>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [chosenOption, setChosenOption] = useState<any>(null);
  const [finishedStories, setFinishedStories] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  // Load completed stories on mount
  useEffect(() => {
    const saved = localStorage.getItem("eq_ls_completed");
    if (saved) {
      setFinishedStories(JSON.parse(saved));
    }
  }, []);

  // Confetti burst
  const triggerConfetti = () => {
    setShowCelebration(true);
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100,
      size: Math.random() * 12 + 5,
      color: ["#fbbf24", "#f43f5e", "#60a5fa", "#34d399", "#a78bfa", "#fb923c", "#e879f9"][Math.floor(Math.random() * 7)],
      delay: Math.random() * 0.5,
      duration: Math.random() * 1.8 + 1.2,
      shape: Math.random() > 0.5 ? "circle" : "square"
    }));
    setParticles(newParticles);
    setTimeout(() => {
      setShowCelebration(false);
      setParticles([]);
    }, 3500);
  };

  const handleStartStory = (story: any) => {
    const prevStoryIndex = STORIES.findIndex(s => s.id === story.id) - 1;
    if (prevStoryIndex >= 0) {
      const prevStory = STORIES[prevStoryIndex];
      if (!finishedStories.includes(prevStory.id)) {
        toast({
          title: "🔒 Level Locked!",
          description: `Complete "${prevStory.title}" first to unlock this adventure.`,
          variant: "destructive"
        });
        return;
      }
    }
    setActiveStory(story);
    setCurrentSceneIdx(0);
    setChosenOption(null);
  };

  const handleChoice = (choice: any) => {
    setChosenOption(choice);
  };

  const handleNext = () => {
    if (currentSceneIdx < activeStory.scenes.length - 1) {
      setCurrentSceneIdx(currentSceneIdx + 1);
    }
  };

  const handleCompleteStory = async () => {
    if (!chosenOption) return;

    const isCorrect = chosenOption.nextScene.correct;
    if (isCorrect) {
      const updatedList = [...finishedStories];
      if (!updatedList.includes(activeStory.id)) {
        updatedList.push(activeStory.id);
        setFinishedStories(updatedList);
        localStorage.setItem("eq_ls_completed", JSON.stringify(updatedList));

        setCoins(c => c + activeStory.coin_reward);
        setBuddyXP(x => x + activeStory.xp_reward);

        if (user) {
          try {
            const { error: spError } = await supabase.from("student_progress").insert({
              user_id: user.id,
              status: "completed" as const,
              xp_earned: activeStory.xp_reward,
              completed_at: new Date().toISOString(),
            });
            if (spError) console.error("[LifeSkills] Failed to insert student_progress:", spError);
            broadcastActivityComplete({ userId: user.id, activityType: "life_skills", xp: activeStory.xp_reward });
            await supabase.from("coin_transactions").insert({
              user_id: user.id,
              amount: activeStory.coin_reward,
              description: `Completed Life Skills: ${activeStory.title}`,
            });
          } catch (err) {
            console.error("[LifeSkills] Failed to persist rewards:", err);
          }
        }

        triggerConfetti();
        toast({
          title: "🏆 Congratulations!",
          description: `You earned "${activeStory.badge}" Badge, +${activeStory.xp_reward} XP & +${activeStory.coin_reward} Coins!`
        });
      }
      setActiveStory(null);
      setChosenOption(null);
    } else {
      setChosenOption(null);
      setCurrentSceneIdx(0);
      toast({
        title: "🔄 Let's try again!",
        description: "Think about what leads to a positive, safe, or friendly outcome.",
        variant: "destructive"
      });
    }
  };

  const completionPct = Math.round((finishedStories.length / STORIES.length) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-40 relative text-left">

      {/* ════════════════ HERO HEADER BANNER ════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/30 shadow-xl"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-95" />
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-10 bg-white"
              style={{
                width: 60 + i * 30,
                height: 60 + i * 30,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-2xl text-white/80 hover:text-white hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.span
                  className="text-3xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🌍
                </motion.span>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Life Skills Story World
                </h2>
              </div>
              <p className="text-xs text-white/60 font-medium">
                Interactive comic adventures & real-world decision making
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5"
            >
              <span className="text-sm">🪙</span>
              <span className="text-sm font-black text-white">{coins}</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-sm font-black text-white">{buddyXP} XP</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-sm font-black text-white">{finishedStories.length}/{STORIES.length}</span>
            </motion.div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 px-5 md:px-6 pb-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-white/50 mb-1.5">
            <span>YOUR PROGRESS</span>
            <span>{completionPct}% COMPLETE</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              style={{ boxShadow: "0 0 12px rgba(251,191,36,0.5)" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ════════════════ ROADMAP SELECTION SCREEN ════════════════ */}
      {!activeStory && (
        <div className="space-y-4">
          {/* Level cards as a vertical roadmap */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/30 via-primary/15 to-transparent hidden md:block" />

            <div className="space-y-4">
              {STORIES.map((story, idx) => {
                const isCompleted = finishedStories.includes(story.id);
                const isLocked = idx > 0 && !finishedStories.includes(STORIES[idx - 1].id);
                const isNext = !isCompleted && !isLocked;

                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: idx * 0.12, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <motion.button
                      whileHover={!isLocked ? { scale: 1.015, y: -3 } : {}}
                      whileTap={!isLocked ? { scale: 0.985 } : {}}
                      onClick={() => !isLocked && handleStartStory(story)}
                      disabled={isLocked}
                      className={`w-full text-left rounded-3xl border-2 transition-all duration-300 overflow-hidden relative group ${
                        isCompleted
                          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/8 to-teal-500/5 shadow-lg shadow-emerald-500/10"
                          : isLocked
                            ? "border-border/20 bg-muted/5 opacity-50 cursor-not-allowed"
                            : "border-primary/30 bg-card shadow-xl hover:shadow-2xl hover:border-primary/50 cursor-pointer"
                      }`}
                    >
                      {/* Glow effect for next-up level */}
                      {isNext && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-3xl"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <div className="relative z-10 p-5 md:p-6 flex items-center gap-4 md:gap-5">
                        {/* Level icon */}
                        <div className="shrink-0">
                          <motion.div
                            className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-lg relative ${
                              isCompleted
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
                                : isLocked
                                  ? "bg-muted"
                                  : `${story.iconBg} ${story.glow}`
                            }`}
                            animate={isNext ? { y: [0, -4, 0] } : {}}
                            transition={isNext ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-8 h-8 text-white" />
                            ) : isLocked ? (
                              <Lock className="w-7 h-7 text-muted-foreground" />
                            ) : (
                              <span className="select-none">{story.emoji}</span>
                            )}

                            {/* Level number badge */}
                            <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                              isCompleted
                                ? "bg-emerald-300 text-emerald-800"
                                : isLocked
                                  ? "bg-muted-foreground/30 text-muted-foreground"
                                  : "bg-white text-foreground shadow-md"
                            }`}>
                              {story.level}
                            </div>
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                              isCompleted ? "text-emerald-500" : isLocked ? "text-muted-foreground/60" : "text-primary"
                            }`}>
                              Level {story.level} · {story.topic}
                            </span>
                            {isCompleted && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                              >
                                ✅ BADGE EARNED
                              </motion.span>
                            )}
                            {isNext && (
                              <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20"
                              >
                                ▶ PLAY NOW
                              </motion.span>
                            )}
                          </div>
                          <h4 className={`text-base md:text-lg font-black leading-tight ${
                            isLocked ? "text-muted-foreground/50" : "text-foreground"
                          }`}>
                            {story.title}
                          </h4>
                          <p className={`text-xs leading-relaxed ${
                            isLocked ? "text-muted-foreground/30" : "text-muted-foreground"
                          }`}>
                            {story.description}
                          </p>

                          {/* Rewards preview */}
                          {!isLocked && (
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Zap className="w-3 h-3" /> +{story.xp_reward} XP
                              </span>
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                🪙 +{story.coin_reward}
                              </span>
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                🏅 Badge
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        {!isLocked && (
                          <motion.div
                            className="shrink-0"
                            animate={isNext ? { x: [0, 4, 0] } : {}}
                            transition={isNext ? { duration: 1.2, repeat: Infinity } : {}}
                          >
                            <ChevronRight className={`w-6 h-6 ${isCompleted ? "text-emerald-400" : "text-muted-foreground"}`} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Completion message */}
          {finishedStories.length === STORIES.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-2 border-amber-500/20 shadow-xl"
            >
              <motion.span
                className="text-6xl block mb-3"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                🏆
              </motion.span>
              <h3 className="text-xl font-black text-foreground mb-1">All Stories Completed!</h3>
              <p className="text-sm text-muted-foreground">You've mastered all life skills! You are a true champion. 🌟</p>
            </motion.div>
          )}
        </div>
      )}

      {/* ════════════════ STORY VIEWER SCREEN ════════════════ */}
      {activeStory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Card className="rounded-3xl border-2 border-border/30 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              {/* Story header */}
              <div className={`bg-gradient-to-r ${activeStory.color} relative overflow-hidden`}>
                {/* Decorative orbs */}
                <div className="absolute inset-0">
                  <div className="absolute top-2 right-8 w-20 h-20 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 left-12 w-16 h-16 rounded-full bg-white/5" />
                </div>
                <div className="relative z-10 px-6 py-5 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70 block mb-0.5">
                      Level {activeStory.level} · {activeStory.topic}
                    </span>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span className="text-2xl">{activeStory.emoji}</span>
                      {activeStory.title}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-9 text-xs font-bold border border-white/20"
                    onClick={() => {
                      setActiveStory(null);
                      setChosenOption(null);
                    }}
                  >
                    ✕ Quit
                  </Button>
                </div>

                {/* Scene progress dots */}
                <div className="relative z-10 px-6 pb-4 flex items-center gap-2">
                  {activeStory.scenes.map((_: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <motion.div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          i < currentSceneIdx
                            ? "bg-white text-foreground"
                            : i === currentSceneIdx
                              ? "bg-white/30 text-white border-2 border-white"
                              : "bg-white/10 text-white/50"
                        }`}
                        animate={i === currentSceneIdx ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {i < currentSceneIdx ? "✓" : i + 1}
                      </motion.div>
                      {i < activeStory.scenes.length - 1 && (
                        <div className={`w-8 h-0.5 rounded-full ${i < currentSceneIdx ? "bg-white" : "bg-white/20"}`} />
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-0.5 rounded-full ${chosenOption ? "bg-white" : "bg-white/20"}`} />
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                      chosenOption ? "bg-white/30 text-white border-2 border-white" : "bg-white/10 text-white/50"
                    }`}>
                      ⚡
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="p-5 md:p-8 space-y-5 min-h-[380px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {/* ── SCENE PANELS ── */}
                  {!chosenOption ? (
                    <motion.div
                      key={`scene-${currentSceneIdx}`}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="space-y-5"
                    >
                      {/* Comic panel */}
                      <div className="flex flex-col md:flex-row items-center gap-5">
                        {/* Character illustration */}
                        <motion.div
                          className={`w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br ${activeStory.cardBg} border-2 border-border/30 flex items-center justify-center text-6xl md:text-7xl shadow-lg shrink-0 select-none`}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {activeStory.scenes[currentSceneIdx].illustration}
                        </motion.div>

                        {/* Speech bubble */}
                        <div className="relative flex-1 bg-gradient-to-br from-primary/5 to-primary/[0.02] border-2 border-primary/15 rounded-2xl p-4 md:p-5 text-left">
                          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-primary/5 to-primary/[0.02] rotate-45 border-l-2 border-b-2 border-primary/15 hidden md:block" />
                          <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.15em] block mb-1.5">
                            💬 {activeStory.character} says...
                          </span>
                          <p className="text-sm md:text-base font-semibold italic text-foreground leading-relaxed">
                            "{activeStory.scenes[currentSceneIdx].bubble}"
                          </p>
                        </div>
                      </div>

                      {/* Scene text */}
                      <div className="space-y-1.5 bg-muted/20 rounded-2xl p-4 border border-border/30">
                        <h4 className="text-base md:text-lg font-black text-foreground flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {activeStory.scenes[currentSceneIdx].title}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                          {activeStory.scenes[currentSceneIdx].text}
                        </p>
                      </div>

                      {/* Choice buttons on last scene */}
                      {currentSceneIdx === activeStory.scenes.length - 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-3 pt-2"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                              What would you do? Choose wisely!
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeStory.choices.map((choice: any, ci: number) => (
                              <motion.button
                                key={choice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + ci * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="p-4 md:p-5 rounded-2xl border-2 border-border/40 bg-card hover:border-primary/50 hover:bg-primary/[0.03] active:scale-95 transition-all text-left cursor-pointer group shadow-sm hover:shadow-lg"
                                onClick={() => handleChoice(choice)}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl shrink-0 mt-0.5">{choice.emoji}</span>
                                  <div>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                                      Option {ci === 0 ? "A" : "B"}
                                    </span>
                                    <p className="text-xs md:text-sm font-bold text-foreground leading-snug mt-0.5 group-hover:text-primary transition-colors">
                                      {choice.text}
                                    </p>
                                  </div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    /* ── CONSEQUENCE / RESULT ── */
                    <motion.div
                      key="consequence"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="space-y-5"
                    >
                      {/* Result banner */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                          chosenOption.nextScene.correct
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.5 }}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                            chosenOption.nextScene.correct
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                              : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                          }`}
                        >
                          {chosenOption.nextScene.correct ? "✅" : "⚠️"}
                        </motion.div>
                        <div>
                          <h4 className={`text-base font-black ${
                            chosenOption.nextScene.correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {chosenOption.nextScene.correct ? "🎉 Positive Outcome!" : "⚠️ Oops! There's a Lesson Here"}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {chosenOption.nextScene.correct
                              ? "Great thinking! You made the right decision."
                              : "This didn't go well. Let's learn from it!"}
                          </p>
                        </div>
                      </motion.div>

                      {/* Consequence scene */}
                      <div className="flex flex-col md:flex-row items-center gap-5">
                        <motion.div
                          className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${activeStory.cardBg} border-2 border-border/30 flex items-center justify-center text-6xl shadow-lg shrink-0 select-none`}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {chosenOption.nextScene.illustration}
                        </motion.div>
                        <div className="relative flex-1 bg-muted/30 border border-border/30 rounded-2xl p-4 text-left">
                          <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.15em] block mb-1.5">
                            💬 What happened...
                          </span>
                          <p className="text-sm font-semibold italic text-foreground leading-relaxed">
                            "{chosenOption.nextScene.bubble}"
                          </p>
                        </div>
                      </div>

                      {/* Story text */}
                      <div className="bg-muted/20 rounded-2xl p-4 border border-border/30">
                        <h4 className="text-base font-black text-foreground mb-1.5">{chosenOption.nextScene.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {chosenOption.nextScene.text}
                        </p>
                      </div>

                      {/* Lesson summary (correct only) */}
                      {chosenOption.nextScene.correct && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-2 border-amber-500/20"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧠</span>
                            <strong className="text-sm font-black text-amber-700 dark:text-amber-400">Sparky's Lesson Summary</strong>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{activeStory.summary}</p>

                          {/* Rewards */}
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-amber-500/15">
                            <span className="text-[10px] font-black text-muted-foreground">REWARDS:</span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" /> +{activeStory.xp_reward} XP
                            </span>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full">
                              🪙 +{activeStory.coin_reward} Coins
                            </span>
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                              🏅 {activeStory.badge}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-5 border-t border-border/30">
                  <span className="text-[10px] font-bold text-muted-foreground/60">
                    {activeStory.character}'s Adventure
                  </span>
                  {!chosenOption ? (
                    currentSceneIdx < activeStory.scenes.length - 1 ? (
                      <Button
                        className="rounded-xl h-11 px-6 font-bold gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                        onClick={handleNext}
                      >
                        Next Scene <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : null
                  ) : (
                    <Button
                      className={`rounded-xl h-11 px-6 font-black gap-2 shadow-lg ${
                        chosenOption.nextScene.correct
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white shadow-emerald-500/20"
                          : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 text-white shadow-red-500/20"
                      }`}
                      onClick={handleCompleteStory}
                    >
                      {chosenOption.nextScene.correct ? (
                        <>
                          <Gift className="w-4 h-4" /> Claim Rewards! 🎉
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" /> Try Again
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ════════════════ CONFETTI CELEBRATION ════════════════ */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className={`absolute ${p.shape === "circle" ? "rounded-full" : "rounded-sm"}`}
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                }}
                initial={{ y: "100vh", opacity: 1, scale: 1 }}
                animate={{
                  y: ["100vh", "-10vh"],
                  x: [`${p.x}%`, `${p.x + (p.id % 2 === 0 ? 20 : -20)}%`],
                  rotate: [0, p.id % 2 === 0 ? 360 : -360],
                  scale: [1, 1.3, 0.5],
                  opacity: [1, 0.9, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
