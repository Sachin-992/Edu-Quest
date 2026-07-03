/**
 * ScenarioRoleplay — Immersive English conversation roleplay system
 * Players practice real-world scenarios with dialogue choices
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Volume2, Star, MessageCircle, Users,
  CheckCircle2, Award, Sparkles, ChevronRight, Play,
} from "lucide-react";

interface ScenarioRoleplayProps {
  onComplete: (score: number, xpEarned: number) => void;
  onBack: () => void;
}

interface DialogueChoice {
  text: string;
  quality: "perfect" | "acceptable" | "wrong";
  feedback: string;
}

interface DialogueStep {
  npcEmoji: string;
  npcName: string;
  npcLine: string;
  choices: DialogueChoice[];
}

interface Scenario {
  id: string;
  title: string;
  emoji: string;
  location: string;
  description: string;
  gradient: string;
  bgGlow: string;
  steps: DialogueStep[];
  tips: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "hotel",
    title: "Hotel Check-in",
    emoji: "🏨",
    location: "Grand Palace Hotel",
    description: "Check into a hotel and request room services",
    gradient: "from-blue-500 to-cyan-600",
    bgGlow: "bg-blue-500/10",
    steps: [
      {
        npcEmoji: "👨‍💼", npcName: "Receptionist",
        npcLine: "Good evening! Welcome to the Grand Palace Hotel. Do you have a reservation?",
        choices: [
          { text: "Yes, I have a reservation under the name Sharma for two nights.", quality: "perfect", feedback: "Perfect! Clear and professional." },
          { text: "Yes, booking. Sharma name.", quality: "acceptable", feedback: "Understandable, but try using complete sentences." },
          { text: "Give me room now.", quality: "wrong", feedback: "This sounds rude. Always greet and be polite!" },
        ],
      },
      {
        npcEmoji: "👨‍💼", npcName: "Receptionist",
        npcLine: "I found your reservation. Would you prefer a room with a city view or a garden view?",
        choices: [
          { text: "I'd prefer the city view, please. Is there an extra charge for that?", quality: "perfect", feedback: "Excellent! Polite and asks relevant questions." },
          { text: "City view please.", quality: "acceptable", feedback: "Good choice! You could also ask about pricing." },
          { text: "Whatever is cheapest.", quality: "wrong", feedback: "This is too casual for a hotel. Be more specific." },
        ],
      },
      {
        npcEmoji: "👨‍💼", npcName: "Receptionist",
        npcLine: "No extra charge! Here's your room key. Breakfast is served from 7 to 10 AM. Is there anything else I can help you with?",
        choices: [
          { text: "Could you please arrange a wake-up call at 7 AM? Also, is there Wi-Fi available in the room?", quality: "perfect", feedback: "Perfect! Asking politely with relevant follow-up questions." },
          { text: "Wake-up call at 7, please.", quality: "acceptable", feedback: "Good, but you missed asking about other amenities." },
          { text: "No. Where is the elevator?", quality: "wrong", feedback: "A bit abrupt. Try: 'No, thank you. Could you point me to the elevator?'" },
        ],
      },
      {
        npcEmoji: "👨‍💼", npcName: "Receptionist",
        npcLine: "Of course! Wi-Fi password is on the card in your room. Your room is 504 on the 5th floor. Enjoy your stay!",
        choices: [
          { text: "Thank you very much for your help! Have a wonderful evening.", quality: "perfect", feedback: "Warm and courteous farewell!" },
          { text: "Thanks! Bye.", quality: "acceptable", feedback: "Quick but polite. A fuller response shows better communication." },
          { text: "OK.", quality: "wrong", feedback: "Too brief! Always thank service staff properly." },
        ],
      },
    ],
    tips: ["Always greet staff politely", "Ask relevant follow-up questions", "Thank people for their help", "Use complete sentences"],
  },
  {
    id: "doctor",
    title: "Doctor Visit",
    emoji: "🏥",
    location: "City Health Clinic",
    description: "Describe symptoms and understand medical advice",
    gradient: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/10",
    steps: [
      {
        npcEmoji: "👩‍⚕️", npcName: "Doctor",
        npcLine: "Good morning! Please have a seat. What brings you here today?",
        choices: [
          { text: "Good morning, Doctor. I've been having a headache and mild fever since yesterday.", quality: "perfect", feedback: "Great! Clear description of symptoms with timeline." },
          { text: "Head hurting. Fever also.", quality: "acceptable", feedback: "Understood, but adding details like 'since when' helps the doctor." },
          { text: "I don't feel good.", quality: "wrong", feedback: "Too vague. Describe specific symptoms so the doctor can help." },
        ],
      },
      {
        npcEmoji: "👩‍⚕️", npcName: "Doctor",
        npcLine: "I see. Have you taken any medicine so far? Are you allergic to anything?",
        choices: [
          { text: "I took a paracetamol tablet last night, but the headache returned this morning. I don't have any known allergies.", quality: "perfect", feedback: "Excellent! Complete medical history response." },
          { text: "I took one tablet. No allergies.", quality: "acceptable", feedback: "Good, but specify which medicine you took." },
          { text: "Some tablet, I forgot the name.", quality: "wrong", feedback: "Always remember and tell your doctor the exact medication name." },
        ],
      },
      {
        npcEmoji: "👩‍⚕️", npcName: "Doctor",
        npcLine: "I'm going to prescribe some medicine. Take this tablet twice a day after meals. Come back if the fever doesn't go down in two days.",
        choices: [
          { text: "Thank you, Doctor. Should I avoid any specific foods while on this medication?", quality: "perfect", feedback: "Smart question! Always ask about dietary restrictions." },
          { text: "OK, Doctor. Thank you.", quality: "acceptable", feedback: "Polite, but asking about precautions shows responsibility." },
          { text: "Can I just buy stronger medicine instead?", quality: "wrong", feedback: "Never self-medicate! Trust and follow your doctor's advice." },
        ],
      },
    ],
    tips: ["Describe symptoms clearly with timeline", "Mention medications you've taken", "Ask about dietary restrictions", "Follow the doctor's advice"],
  },
  {
    id: "restaurant",
    title: "Restaurant Order",
    emoji: "🍽️",
    location: "Spice Garden Restaurant",
    description: "Order food and handle special requests politely",
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
    steps: [
      {
        npcEmoji: "🧑‍🍳", npcName: "Waiter",
        npcLine: "Good afternoon! Welcome to Spice Garden. Here's our menu. Can I get you something to drink while you decide?",
        choices: [
          { text: "Good afternoon! Yes, could I please have a glass of fresh lime soda?", quality: "perfect", feedback: "Polite greeting and clear order!" },
          { text: "Lime soda please.", quality: "acceptable", feedback: "Good, but greeting the staff first is more polite." },
          { text: "Just water. Hurry up.", quality: "wrong", feedback: "Very rude! Never rush the staff." },
        ],
      },
      {
        npcEmoji: "🧑‍🍳", npcName: "Waiter",
        npcLine: "Here's your lime soda. Are you ready to order your meal?",
        choices: [
          { text: "Yes, I'd like the paneer butter masala with two naan. Could you make it less spicy, please?", quality: "perfect", feedback: "Perfect! Specific order with polite special request." },
          { text: "Paneer butter masala, two naan.", quality: "acceptable", feedback: "Clear order, but mention any preferences like spice level." },
          { text: "Give me that thing on page two.", quality: "wrong", feedback: "Be specific about what you want to order." },
        ],
      },
      {
        npcEmoji: "🧑‍🍳", npcName: "Waiter",
        npcLine: "Sure, less spicy paneer butter masala with two naan. Would you like any dessert?",
        choices: [
          { text: "What do you recommend? I'm in the mood for something sweet but not too heavy.", quality: "perfect", feedback: "Great conversation! Asking for recommendations shows engagement." },
          { text: "No dessert, thanks.", quality: "acceptable", feedback: "Polite decline. Perfectly fine!" },
          { text: "I don't want anything sweet.", quality: "wrong", feedback: "Try: 'No thank you, I'll skip dessert today.'" },
        ],
      },
      {
        npcEmoji: "🧑‍🍳", npcName: "Waiter",
        npcLine: "Here's your bill. The total comes to ₹680. Would you like to pay by card or cash?",
        choices: [
          { text: "I'll pay by card, please. The food was absolutely delicious — please compliment the chef!", quality: "perfect", feedback: "Wonderful! Complimenting the food shows appreciation." },
          { text: "Card please. Thank you.", quality: "acceptable", feedback: "Polite and efficient payment." },
          { text: "That's expensive. I'll pay cash.", quality: "wrong", feedback: "Commenting on price like this is inappropriate. Simply pay and provide feedback nicely." },
        ],
      },
    ],
    tips: ["Greet service staff warmly", "Be specific about your order", "Mention dietary preferences politely", "Compliment good food and service"],
  },
  {
    id: "interview",
    title: "Job Interview",
    emoji: "💼",
    location: "TechCorp Office",
    description: "Handle a professional interview confidently",
    gradient: "from-indigo-500 to-violet-600",
    bgGlow: "bg-indigo-500/10",
    steps: [
      {
        npcEmoji: "👔", npcName: "Interviewer",
        npcLine: "Good morning! Please take a seat. Can you tell me a little about yourself?",
        choices: [
          { text: "Good morning! My name is Ravi. I recently graduated with a degree in Computer Science and I'm passionate about web development. I've completed two internships where I built applications using React.", quality: "perfect", feedback: "Excellent! Professional, structured, and relevant." },
          { text: "I'm Ravi. I studied computers. I want a job.", quality: "acceptable", feedback: "Too brief. Share your qualifications and passions." },
          { text: "What do you want to know?", quality: "wrong", feedback: "This sounds defensive. Prepare a brief self-introduction!" },
        ],
      },
      {
        npcEmoji: "👔", npcName: "Interviewer",
        npcLine: "Very impressive! What is your biggest strength?",
        choices: [
          { text: "I believe my biggest strength is problem-solving. When I face challenges, I break them into smaller steps and find creative solutions. My internship supervisors appreciated this approach.", quality: "perfect", feedback: "Perfect! Specific strength with supporting evidence." },
          { text: "I work hard.", quality: "acceptable", feedback: "Good quality, but give a specific example to stand out." },
          { text: "I don't have any weaknesses.", quality: "wrong", feedback: "This sounds unrealistic. Be honest and specific about strengths." },
        ],
      },
      {
        npcEmoji: "👔", npcName: "Interviewer",
        npcLine: "Great! Do you have any questions for us?",
        choices: [
          { text: "Yes! Could you tell me about the team I would be working with and what a typical project looks like here?", quality: "perfect", feedback: "Wonderful! Shows genuine interest in the role and team." },
          { text: "When will I get the result?", quality: "acceptable", feedback: "This is okay but shows you're only focused on the outcome. Ask about the role too." },
          { text: "No, I think I'm good.", quality: "wrong", feedback: "Always ask questions! It shows you're engaged and interested." },
        ],
      },
    ],
    tips: ["Prepare a brief self-introduction", "Use specific examples for strengths", "Always ask thoughtful questions", "Maintain professional language"],
  },
  {
    id: "school",
    title: "School Presentation",
    emoji: "🎓",
    location: "Classroom",
    description: "Give a presentation and answer questions from classmates",
    gradient: "from-rose-500 to-pink-600",
    bgGlow: "bg-rose-500/10",
    steps: [
      {
        npcEmoji: "👩‍🏫", npcName: "Teacher",
        npcLine: "Alright class, it's your turn to present your project on renewable energy. Please begin!",
        choices: [
          { text: "Thank you, Ma'am. Good morning everyone! Today I'll be presenting my project on solar energy and how it can power our future. Let me start with some interesting facts.", quality: "perfect", feedback: "Great opening! Professional greeting with engaging intro." },
          { text: "OK so my project is about solar energy.", quality: "acceptable", feedback: "Start with a greeting and make it more engaging." },
          { text: "I didn't prepare much but let me try.", quality: "wrong", feedback: "Never start with a negative statement! Show confidence." },
        ],
      },
      {
        npcEmoji: "👦", npcName: "Classmate",
        npcLine: "That was interesting! But how expensive are solar panels? Can a normal family afford them?",
        choices: [
          { text: "That's a great question! While solar panels have an upfront cost, the government offers subsidies that can reduce it by up to 40%. Over time, families actually save money on electricity bills.", quality: "perfect", feedback: "Excellent! Acknowledged the question and gave a detailed answer." },
          { text: "They are expensive but worth it.", quality: "acceptable", feedback: "Brief answer. Try adding facts and numbers." },
          { text: "I don't know the exact cost.", quality: "wrong", feedback: "Always research answers to potential questions beforehand." },
        ],
      },
      {
        npcEmoji: "👩‍🏫", npcName: "Teacher",
        npcLine: "Wonderful presentation! Can you summarize your main points for the class?",
        choices: [
          { text: "Of course! In summary, solar energy is clean, becoming more affordable, and can significantly reduce our carbon footprint. I believe every school should have solar panels by 2030. Thank you for listening!", quality: "perfect", feedback: "Strong conclusion with a call to action! Perfect." },
          { text: "Solar energy is good for the environment. Thank you.", quality: "acceptable", feedback: "Good, but summarize 2-3 key points for a stronger close." },
          { text: "That's all I have.", quality: "wrong", feedback: "End on a strong note! Summarize and thank your audience." },
        ],
      },
    ],
    tips: ["Start with a confident greeting", "Use facts and numbers in answers", "Always prepare for Q&A", "End with a strong summary"],
  },
  {
    id: "phone",
    title: "Phone Call",
    emoji: "📞",
    location: "Making an Appointment",
    description: "Book a doctor's appointment over the phone",
    gradient: "from-cyan-500 to-blue-600",
    bgGlow: "bg-cyan-500/10",
    steps: [
      {
        npcEmoji: "👩‍💻", npcName: "Receptionist",
        npcLine: "Hello, City Health Clinic. How may I help you?",
        choices: [
          { text: "Hello! I'd like to book an appointment with Dr. Priya for a general check-up, please.", quality: "perfect", feedback: "Clear, polite, and specific request!" },
          { text: "I need to see a doctor.", quality: "acceptable", feedback: "Good, but mention which doctor and the reason." },
          { text: "Doctor appointment, ASAP.", quality: "wrong", feedback: "Too blunt. Use polite language on the phone." },
        ],
      },
      {
        npcEmoji: "👩‍💻", npcName: "Receptionist",
        npcLine: "Sure! Dr. Priya is available on Thursday at 10 AM or Friday at 3 PM. Which slot works for you?",
        choices: [
          { text: "Thursday at 10 AM would be perfect. Could I have the clinic address as well, please?", quality: "perfect", feedback: "Prompt response with a useful follow-up question." },
          { text: "Thursday.", quality: "acceptable", feedback: "Confirm the full time slot: 'Thursday at 10 AM, please.'" },
          { text: "Can't she see me today?", quality: "wrong", feedback: "Accept available slots politely. If urgent, explain why." },
        ],
      },
      {
        npcEmoji: "👩‍💻", npcName: "Receptionist",
        npcLine: "Your appointment is confirmed for Thursday at 10 AM. Please bring your ID and any previous medical reports. Anything else?",
        choices: [
          { text: "Thank you so much! I'll make sure to bring everything. Have a great day!", quality: "perfect", feedback: "Warm and professional closing!" },
          { text: "OK, thanks. Bye.", quality: "acceptable", feedback: "Brief but polite." },
          { text: "Yeah, that's it.", quality: "wrong", feedback: "Try ending with a thank you!" },
        ],
      },
    ],
    tips: ["State your purpose clearly at the start", "Confirm appointment details", "Ask for address/directions if needed", "End calls politely"],
  },
];

const QUALITY_CONFIG = {
  perfect: { stars: 3, color: "text-green-500", bg: "bg-green-500/15", border: "border-green-500/30", emoji: "🌟", label: "Perfect!" },
  acceptable: { stars: 2, color: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/30", emoji: "👍", label: "Good!" },
  wrong: { stars: 1, color: "text-red-500", bg: "bg-red-500/15", border: "border-red-500/30", emoji: "💡", label: "Learn!" },
};

const ScenarioRoleplay = ({ onComplete, onBack }: ScenarioRoleplayProps) => {
  const [screen, setScreen] = useState<"select" | "playing" | "complete">("select");
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<DialogueChoice | null>(null);
  const [starsEarned, setStarsEarned] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelectScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setCurrentStep(0);
    setStarsEarned([]);
    setSelectedChoice(null);
    setShowFeedback(false);
    setScreen("playing");
  };

  const handleChoice = (choice: DialogueChoice) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    setStarsEarned((prev) => [...prev, QUALITY_CONFIG[choice.quality].stars]);
    setShowFeedback(true);
  };

  const handleNextStep = () => {
    if (!activeScenario) return;
    const next = currentStep + 1;
    if (next >= activeScenario.steps.length) {
      setScreen("complete");
      return;
    }
    setCurrentStep(next);
    setSelectedChoice(null);
    setShowFeedback(false);
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const totalStars = starsEarned.reduce((a, b) => a + b, 0);
  const maxStars = activeScenario ? activeScenario.steps.length * 3 : 0;
  const xpEarned = Math.max(5, totalStars * 4);

  // Completion screen
  if (screen === "complete" && activeScenario) {
    const percentage = Math.round((totalStars / maxStars) * 100);
    return (
      <div className="min-h-[80vh] flex items-center justify-center pb-28 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/50 rounded-3xl p-8 text-center shadow-2xl"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-7xl mb-4">
            {percentage >= 80 ? "🎭" : percentage >= 50 ? "🗣️" : "📖"}
          </motion.div>

          <h2 className="text-2xl font-black text-foreground mb-1">
            {percentage >= 80 ? "Outstanding!" : percentage >= 50 ? "Well Spoken!" : "Keep Practicing!"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {activeScenario.emoji} {activeScenario.title} — Completed!
          </p>

          {/* Stars display */}
          <div className="flex justify-center gap-1 mb-5">
            {starsEarned.map((stars, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex gap-0.5">
                {[1, 2, 3].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= stars ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{totalStars}/{maxStars}</div>
              <div className="text-[10px] font-bold text-muted-foreground">Stars</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3">
              <Sparkles className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">+{xpEarned}</div>
              <div className="text-[10px] font-bold text-muted-foreground">XP Earned</div>
            </div>
          </div>

          {/* Tips section */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl p-3 mb-5 text-left">
            <h4 className="text-xs font-black text-muted-foreground uppercase mb-2">💡 Communication Tips</h4>
            <ul className="space-y-1">
              {activeScenario.tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="flex-1 py-3 rounded-2xl bg-muted hover:bg-muted/80 font-bold text-sm transition-colors">
              Back
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onComplete(totalStars, xpEarned)} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg">
              Collect XP! ⭐
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Scenario selection screen
  if (screen === "select") {
    return (
      <div className="min-h-[80vh] pb-28">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-foreground">🎭 Scenario Roleplay</h1>
            <p className="text-sm text-muted-foreground">Pick a real-world scenario to practice</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SCENARIOS.map((scenario, idx) => (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectScenario(scenario)}
              className={`${scenario.bgGlow} border border-border/40 hover:border-amber-500/40 rounded-2xl p-4 text-center transition-all shadow-sm hover:shadow-lg group`}
            >
              <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{scenario.emoji}</span>
              <h3 className="font-black text-sm text-foreground mb-0.5">{scenario.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">{scenario.description}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star key={s} className="w-3 h-3 text-muted-foreground/30" />
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Playing screen
  if (!activeScenario) return null;
  const step = activeScenario.steps[currentStep];

  return (
    <div className="min-h-[80vh] pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setScreen("select")} className="h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-lg font-black text-foreground">{activeScenario.emoji} {activeScenario.title}</h1>
            <p className="text-xs text-muted-foreground">📍 {activeScenario.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {starsEarned.map((stars, i) => (
            <div key={i} className="flex">
              {[1, 2, 3].map((s) => (
                <Star key={s} className={`w-3 h-3 ${s <= stars ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / activeScenario.steps.length) * 100}%` }}
            className={`h-full rounded-full bg-gradient-to-r ${activeScenario.gradient}`}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">{currentStep + 1}/{activeScenario.steps.length}</span>
      </div>

      {/* NPC Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 rounded-full bg-card border border-border/50 flex items-center justify-center text-2xl shadow-md">
              {step.npcEmoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-muted-foreground uppercase">{step.npcName}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => speakText(step.npcLine)}
                  className="h-6 w-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center"
                >
                  <Volume2 className="w-3 h-3 text-blue-500" />
                </motion.button>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm">
                <p className="text-sm font-medium text-foreground leading-relaxed">{step.npcLine}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Response choices */}
      <div className="space-y-2.5 mb-5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Your Response:</label>
        {step.choices.map((choice, idx) => {
          const selected = selectedChoice === choice;
          const revealed = selectedChoice !== null;
          const config = QUALITY_CONFIG[choice.quality];

          let cardClass = "bg-card border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5";
          if (revealed) {
            if (selected) {
              cardClass = `${config.bg} ${config.border}`;
            } else {
              cardClass = "bg-card/40 border-border/30 opacity-40";
            }
          }

          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={!revealed ? { x: 4 } : {}}
              whileTap={!revealed ? { scale: 0.98 } : {}}
              onClick={() => handleChoice(choice)}
              disabled={revealed}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${cardClass}`}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${revealed && selected ? config.bg : "bg-muted/50"} ${revealed && selected ? config.color : "text-muted-foreground"}`}>
                  {revealed && selected ? config.emoji : `${idx + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-relaxed">{choice.text}</p>
                  {revealed && selected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`text-xs font-semibold mt-1.5 ${config.color}`}
                    >
                      {config.label} {choice.feedback}
                    </motion.p>
                  )}
                </div>
                {revealed && selected && (
                  <div className="shrink-0 flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= config.stars ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      {selectedChoice && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextStep}
          className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${activeScenario.gradient} text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2`}
        >
          {currentStep + 1 >= activeScenario.steps.length ? "See Results 🏆" : "Continue Conversation"}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};

export default ScenarioRoleplay;
