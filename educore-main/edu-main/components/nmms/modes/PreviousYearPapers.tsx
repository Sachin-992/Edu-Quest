import React, { useState } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Calendar, Award, Compass, Play, BookOpen, ChevronLeft } from "lucide-react";
import NMMSQuizPlayer from "../quiz/NMMSQuizPlayer";
import { PREVIOUS_YEAR_PAPERS } from "../previousYearPapersData";

interface PreviousYearPapersProps {
  onBack: () => void;
}

export default function PreviousYearPapers({ onBack }: PreviousYearPapersProps) {
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  const [step, setStep] = useState<"lobby" | "quiz">("lobby");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedPaperType, setSelectedPaperType] = useState<"MAT" | "SAT" | null>(null);

  const handleStartPaper = (year: number, type: "MAT" | "SAT") => {
    setSelectedYear(year);
    setSelectedPaperType(type);
    setStep("quiz");
  };

  const selectedPaperQuestions = selectedYear && selectedPaperType
    ? PREVIOUS_YEAR_PAPERS.find(p => p.year === selectedYear)?.[selectedPaperType.toLowerCase() as "mat" | "sat"] || []
    : [];

  return (
    <div className="max-w-4xl mx-auto text-left space-y-6 pb-12">
      {step === "lobby" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black text-foreground">
              {isTamil ? "முந்தைய ஆண்டு வினாத்தாள்கள்" : "Previous Year Papers"}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              {isTamil
                ? "கடந்த ஆண்டுகளின் அதிகாரப்பூர்வ வினாத்தாள்களைக் கொண்டு தேர்வு எழுதிப் பழகுங்கள்."
                : "Practice solving authentic question papers from past NMMS examinations."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PREVIOUS_YEAR_PAPERS.map((paper) => (
              <div
                key={paper.year}
                className="bg-card border border-border/40 rounded-3xl p-6 space-y-4 shadow-md relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-foreground">{paper.year} NMMS Exam</h3>
                      {paper.year >= 2025 && (
                        <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                          {isTamil ? "புதியது" : "Latest"}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {isTamil ? "அதிகாரப்பூர்வ வினாத்தாள் தொகுப்பு" : "Official Board Question Paper"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleStartPaper(paper.year, "MAT")}
                    className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    MAT ({paper.mat.length} Q)
                  </button>
                  <button
                    onClick={() => handleStartPaper(paper.year, "SAT")}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    SAT ({paper.sat.length} Q)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setStep("lobby")}
            className="text-xs font-black text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {isTamil ? "வினாத்தாள் பட்டியலுக்குத் திரும்பு" : "Back to Papers selection"}
          </button>

          <NMMSQuizPlayer
            sessionType="practice"
            paperType={selectedPaperType || "MAT"}
            chapter={`Official ${selectedYear} Question Paper`}
            customQuestions={selectedPaperQuestions}
            onBack={() => setStep("lobby")}
          />
        </div>
      )}
    </div>
  );
}
