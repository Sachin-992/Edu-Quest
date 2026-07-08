import React from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Info, Award, Calendar, FileText, CheckCircle, ShieldAlert } from "lucide-react";

interface NMMSExamInfoProps {
  onBack: () => void;
}

export default function NMMSExamInfo({ onBack }: NMMSExamInfoProps) {
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/20 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-6 translate-x-6 text-9xl font-black select-none">
          NMMS
        </div>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            {isTamil ? "தேர்வு வழிகாட்டி" : "Exam Guide"}
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            {isTamil ? "தேசிய வருவாய்வழி மற்றும் திறனாய்வுத் தேர்வு" : "National Means-cum-Merit Scholarship Examination"}
          </h1>
          <p className="text-xs md:text-sm text-purple-200 font-semibold max-w-2xl leading-relaxed">
            {isTamil
              ? "அரசு மற்றும் அரசு உதவி பெறும் பள்ளி மாணவர்களுக்கு வழங்கப்படும் ஒரு சிறந்த மத்திய அரசு உதவித்தொகைத் திட்டம்."
              : "A prestigious scholarship program by the Central Government designed for students studying in Government and Govt-aided schools."}
          </p>
        </div>
      </div>

      {/* Grid for Quick info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Eligibility Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isTamil ? "மாணவர் தகுதி" : "Who is Eligible?"}
            </h3>
          </div>
          <ul className="space-y-3 text-xs text-muted-foreground font-semibold">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{isTamil ? "8-ஆம் வகுப்பு படிக்கும் அரசு / அரசு உதவி பெறும் பள்ளி மாணவர்கள்." : "Current 8th standard students in Govt/Govt-aided schools."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{isTamil ? "7-ஆம் வகுப்பில் 55% அல்லது அதற்கு மேல் பெற்றிருக்க வேண்டும்." : "Must have scored 55% or above in 7th standard."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{isTamil ? "குடும்ப ஆண்டு வருமானம் ₹3,50,000-க்குள் இருக்க வேண்டும்." : "Family annual income below ₹3,50,000."}</span>
            </li>
          </ul>
        </div>

        {/* Benefits Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isTamil ? "உதவித்தொகை பயன்கள்" : "Scholarship Benefits"}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 text-center">
              <div className="text-2xl font-black text-purple-400">₹12,000 / Year</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{isTamil ? "ஆண்டுதோறும்" : "Every Year"}</div>
            </div>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {isTamil
                ? "9-ஆம் வகுப்பு முதல் 12-ஆம் வகுப்பு வரை தொடர்ந்து 4 ஆண்டுகள் கல்வி பயில தலா ₹12,000 உதவித்தொகை வழங்கப்படும் (மொத்தம் ₹48,000)."
                : "Eligible scholars receive ₹12,000 per year for 4 consecutive years (from Class 9 to Class 12, total ₹48,000) directly to their bank account."}
            </p>
          </div>
        </div>

        {/* Exam Structure Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isTamil ? "தேர்வு முறைமை" : "Exam Structure"}
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-muted-foreground font-semibold">
            <li className="flex justify-between border-b border-border/30 pb-1.5">
              <span>{isTamil ? "மொத்த வினாக்கள்" : "Total Questions"}</span>
              <span className="font-black text-foreground">180 MCQs</span>
            </li>
            <li className="flex justify-between border-b border-border/30 pb-1.5">
              <span>{isTamil ? "பகுதி 1: மனத்திறன் (MAT)" : "Part 1: MAT (Reasoning)"}</span>
              <span className="font-black text-foreground">90 Q / 90 Mins</span>
            </li>
            <li className="flex justify-between border-b border-border/30 pb-1.5">
              <span>{isTamil ? "பகுதி 2: கல்வித்திறன் (SAT)" : "Part 2: SAT (Academic)"}</span>
              <span className="font-black text-foreground">90 Q / 90 Mins</span>
            </li>
            <li className="flex justify-between">
              <span>{isTamil ? "தவறான விடைகளுக்கு மதிப்பெண்" : "Negative Marking"}</span>
              <span className="font-black text-emerald-500">{isTamil ? "இல்லை" : "None"}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Syllabus Detail Section */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-black text-foreground border-b border-border/30 pb-4">
          {isTamil ? "விரிவான பாடத்திட்டம்" : "Detailed Syllabus Breakdown"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-blue-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              {isTamil ? "பகுதி 1: மனத்திறன் தேர்வு (MAT)" : "Paper 1: Mental Ability Test (MAT)"}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {isTamil
                ? "இந்தத் தேர்வு மாணவர்களின் பகுத்தறியும் திறன், தர்க்கச் சிந்தனை மற்றும் சிக்கல்களைத் தீர்க்கும் திறனை சோதிக்கிறது."
                : "This paper measures logical reasoning, pattern recognition, and critical thinking capabilities through non-verbal and verbal reasoning items."}
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-semibold pl-4 list-disc">
              <li>{isTamil ? "ஒப்புமை (Analogy)" : "Analogy"}</li>
              <li>{isTamil ? "வகைப்படுத்துதல்" : "Classification"}</li>
              <li>{isTamil ? "எண் தொடர்" : "Number Series"}</li>
              <li>{isTamil ? "எழுத்து தொடர்" : "Alphabet Series"}</li>
              <li>{isTamil ? "குறியீட்டு முறை" : "Coding-Decoding"}</li>
              <li>{isTamil ? "பிரதிபலிப்பு பிம்பங்கள்" : "Mirror/Water Images"}</li>
              <li>{isTamil ? "பகடை கணக்குகள்" : "Cubes and Dice"}</li>
              <li>{isTamil ? "மறைந்த உருவங்கள்" : "Hidden Figures"}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-purple-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              {isTamil ? "பகுதி 2: கல்விச் சார் அறிவுத் தேர்வு (SAT)" : "Paper 2: Scholastic Aptitude Test (SAT)"}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {isTamil
                ? "வகுப்பு 7 மற்றும் வகுப்பு 8 மாநிலப் பாடத்திட்டத்தின் அறிவியல், சமூக அறிவியல் மற்றும் கணிதப் பாடங்களிலிருந்து கேள்விகள் கேட்கப்படும்."
                : "Academic syllabus of Class 7 and Class 8 Tamil Nadu State Board spanning Science, Social Science, and Mathematics."}
            </p>
            <div className="space-y-3 pl-4">
              <div className="text-xs text-muted-foreground">
                <span className="font-black text-foreground">{isTamil ? "அறிவியல் (35 வினாக்கள்):" : "Science (35 Questions):"}</span>
                <span className="font-semibold"> {isTamil ? "இயற்பியல், வேதியியல் மற்றும் உயிரியல் பாடங்கள்." : "Physics, Chemistry, and Biology."}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-black text-foreground">{isTamil ? "சமூக அறிவியல் (35 வினாக்கள்):" : "Social Science (35 Questions):"}</span>
                <span className="font-semibold"> {isTamil ? "வரலாறு, புவியியல் மற்றும் குடிமையியல் பாடங்கள்." : "History, Geography, and Civics."}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-black text-foreground">{isTamil ? "கணிதம் (20 வினாக்கள்):" : "Mathematics (20 Questions):"}</span>
                <span className="font-semibold"> {isTamil ? "இயல் எண்கள், இயற்கணிதம், அளவியல் மற்றும் வடிவியல் பாடங்கள்." : "Rational Numbers, Algebra, Geometry, and Mensuration."}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-400 font-semibold leading-relaxed">
          <p>
            {isTamil
              ? "முக்கியக் குறிப்பு: தகுதி பெற மாணவர்கள் இரு தாள்களிலும் (MAT மற்றும் SAT) தனித்தனியாக குறைந்தபட்சம் 40% (SC/ST மாணவர்களுக்கு 32%) மதிப்பெண்கள் பெற வேண்டும்."
              : "Important: Students must secure a minimum of 40% aggregate marks in both papers (32% for SC/ST categories) separately to qualify for the final merit list."}
          </p>
        </div>
      </div>
    </div>
  );
}
