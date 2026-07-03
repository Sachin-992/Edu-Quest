import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, Volume2, Sparkles, Star, Flame, Trophy,
  Play, BookOpen, Lightbulb, CheckCircle2, ChevronRight, Gamepad2,
  Clock, ShieldAlert, Award, Smile, RefreshCw, XCircle, Heart
} from "lucide-react";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

// Speech Recognition API setup
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// 12 English Buddy Categories
const CATEGORIES = [
  { id: "school", name: "School", emoji: "🏫", desc: "Classroom conversations & asking questions" },
  { id: "home", name: "Home", emoji: "🏠", desc: "Helping with chores & family discussions" },
  { id: "office", name: "Office", emoji: "🏢", desc: "Professional emails, meetings & reports" },
  { id: "hotel", name: "Hotel / Restaurant", emoji: "🍽", desc: "Ordering food & check-in dialogues" },
  { id: "shopping", name: "Shopping", emoji: "🛒", desc: "Asking for prices, size, and paying bills" },
  { id: "travel", name: "Travel", emoji: "🚌", desc: "Navigating airports, buses, and asking directions" },
  { id: "friends", name: "Friends & Family", emoji: "👨👩👧", desc: "Friendly catch-ups, hobbies & jokes" },
  { id: "world", name: "Outside World", emoji: "🌍", desc: "Talking to strangers, weather & environment" },
  { id: "internet", name: "Internet & Technology", emoji: "💻", desc: "Social media safety, app usage & emails" },
  { id: "ai", name: "AI & Chatbots", emoji: "🤖", desc: "Prompting ChatGPT, robots & tech trends" },
  { id: "speaking", name: "Public Speaking", emoji: "🎤", desc: "School speeches, presentations & debate prep" },
  { id: "phone", name: "Phone Conversations", emoji: "📞", desc: "Making doctor appointments & booking services" },
];

// Local Fallback Lessons for all categories (Ensures 100% immediate functionality)
const LOCAL_LESSONS = [
  {
    id: "local-school-beg",
    category: "School",
    level: "Beginner",
    title: "Asking for a Pencil",
    description: "Learn how to borrow a pencil from a classmate politely.",
    icon: "🏫",
    content: [
      { speaker: "mascot", text: "Hello there! Let's practice borrowing a pencil. Repeat after me.", meaning: "Greeting and instruction", translation: "வணக்கம்! பென்சில் கடன் வாங்குவதை பயிற்சி செய்வோம். என் பின்னாடி சொல்லுங்க." },
      { speaker: "student", text: "Excuse me, do you have an extra pencil?", meaning: "Politely asking a classmate if they have a spare pencil", translation: "மன்னிக்கவும், உங்களிடம் கூடுதல் பென்சில் உள்ளதா?" },
      { speaker: "mascot", text: "Sure, here you go!", meaning: "Classmate kindly handing over the pencil", translation: "நிச்சயமாக, இந்தாங்க!" },
      { speaker: "student", text: "Thank you so much! I will return it after class.", meaning: "Expressing gratitude and promising to return it", translation: "மிக்க நன்றி! வகுப்பு முடிந்ததும் திருப்பித் தருகிறேன்." }
    ],
    practice_game: {
      type: "unscramble",
      scrambled: ["have", "pencil?", "you", "extra", "do", "an"],
      correctOrder: ["do", "you", "have", "an", "extra", "pencil?"],
      question: "Arrange the words to ask for a pencil politely:"
    },
    real_usage: [
      { context: "In the classroom when you forgot your pencil box", text: "Excuse me, can I borrow a pen, please?", type: "friendly" },
      { context: "Asking a teacher or supervisor during an exam", text: "Excuse me, Sir/Madam, could you please spare a pencil?", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-ai-int",
    category: "AI & Chatbots",
    level: "Intermediate",
    title: "Introducing ChatGPT",
    description: "Discover how to explain what an AI chatbot is to a friend.",
    icon: "🤖",
    content: [
      { speaker: "mascot", text: "Do you know what ChatGPT is? Let's practice explaining it.", meaning: "Opening question about AI", translation: "உங்களுக்கு சாட்ஜிபிடி என்றால் என்னவென்று தெரியுமா? அதை விளக்கப் பயிற்சி செய்வோம்." },
      { speaker: "student", text: "ChatGPT is an artificial intelligence chatbot that can chat, write, and code.", meaning: "Defining ChatGPT in simple terms", translation: "சாட்ஜிபிடி என்பது அரட்டையடிக்க, எழுத மற்றும் குறியீட்டு செய்யக்கூடிய ஒரு செயற்கை நுண்ணறிவு அரட்டைப் பெட்டியாகும்." },
      { speaker: "mascot", text: "That is cool! How does it learn?", meaning: "Asking about AI learning methods", translation: "சூப்பர்! அது எப்படி கற்றுக்கொள்கிறது?" },
      { speaker: "student", text: "It is trained on massive amounts of books and websites to understand human text.", meaning: "Explaining the training dataset of LLMs", translation: "மனித உரையைப் புரிந்துகொள்ள இது ஏராளமான புத்தகங்கள் மற்றும் வலைத்தளங்களில் பயிற்சி பெற்றுள்ளது."}
    ],
    practice_game: {
      type: "fill",
      sentence: "ChatGPT is an ___ intelligence chatbot.",
      options: ["artificial", "organic", "artistic"],
      answer: "artificial",
      question: "Fill in the missing word:"
    },
    real_usage: [
      { context: "Explaining technology to your parents", text: "It's like a super smart assistant that answers any question instantly.", type: "friendly" },
      { context: "Writing a presentation about AI tools", text: "ChatGPT is a large language model designed to simulate conversational engagement.", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-travel-adv",
    category: "Travel",
    level: "Advanced",
    title: "Navigating the Airport",
    description: "Master professional speech patterns for airport check-in and luggage.",
    icon: "✈️",
    content: [
      { speaker: "mascot", text: "Welcome to airport training. Repeat after me to check in.", meaning: "Welcome greeting", translation: "விமான நிலைய பயிற்சிக்கு உங்களை வரவேற்கிறோம். செக்-இன் செய்ய என் பின்னாடி சொல்லுங்க." },
      { speaker: "student", text: "Good morning, I would like to check in for flight SQ328 to Singapore.", meaning: "Presenting travel details at check-in counter", translation: "காலை வணக்கம், சிங்கப்பூர் செல்லும் SQ328 விமானத்தில் பயணிக்க செக்-இன் செய்ய விரும்புகிறேன்." },
      { speaker: "mascot", text: "Certainly. May I have your passport and booking reference, please?", meaning: "Agent requesting travel documentation", translation: "நிச்சயமாக. உங்கள் கடவுச்சீட்டு மற்றும் முன்பதிவு குறிப்பைத் தர முடியுமா?" },
      { speaker: "student", text: "Sure, here they are. Also, I have one suitcase to check in.", meaning: "Handing over documents and declaring luggage", translation: "நிச்சயமாக, இதோ. மேலும், செக்-இன் செய்ய ஒரு சூட்கேஸ் உள்ளது." }
    ],
    practice_game: {
      type: "grammar",
      sentence: "I would like to check in for my flying SQ328.",
      incorrectWord: "flying",
      correctWord: "flight",
      question: "Fix the grammatical error in this check-in sentence:"
    },
    real_usage: [
      { context: "Checking in at the airport counter", text: "Excuse me, does this flight include a meal option?", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-home-beg",
    category: "Home",
    level: "Beginner",
    title: "Helping Mom in the Kitchen",
    description: "Learn how to offer help and talk about cooking at home.",
    icon: "🏠",
    content: [
      { speaker: "mascot", text: "Let's learn how to help your mom in the kitchen. Ready?", meaning: "Introduction to kitchen conversation", translation: "சமையலறையில் உங்கள் அம்மாவுக்கு எப்படி உதவுவது என்று கற்றுக்கொள்வோம். தயாரா?" },
      { speaker: "student", text: "Mom, can I help you cook dinner tonight?", meaning: "Offering help politely to a parent", translation: "அம்மா, இன்று இரவு உணவு சமைக்க நான் உதவலாமா?" },
      { speaker: "mascot", text: "Sure! Can you wash the vegetables and chop the onions?", meaning: "Mom assigning tasks in the kitchen", translation: "நிச்சயமாக! காய்கறிகளைக் கழுவி வெங்காயத்தை நறுக்க முடியுமா?" },
      { speaker: "student", text: "Of course! I will be careful with the knife.", meaning: "Agreeing and showing responsibility", translation: "நிச்சயமாக! கத்தியுடன் கவனமாக இருப்பேன்." }
    ],
    practice_game: {
      type: "fill",
      sentence: "Can I ___ you cook dinner tonight?",
      options: ["help", "give", "take"],
      answer: "help",
      question: "Fill in the missing word:"
    },
    real_usage: [
      { context: "Offering to help with household chores", text: "Shall I set the table for dinner?", type: "friendly" },
      { context: "Asking a parent for permission in the kitchen", text: "May I help you prepare the meal, please?", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-office-int",
    category: "Office",
    level: "Intermediate",
    title: "Sending a Professional Email",
    description: "Learn how to write and discuss a professional email at work.",
    icon: "🏢",
    content: [
      { speaker: "mascot", text: "Today we will learn how to write a professional email. Let's begin!", meaning: "Introduction to email writing", translation: "இன்று ஒரு தொழில்முறை மின்னஞ்சல் எழுதுவது எப்படி என்று கற்றுக்கொள்வோம். ஆரம்பிக்கலாம்!" },
      { speaker: "student", text: "Dear Mr. Kumar, I am writing to request a meeting regarding the project update.", meaning: "Formal email opening with purpose", translation: "அன்புள்ள திரு. குமார், திட்ட புதுப்பிப்பு குறித்து ஒரு கூட்டத்தை கோர எழுதுகிறேன்." },
      { speaker: "mascot", text: "Excellent! Now add a polite closing line.", meaning: "Prompting for professional sign-off", translation: "அருமை! இப்போது ஒரு கண்ணியமான நிறைவு வரியைச் சேர்க்கவும்." },
      { speaker: "student", text: "Thank you for your time. I look forward to hearing from you. Best regards, Priya.", meaning: "Professional closing with name", translation: "உங்கள் நேரத்திற்கு நன்றி. உங்களிடமிருந்து பதில் எதிர்பார்க்கிறேன். அன்புடன், பிரியா." }
    ],
    practice_game: {
      type: "grammar",
      sentence: "I am writing to requesting a meeting regarding the project.",
      incorrectWord: "requesting",
      correctWord: "request",
      question: "Fix the grammatical error in this email sentence:"
    },
    real_usage: [
      { context: "Writing to a teacher about missing homework", text: "Dear Ma'am, I apologize for the delay in submitting my assignment.", type: "professional" },
      { context: "Emailing a friend about a group project", text: "Hey, just wanted to check if you finished your part of the project.", type: "friendly" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-hotel-beg",
    category: "Hotel / Restaurant",
    level: "Beginner",
    title: "Ordering Food at a Restaurant",
    description: "Practice ordering a meal politely at a restaurant.",
    icon: "🍽",
    content: [
      { speaker: "mascot", text: "Welcome to restaurant training! Let's practice ordering food.", meaning: "Introduction to restaurant dialogue", translation: "உணவகப் பயிற்சிக்கு வரவேற்கிறோம்! உணவு ஆர்டர் செய்வதைப் பயிற்சி செய்வோம்." },
      { speaker: "student", text: "Excuse me, could I see the menu, please?", meaning: "Politely requesting the menu from the waiter", translation: "மன்னிக்கவும், மெனுவைப் பார்க்கலாமா?" },
      { speaker: "mascot", text: "Of course! Here is the menu. Are you ready to order?", meaning: "Waiter offering the menu and asking for the order", translation: "நிச்சயமாக! இதோ மெனு. ஆர்டர் செய்ய தயாரா?" },
      { speaker: "student", text: "Yes, I would like a plate of fried rice and a glass of orange juice, please.", meaning: "Placing a food order politely", translation: "ஆமா, ஒரு தட்டு ப்ரைட் ரைஸ் மற்றும் ஒரு கிளாஸ் ஆரஞ்சு ஜூஸ் வேண்டும்." }
    ],
    practice_game: {
      type: "unscramble",
      scrambled: ["like", "of", "I", "a", "would", "plate", "rice", "fried"],
      correctOrder: ["I", "would", "like", "a", "plate", "of", "fried", "rice"],
      question: "Arrange the words to order food politely:"
    },
    real_usage: [
      { context: "Ordering at a fast food counter", text: "Hi, can I get a chicken burger and a cola, please?", type: "friendly" },
      { context: "Ordering at a formal dinner", text: "I would like to have the grilled fish with steamed vegetables, please.", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-shopping-beg",
    category: "Shopping",
    level: "Beginner",
    title: "Asking for the Price at a Shop",
    description: "Learn how to ask about prices and buy things at a store.",
    icon: "🛒",
    content: [
      { speaker: "mascot", text: "Let's go shopping! I'll teach you how to ask about prices.", meaning: "Introduction to shopping vocabulary", translation: "ஷாப்பிங் போகலாம்! விலையைப் பற்றி கேட்பது எப்படி என்று கற்றுத் தருகிறேன்." },
      { speaker: "student", text: "Excuse me, how much does this notebook cost?", meaning: "Asking the shopkeeper for the price", translation: "மன்னிக்கவும், இந்த நோட்புக் எவ்வளவு?" },
      { speaker: "mascot", text: "This notebook costs fifty rupees. Would you like anything else?", meaning: "Shopkeeper stating the price and offering more items", translation: "இந்த நோட்புக் ஐம்பது ரூபாய். வேறு ஏதாவது வேண்டுமா?" },
      { speaker: "student", text: "No, thank you. Here is the money. Can I have a bag, please?", meaning: "Completing the purchase and asking for a carry bag", translation: "இல்லை, நன்றி. இதோ பணம். ஒரு பை தர முடியுமா?" }
    ],
    practice_game: {
      type: "fill",
      sentence: "How much ___ this notebook cost?",
      options: ["does", "do", "is"],
      answer: "does",
      question: "Fill in the correct word:"
    },
    real_usage: [
      { context: "At a grocery store asking about fruit prices", text: "How much are the apples per kilogram?", type: "friendly" },
      { context: "At a department store asking about discounts", text: "Could you please tell me if this item is on sale?", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-friends-beg",
    category: "Friends & Family",
    level: "Beginner",
    title: "Planning a Weekend Outing with Friends",
    description: "Learn to plan and discuss a fun weekend outing with your friends.",
    icon: "👨‍👩‍👧",
    content: [
      { speaker: "mascot", text: "Let's learn how to plan a weekend outing with your friends!", meaning: "Introduction to friendly conversation about plans", translation: "உங்கள் நண்பர்களுடன் வார இறுதி வெளியே செல்வதை எப்படி திட்டமிடுவது என்று கற்றுக்கொள்வோம்!" },
      { speaker: "student", text: "Hey, are you free this Saturday? Let's go to the park!", meaning: "Inviting a friend to hang out", translation: "ஹேய், இந்த சனிக்கிழமை உனக்கு நேரம் இருக்கா? பூங்காவுக்குப் போகலாம்!" },
      { speaker: "mascot", text: "That sounds fun! What time should we meet?", meaning: "Friend expressing interest and asking about timing", translation: "அது வேடிக்கையாக இருக்கும்! நாம் எந்த நேரத்தில் சந்திக்க வேண்டும்?" },
      { speaker: "student", text: "Let's meet at ten o'clock near the bus stop. Don't forget to bring water!", meaning: "Setting a time and place with a reminder", translation: "பத்து மணிக்கு பஸ் ஸ்டாப் அருகில் சந்திக்கலாம். தண்ணீர் எடுத்துக்க மறக்காதே!" }
    ],
    practice_game: {
      type: "unscramble",
      scrambled: ["free", "Saturday?", "you", "this", "are"],
      correctOrder: ["are", "you", "free", "this", "Saturday?"],
      question: "Arrange the words to invite your friend:"
    },
    real_usage: [
      { context: "Texting a friend about weekend plans", text: "Want to catch a movie this Sunday afternoon?", type: "friendly" },
      { context: "Planning a group study session", text: "Would everyone be available for a study session at the library this weekend?", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-world-beg",
    category: "Outside World",
    level: "Beginner",
    title: "Asking for Directions to a Bus Stop",
    description: "Learn how to politely ask strangers for directions on the street.",
    icon: "🌍",
    content: [
      { speaker: "mascot", text: "Let's learn how to ask for directions when you are outside!", meaning: "Introduction to asking directions", translation: "நீங்கள் வெளியே இருக்கும்போது வழி கேட்பது எப்படி என்று கற்றுக்கொள்வோம்!" },
      { speaker: "student", text: "Excuse me, could you tell me how to get to the nearest bus stop?", meaning: "Politely asking a stranger for directions", translation: "மன்னிக்கவும், அருகிலுள்ள பஸ் நிறுத்தத்திற்கு எப்படி செல்வது என்று சொல்ல முடியுமா?" },
      { speaker: "mascot", text: "Sure! Walk straight for two blocks, then turn left. You will see it on your right.", meaning: "Giving clear step-by-step directions", translation: "நிச்சயமாக! இரண்டு தெருக்கள் நேராக நடந்து, பிறகு இடதுபுறம் திரும்புங்கள். வலதுபுறம் தெரியும்." },
      { speaker: "student", text: "Thank you so much! Is it far from here?", meaning: "Expressing gratitude and asking about distance", translation: "மிக்க நன்றி! இங்கிருந்து வெகு தொலைவா?" }
    ],
    practice_game: {
      type: "grammar",
      sentence: "Could you tell me how to getting to the nearest bus stop?",
      incorrectWord: "getting",
      correctWord: "get",
      question: "Fix the grammatical error in this question:"
    },
    real_usage: [
      { context: "Asking for directions in a new city", text: "Excuse me, is there a bus stop nearby?", type: "friendly" },
      { context: "Asking an official at a railway station", text: "Could you please direct me to the nearest bus terminal?", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-internet-int",
    category: "Internet & Technology",
    level: "Intermediate",
    title: "Staying Safe Online",
    description: "Learn important phrases about internet safety and protecting personal information.",
    icon: "💻",
    content: [
      { speaker: "mascot", text: "Today we will learn about staying safe on the internet. This is very important!", meaning: "Introduction to online safety", translation: "இன்று இணையத்தில் பாதுகாப்பாக இருப்பது பற்றி கற்றுக்கொள்வோம். இது மிகவும் முக்கியம்!" },
      { speaker: "student", text: "I know we should never share our password with strangers online.", meaning: "Stating a key internet safety rule", translation: "இணையத்தில் அறிமுகமில்லாதவர்களுடன் நம் கடவுச்சொல்லை ஒருபோதும் பகிரக்கூடாது என்று எனக்குத் தெரியும்." },
      { speaker: "mascot", text: "Correct! Also, always check if a website is safe before clicking any links.", meaning: "Teaching about safe browsing habits", translation: "சரி! மேலும், எந்த இணைப்புகளையும் கிளிக் செய்வதற்கு முன் வலைத்தளம் பாதுகாப்பானதா என்று எப்போதும் சரிபாருங்கள்." },
      { speaker: "student", text: "I will look for the lock icon in the browser and avoid suspicious websites.", meaning: "Describing safe browsing practice", translation: "உலாவியில் பூட்டு ஐகானைத் தேடுவேன், சந்தேகமான வலைத்தளங்களைத் தவிர்ப்பேன்." }
    ],
    practice_game: {
      type: "fill",
      sentence: "We should never share our ___ with strangers online.",
      options: ["password", "homework", "photos"],
      answer: "password",
      question: "Fill in the most important word:"
    },
    real_usage: [
      { context: "Warning a friend about a suspicious link", text: "Don't click that link, it might be a scam!", type: "friendly" },
      { context: "Explaining online safety rules in a school presentation", text: "It is essential to use strong, unique passwords and enable two-factor authentication.", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-speaking-int",
    category: "Public Speaking",
    level: "Intermediate",
    title: "Giving a Speech at School Assembly",
    description: "Practice delivering a confident speech at your school assembly.",
    icon: "🎤",
    content: [
      { speaker: "mascot", text: "Let's prepare a short speech for the school assembly. Confidence is key!", meaning: "Introduction to public speaking practice", translation: "பள்ளி பேரவைக்கு ஒரு சிறிய உரையை தயார் செய்வோம். தன்னம்பிக்கை முக்கியம்!" },
      { speaker: "student", text: "Good morning, respected teachers and dear friends. Today I would like to speak about the importance of reading.", meaning: "Formal opening of a school speech", translation: "காலை வணக்கம், மரியாதைக்குரிய ஆசிரியர்களே, அன்பு நண்பர்களே. இன்று வாசிப்பின் முக்கியத்துவத்தைப் பற்றி பேச விரும்புகிறேன்." },
      { speaker: "mascot", text: "Great opening! Now tell the audience why reading is important.", meaning: "Guiding the student to develop the body of the speech", translation: "அருமையான தொடக்கம்! இப்போது வாசிப்பு ஏன் முக்கியம் என்று பார்வையாளர்களிடம் சொல்லுங்கள்." },
      { speaker: "student", text: "Reading improves our vocabulary, sharpens our mind, and opens the door to new ideas. Thank you for listening!", meaning: "Delivering the main point and closing the speech", translation: "வாசிப்பு நமது சொல்வளத்தை மேம்படுத்துகிறது, மனதைக் கூர்மையாக்குகிறது, புதிய யோசனைகளுக்கான கதவைத் திறக்கிறது. கேட்டதற்கு நன்றி!" }
    ],
    practice_game: {
      type: "grammar",
      sentence: "Reading improves our vocabulary and sharpen our mind.",
      incorrectWord: "sharpen",
      correctWord: "sharpens",
      question: "Fix the grammatical error in this speech sentence:"
    },
    real_usage: [
      { context: "Starting a classroom presentation", text: "Hello everyone, today my topic is about saving water.", type: "friendly" },
      { context: "Addressing the school assembly formally", text: "Respected Principal, teachers, and fellow students, I am honoured to speak on this occasion.", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  },
  {
    id: "local-phone-beg",
    category: "Phone Conversations",
    level: "Beginner",
    title: "Making a Doctor Appointment",
    description: "Learn how to make a doctor appointment over the phone politely.",
    icon: "📞",
    content: [
      { speaker: "mascot", text: "Let's practice making a phone call to book a doctor appointment!", meaning: "Introduction to phone conversation practice", translation: "மருத்துவர் சந்திப்பை பதிவு செய்ய தொலைபேசி அழைப்பு செய்வதைப் பயிற்சி செய்வோம்!" },
      { speaker: "student", text: "Hello, I would like to book an appointment with Dr. Sharma, please.", meaning: "Requesting an appointment politely over the phone", translation: "வணக்கம், டாக்டர் ஷர்மாவுடன் ஒரு சந்திப்பை பதிவு செய்ய விரும்புகிறேன்." },
      { speaker: "mascot", text: "Sure! Dr. Sharma is available on Thursday at 4 PM. Does that work for you?", meaning: "Receptionist offering an available time slot", translation: "நிச்சயமாக! டாக்டர் ஷர்மா வியாழக்கிழமை மாலை 4 மணிக்கு இருக்கிறார். அது உங்களுக்கு சரியா?" },
      { speaker: "student", text: "Yes, Thursday at 4 PM works perfectly. Thank you very much!", meaning: "Confirming the appointment time", translation: "ஆமா, வியாழக்கிழமை மாலை 4 மணி சரியாக இருக்கும். மிக்க நன்றி!" }
    ],
    practice_game: {
      type: "unscramble",
      scrambled: ["appointment", "to", "like", "I", "an", "would", "book"],
      correctOrder: ["I", "would", "like", "to", "book", "an", "appointment"],
      question: "Arrange the words to request a doctor appointment:"
    },
    real_usage: [
      { context: "Calling a clinic to reschedule", text: "Hi, I need to reschedule my appointment to next week, please.", type: "friendly" },
      { context: "Booking an appointment at a hospital", text: "Good morning, I would like to schedule a consultation with a specialist at your earliest convenience.", type: "professional" }
    ],
    xp_reward: 20,
    coin_reward: 10
  }
];

// Local fallback Words of the Day
const LOCAL_WORDS = [
  { id: "w-1", word: "Persistence", meaning: "Continuing to do something even if it is difficult.", pronunciation: "per-sis-tens", emoji: "🔥", example_sentence: "Her persistence helped her learn to play the violin perfectly.", explanation: "Never giving up even when things get hard.", synonyms: ["determination", "perseverance", "grit"], date: new Date().toISOString().slice(0,10) },
  { id: "w-2", word: "Curious", meaning: "Eager to know or learn something new.", pronunciation: "kyoo-ree-uhs", emoji: "🔬", example_sentence: "The curious student asked many questions about the solar system.", explanation: "Always wanting to find out how things work.", synonyms: ["inquisitive", "interested", "inquiring"], date: new Date(Date.now() + 86400000).toISOString().slice(0,10) }
];

interface EnglishBuddyProps {
  onBack: () => void;
}

const EnglishBuddy = ({ onBack }: EnglishBuddyProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Navigation & Screen states
  const [activeScreen, setActiveScreen] = useState<"lobby" | "dialogue" | "games">("lobby");
  const [loading, setLoading] = useState(false);
  
  // Game/Lesson data states
  const [lessons, setLessons] = useState<any[]>(LOCAL_LESSONS);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [dailyWord, setDailyWord] = useState<any>(LOCAL_WORDS[0]);
  const [wordInput, setWordInput] = useState("");
  const [wordCompleted, setWordCompleted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Immersive Dialog/Lesson states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [isSpeakingMascot, setIsSpeakingMascot] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [spokenConfidence, setSpokenConfidence] = useState<number | null>(null);
  const [spokenText, setSpokenText] = useState("");
  
  // Step 4: Practice interactive structures
  const [unscrambleSelected, setUnscrambleSelected] = useState<string[]>([]);
  const [fillSelected, setFillSelected] = useState<string | null>(null);
  const [grammarFixed, setGrammarFixed] = useState(false);
  
  // Mini-Games state
  const [activeGame, setActiveGame] = useState<"unscramble" | "match" | "speed" | null>(null);
  
  // Gamification scores
  const [streakCount, setStreakCount] = useState(1);
  const [buddyXP, setBuddyXP] = useState(0);
  const [buddyCoins, setBuddyCoins] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  
  // Mascot motivational lines
  const [mascotBubble, setMascotBubble] = useState("Hi! I'm Sparky! Let's master English together today! 🤖");
  const [bounceMascot, setBounceMascot] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Fetch lessons from DB and merge with local fallbacks
        const { data: dbLessons, error: errL } = await supabase
          .from("english_buddy_lessons")
          .select("*");
        if (dbLessons && dbLessons.length > 0) {
          // Merge: DB lessons take priority, local lessons fill gaps
          const dbCategories = new Set(dbLessons.map((l: any) => l.category?.toLowerCase()));
          const localFallbacks = LOCAL_LESSONS.filter(
            l => !dbCategories.has(l.category.toLowerCase())
          );
          setLessons([...dbLessons, ...localFallbacks]);
        }

        // Fetch Word of the Day
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: dbWords, error: errW } = await supabase
          .from("english_buddy_words")
          .select("*")
          .eq("date", todayStr)
          .maybeSingle();
        if (dbWords) {
          setDailyWord(dbWords);
        }

        // Check if Word of the Day is completed
        if (user) {
          const wordToUse = dbWords || LOCAL_WORDS[0];
          const { data: comp } = await supabase
            .from("english_buddy_word_completions")
            .select("*")
            .eq("user_id", user.id)
            .eq("word_id", wordToUse.id)
            .maybeSingle();
          if (comp) {
            setWordCompleted(true);
          }

          // Fetch Streak
          const { data: streak } = await supabase
            .from("english_buddy_streaks")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          if (streak) {
            setStreakCount(streak.streak_count);
          }
        }
      } catch (e) {
        console.warn("[EnglishBuddy] Database tables not deployed yet, running in Local-fallback mode:", e);
      } finally {
        setLoading(false);
      }
    };

    // Load gamification scores from localStorage for fast client integration
    const localXP = localStorage.getItem("eq_eb_xp") || "0";
    const localCoins = localStorage.getItem("eq_eb_coins") || "0";
    const localStreak = localStorage.getItem("eq_eb_streak") || "3";
    const localWordComp = localStorage.getItem(`eq_eb_word_comp_${new Date().toISOString().slice(0,10)}`) === "true";
    
    setBuddyXP(parseInt(localXP));
    setBuddyCoins(parseInt(localCoins));
    setStreakCount(parseInt(localStreak));
    if (localWordComp) setWordCompleted(true);

    fetchContent();
  }, [user, refreshKey]);

  // Mascot Bubble Trigger
  const triggerMascotPhrase = (phrase: string) => {
    setMascotBubble(phrase);
    setBounceMascot(true);
    setTimeout(() => setBounceMascot(false), 800);
  };

  // Text-To-Speech (Speech Synthesis)
  const speakDialogueText = (text: string) => {
    if (!window.speechSynthesis) {
      toast({ title: "Speech Synthesis not supported", variant: "destructive" });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85; // slightly slower for learning kids
    
    utterance.onstart = () => setIsSpeakingMascot(true);
    utterance.onend = () => setIsSpeakingMascot(false);
    utterance.onerror = () => setIsSpeakingMascot(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Mic Recording)
  const startSpeechRecording = () => {
    if (!SpeechRecognitionAPI) {
      toast({ title: "Speech recognition not supported in this browser. Try Chrome/Edge!", variant: "destructive" });
      return;
    }

    window.speechSynthesis.cancel();
    setSpokenText("");
    setSpokenConfidence(null);
    setIsListeningMic(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const result = event.results[0][0];
      const text = result.transcript;
      const confidence = Math.round(result.confidence * 100);

      setSpokenText(text);
      setSpokenConfidence(confidence);

      // Verify matching
      const target = selectedLesson.content[currentLineIdx].text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();
      const userTxt = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();
      
      const similarity = calculateWordSimilarity(target, userTxt);
      if (similarity >= 0.75) {
        triggerMascotPhrase("Wow! Fantastic pronunciation! You nailed it! 🌟");
        awardXPAndCoins(10, 5, "Pronunciation match!");
      } else {
        triggerMascotPhrase("Good attempt! Let's listen again and repeat! 💪");
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListeningMic(false);
      toast({ title: "Microphone error", description: event.error, variant: "destructive" });
    };

    recognition.onend = () => {
      setIsListeningMic(false);
    };

    recognition.start();
  };

  // Simulating string similarity score
  const calculateWordSimilarity = (s1: string, s2: string): number => {
    const w1 = s1.split(" ");
    const w2 = s2.split(" ");
    const matches = w1.filter(w => w2.includes(w)).length;
    return matches / Math.max(w1.length, w2.length);
  };

  // Earn rewards securely and sync
  const awardXPAndCoins = async (xp: number, coinsEarned: number, reason: string) => {
    const updatedXP = buddyXP + xp;
    const updatedCoins = buddyCoins + coinsEarned;
    setBuddyXP(updatedXP);
    setBuddyCoins(updatedCoins);
    
    // Save to LocalStorage
    localStorage.setItem("eq_eb_xp", String(updatedXP));
    localStorage.setItem("eq_eb_coins", String(updatedCoins));

    // Save to Supabase (Profiles & coin transactions if tables allow)
    if (user) {
      try {
        // Upsert standard student progress to trigger native global dashboard updates
        const { error: spError } = await supabase.from("student_progress").insert({
          user_id: user.id,
          status: "completed",
          xp_earned: xp,
          completed_at: new Date().toISOString()
        });
        if (spError) console.error("[EnglishBuddy] Failed to insert student_progress:", spError);
            broadcastActivityComplete({ userId: user.id, activityType: "english_buddy", xp: 20 });

        // Add to coin transactions
        await supabase.from("coin_transactions").insert({
          user_id: user.id,
          amount: coinsEarned,
          description: `English Buddy: ${reason}`
        });
      } catch (err) {
        console.warn("[EnglishBuddy] Synced to local profile only.");
      }
    }

    toast({
      title: `Excellent Job! 🎉`,
      description: `+${xp} XP & +${coinsEarned} Coins earned for: ${reason}`
    });
  };

  // Word of the Day sentence submission
  const handleWordSentenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput || wordInput.trim().length < 8) {
      toast({ title: "Make your sentence a bit longer!", variant: "destructive" });
      return;
    }
    
    const targetWord = dailyWord.word.toLowerCase();
    if (!wordInput.toLowerCase().includes(targetWord)) {
      toast({ title: `Oops! Make sure to use the word "${dailyWord.word}" in your sentence.`, variant: "destructive" });
      return;
    }

    // Award rewards
    setWordCompleted(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`eq_eb_word_comp_${todayStr}`, "true");

    // Add to streaks
    const currentStreak = streakCount + 1;
    setStreakCount(currentStreak);
    localStorage.setItem("eq_eb_streak", String(currentStreak));

    if (user) {
      try {
        // Log daily completion to supabase if possible
        await supabase.from("english_buddy_word_completions").insert({
          user_id: user.id,
          word_id: dailyWord.id,
          user_sentence: wordInput
        });

        await supabase.from("english_buddy_streaks").upsert({
          user_id: user.id,
          streak_count: currentStreak,
          last_activity_date: todayStr
        });
      } catch (err) {
        console.warn("[EnglishBuddy] Word completion logged locally.");
      }
    }

    awardXPAndCoins(15, 10, "Word of the Day");
    triggerMascotPhrase("Brilliant! You used the word of the day correctly. Streak kept alive! 🔥");
    setWordInput("");
  };

  // Dialogue Lesson navigation & progress
  const launchLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setCurrentStep(1);
    setCurrentLineIdx(0);
    setUnscrambleSelected([]);
    setFillSelected(null);
    setGrammarFixed(false);
    setSpokenText("");
    setSpokenConfidence(null);
    setActiveScreen("dialogue");
    triggerMascotPhrase(`Ready for "${lesson.title}"? Let's start with Step 1: Listen! 🎧`);
  };

  const handleNextLine = () => {
    const lines = selectedLesson.content;
    if (currentLineIdx < lines.length - 1) {
      setCurrentLineIdx(currentLineIdx + 1);
      setCurrentStep(1); // Go back to listen for next bubble
      setSpokenText("");
      setSpokenConfidence(null);
      setUnscrambleSelected([]);
      setFillSelected(null);
      setGrammarFixed(false);
    } else {
      // Completed all dialogue lines
      awardXPAndCoins(selectedLesson.xp_reward || 20, selectedLesson.coin_reward || 10, selectedLesson.title);
      setActiveScreen("lobby");
      setSelectedLesson(null);
      triggerMascotPhrase("Hooray! You completed the conversation. You are becoming a great speaker! 🏆");
    }
  };

  // Level Names based on XP
  const getEnglishLevel = (xp: number) => {
    if (xp >= 500) return { title: "Global Speaker 🌎", color: "from-red-500 to-amber-500" };
    if (xp >= 350) return { title: "English Champion 👑", color: "from-yellow-400 to-orange-500" };
    if (xp >= 200) return { title: "Fluent Explorer ⛵", color: "from-purple-500 to-indigo-500" };
    if (xp >= 100) return { title: "Smart Communicator 🧠", color: "from-blue-500 to-cyan-500" };
    if (xp >= 50) return { title: "Daily Talker 🗣️", color: "from-emerald-500 to-teal-500" };
    return { title: "Beginner Speaker 🌱", color: "from-slate-400 to-slate-500" };
  };

  const currentLevel = getEnglishLevel(buddyXP);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-40">
      {/* HUD HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/40 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-muted/80">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="leading-tight text-left">
            <h2 className="text-xl font-black flex items-center gap-2">
              📘 English Buddy
            </h2>
            <p className="text-xs text-muted-foreground">Duolingo-style spoken & written English helper</p>
          </div>
        </div>

        {/* RESOURCE DISPLAY */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border-none shadow-sm shadow-orange-500/10">
            <Flame className="w-4 h-4 fill-white animate-pulse" />
            <span>Streak: {streakCount} Days</span>
          </Badge>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border-none shadow-sm shadow-blue-500/10">
            <Star className="w-4 h-4 fill-white" />
            <span>{buddyXP} EB-XP</span>
          </Badge>
        </div>
      </div>

      {/* LOBBY VIEW */}
      {activeScreen === "lobby" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left">
          
          {/* LEFT COLUMN: LEVEL PROFILE CARD & WORD OF THE DAY */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Mascot Banner Card */}
            <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none shadow-lg overflow-hidden relative rounded-3xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-400/20 via-transparent to-transparent pointer-events-none" />
              <CardContent className="p-5 flex items-center gap-4 relative z-10">
                {/* Visual Mascot */}
                <motion.div
                  animate={bounceMascot ? { y: [-15, 0, -5, 0], rotate: [-10, 10, -5, 0] } : {}}
                  className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl cursor-pointer"
                  onClick={() => triggerMascotPhrase("Ready to increase your English level? Tap a category to start! ⚡")}
                >
                  🤖
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Your Mascot Buddy</div>
                  <h3 className="text-base font-black">Sparky</h3>
                  <div className="bg-black/20 p-2.5 rounded-xl text-xs font-semibold leading-snug mt-2 select-none">
                    "{mascotBubble}"
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level Title Card */}
            <Card className="rounded-3xl border border-border/40 shadow-sm">
              <CardContent className="p-5">
                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Speaking Mastery Level</div>
                <div className={`bg-gradient-to-r ${currentLevel.color} text-white font-extrabold text-sm px-4 py-2 rounded-2xl inline-block shadow-md`}>
                  {currentLevel.title}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Total Mastery XP</span>
                  <span className="text-foreground">{buddyXP} XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${Math.min(100, (buddyXP % 100))}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Word of the Day Section */}
            <Card className="rounded-3xl border border-border/40 shadow-md relative overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-border/30">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    ✨ Word Of The Day
                  </span>
                  {wordCompleted && (
                    <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-none text-[10px]">
                      Completed
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    {dailyWord?.emoji || "📖"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{dailyWord?.word}</h3>
                    <p className="text-xs text-muted-foreground italic font-mono font-medium">/{dailyWord?.pronunciation}/</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-2xl space-y-2 border border-border/10">
                  <p className="text-xs font-semibold leading-relaxed text-foreground"><strong className="text-primary">Meaning:</strong> {dailyWord?.meaning}</p>
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed"><strong className="text-foreground font-semibold">Example:</strong> "{dailyWord?.example_sentence}"</p>
                </div>

                {!wordCompleted ? (
                  <form onSubmit={handleWordSentenceSubmit} className="space-y-2.5">
                    <Input
                      placeholder={`Write a sentence using "${dailyWord?.word}"...`}
                      value={wordInput}
                      onChange={(e) => setWordInput(e.target.value)}
                      className="rounded-xl h-10 border-border/50 text-xs"
                      required
                    />
                    <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-10 btn-bounce-hover shadow-sm">
                      Submit Sentence (+15 XP)
                    </Button>
                  </form>
                ) : (
                  <div className="p-3 text-center rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-700/20 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Word Challenge Complete!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: LESSONS & CATEGORIES */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="rounded-3xl border border-border/40 shadow-sm">
              <CardContent className="p-5 md:p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-foreground">Select Learning Conversation</h3>
                  <Badge variant="outline" className="border-border/60 text-xs font-semibold">
                    {CATEGORIES.filter(cat => lessons.some(l => l.category.toLowerCase().includes(cat.id) || cat.name.toLowerCase().includes(l.category.toLowerCase()))).length} Packs Available
                  </Badge>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CATEGORIES.map((cat) => {
                    const categoryLessons = lessons.filter(l => l.category.toLowerCase().includes(cat.id) || cat.name.toLowerCase().includes(l.category.toLowerCase()));
                    const hasLesson = categoryLessons.length > 0;
                    
                    return (
                      <motion.div
                        key={cat.id}
                        whileHover={hasLesson ? { scale: 1.02 } : {}}
                        whileTap={hasLesson ? { scale: 0.98 } : {}}
                        onClick={() => {
                          if (hasLesson) {
                            launchLesson(categoryLessons[0]);
                          } else {
                            toast({
                              title: `${cat.name} coming soon!`,
                              description: "Our content creators are writing the conversation packs now.",
                              variant: "default"
                            });
                          }
                        }}
                        className={`rounded-2xl p-4 text-left border flex items-center justify-between gap-4 transition-all duration-200 ${
                          hasLesson
                            ? "bg-gradient-to-br from-card to-muted/20 border-border/50 hover:border-blue-500/40 hover:shadow-md cursor-pointer"
                            : "bg-muted/10 border-border/10 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-3xl filter drop-shadow-sm select-none shrink-0">{cat.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-black text-foreground truncate">{cat.name}</h4>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{cat.desc}</p>
                          </div>
                        </div>
                        {hasLesson ? (
                          <Badge className="bg-blue-100 dark:bg-blue-500/10 border-none text-blue-600 dark:text-blue-400 font-extrabold text-[10px] tracking-wider shrink-0 uppercase">
                            Play
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-border/40 text-muted-foreground font-semibold text-[10px] shrink-0 uppercase">
                            Soon
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* DIALOGUE & INTERACTIVE STEP FLOW VIEW */}
      {activeScreen === "dialogue" && selectedLesson && (
        <Card className="rounded-3xl border border-border/40 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {/* Header info */}
            <div className="bg-muted/30 border-b border-border/30 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-left">
                <span className="text-2xl">{selectedLesson.icon}</span>
                <div>
                  <h3 className="text-base font-black text-foreground">{selectedLesson.title}</h3>
                  <p className="text-xs text-muted-foreground">Category: {selectedLesson.category} · Level: {selectedLesson.level}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setActiveScreen("lobby");
                  setSelectedLesson(null);
                }}
              >
                Quit Lesson
              </Button>
            </div>

            {/* DUOLINGO STEP-BY-STEP FLOW PROGRESS */}
            <div className="px-5 py-3.5 bg-muted/10 border-b border-border/20 flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-1 text-muted-foreground">
                Dialogue Line: <span className="text-foreground">{currentLineIdx + 1}/{selectedLesson.content.length}</span>
              </div>
              
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentStep === s
                        ? "w-8 bg-blue-500"
                        : currentStep > s
                          ? "w-2.5 bg-emerald-500"
                          : "w-2.5 bg-muted"
                    }`}
                    title={["Listen", "Repeat", "Understand", "Practice", "Real Usage"][s-1]}
                  />
                ))}
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="p-6 md:p-8 space-y-6 min-h-[300px] flex flex-col justify-between">
              
              {/* DIALOGUE BUBBLE DISPLAY */}
              <div className="space-y-4">
                <div className={`flex items-start gap-4 ${selectedLesson.content[currentLineIdx].speaker === 'student' ? 'flex-row-reverse' : ''}`}>
                  {/* Mascot / Avatar icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 select-none ${
                    selectedLesson.content[currentLineIdx].speaker === 'student' ? 'bg-indigo-500 text-white' : 'bg-primary/10'
                  }`}>
                    {selectedLesson.content[currentLineIdx].speaker === 'student' ? '👤' : '🤖'}
                  </div>
                  
                  {/* Active Text Speech Bubble */}
                  <div className={`rounded-2xl p-4 max-w-lg shadow-sm border text-left ${
                    selectedLesson.content[currentLineIdx].speaker === 'student'
                      ? "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200/50 dark:border-indigo-800/30"
                      : "bg-card border-border/50"
                  }`}>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider block mb-1">
                      {selectedLesson.content[currentLineIdx].speaker === 'student' ? 'Student (You)' : 'Sparky (Buddy)'}
                    </span>
                    <h4 className="text-base md:text-lg font-black leading-snug text-foreground">
                      {selectedLesson.content[currentLineIdx].text}
                    </h4>
                  </div>
                </div>

                {/* Step specific interactions */}
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/40 dark:border-blue-700/20 text-center space-y-4"
                    >
                      <Star className="w-10 h-10 text-blue-500 mx-auto animate-pulse" />
                      <h4 className="text-sm font-black text-foreground">Step 1: Listen to the Dialogue</h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Click the speaker button below to hear Sparky pronounce the English words correctly.
                      </p>
                      <Button
                        size="lg"
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white gap-2 font-bold px-8 shadow-md"
                        onClick={() => speakDialogueText(selectedLesson.content[currentLineIdx].text)}
                        disabled={isSpeakingMascot}
                      >
                        <Volume2 className="w-5 h-5" />
                        {isSpeakingMascot ? "Speaking..." : "Listen Audio"}
                      </Button>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/40 dark:border-indigo-700/20 text-center space-y-4"
                    >
                      <Mic className={`w-10 h-10 mx-auto ${isListeningMic ? 'text-red-500 animate-ping' : 'text-indigo-500'}`} />
                      <h4 className="text-sm font-black text-foreground">Step 2: Repeat & Practice Speaking</h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Tap the microphone and read the sentence out loud into your microphone!
                      </p>
                      
                      {spokenText && (
                        <div className="bg-card p-3.5 rounded-xl border border-border/40 max-w-sm mx-auto text-left leading-relaxed text-xs">
                          <strong className="text-primary block mb-0.5">You said:</strong>
                          <p className="font-semibold text-foreground">"{spokenText}"</p>
                          {spokenConfidence !== null && (
                            <span className="inline-block mt-2 text-[10px] font-black bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                              Accuracy Match: {spokenConfidence}%
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="lg"
                          className={`rounded-xl font-bold px-6 gap-2 ${
                            isListeningMic ? "bg-red-500 hover:bg-red-600 text-white" : "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                          }`}
                          onClick={startSpeechRecording}
                        >
                          <Mic className="w-5 h-5" />
                          {isListeningMic ? "Listening..." : "Tap to Speak"}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl h-12 text-xs font-bold text-muted-foreground"
                          onClick={() => {
                            setSpokenText("Simulated repeat successful!");
                            setSpokenConfidence(90);
                            awardXPAndCoins(5, 2, "Read sentence");
                            triggerMascotPhrase("Great reading! Let's understand it! 👍");
                          }}
                        >
                          Alternative Keyboard
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 text-left space-y-3"
                    >
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Step 3: Understand Meanings
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <p className="text-foreground leading-relaxed">
                          <strong className="text-amber-600">English context:</strong> {selectedLesson.content[currentLineIdx].meaning}
                        </p>
                        <p className="text-muted-foreground font-medium font-tamil leading-relaxed border-t border-dashed border-border/40 pt-2 text-sm">
                          <strong className="text-foreground font-semibold font-sans text-xs">Tamil Translation:</strong> {selectedLesson.content[currentLineIdx].translation}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/40 dark:border-emerald-700/20 text-left space-y-4"
                    >
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-emerald-500" />
                        Step 4: Interactive Practice Game
                      </h4>

                      {/* UNSCRAMBLE GAME */}
                      {selectedLesson.practice_game.type === "unscramble" && (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground font-medium">{selectedLesson.practice_game.question}</p>
                          
                          {/* Selected boxes */}
                          <div className="flex gap-2 p-3 min-h-[50px] bg-card border rounded-2xl flex-wrap items-center">
                            {unscrambleSelected.map((word, wIdx) => (
                              <button
                                key={wIdx}
                                className="px-3.5 py-1.5 bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-black"
                                onClick={() => {
                                  setUnscrambleSelected(unscrambleSelected.filter((_, i) => i !== wIdx));
                                }}
                              >
                                {word}
                              </button>
                            ))}
                          </div>

                          {/* Choice boxes */}
                          <div className="flex gap-2 flex-wrap pt-1">
                            {selectedLesson.practice_game.scrambled
                              .filter((w: string) => !unscrambleSelected.includes(w))
                              .map((word: string, wIdx: number) => (
                                <button
                                  key={wIdx}
                                  className="px-3.5 py-2 bg-card hover:bg-muted border border-border/40 active:scale-95 transition-all rounded-xl text-xs font-bold text-foreground cursor-pointer"
                                  onClick={() => {
                                    setUnscrambleSelected([...unscrambleSelected, word]);
                                  }}
                                >
                                  {word}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* FILL IN THE BLANK GAME */}
                      {selectedLesson.practice_game.type === "fill" && (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground font-medium">{selectedLesson.practice_game.question}</p>
                          <h5 className="text-base font-black text-foreground text-center my-3">
                            {selectedLesson.practice_game.sentence.replace("___", fillSelected ? `[${fillSelected}]` : "___")}
                          </h5>
                          <div className="flex items-center justify-center gap-3">
                            {selectedLesson.practice_game.options.map((opt: string) => (
                              <button
                                key={opt}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                                  fillSelected === opt
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-card hover:bg-muted text-foreground border-border/40"
                                }`}
                                onClick={() => setFillSelected(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GRAMMAR CORRECTOR GAME */}
                      {selectedLesson.practice_game.type === "grammar" && (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground font-medium">{selectedLesson.practice_game.question}</p>
                          <h5 className="text-sm font-black text-foreground my-3 p-3.5 rounded-xl bg-card border text-center">
                            "{selectedLesson.practice_game.sentence}"
                          </h5>
                          {!grammarFixed ? (
                            <div className="text-center">
                              <span className="text-xs text-muted-foreground font-bold mr-2">Tap wrong word:</span>
                              <button
                                className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 border border-red-200/40 text-xs font-black cursor-pointer"
                                onClick={() => {
                                  setGrammarFixed(true);
                                  awardXPAndCoins(10, 5, "Grammar fix");
                                  triggerMascotPhrase("Splendid job! You spotted the incorrect word! 🧠");
                                }}
                              >
                                {selectedLesson.practice_game.incorrectWord}
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 text-center rounded-xl bg-green-50 dark:bg-green-900/10 text-xs font-black text-green-600 dark:text-green-400 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4.5 h-4.5" /> Corrected to "{selectedLesson.practice_game.correctWord}"!
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {currentStep === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/40 dark:border-indigo-700/20 text-left space-y-4 animate-fade-in"
                    >
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-500" />
                        Step 5: Real World Application
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLesson.real_usage.map((use: any, uIdx: number) => (
                          <div key={uIdx} className="bg-card p-4 rounded-xl border border-border/40 space-y-2">
                            <Badge className={`text-[10px] font-black border-none uppercase ${
                              use.type === 'professional'
                                ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600"
                                : "bg-blue-100 dark:bg-blue-500/10 text-blue-600"
                            }`}>
                              {use.type} Context
                            </Badge>
                            <p className="text-xs text-muted-foreground font-semibold">"{use.context}"</p>
                            <p className="text-sm font-extrabold text-foreground">👉 "{use.text}"</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between border-t border-border/30 pt-6">
                <div>
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 text-xs font-bold text-muted-foreground hover:text-foreground"
                      onClick={() => setCurrentStep((currentStep - 1) as any)}
                    >
                      Back Step
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {currentStep < 5 ? (
                    <Button
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-10 px-6 shadow-sm"
                      onClick={() => {
                        // Unscramble validation check
                        if (currentStep === 4 && selectedLesson.practice_game.type === "unscramble") {
                          const order = selectedLesson.practice_game.correctOrder.join(" ");
                          const userOrder = unscrambleSelected.join(" ");
                          if (order !== userOrder) {
                            toast({ title: "Unscramble order is incorrect, try again!", variant: "destructive" });
                            return;
                          }
                          awardXPAndCoins(10, 5, "Unscramble solution");
                          triggerMascotPhrase("Wow, you unscrambled the sentence beautifully! 🏆");
                        }

                        // Fill validations
                        if (currentStep === 4 && selectedLesson.practice_game.type === "fill") {
                          if (fillSelected !== selectedLesson.practice_game.answer) {
                            toast({ title: "Incorrect fill option, try again!", variant: "destructive" });
                            return;
                          }
                          awardXPAndCoins(10, 5, "Fill in blank");
                          triggerMascotPhrase("Bingo! That matches perfectly! 🎯");
                        }

                        setCurrentStep((currentStep + 1) as any);
                      }}
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white font-black h-10 px-8 shadow-sm"
                      onClick={handleNextLine}
                    >
                      {currentLineIdx === selectedLesson.content.length - 1 ? "Complete Lesson! 🎉" : "Next Line"}
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default EnglishBuddy;
