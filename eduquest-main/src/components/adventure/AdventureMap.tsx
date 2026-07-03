import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, Star, Trophy, Swords, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getAdventureWorlds, type AdventureWorld, type AdventureLevel } from "./adventureData";
import AdventureLevelPlayer from "./AdventureLevelPlayer";

interface AdventureMapProps {
  onBack: () => void;
}


interface LevelProgress {
  world_id: string;
  level_number: number;
  stars_earned: number;
  is_completed: boolean;
}

const AdventureMap = ({ onBack }: AdventureMapProps) => {
  const { user, profile } = useAuth();
  const classLevel = profile?.class_level ?? 5;
  const { language: lang } = useLanguageStore();
  const [selectedWorld, setSelectedWorld] = useState<AdventureWorld | null>(null);
  const [playingLevel, setPlayingLevel] = useState<AdventureLevel | null>(null);
  const [progress, setProgress] = useState<LevelProgress[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState<"all" | "school" | "real-world">("all");
  const isTamil = lang === "ta";

  const worlds = getAdventureWorlds(classLevel);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("adventure_progress")
        .select("world_id, level_number, stars_earned, is_completed")
        .eq("user_id", user.id);
      if (data) setProgress(data as LevelProgress[]);
    };
    fetch();
  }, [user, refreshKey]);

  const getLevelProgress = (worldId: string, levelNum: number) =>
    progress.find((p) => p.world_id === worldId && p.level_number === levelNum);

  const isLevelUnlocked = (worldId: string, levelNum: number) => {
    if (levelNum === 1) return true;
    const prev = getLevelProgress(worldId, levelNum - 1);
    return prev?.is_completed ?? false;
  };

  const getWorldStars = (worldId: string) =>
    progress.filter((p) => p.world_id === worldId).reduce((sum, p) => sum + p.stars_earned, 0);

  const getWorldCompleted = (worldId: string) =>
    progress.filter((p) => p.world_id === worldId && p.is_completed).length;

  const totalStars = progress.reduce((sum, p) => sum + p.stars_earned, 0);

  // Playing a level
  if (playingLevel && selectedWorld) {
    return (
      <AdventureLevelPlayer
        world={selectedWorld}
        level={playingLevel}
        lang={lang}
        onComplete={(stars, xp) => {
          setRefreshKey((k) => k + 1);
          setPlayingLevel(null);
        }}
        onBack={() => setPlayingLevel(null)}
      />
    );
  }

  // Inside a world — show level path
  if (selectedWorld) {
    const worldStars = getWorldStars(selectedWorld.id);
    const maxStars = selectedWorld.levels.length * 3;

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setSelectedWorld(null)} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> {isTamil ? "உலக வரைபடம்" : "World Map"}
            </Button>
            <div className="flex items-center gap-2">

              <Badge className="gap-1 px-3 py-1.5 rounded-full">
                <Star className="w-3.5 h-3.5" /> {worldStars}/{maxStars}
              </Badge>
            </div>
          </div>

          {/* World Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <span className="text-6xl block mb-3 anim-float">
              {selectedWorld.emoji}
            </span>
            <h1 className="text-3xl font-black">
              {isTamil ? selectedWorld.name_ta : selectedWorld.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isTamil ? selectedWorld.description_ta : selectedWorld.description}
            </p>
          </motion.div>

          {/* Level Path */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-border via-border to-transparent -translate-x-1/2 rounded-full" />

            <div className="space-y-6 relative">
              {selectedWorld.levels.map((level, idx) => {
                const prog = getLevelProgress(selectedWorld.id, level.number);
                const unlocked = isLevelUnlocked(selectedWorld.id, level.number);
                const completed = prog?.is_completed ?? false;
                const stars = prog?.stars_earned ?? 0;
                const isEven = idx % 2 === 0;

                return (
                  <motion.div
                    key={level.number}
                    initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.12 }}
                    className={`flex items-center gap-4 ${isEven ? "flex-row" : "flex-row-reverse"}`}
                  >
                    {/* Content Card */}
                    <motion.button
                      whileHover={unlocked ? { scale: 1.03 } : {}}
                      whileTap={unlocked ? { scale: 0.97 } : {}}
                      onClick={() => unlocked && setPlayingLevel(level)}
                      disabled={!unlocked}
                      className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${completed
                          ? "bg-gradient-to-br from-xp/10 to-xp/5 border-xp/30"
                          : unlocked
                            ? "bg-card border-primary/30 hover:border-primary hover:shadow-lg cursor-pointer"
                            : "bg-muted/30 border-border/50 opacity-60 cursor-not-allowed"
                        }`}
                    >
                      {/* Boss indicator */}
                      {level.isBoss && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="gap-1 text-[10px]">
                            <Swords className="w-3 h-3" /> {isTamil ? "போஸ்" : "BOSS"}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0 ${completed ? "bg-xp/20 text-xp" : unlocked ? `bg-gradient-to-br ${selectedWorld.theme} text-white` : "bg-muted text-muted-foreground"
                          }`}>
                          {completed ? "✓" : !unlocked ? <Lock className="w-5 h-5" /> : level.number}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">
                            {isTamil ? level.title_ta : level.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {level.questions.length} {isTamil ? "கேள்விகள்" : "questions"}
                            {level.isBoss && (isTamil ? " · வார சோதனை" : " · Weekly Test")}
                          </p>
                        </div>
                      </div>

                      {/* Stars display */}
                      {completed && (
                        <div className="flex gap-1 mt-2 pl-[60px]">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= stars ? "text-edu-yellow fill-edu-yellow" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>

                    {/* Center node */}
                    <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center shrink-0 z-10 ${completed ? "border-xp bg-xp/20" : unlocked ? "border-primary bg-primary/20" : "border-border bg-muted"
                      }`}>
                      {completed ? (
                        <Trophy className="w-4 h-4 text-xp" />
                      ) : level.isBoss ? (
                        <Swords className={`w-4 h-4 ${unlocked ? "text-primary" : "text-muted-foreground"}`} />
                      ) : (
                        <span className={`text-xs font-black ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
                          {level.number}
                        </span>
                      )}
                    </div>

                    {/* Spacer for alignment */}
                    <div className="flex-1" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // World selection map

  const filteredWorlds = worlds.filter(w =>
    activeCategory === "all" ? true : w.category === activeCategory
  );

  const categoryTabs = [
    { id: "all" as const, label: isTamil ? "🔥 அனைத்தும்" : "🔥 All", count: worlds.length },
    { id: "school" as const, label: isTamil ? "📚 பள்ளி" : "📚 School", count: worlds.filter(w => w.category === "school").length },
    { id: "real-world" as const, label: isTamil ? "🌍 நிஜ உலகம்" : "🌍 Real World", count: worlds.filter(w => w.category === "real-world").length },
  ];

  // Daily Trend — rotate by day of year
  const dailyTrends = [
    { emoji: "🤖", title: "AI can now write music!", title_ta: "AI இப்போது இசை எழுத முடியும்!", fact: "Google's AI can compose entire songs just from a text description. 🎵", fact_ta: "Google-இன் AI உரை விவரிப்பிலிருந்து முழு பாடல்களையும் இசையமைக்க முடியும். 🎵", category: "AI" },
    { emoji: "🚀", title: "SpaceX landed 300+ rockets!", title_ta: "SpaceX 300+ ராக்கெட்களை இறக்கியது!", fact: "Reusable rockets save millions. Elon Musk's company lands rockets like parking cars! 🅿️", fact_ta: "மீண்டும் பயன்படுத்தக்கூடிய ராக்கெட்கள் கோடிகளை மிச்சப்படுத்துகின்றன! 🅿️", category: "Space" },
    { emoji: "🧠", title: "Your brain has 86 billion neurons!", title_ta: "உங்கள் மூளையில் 86 பில்லியன் நியூரான்கள்!", fact: "That's more connections than stars in our galaxy. Your brain is the ultimate supercomputer! 💻", fact_ta: "நம் விண்மீன் மண்டலத்தில் உள்ள நட்சத்திரங்களை விட அதிக இணைப்புகள்! 💻", category: "Science" },
    { emoji: "🎮", title: "Gaming earns more than Hollywood!", title_ta: "கேமிங் ஹாலிவுட்டை விட அதிகம் சம்பாதிக்கிறது!", fact: "The gaming industry is worth over $200 billion — bigger than movies AND music combined! 🎬🎵", fact_ta: "கேமிங் தொழில் $200 பில்லியனுக்கு அதிகம் — திரைப்படம் மற்றும் இசை இரண்டையும் சேர்த்ததை விட பெரியது! 🎬🎵", category: "Gaming" },
    { emoji: "🌐", title: "5 billion people use the internet!", title_ta: "5 பில்லியன் மக்கள் இணையத்தை பயன்படுத்துகின்றனர்!", fact: "That's over 60% of all humans on Earth. In 1995, it was only 1%! 📈", fact_ta: "பூமியில் உள்ள அனைத்து மனிதர்களின் 60%க்கும் அதிகம். 1995-இல், 1% மட்டுமே! 📈", category: "Internet" },
    { emoji: "🔬", title: "DNA can store data!", title_ta: "DNA தரவை சேமிக்க முடியும்!", fact: "Scientists stored a movie in DNA. 1 gram of DNA can hold 215 petabytes! 🧬", fact_ta: "விஞ்ஞானிகள் DNA-இல் ஒரு திரைப்படத்தை சேமித்தனர். 1 கிராம் DNA 215 petabytes வைத்திருக்கும்! 🧬", category: "Science" },
    { emoji: "💡", title: "A teenager invented Braille!", title_ta: "ஒரு டீனேஜர் பிரெய்ல் கண்டுபிடித்தார்!", fact: "Louis Braille was only 15 when he invented the reading system for blind people! 📖", fact_ta: "லூயிஸ் பிரெய்ல் பார்வையற்றவர்களுக்கான வாசிப்பு முறையை கண்டுபிடித்தபோது அவருக்கு 15 வயது மட்டுமே! 📖", category: "Innovation" },
    { emoji: "🐙", title: "Octopuses have 3 hearts!", title_ta: "ஆக்டோபஸுக்கு 3 இதயங்கள்!", fact: "Two pump blood to gills, one to the body. And they have BLUE blood! 💙", fact_ta: "இரண்டு செவுள்களுக்கும் ஒன்று உடலுக்கும் இரத்தத்தை பம்ப் செய்யும். நீல இரத்தம்! 💙", category: "Fun Facts" },
    { emoji: "📱", title: "Your phone is more powerful than Apollo 11!", title_ta: "உங்கள் போன் Apollo 11-ஐ விட சக்திவாய்ந்தது!", fact: "The computer that landed on the Moon had less power than a modern calculator! 🌙", fact_ta: "நிலவில் இறங்கிய கணினியின் சக்தி நவீன கால்குலேட்டரை விட குறைவு! 🌙", category: "Tech" },
    { emoji: "🦄", title: "India has 100+ unicorn startups!", title_ta: "இந்தியாவில் 100+ யூனிகார்ன் ஸ்டார்ட்அப்கள்!", fact: "Companies like Flipkart, Zerodha, and CRED are worth over $1 billion each! 🇮🇳", fact_ta: "Flipkart, Zerodha, CRED போன்ற நிறுவனங்கள் ஒவ்வொன்றும் $1 பில்லியனுக்கு மேல் மதிப்புள்ளவை! 🇮🇳", category: "Business" },
    { emoji: "⚡", title: "Lightning is 5x hotter than the Sun!", title_ta: "மின்னல் சூரியனை விட 5 மடங்கு சூடானது!", fact: "A bolt of lightning reaches 30,000°C. The Sun's surface is 'only' 5,500°C! ☀️", fact_ta: "ஒரு மின்னல் 30,000°C அடையும். சூரியனின் மேற்பரப்பு 'வெறும்' 5,500°C! ☀️", category: "Science" },
    { emoji: "🎨", title: "Roblox has 40M+ games!", title_ta: "Roblox-இல் 40M+ கேம்கள்!", fact: "All created by players! Some teen developers earn millions from their games. 🤑", fact_ta: "அனைத்தும் வீரர்களால் உருவாக்கப்பட்டவை! சில டீன் டெவலப்பர்கள் கோடிகள் சம்பாதிக்கிறார்கள்! 🤑", category: "Gaming" },
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayTrend = dailyTrends[dayOfYear % dailyTrends.length];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> {isTamil ? "முகப்பு" : "Dashboard"}
          </Button>
          <div className="flex items-center gap-2">

            <Badge className="gap-1 px-3 py-1.5 rounded-full text-sm">
              <Star className="w-3.5 h-3.5 fill-current" /> {totalStars} {isTamil ? "நட்சத்திரங்கள்" : "Stars"}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            🗺️ {isTamil ? "சாகச கற்றல் பயணம்" : "Adventure Learning Quest"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isTamil ? "உலகங்களை ஆராய்ந்து, நிலைகளை வெல்லுங்கள்!" : "Explore worlds, complete missions, collect stars!"}
          </p>
        </motion.div>

        {/* 🔥 Daily Trend Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 md:p-5"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/10 blur-xl" />
          <div className="flex items-start gap-4 relative z-10">
            <span className="text-4xl shrink-0 anim-float">{todayTrend.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold gap-1 bg-primary/10 border-primary/30">
                  🔥 {isTamil ? "இன்றைய ட்ரெண்ட்" : "Today's Trend"}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">{todayTrend.category}</span>
              </div>
              <h3 className="font-black text-base mb-1">
                {isTamil ? todayTrend.title_ta : todayTrend.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isTamil ? todayTrend.fact_ta : todayTrend.fact}
              </p>
            </div>
          </div>
        </motion.div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {categoryTabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex shrink-0 items-center justify-center px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-2 ${
                  activeCategory === tab.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : "bg-card border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
              {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
            </motion.button>
          ))}
        </div>

        {/* World Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredWorlds.map((world, i) => {
            const wStars = getWorldStars(world.id);
            const wCompleted = getWorldCompleted(world.id);
            const maxStars = world.levels.length * 3;

            return (
              <motion.button
                key={world.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedWorld(world)}
                className="relative overflow-hidden rounded-3xl border-2 border-border/50 hover:border-primary/40 transition-all text-left group"
              >
                {/* BG gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${world.theme} opacity-10 group-hover:opacity-20 transition-opacity`} />

                {/* Floating emojis */}
                <div className="absolute inset-0 overflow-hidden">
                  {world.bgEmojis.map((e, j) => (
                    <span
                      key={j}
                      className="absolute text-2xl opacity-20 anim-float"
                      style={{ left: `${15 + j * 14}%`, top: `${20 + (j % 3) * 25}%`, animationDelay: `${j * 0.3}s` }}
                    >
                      {e}
                    </span>
                  ))}
                </div>

                {/* NEW Badge */}
                {world.isNew && (
                  <div className="absolute top-3 right-3 z-20">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg animate-pulse">
                      🔥 NEW
                    </span>
                  </div>
                )}

                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-5xl block mb-3 anim-float">
                        {world.emoji}
                      </span>
                      <h2 className="text-xl font-black">
                        {isTamil ? world.name_ta : world.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isTamil ? world.description_ta : world.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                  </div>

                  {/* Progress */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${wStars >= s ? "text-edu-yellow fill-edu-yellow" : "text-muted/40"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {wStars}/{maxStars} {isTamil ? "நட்சத்திரங்கள்" : "Stars"}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {wCompleted}/{world.levels.length} {isTamil ? "நிலைகள்" : "Levels"}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${world.theme}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(wCompleted / world.levels.length) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.8 }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


export default AdventureMap;

