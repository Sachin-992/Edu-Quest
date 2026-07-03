import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Gem, ShieldCheck, AlertTriangle, Calendar, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";

/* ═══════════════════════════════════════════════════
   Streak Freeze Shop — protect your streak
   ═══════════════════════════════════════════════════ */

interface StreakFreezeShopProps {
  streakDays: number;
  onClose?: () => void;
}

const FREEZE_COST = 5; // gems per freeze
const MAX_FREEZES = 3;

function getGems(): number {
  return parseInt(localStorage.getItem('eq_gems') || '0', 10);
}

function setGems(amount: number): void {
  localStorage.setItem('eq_gems', String(Math.max(0, amount)));
}

function getFreezes(): number {
  return parseInt(localStorage.getItem('eq_streak_freezes') || '0', 10);
}

function setFreezes(count: number): void {
  localStorage.setItem('eq_streak_freezes', String(Math.min(MAX_FREEZES, Math.max(0, count))));
}

// Get last 7 days streak calendar data from localStorage
function getStreakCalendar(): { date: string; active: boolean }[] {
  const days: { date: string; active: boolean }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const istMs = d.getTime() + 330 * 60 * 1000;
    const dateStr = new Date(istMs).toISOString().slice(0, 10);

    // Check if there's activity for this date
    const dayKey = `eq_daily_quests_${dateStr}`;
    const loginKey = `eduspark_daily_login`;
    const missionKey = `eq_daily_mission_triggered_${dateStr}`;

    let active = false;
    try {
      // Check daily quest data
      const questData = localStorage.getItem(dayKey);
      if (questData) {
        const parsed = JSON.parse(questData);
        if (parsed.questsCompleted?.some((c: boolean) => c)) active = true;
      }
      // Check mission trigger
      if (localStorage.getItem(missionKey) === '1') active = true;
      // Check login data
      const loginData = localStorage.getItem(loginKey);
      if (loginData) {
        const parsed = JSON.parse(loginData);
        if (parsed.lastClaimDate === dateStr) active = true;
      }
    } catch { /* ignore */ }

    days.push({ date: dateStr, active });
  }

  return days;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TAMIL_DAY_LABELS = ['திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி', 'ஞாயிறு'];

const StreakFreezeShop = ({ streakDays, onClose }: StreakFreezeShopProps) => {
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';
  const [gems, setGemsState] = useState(getGems);
  const [freezes, setFreezesState] = useState(getFreezes);
  const [purchasing, setPurchasing] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const [calendar] = useState(getStreakCalendar);

  const canAfford = gems >= FREEZE_COST;
  const hasRoom = freezes < MAX_FREEZES;
  const streakAtRisk = streakDays > 0 && freezes === 0;

  const handlePurchase = async () => {
    if (!canAfford || !hasRoom || purchasing || !user) return;

    setPurchasing(true);

    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      let parsed: any = {};
      if (prof?.avatar_url) {
        try {
          parsed = JSON.parse(prof.avatar_url);
        } catch (e) {}
      }

      parsed.gems_spent = (parsed.gems_spent || 0) + FREEZE_COST;

      await supabase
        .from("profiles")
        .update({ avatar_url: JSON.stringify(parsed) })
        .eq("user_id", user.id);

      const newGems = gems - FREEZE_COST;
      const newFreezes = freezes + 1;
      setGems(newGems);
      setFreezes(newFreezes);
      setGemsState(newGems);
      setFreezesState(newFreezes);
      setJustBought(true);
      setTimeout(() => setJustBought(false), 2000);
    } catch (err) {
      console.error("Error purchasing streak freeze:", err);
    } finally {
      setPurchasing(false);
    }
  };

  // Re-sync from localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGemsState(getGems());
      setFreezesState(getFreezes());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      className="relative overflow-hidden rounded-3xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-2xl"
    >
      {/* Background ambience */}
      <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-blue-500/6 blur-3xl pointer-events-none" />

      {/* Streak at risk warning border */}
      {streakAtRisk && (
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-red-500/40 pointer-events-none z-20"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400/20 to-red-500/15 border border-orange-400/25 flex items-center justify-center">
              <motion.div
                animate={streakDays > 0 ? { scale: [1, 1.15, 1], rotate: [-3, 3, -3] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame className={`w-6 h-6 ${streakDays > 0 ? 'text-orange-500' : 'text-muted-foreground/40'}`} />
              </motion.div>
              {streakDays > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-orange-500/30"
                >
                  {streakDays}
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">{isTamil ? "தொடர் பாதுகாப்பு" : "Streak Protection"}</h2>
              <p className="text-xs text-muted-foreground font-medium">
                {streakDays > 0
                  ? (isTamil 
                      ? `${streakDays} நாள் தொடர்கிறது! 🔥` 
                      : `${streakDays} day${streakDays === 1 ? '' : 's'} and counting! 🔥`)
                  : (isTamil ? 'இன்றே உங்கள் தொடரைத் தொடங்குங்கள்!' : 'Start your streak today!')}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Streak at risk alert */}
      <AnimatePresence>
        {streakAtRisk && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 px-6"
          >
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              </motion.div>
              <div>
                <p className="text-sm font-bold text-red-500 dark:text-red-400">{isTamil ? "தொடர் ஆபத்தில் உள்ளது!" : "Streak at Risk!"}</p>
                <p className="text-xs text-red-400/80 dark:text-red-400/60">
                  {isTamil 
                    ? `உங்களிடம் ஃப்ரீஸ் டோக்கன்கள் இல்லை. உங்கள் ${streakDays}-நாள் தொடரைப் பாதுகாக்க ஒன்றை வாங்கவும்!` 
                    : `You have no freeze tokens. Buy one to protect your ${streakDays}-day streak!`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Calendar — Last 7 days */}
      <div className="relative z-10 px-6 mb-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isTamil ? "கடந்த 7 நாட்கள்" : "Last 7 Days"}</span>
        </div>
        <div className="flex gap-2 justify-between">
          {calendar.map((day, i) => {
            const d = new Date(day.date + 'T00:00:00');
            const dayLabel = isTamil 
              ? TAMIL_DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
              : DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.15 }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{dayLabel}</span>
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    day.active
                      ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-md shadow-orange-500/25'
                      : 'bg-muted/30 border border-border/40'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {day.active ? (
                    <Flame className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Freeze Inventory */}
      <div className="relative z-10 px-6 mb-4">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/8 to-cyan-500/5 border border-sky-400/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-foreground">{isTamil ? "தொடர் முடக்கங்கள்" : "Streak Freezes"}</span>
            </div>
            <span className="text-xs font-bold text-muted-foreground">{freezes}/{MAX_FREEZES}</span>
          </div>

          {/* Ice crystal inventory slots */}
          <div className="flex gap-3 justify-center mb-3">
            {Array.from({ length: MAX_FREEZES }).map((_, i) => {
              const filled = i < freezes;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                    filled
                      ? 'bg-gradient-to-br from-sky-400/20 to-blue-500/15 border-2 border-sky-400/40 shadow-lg shadow-sky-500/15'
                      : 'bg-muted/20 border-2 border-dashed border-border/40'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {filled ? (
                      <motion.div
                        key="filled"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <Snowflake className="w-7 h-7 text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/20"
                      />
                    )}
                  </AnimatePresence>

                  {/* Just bought indicator */}
                  {filled && i === freezes - 1 && justBought && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-0.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className="text-[10px] text-center text-muted-foreground/70">
            {isTamil 
              ? "ஒவ்வொரு முடக்கமும் நீங்கள் தவறவிட்ட 1 நாளுக்கு உங்கள் தொடரைப் பாதுகாக்கும் ❄️" 
              : "Each freeze protects your streak for 1 missed day ❄️"}
          </p>
        </div>
      </div>

      {/* Purchase Section */}
      <div className="relative z-10 px-6 pb-6">
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/8 via-violet-500/5 to-fuchsia-500/8 border border-purple-400/15 p-4">
          {/* Gem balance */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Gem className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">{isTamil ? "உங்கள் ரத்தினங்கள்" : "Your Gems"}</p>
                <p className="text-lg font-black text-foreground">{gems}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground">{isTamil ? "செலவு" : "Cost"}</p>
              <div className="flex items-center gap-1">
                <Gem className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-lg font-black text-foreground">{FREEZE_COST}</span>
              </div>
            </div>
          </div>

          {/* Buy button */}
          <motion.button
            whileTap={canAfford && hasRoom ? { scale: 0.95 } : {}}
            whileHover={canAfford && hasRoom ? { scale: 1.02 } : {}}
            onClick={handlePurchase}
            disabled={!canAfford || !hasRoom || purchasing}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              !canAfford || !hasRoom
                ? 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                : purchasing
                  ? 'bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl'
            }`}
          >
            {purchasing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                >
                  <Snowflake className="w-4 h-4" />
                </motion.div>
                {isTamil ? "வாங்கப்படுகிறது..." : "Purchasing..."}
              </>
            ) : !hasRoom ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                {isTamil ? `சரக்கு நிரம்பியது (அதிகபட்சம் ${MAX_FREEZES})` : `Inventory Full (Max ${MAX_FREEZES})`}
              </>
            ) : !canAfford ? (
              <>
                <Gem className="w-4 h-4" />
                {isTamil ? `மேலும் ${FREEZE_COST - gems} ரத்தினங்கள் தேவை` : `Need ${FREEZE_COST - gems} more gems`}
              </>
            ) : (
              <>
                <Snowflake className="w-4 h-4" />
                {isTamil ? "தொடர் முடக்கத்தை வாங்குங்கள்" : "Buy Streak Freeze"}
                <span className="text-xs opacity-75"> ({isTamil ? `${FREEZE_COST} ரத்தினங்கள்` : `${FREEZE_COST} gems`})</span>
              </>
            )}
          </motion.button>

          {/* Success message */}
          <AnimatePresence>
            {justBought && (
              <motion.div
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                className="mt-3 text-center"
              >
                <p className="text-sm font-bold text-green-500">
                  {isTamil ? "❄️ தொடர் முடக்கம் பெறப்பட்டது! உங்கள் தொடர் இப்போது பாதுகாப்பாக உள்ளது." : "❄️ Streak Freeze acquired! Your streak is safer now."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default StreakFreezeShop;
