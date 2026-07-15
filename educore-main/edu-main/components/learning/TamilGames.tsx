import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Star, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

interface TamilGamesProps {
  onBack: () => void;
  classLevel?: number;
}

// Tamil vowels & consonants data — Grade-scaled
const TAMIL_VOWELS = [
  { letter: "அ", trans: "a" }, { letter: "ஆ", trans: "aa" },
  { letter: "இ", trans: "i" }, { letter: "ஈ", trans: "ee" },
  { letter: "உ", trans: "u" }, { letter: "ஊ", trans: "oo" },
  { letter: "எ", trans: "e" }, { letter: "ஏ", trans: "ae" },
  { letter: "ஐ", trans: "ai" }, { letter: "ஒ", trans: "o" },
  { letter: "ஓ", trans: "oa" }, { letter: "ஔ", trans: "au" },
];

const TAMIL_CONSONANTS = [
  { letter: "க", trans: "ka" }, { letter: "ங", trans: "nga" },
  { letter: "ச", trans: "sa" }, { letter: "ஞ", trans: "nya" },
  { letter: "ட", trans: "ta" }, { letter: "ண", trans: "na" },
  { letter: "த", trans: "tha" }, { letter: "ந", trans: "nha" },
  { letter: "ப", trans: "pa" }, { letter: "ம", trans: "ma" },
  { letter: "ய", trans: "ya" }, { letter: "ர", trans: "ra" },
  { letter: "ல", trans: "la" }, { letter: "வ", trans: "va" },
  { letter: "ழ", trans: "zha" }, { letter: "ள", trans: "lla" },
  { letter: "ற", trans: "rra" }, { letter: "ன", trans: "nna" },
];

// Tamil Pure Consonants (Dotted letters)
const TAMIL_PURE_CONSONANTS = [
  { letter: "க்", trans: "ik" }, { letter: "ங்", trans: "ing" },
  { letter: "ச்", trans: "ich" }, { letter: "ஞ்", trans: "inj" },
  { letter: "ட்", trans: "it" }, { letter: "ண்", trans: "inn" },
  { letter: "த்", trans: "ith" }, { letter: "ந்", trans: "inth" },
  { letter: "ப்", trans: "ip" }, { letter: "ம்", trans: "im" },
  { letter: "ய்", trans: "iy" }, { letter: "ர்", trans: "ir" },
  { letter: "ல்", trans: "il" }, { letter: "வ்", trans: "iv" },
  { letter: "ழ்", trans: "izh" }, { letter: "ள்ட்", trans: "ill" }, // Using "ள்ட்" or "ள்"
  { letter: "ள்", trans: "ill" },
  { letter: "ற்", trans: "irr" }, { letter: "ன்", trans: "inn" },
];

// Vallinam (Hard), Mellinam (Soft), Idaiyinam (Medium) classification items
const CLASSIFICATION_ITEMS = [
  // Vallinam (Hard consonants - கசடதபற)
  { letter: "க", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ச", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ட", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "த", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ப", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ற", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "க்", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ச்", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ட்", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "த்", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ப்", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  { letter: "ற்", group: "vallinam", name: "வல்லினம் (Vallinam)" },
  // Mellinam (Soft consonants - ஙஞணநமன)
  { letter: "ங", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ஞ", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ண", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ந", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ம", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ன", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ங்", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ஞ்", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ண்", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ந்", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ம்", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  { letter: "ன்", group: "mellinam", name: "மெல்லினம் (Mellinam)" },
  // Idaiyinam (Medium consonants - யரலவழள)
  { letter: "ய", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ர", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ல", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "வ", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ழ", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ள", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ய்", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ர்", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ல்", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "வ்", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ழ்", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
  { letter: "ள்", group: "idaiyinam", name: "இடையினம் (Idaiyinam)" },
];

// Grade-scaled word banks
const TAMIL_WORDS_EASY = [
  { tamil: "பூ", english: "Flower", hint: "In a garden" },
  { tamil: "மரம்", english: "Tree", hint: "Gives shade" },
  { tamil: "நீர்", english: "Water", hint: "We drink this" },
  { tamil: "மீன்", english: "Fish", hint: "Lives in water" },
  { tamil: "பறவை", english: "Bird", hint: "Can fly" },
  { tamil: "நிலா", english: "Moon", hint: "Night sky" },
  { tamil: "கை", english: "Hand", hint: "Part of body" },
  { tamil: "வீடு", english: "House", hint: "We live here" },
  { tamil: "பால்", english: "Milk", hint: "White drink" },
  { tamil: "நாய்", english: "Dog", hint: "Pet animal" },
  { tamil: "பூனை", english: "Cat", hint: "Says meow" },
  { tamil: "மழை", english: "Rain", hint: "Water from clouds" },
];

const TAMIL_WORDS_MEDIUM = [
  { tamil: "நன்றி", english: "Thank you", hint: "Gratitude" },
  { tamil: "வணக்கம்", english: "Hello", hint: "Greeting" },
  { tamil: "புத்தகம்", english: "Book", hint: "Reading material" },
  { tamil: "பள்ளி", english: "School", hint: "Place of learning" },
  { tamil: "தண்ணீர்", english: "Water", hint: "We drink this" },
  { tamil: "சூரியன்", english: "Sun", hint: "Star in sky" },
  { tamil: "ஆசிரியர்", english: "Teacher", hint: "Teaches students" },
  { tamil: "கணிதம்", english: "Mathematics", hint: "Numbers subject" },
  { tamil: "விலங்கு", english: "Animal", hint: "Living creature" },
  { tamil: "கடல்", english: "Sea", hint: "Big water body" },
  { tamil: "வானம்", english: "Sky", hint: "Above us" },
  { tamil: "காற்று", english: "Wind", hint: "We feel it blow" },
];

const TAMIL_WORDS_HARD = [
  { tamil: "அறிவியல்", english: "Science", hint: "Study of nature" },
  { tamil: "புவியியல்", english: "Geography", hint: "Study of Earth" },
  { tamil: "ஜனநாயகம்", english: "Democracy", hint: "Government type" },
  { tamil: "சுதந்திரம்", english: "Freedom", hint: "Independence" },
  { tamil: "தொழில்நுட்பம்", english: "Technology", hint: "Computers & machines" },
  { tamil: "பொருளாதாரம்", english: "Economy", hint: "Money & trade" },
  { tamil: "சுற்றுச்சூழல்", english: "Environment", hint: "Nature around us" },
  { tamil: "வரலாறு", english: "History", hint: "Study of past" },
  { tamil: "கலாச்சாரம்", english: "Culture", hint: "Traditions & customs" },
  { tamil: "நாகரிகம்", english: "Civilization", hint: "Advanced society" },
  { tamil: "பாரம்பரியம்", english: "Heritage", hint: "Inherited traditions" },
  { tamil: "இலக்கியம்", english: "Literature", hint: "Written works" },
];

// Grade-scaled sentence fill
const SENTENCE_FILL_EASY = [
  { sentence: "என் பெயர் ___", options: ["நான்", "அவன்", "நீ"], answer: "நான்", english: "My name is ___" },
  { sentence: "___ பள்ளிக்கு செல்கிறேன்", options: ["நான்", "அவள்", "நீ"], answer: "நான்", english: "I go to school" },
  { sentence: "இது ___ப் புத்தகம்", options: ["என்", "உன்", "அவன்"], answer: "என்", english: "This is ___ book" },
  { sentence: "இது ஒரு ___", options: ["பூ", "நான்", "போ"], answer: "பூ", english: "This is a ___" },
];

const SENTENCE_FILL_MEDIUM = [
  { sentence: "அவள் ___ படிக்கிறாள்", options: ["நன்றாக", "மெதுவாக", "வேகமாக"], answer: "நன்றாக", english: "She reads ___" },
  { sentence: "குழந்தைகள் ___ விளையாடுகின்றனர்", options: ["மகிழ்ச்சியாக", "சோகமாக", "கோபமாக"], answer: "மகிழ்ச்சியாக", english: "Children play ___" },
  { sentence: "சூரியன் ___ உதிக்கிறது", options: ["கிழக்கில்", "மேற்கில்", "வடக்கில்"], answer: "கிழக்கில்", english: "Sun rises in the ___" },
  { sentence: "நாங்கள் ___ சாப்பிடுகிறோம்", options: ["சாதம்", "காற்று", "நீர்"], answer: "சாதம்", english: "We eat ___" },
];

const SENTENCE_FILL_HARD = [
  { sentence: "திருக்குறளை எழுதியவர் ___", options: ["திருவள்ளுவர்", "கம்பர்", "பாரதி"], answer: "திருவள்ளுவர்", english: "Thirukkural was written by ___" },
  { sentence: "தமிழ்நாட்டின் தலைநகரம் ___", options: ["சென்னை", "மதுரை", "கோயம்புத்தூர்"], answer: "சென்னை", english: "Capital of Tamil Nadu is ___" },
  { sentence: "இந்தியா ___ ஆண்டில் சுதந்திரம் பெற்றது", options: ["1947", "1950", "1942"], answer: "1947", english: "India got independence in ___" },
  { sentence: "___ என்பது செம்மொழிகளில் ஒன்று", options: ["தமிழ்", "ஆங்கிலம்", "இந்தி"], answer: "தமிழ்", english: "___ is one of the classical languages" },
  { sentence: "பரதநாட்டியம் ___ மாநிலத்தின் நடன வடிவம்", options: ["தமிழ்நாடு", "கேரளா", "கர்நாடகா"], answer: "தமிழ்நாடு", english: "Bharatanatyam is the dance form of ___" },
];

// Helper to get grade-appropriate content
function getGradeContent(classLevel: number) {
  const grade = Math.min(Math.max(classLevel, 1), 8);
  if (grade <= 3) {
    return {
      letters: TAMIL_VOWELS,
      words: TAMIL_WORDS_EASY,
      sentences: SENTENCE_FILL_EASY,
      letterCount: 4, // fewer letters to arrange
      matchCount: 4, // fewer match pairs
    };
  } else if (grade <= 5) {
    return {
      letters: [...TAMIL_VOWELS, ...TAMIL_CONSONANTS.slice(0, 6)],
      words: TAMIL_WORDS_MEDIUM,
      sentences: SENTENCE_FILL_MEDIUM,
      letterCount: 6,
      matchCount: 6,
    };
  } else {
    return {
      letters: [...TAMIL_VOWELS, ...TAMIL_CONSONANTS, ...TAMIL_PURE_CONSONANTS],
      words: TAMIL_WORDS_HARD,
      sentences: SENTENCE_FILL_HARD,
      letterCount: 8,
      matchCount: 8,
    };
  }
}

type GameType = "match" | "word_guess" | "sentence_fill" | "letter_order" | "letter_class";

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const TamilGames = ({ onBack, classLevel = 5 }: TamilGamesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  // Get grade-appropriate content
  const gradeContent = getGradeContent(classLevel);

  // Match game state
  const [matchPairs, setMatchPairs] = useState<Array<{ id: number; content: string; type: "tamil" | "trans"; matched: boolean; selected: boolean }>>([]);
  const [matchSelected, setMatchSelected] = useState<number | null>(null);
  const [matchMoves, setMatchMoves] = useState(0);

  // Word guess state
  const [wordIdx, setWordIdx] = useState(0);
  const [wordGuess, setWordGuess] = useState("");
  const [wordResult, setWordResult] = useState<"correct" | "wrong" | null>(null);
  const [wordScore, setWordScore] = useState(0);
  const [shuffledWords, setShuffledWords] = useState(gradeContent.words);

  // Sentence fill state
  const [sentIdx, setSentIdx] = useState(0);
  const [sentResult, setSentResult] = useState<"correct" | "wrong" | null>(null);
  const [sentScore, setSentScore] = useState(0);

  // Letter order state
  const [letterTarget, setLetterTarget] = useState<typeof TAMIL_VOWELS>([]);
  const [letterChoices, setLetterChoices] = useState<typeof TAMIL_VOWELS>([]);
  const [letterSelected, setLetterSelected] = useState<typeof TAMIL_VOWELS>([]);
  const [letterDone, setLetterDone] = useState(false);

  // Letter classification game state
  const [classIdx, setClassIdx] = useState(0);
  const [classResult, setClassResult] = useState<"correct" | "wrong" | null>(null);
  const [classScore, setClassScore] = useState(0);
  const [shuffledClassItems, setShuffledClassItems] = useState<typeof CLASSIFICATION_ITEMS>(CLASSIFICATION_ITEMS);

  const startMatch = () => {
    const selected = shuffle(gradeContent.letters).slice(0, gradeContent.matchCount);
    const count = gradeContent.matchCount;
    const cards = shuffle([
      ...selected.map((v, i) => ({ id: i, content: v.letter, type: "tamil" as const, matched: false, selected: false })),
      ...selected.map((v, i) => ({ id: i + count, content: v.trans, type: "trans" as const, matched: false, selected: false })),
    ]);
    setMatchPairs(cards);
    setMatchSelected(null);
    setMatchMoves(0);
    setActiveGame("match");
  };

  const handleMatchClick = (idx: number) => {
    const card = matchPairs[idx];
    if (card.matched || card.selected) return;

    const updated = matchPairs.map((c, i) => i === idx ? { ...c, selected: true } : c);

    if (matchSelected === null) {
      setMatchSelected(idx);
      setMatchPairs(updated);
    } else {
      const prev = matchPairs[matchSelected];
      setMatchMoves((m) => m + 1);
      // Check if match
      const allLetters = gradeContent.letters;
      const vowel1 = allLetters.find((v) => v.letter === prev.content || v.trans === prev.content);
      const vowel2 = allLetters.find((v) => v.letter === card.content || v.trans === card.content);
      if (vowel1 && vowel2 && vowel1.letter === vowel2.letter && prev.type !== card.type) {
        setMatchPairs(updated.map((c) => c.id === prev.id || c.id === card.id ? { ...c, matched: true, selected: true } : c));
        setScore((s) => s + 5);
      } else {
        setMatchPairs(updated);
        setTimeout(() => {
          setMatchPairs((p) => p.map((c) => c.matched ? c : { ...c, selected: false }));
        }, 800);
      }
      setMatchSelected(null);
    }
  };

  const startWordGuess = () => {
    setShuffledWords(shuffle(gradeContent.words));
    setWordIdx(0);
    setWordGuess("");
    setWordResult(null);
    setWordScore(0);
    setActiveGame("word_guess");
  };

  const checkWordGuess = (guess: string) => {
    const correct = shuffledWords[wordIdx]?.english.toLowerCase() === guess.toLowerCase();
    setWordResult(correct ? "correct" : "wrong");
    if (correct) { setWordScore((s) => s + 10); setScore((s) => s + 10); }
    setTimeout(() => {
      if (wordIdx < Math.min(shuffledWords.length, 8) - 1) {
        setWordIdx((i) => i + 1);
        setWordGuess("");
        setWordResult(null);
      } else {
        awardXP(wordScore + (correct ? 10 : 0));
      }
    }, 1500);
  };

  const startSentenceFill = () => {
    setSentIdx(0);
    setSentResult(null);
    setSentScore(0);
    setActiveGame("sentence_fill");
  };

  const checkSentence = (answer: string) => {
    const correct = answer === gradeContent.sentences[sentIdx]?.answer;
    setSentResult(correct ? "correct" : "wrong");
    if (correct) { setSentScore((s) => s + 15); setScore((s) => s + 15); }
    setTimeout(() => {
      if (sentIdx < gradeContent.sentences.length - 1) {
        setSentIdx((i) => i + 1);
        setSentResult(null);
      } else {
        awardXP(sentScore + (correct ? 15 : 0));
      }
    }, 1500);
  };

  const startLetterOrder = () => {
    const target = gradeContent.letters.slice(0, gradeContent.letterCount);
    setLetterTarget(target);
    setLetterChoices(shuffle(target));
    setLetterSelected([]);
    setLetterDone(false);
    setActiveGame("letter_order");
  };

  const handleLetterSelect = (vowel: typeof TAMIL_VOWELS[0]) => {
    const newSelected = [...letterSelected, vowel];
    setLetterSelected(newSelected);
    setLetterChoices((c) => c.filter((v) => v.letter !== vowel.letter));
    if (newSelected.length === letterTarget.length) {
      const correct = newSelected.every((v, i) => v.letter === letterTarget[i].letter);
      setLetterDone(true);
      if (correct) { setScore((s) => s + 25); awardXP(25); }
    }
  };

  const startLetterClass = () => {
    setShuffledClassItems(shuffle(CLASSIFICATION_ITEMS));
    setClassIdx(0);
    setClassResult(null);
    setClassScore(0);
    setActiveGame("letter_class");
  };

  const checkLetterClass = (group: string) => {
    const current = shuffledClassItems[classIdx];
    const correct = current.group === group;
    setClassResult(correct ? "correct" : "wrong");
    if (correct) {
      setClassScore((s) => s + 10);
      setScore((s) => s + 10);
    }
    setTimeout(() => {
      if (classIdx < 9) { // Play 10 rounds
        setClassIdx((i) => i + 1);
        setClassResult(null);
      } else {
        awardXP(classScore + (correct ? 10 : 0));
      }
    }, 1500);
  };

  const awardXP = async (xp: number) => {
    setTotalXP((t) => t + xp);
    if (user && xp > 0) {
      const { error } = await supabase.from("student_progress").insert({
        user_id: user.id, status: "completed", xp_earned: xp, completed_at: new Date().toISOString(),
      });
      if (error) console.error("[TamilGames] Failed to insert student_progress:", error);
            broadcastActivityComplete({ userId: user.id, activityType: "tamil_game", xp: 15 });
    }
    toast({ title: isTamil ? `+${xp} XP பெற்றீர்கள்! 🎉` : `+${xp} XP earned! 🎉` });
  };

  const games = [
    { 
      type: "match" as GameType, 
      icon: "🎴", 
      title: isTamil ? "எழுத்து இணைத்தல்" : "Letter Match", 
      desc: isTamil ? "தமிழ் எழுத்துகளுடன் ஆங்கில ஒலிப்பை இணைக்கவும்" : "Match Tamil letters with transliterations", 
      color: "bg-tamil-gold/20" 
    },
    { 
      type: "word_guess" as GameType, 
      icon: "📝", 
      title: isTamil ? "சொல் மாஸ்டர்" : "Word Master", 
      desc: isTamil ? "தமிழ் சொற்களின் ஆங்கிலப் பொருளைக் கண்டறியவும்" : "Guess English meanings of Tamil words", 
      color: "bg-edu-purple/20" 
    },
    { 
      type: "sentence_fill" as GameType, 
      icon: "✍️", 
      title: isTamil ? "கோடிட்ட இடம்" : "Fill the Blank", 
      desc: isTamil ? "சரியான சொற்களைக் கொண்டு வாக்கியங்களை நிரப்புக" : "Complete Tamil sentences correctly", 
      color: "bg-edu-orange/20" 
    },
    { 
      type: "letter_order" as GameType, 
      icon: "🔤", 
      title: isTamil ? "எழுத்து வரிசை" : "Letter Order", 
      desc: isTamil ? "உயிர் எழுத்துக்களைச் சரியான வரிசையில் ஒழுங்குபடுத்தவும்" : "Arrange Tamil vowels in correct order", 
      color: "bg-primary/20" 
    },
    { 
      type: "letter_class" as GameType, 
      icon: "📚", 
      title: isTamil ? "மெய் வகைப்பாடு" : "Letter Class", 
      desc: isTamil ? "எழுத்துக்களை வல்லினம், மெல்லினம், இடையினம் என வகைப்படுத்தவும்" : "Classify consonants into Vallinam, Mellinam, and Idaiyinam", 
      color: "bg-emerald-500/20" 
    },
  ];

  if (!activeGame) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "பாடங்களுக்கு திரும்புக" : "Back to Subjects"}
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🎮</span>
          <div>
            <h2 className="text-2xl font-black">{isTamil ? "தமிழ் விளையாட்டுகள்" : "Tamil Games"}</h2>
            <p className="text-muted-foreground font-tamil">தமிழ் விளையாட்டுகள்</p>
          </div>
          {totalXP > 0 && (
            <Badge className="ml-auto bg-xp text-primary-foreground text-lg px-4 py-1">
              <Star className="w-4 h-4 mr-1" /> {totalXP} XP
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((g, i) => (
            <motion.button
              key={g.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                if (g.type === "match") startMatch();
                else if (g.type === "word_guess") startWordGuess();
                else if (g.type === "sentence_fill") startSentenceFill();
                else if (g.type === "letter_order") startLetterOrder();
                else startLetterClass();
              }}
              className={`${g.color} rounded-2xl p-6 text-left hover:shadow-lg transition-all`}
            >
              <span className="text-4xl mb-3 block">{g.icon}</span>
              <h3 className="text-lg font-bold">{g.title}</h3>
              <p className="text-sm text-muted-foreground">{g.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Match Game
  if (activeGame === "match") {
    const allMatched = matchPairs.every((c) => c.matched);
    return (
      <div>
        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "விளையாட்டுகளுக்கு திரும்புக" : "Back to Games"}
        </Button>
        <h2 className="text-2xl font-black mb-2">🎴 {isTamil ? "எழுத்து இணைத்தல்" : "Letter Match"}</h2>
        <p className="text-muted-foreground mb-4">{isTamil ? `நகர்வுகள்: ${matchMoves} · மதிப்பெண்: ${score}` : `Moves: ${matchMoves} · Score: ${score}`}</p>
        {allMatched ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-card rounded-2xl p-8 shadow-card text-center">
            <span className="text-6xl block mb-4">🎉</span>
            <h3 className="text-2xl font-black mb-2">{isTamil ? "அனைத்தும் இணைக்கப்பட்டன!" : "All Matched!"}</h3>
            <p className="text-muted-foreground mb-4">{isTamil ? `${matchMoves} நகர்வுகளில் முடிந்தது` : `Completed in ${matchMoves} moves`}</p>
            <Button onClick={startMatch}><RotateCcw className="w-4 h-4 mr-1" /> {isTamil ? "மீண்டும் விளையாடு" : "Play Again"}</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {matchPairs.map((card, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMatchClick(i)}
                className={`aspect-square rounded-2xl text-2xl font-bold flex items-center justify-center transition-all ${
                  card.matched ? "bg-xp/20 border-2 border-xp" :
                  card.selected ? "bg-primary/20 border-2 border-primary" :
                  "bg-card shadow-card hover:shadow-lg"
                } ${card.type === "tamil" ? "font-tamil" : ""}`}
              >
                {card.selected || card.matched ? card.content : "?"}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Word Guess Game
  if (activeGame === "word_guess") {
    const current = shuffledWords[wordIdx];
    const isLast = wordIdx >= Math.min(shuffledWords.length, 8) - 1;
    return (
      <div>
        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "விளையாட்டுகளுக்கு திரும்புக" : "Back to Games"}
        </Button>
        <h2 className="text-2xl font-black mb-4">📝 {isTamil ? "சொல் மாஸ்டர்" : "Word Master"}</h2>
        <div className="bg-card rounded-2xl p-6 shadow-card text-center max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-2">{isTamil ? `வார்த்தை ${wordIdx + 1} இல் ${Math.min(shuffledWords.length, 8)}` : `Word ${wordIdx + 1} of ${Math.min(shuffledWords.length, 8)}`}</p>
          <p className="text-5xl font-tamil mb-4">{current.tamil}</p>
          <p className="text-sm text-muted-foreground mb-4">{isTamil ? `குறிப்பு: ${current.hint}` : `Hint: ${current.hint}`}</p>
          {wordResult ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              {wordResult === "correct" ? (
                <div className="text-xp font-bold text-xl flex items-center justify-center gap-2"><CheckCircle2 /> {isTamil ? "சரியான விடை! +10 XP" : "Correct! +10 XP"}</div>
              ) : (
                <div className="text-destructive font-bold text-xl flex items-center justify-center gap-2"><XCircle /> {isTamil ? `விடை: ${current.english}` : `Answer: ${current.english}`}</div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {shuffle([current.english, ...shuffle(gradeContent.words.filter((w) => w.english !== current.english)).slice(0, 3).map((w) => w.english)]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => checkWordGuess(opt)}
                  className="w-full p-3 bg-muted rounded-xl hover:bg-primary/10 transition-colors font-medium cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">{isTamil ? `மதிப்பெண்: ${wordScore}` : `Score: ${wordScore}`}</p>
        </div>
      </div>
    );
  }

  // Sentence Fill
  if (activeGame === "sentence_fill") {
    const current = gradeContent.sentences[sentIdx];
    return (
      <div>
        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "விளையாட்டுகளுக்கு திரும்புக" : "Back to Games"}
        </Button>
        <h2 className="text-2xl font-black mb-4">✍️ {isTamil ? "கோடிட்ட இடம்" : "Fill the Blank"}</h2>
        <div className="bg-card rounded-2xl p-6 shadow-card max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-2">{isTamil ? `வாக்கியம் ${sentIdx + 1} இல் ${gradeContent.sentences.length}` : `Sentence ${sentIdx + 1} of ${gradeContent.sentences.length}`}</p>
          <p className="text-2xl font-tamil mb-2 text-center">{current.sentence}</p>
          <p className="text-sm text-muted-foreground mb-6 text-center">{current.english}</p>
          {sentResult ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
              {sentResult === "correct" ? (
                <div className="text-xp font-bold text-xl flex items-center justify-center gap-2"><CheckCircle2 /> {isTamil ? "சரியான விடை! +15 XP" : "Correct! +15 XP"}</div>
              ) : (
                <div className="text-destructive font-bold text-xl flex items-center justify-center gap-2"><XCircle /> {isTamil ? `விடை: ${current.answer}` : `Answer: ${current.answer}`}</div>
              )}
            </motion.div>
          ) : (
            <div className="flex gap-3 justify-center flex-wrap">
              {shuffle(current.options).map((opt) => (
                <button
                  key={opt}
                  onClick={() => checkSentence(opt)}
                  className="px-6 py-3 bg-muted rounded-xl hover:bg-primary/10 transition-colors font-tamil font-bold text-lg cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4 text-center">{isTamil ? `மதிப்பெண்: ${sentScore}` : `Score: ${sentScore}`}</p>
        </div>
      </div>
    );
  }

  // Letter Order
  if (activeGame === "letter_order") {
    const isCorrect = letterDone && letterSelected.every((v, i) => v.letter === letterTarget[i].letter);
    return (
      <div>
        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "விளையாட்டுகளுக்கு திரும்புக" : "Back to Games"}
        </Button>
        <h2 className="text-2xl font-black mb-4">🔤 {isTamil ? "எழுத்து வரிசை" : "Letter Order"}</h2>
        <p className="text-muted-foreground mb-4">{isTamil ? "உயிர் எழுத்துக்களைச் சரியான வரிசையில் ஒழுங்குபடுத்தவும்" : "Arrange the Tamil vowels in the correct order"}</p>
        <div className="bg-card rounded-2xl p-6 shadow-card max-w-md mx-auto">
          <div className="flex gap-2 justify-center mb-6 min-h-[60px] flex-wrap">
            {letterSelected.map((v, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-tamil font-bold ${
                letterDone ? (v.letter === letterTarget[i].letter ? "bg-xp/20 border-2 border-xp" : "bg-destructive/20 border-2 border-destructive") : "bg-primary/10 border-2 border-primary"
              }`}>
                {v.letter}
              </motion.div>
            ))}
            {Array.from({ length: letterTarget.length - letterSelected.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12 rounded-xl border-2 border-dashed border-muted" />
            ))}
          </div>
          {letterDone ? (
            <div className="text-center">
              {isCorrect ? (
                <div className="text-xp font-bold text-xl mb-4">🎉 {isTamil ? "சரியான வரிசை! +25 XP" : "Perfect Order! +25 XP"}</div>
              ) : (
                <div className="text-destructive font-bold mb-4">{isTamil ? `தவறு. சரியான வரிசை: ${letterTarget.map((v) => v.letter).join(" ")}` : `Incorrect. Correct order: ${letterTarget.map((v) => v.letter).join(" ")}`}</div>
              )}
              <Button onClick={startLetterOrder} className="cursor-pointer"><RotateCcw className="w-4 h-4 mr-1" /> {isTamil ? "மீண்டும் முயற்சி செய்" : "Try Again"}</Button>
            </div>
          ) : (
            <div className="flex gap-2 justify-center flex-wrap">
              {letterChoices.map((v) => (
                <motion.button
                  key={v.letter}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLetterSelect(v)}
                  className="w-14 h-14 rounded-xl bg-muted hover:bg-primary/10 transition-colors text-xl font-tamil font-bold cursor-pointer"
                >
                  {v.letter}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Letter Class
  if (activeGame === "letter_class") {
    const current = shuffledClassItems[classIdx];
    return (
      <div>
        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "விளையாட்டுகளுக்கு திரும்புக" : "Back to Games"}
        </Button>
        <h2 className="text-2xl font-black mb-4">📚 {isTamil ? "மெய் வகைப்பாடு" : "Letter Class"}</h2>
        
        <div className="bg-card rounded-2xl p-6 shadow-card max-w-md mx-auto text-center space-y-6">
          <p className="text-sm text-muted-foreground">
            {isTamil ? `எழுத்து ${classIdx + 1} இல் 10` : `Letter ${classIdx + 1} of 10`}
          </p>
          
          <div className="py-6 bg-muted/30 rounded-2xl border border-border/10">
            <span className="text-7xl font-tamil font-bold block text-foreground animate-pulse">
              {current?.letter}
            </span>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl text-left border border-border/10">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1">
              💡 {isTamil ? "உதவிக் குறிப்பு" : "Cheat Sheet Guide"}
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>{isTamil ? "வல்லினம் (கடினம்):" : "Vallinam (Hard):"}</strong> க், ச், ட், த், ப், ற் (கசடதபற)<br />
              <strong>{isTamil ? "மெல்லினம் (மென்மை):" : "Mellinam (Soft):"}</strong> ங், ஞ், ண், ந், ம், ன் (ஙஞணநமன)<br />
              <strong>{isTamil ? "இடையினம் (இடைப்பட்ட):" : "Idaiyinam (Medium):"}</strong> ய், ர், ல், வ், ழ், ள் (யரலவழள)
            </p>
          </div>

          {classResult ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="py-4">
              {classResult === "correct" ? (
                <div className="text-xp font-bold text-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="text-xp animate-bounce" />
                  {isTamil ? "சரியான விடை! +10 XP" : "Correct! +10 XP"}
                </div>
              ) : (
                <div className="text-destructive font-bold text-lg flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1.5"><XCircle className="w-5 h-5" /> {isTamil ? "தவறான விடை!" : "Wrong!"}</span>
                  <span className="text-xs text-muted-foreground">
                    {isTamil 
                      ? `'${current?.letter}' என்பது ${current?.name} வகுப்பைச் சேர்ந்தது.`
                      : `'${current?.letter}' belongs to ${current?.name}.`}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { id: "vallinam", label: isTamil ? "வல்லினம் (Hard)" : "வல்லினம் (Hard)" },
                { id: "mellinam", label: isTamil ? "மெல்லினம் (Soft)" : "மெல்லினம் (Soft)" },
                { id: "idaiyinam", label: isTamil ? "இடையினம் (Medium)" : "இடையினம் (Medium)" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => checkLetterClass(btn.id)}
                  className="w-full p-4 bg-muted rounded-xl hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all font-tamil font-bold text-base cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {isTamil ? `மதிப்பெண்: ${classScore}` : `Score: ${classScore}`}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default TamilGames;
