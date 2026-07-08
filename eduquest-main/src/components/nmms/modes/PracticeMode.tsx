import React, { useState } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { BookOpen, Brain, Compass, ArrowRight, HelpCircle, ChevronRight } from "lucide-react";
import { NMMS_STATIC_QUESTIONS } from "../questionsData";
import NMMSQuizPlayer from "../quiz/NMMSQuizPlayer";

interface PracticeModeProps {
  onBack: () => void;
}

export default function PracticeMode({ onBack }: PracticeModeProps) {
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  const [step, setStep] = useState<"paper" | "subject" | "chapter" | "quiz">("paper");
  const [selectedPaper, setSelectedPaper] = useState<"MAT" | "SAT" | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<"mathematics" | "science" | "social_science" | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  // Dynamic filter lists
  const subjects = [
    { id: "mathematics", label: isTamil ? "கணிதம்" : "Mathematics", icon: "📐", color: "from-red-500/10 to-red-600/10 border-red-500/20 hover:border-red-500/40 text-red-400" },
    { id: "science", label: isTamil ? "அறிவியல்" : "Science", icon: "🔬", color: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400" },
    { id: "social_science", label: isTamil ? "சமூக அறிவியல்" : "Social Science", icon: "🗺️", color: "from-amber-500/10 to-amber-600/10 border-amber-500/20 hover:border-amber-500/40 text-amber-400" }
  ] as const;

  // Chapters list based on selected options
  const getChapters = () => {
    let list = NMMS_STATIC_QUESTIONS;
    if (selectedPaper === "MAT") {
      list = list.filter(q => q.paper_type === "MAT");
    } else {
      list = list.filter(q => q.paper_type === "SAT" && q.subject === selectedSubject);
    }
    const chapters = Array.from(new Set(list.map(q => q.chapter)));
    return chapters;
  };

  const handleStartPractice = (chapterName: string) => {
    setSelectedChapter(chapterName);
    setStep("quiz");
  };

  return (
    <div className="max-w-4xl mx-auto text-left space-y-6 pb-12">
      {step !== "quiz" && (
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-black text-foreground">
            {isTamil ? "வகுப்புவாரியாக பயிற்சி" : "Topic-wise Practice Hub"}
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            {isTamil
              ? "உங்கள் பலவீனமான பாடப்பகுதிகளைத் தேர்ந்தெடுத்து வரம்பற்ற முறையில் பயிற்சி செய்யுங்கள்."
              : "Strengthen your conceptual knowledge by taking practice sets targeting specific topics."}
          </p>
        </div>
      )}

      {step === "paper" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* MAT Card */}
          <div
            onClick={() => {
              setSelectedPaper("MAT");
              setStep("chapter");
            }}
            className="group p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-purple-500/40 shadow-xl rounded-3xl transition-all cursor-pointer space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-3.5 bg-purple-500/15 border border-purple-500/20 rounded-2xl text-purple-400">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                90 Questions
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-foreground">
                {isTamil ? "தாள் 1: மனத்திறன் தேர்வு (MAT)" : "Paper 1: Mental Ability Test (MAT)"}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                {isTamil
                  ? "எழுத்துத் தொடர், எண் ஒப்புமை, குறியீட்டு முறைகள், பகடைகள் மற்றும் பிற தர்க்கரீதியான திறன்களை பயிற்சி செய்யுங்கள்."
                  : "Practice logical sequences, coding-decoding, spatial awareness, analogy and verbal classifications."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 pt-2">
              {isTamil ? "தலைப்புகளைக் காண்க" : "Explore Topics"}
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* SAT Card */}
          <div
            onClick={() => {
              setSelectedPaper("SAT");
              setStep("subject");
            }}
            className="group p-6 bg-gradient-to-br from-card/85 to-card/50 border border-border/40 hover:border-blue-500/40 shadow-xl rounded-3xl transition-all cursor-pointer space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-3.5 bg-blue-500/15 border border-blue-500/20 rounded-2xl text-blue-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                90 Questions
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-foreground">
                {isTamil ? "தாள் 2: கல்விச் சார் அறிவுத் தேர்வு (SAT)" : "Paper 2: Scholastic Aptitude Test (SAT)"}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                {isTamil
                  ? "7 மற்றும் 8-ஆம் வகுப்பு பாடத் திட்டத்திலிருந்து கணிதம், அறிவியல் மற்றும் சமூக அறிவியல் பாடங்களைப் பயிற்சி செய்யுங்கள்."
                  : "Revise academic concepts from school syllabus spanning Mathematics, Science, and Social Science subjects."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 pt-2">
              {isTamil ? "பாடங்களைத் தேர்ந்தெடு" : "Select Subjects"}
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {step === "subject" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("paper")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {isTamil ? "தாள் தேர்வுக்குத் திரும்பு" : "Back to Paper selection"}
          </button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  setSelectedSubject(sub.id);
                  setStep("chapter");
                }}
                className={`p-6 rounded-3xl bg-gradient-to-br ${sub.color} border transition-all cursor-pointer space-y-4 group hover:scale-[1.02]`}
              >
                <div className="text-3xl">{sub.icon}</div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground">{sub.label}</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {isTamil ? "பாடம் சார்ந்த மாதிரி வினாக்கள்" : "Core academic curriculum"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "chapter" && (
        <div className="space-y-4">
          <button
            onClick={() => {
              if (selectedPaper === "SAT") {
                setStep("subject");
              } else {
                setStep("paper");
              }
            }}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {isTamil ? "முந்தைய படிக்குச் செல்" : "Back to previous step"}
          </button>

          <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              {isTamil ? "தலைப்பைத் தேர்ந்தெடுக்கவும்" : "Select Chapter"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getChapters().map((ch, idx) => (
                <div
                  key={idx}
                  onClick={() => handleStartPractice(ch)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/30 hover:border-purple-500/30 hover:bg-muted/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-black text-foreground">{ch}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}

              {getChapters().length === 0 && (
                <div className="col-span-2 text-center py-8 text-xs text-muted-foreground font-semibold">
                  {isTamil ? "தற்போது வினாக்கள் இல்லை." : "No chapters available for this subject yet."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "quiz" && selectedChapter && (
        <NMMSQuizPlayer
          sessionType="practice"
          paperType={selectedPaper || "SAT"}
          subject={selectedSubject || undefined}
          chapter={selectedChapter}
          onBack={() => setStep("chapter")}
        />
      )}
    </div>
  );
}
