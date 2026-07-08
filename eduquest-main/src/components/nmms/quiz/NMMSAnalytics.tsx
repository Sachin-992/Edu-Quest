import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Compass, Award, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

interface NMMSAnalyticsProps {
  onBack: () => void;
}

interface ChapterProgress {
  chapter: string;
  paper_type: string;
  subject: string | null;
  questions_attempted: number;
  questions_correct: number;
  accuracy: number;
}

export default function NMMSAnalytics({ onBack }: NMMSAnalyticsProps) {
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ChapterProgress[]>([]);
  const [totalQuestionsAttempted, setTotalQuestionsAttempted] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("nmms_progress")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          setProgressData(data);
          const attempted = data.reduce((sum, item) => sum + (item.questions_attempted || 0), 0);
          const correct = data.reduce((sum, item) => sum + (item.questions_correct || 0), 0);
          setTotalQuestionsAttempted(attempted);
          setAvgAccuracy(attempted > 0 ? Math.round((correct / attempted) * 100) : 0);
        }
      } catch (err) {
        console.error("Error loading progress data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user]);

  // Derived arrays
  const weakChapters = progressData.filter(ch => ch.accuracy < 60);
  const masteredChapters = progressData.filter(ch => ch.accuracy >= 80);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-purple-400 text-3xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-left space-y-8 pb-12">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-500/20 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-6 translate-x-6 text-9xl font-black select-none">
          📊
        </div>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-400/20 border border-blue-400/40 text-blue-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            {isTamil ? "செயல்திறன் பகுப்பாய்வு" : "Progress Analytics"}
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            {isTamil ? "உங்கள் கற்றல் முன்னேற்றம்" : "Your Learning Analytics"}
          </h1>
          <p className="text-xs text-blue-200 font-semibold max-w-xl leading-relaxed">
            {isTamil
              ? "மாதிரித் தேர்வுகள் மற்றும் பயிற்சிகளின் அடிப்படையில் உங்கள் பலம் மற்றும் பலவீனமான பகுதிகளை அறிந்து கொள்ளுங்கள்."
              : "Review automated performance reports based on your practice sessions to tailor your study plan."}
          </p>
        </div>
      </div>

      {/* Basic Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            {isTamil ? "முயற்சித்த வினாக்கள்" : "Total Solved"}
          </div>
          <div className="text-3xl font-black text-foreground">{totalQuestionsAttempted}</div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            {isTamil ? "பயிற்சி மற்றும் சவால்கள்" : "Questions practiced so far"}
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            {isTamil ? "சராசரி துல்லியம்" : "Average Accuracy"}
          </div>
          <div className="text-3xl font-black text-blue-400">{avgAccuracy}%</div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            {isTamil ? "சரியான விடைகளின் விழுக்காடு" : "Overall correct ratio"}
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            {isTamil ? "பயிற்சி செய்த தலைப்புகள்" : "Chapters Practiced"}
          </div>
          <div className="text-3xl font-black text-purple-400">{progressData.length}</div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            {isTamil ? "MAT மற்றும் SAT பாடப்பிரிவுகள்" : "Total chapters covered"}
          </div>
        </div>
      </div>

      {/* Chapters Split columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Needs Improvement Card */}
        <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            {isTamil ? "அதிக கவனம் தேவைப்படும் பகுதிகள்" : "Weak Chapters (<60% Accuracy)"}
          </h3>

          <div className="space-y-3">
            {weakChapters.map((ch, idx) => (
              <div key={idx} className="p-4.5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-foreground">{ch.chapter}</div>
                  <div className="text-[10px] text-muted-foreground font-bold mt-0.5">
                    {ch.paper_type} {ch.subject ? `• ${ch.subject.replace("_", " ")}` : ""}
                  </div>
                </div>
                <span className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                  {ch.accuracy}%
                </span>
              </div>
            ))}

            {weakChapters.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                {isTamil ? "அற்புதம்! பலவீனமான பகுதிகள் எதுவும் இல்லை." : "Awesome! No weak chapters identified yet."}
              </div>
            )}
          </div>
        </div>

        {/* Mastered Card */}
        <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {isTamil ? "சிறப்பாக விளங்கும் பகுதிகள்" : "Strong Chapters (≥80% Accuracy)"}
          </h3>

          <div className="space-y-3">
            {masteredChapters.map((ch, idx) => (
              <div key={idx} className="p-4.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-foreground">{ch.chapter}</div>
                  <div className="text-[10px] text-muted-foreground font-bold mt-0.5">
                    {ch.paper_type} {ch.subject ? `• ${ch.subject.replace("_", " ")}` : ""}
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {ch.accuracy}%
                </span>
              </div>
            ))}

            {masteredChapters.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                {isTamil ? "மேலும் பயிற்சி செய்து வலுவான பகுதிகளை உருவாக்குங்கள்!" : "Keep practicing to master more chapters!"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
