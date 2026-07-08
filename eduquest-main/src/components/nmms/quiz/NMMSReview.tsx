import React from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { CheckCircle2, XCircle, ChevronLeft } from "lucide-react";
import { NMMSQuestion } from "../questionsData";

interface NMMSReviewProps {
  questions: NMMSQuestion[];
  userAnswers: Record<string, "A" | "B" | "C" | "D">;
  onBack: () => void;
}

export default function NMMSReview({ questions, userAnswers, onBack }: NMMSReviewProps) {
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left pb-12">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-black text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          {isTamil ? "முடிவுகளுக்குத் திரும்பு" : "Back to Results"}
        </button>
      </div>

      <h2 className="text-xl font-black text-foreground">
        {isTamil ? "விடைத்தாள் மதிப்பாய்வு" : "Question Review"}
      </h2>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const userAns = userAnswers[q.id];
          const isCorrect = userAns === q.correct_answer;

          const qText = isTamil && q.question_text_ta ? q.question_text_ta : q.question_text;
          const optA = isTamil && q.option_a_ta ? q.option_a_ta : q.option_a;
          const optB = isTamil && q.option_b_ta ? q.option_b_ta : q.option_b;
          const optC = isTamil && q.option_c_ta ? q.option_c_ta : q.option_c;
          const optD = isTamil && q.option_d_ta ? q.option_d_ta : q.option_d;

          return (
            <div key={q.id} className="bg-card border border-border/40 rounded-3xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <span className="text-xs font-black text-muted-foreground">
                  {isTamil ? "வினா" : "Question"} {idx + 1}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase ${isCorrect ? "text-emerald-500" : "text-red-500"}`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isTamil ? "சரி" : "Correct"}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      {isTamil ? "தவறு" : "Incorrect"}
                    </>
                  )}
                </span>
              </div>

              <h4 className="text-sm font-black text-foreground leading-relaxed">{qText}</h4>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: "A", val: optA },
                  { key: "B", val: optB },
                  { key: "C", val: optC },
                  { key: "D", val: optD }
                ].map((o) => {
                  const isCorrectAnswer = o.key === q.correct_answer;
                  const isUserSelection = o.key === userAns;

                  let optStyle = "bg-muted/10 border-border/25";
                  if (isCorrectAnswer) optStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold";
                  else if (isUserSelection && !isCorrectAnswer) optStyle = "bg-red-500/10 border-red-500 text-red-500 font-bold";

                  return (
                    <div key={o.key} className={`p-3 rounded-xl border flex items-center gap-2 ${optStyle}`}>
                      <span className="font-black">{o.key}.</span>
                      <span>{o.val}</span>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="mt-3 p-3 bg-muted/15 border border-border/30 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-purple-400 block mb-1">{isTamil ? "விளக்கம்:" : "Explanation:"}</strong>
                  {isTamil && q.explanation_ta ? q.explanation_ta : q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
