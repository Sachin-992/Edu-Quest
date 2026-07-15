import { motion } from "framer-motion";
import { BookOpen, Gamepad2, Trophy, Users, Star, Flame, Languages, MessageCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";


/* ────────── feature cards ────────── */
const features = [
  {
    icon: BookOpen, title: "Interactive Lessons",
    description: "Engaging content for Classes 1–8 across all subjects",
    color: "from-blue-500 to-cyan-400", emoji: "📖",
  },
  {
    icon: Languages, title: "தமிழ் Games",
    description: "Learn Tamil letters, words & grammar through fun games",
    color: "from-amber-500 to-orange-400", emoji: "🎭",
  },
  {
    icon: Gamepad2, title: "Gamified Quizzes",
    description: "Timed challenges with instant feedback and XP rewards",
    color: "from-violet-500 to-purple-400", emoji: "🎮",
  },
  {
    icon: Trophy, title: "Badges & Levels",
    description: "Earn achievements, level up, and climb the leaderboard",
    color: "from-yellow-500 to-amber-400", emoji: "🏅",
  },
  {
    icon: Flame, title: "Daily Streaks",
    description: "Build streaks and stay motivated every day",
    color: "from-red-500 to-orange-400", emoji: "🔥",
  },
  {
    icon: Users, title: "Class Leaderboards",
    description: "Compete with classmates and be the top learner",
    color: "from-emerald-500 to-teal-400", emoji: "🏆",
  },
  {
    icon: MessageCircle, title: "English Buddy",
    description: "Conversational AI companion to practice spoken English",
    color: "from-pink-500 to-rose-400", emoji: "🗣️",
  },
  {
    icon: Bot, title: "AI Tutor",
    description: "Smart AI that adapts to your pace and explains concepts",
    color: "from-indigo-500 to-cyan-400", emoji: "🤖",
  },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════
          HERO — Full Background Image
          ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden h-screen" style={{ backgroundColor: "#c8e6c9" }}>
        {/* Full hero background image — cropped from top */}
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          src="/hero-bg.png"
          alt="EduSpark Quest — Gamified Learning"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 65%" }}
        />

        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/65 via-white/30 to-transparent pointer-events-none" />

        {/* ── Text content overlay ── */}
        <div className="absolute inset-0 flex items-center pt-0 md:items-start md:pt-[5%] z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
            <div className="max-w-xl text-center mx-auto lg:mx-0 lg:ml-[5%]">
              {/* Pill badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2d2b55]/85 text-white text-sm font-semibold shadow-lg backdrop-blur-sm">
                  <Star className="w-4 h-4 text-yellow-300" />
                  Gamified Learning for Classes 1–8
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-[1.1] px-4 md:px-0"
              >
                <span className="text-gray-900 drop-shadow-sm">Learn. Play. </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 drop-shadow-sm">
                  Level Up.
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-base md:text-lg text-gray-700 max-w-lg mx-auto mb-8 leading-relaxed drop-shadow-sm px-6 md:px-0"
              >
                The fun way to master Math, Science, English, and{" "}
                <span className="font-tamil font-bold text-amber-600">தமிழ்</span>
                <span className="hidden md:inline">{" "}— </span>
                <br className="md:hidden" />
                <span className="md:hidden">with quizzes, games, XP, badges, and leaderboards!</span>
                <span className="hidden md:inline">with quizzes, games, XP, badges, and leaderboards!</span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6 md:px-0"
              >
                <button
                  className="w-full sm:w-[220px] h-[60px] text-lg font-bold rounded-2xl text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-2xl active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #8b5cf6, #a78bfa)",
                    boxShadow: "0 8px 30px rgba(124, 58, 237, 0.4)",
                  }}
                  onClick={() => navigate("/login")}
                >
                  🚀 Start Learning
                </button>

                <Button
                  variant="outline"
                  className="w-full sm:w-[220px] h-[60px] text-lg font-bold rounded-2xl border-2 border-gray-300 text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-gray-400 shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                  onClick={() => navigate("/admin/login")}
                >
                  Admin Login
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>



      {/* ═══════════════════════════════════════════════════════
          FEATURES — Card Grid
          ═══════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Everything to make learning{" "}
              <span className="text-primary">addictive</span> ✨
            </h2>
            <p className="text-muted-foreground text-lg">
              Built for students, powered by gamification
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title} 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 4) * 0.1, duration: 0.55, ease: "easeOut" }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="h-full"
              >
                <Card className="group hover:shadow-2xl transition-all duration-300 border-transparent hover:border-primary/30 h-full overflow-hidden relative cursor-pointer">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <CardContent className="p-6 flex flex-col items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl">{feature.emoji}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TAMIL SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="gradient-tamil rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <h2 className="font-tamil text-3xl md:text-5xl font-bold text-tamil-gold-foreground mb-4 relative z-10">
              தமிழ் கற்போம்!
            </h2>
            <p className="text-lg md:text-xl text-tamil-gold-foreground/90 mb-8 max-w-2xl mx-auto relative z-10">
              Learn Tamil through interactive letter games, word scrambles, vocabulary matching, and grammar quizzes — all while earning XP!
            </p>
            <div className="flex flex-wrap justify-center gap-3 relative z-10">
              {["உயிர் எழுத்துக்கள்", "சொல் விளையாட்டு", "இலக்கணம்", "படம்-சொல்"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="font-tamil px-4 py-2 bg-background/20 backdrop-blur-sm rounded-full text-sm font-semibold text-tamil-gold-foreground"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <motion.footer 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="px-4 py-8 border-t border-border"
      >
        <div className="max-w-5xl mx-auto text-center text-muted-foreground text-sm">
          <img src="/eduquest-logo.png" alt="EduQuest" className="w-14 h-14 object-contain mx-auto mb-2" />
          <p className="font-semibold text-foreground text-lg mb-1">EduQuest</p>
          <p>Gamified Learning Platform for Classes 1–8</p>
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;
