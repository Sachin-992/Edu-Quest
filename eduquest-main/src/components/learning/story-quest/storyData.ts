export interface StoryPage {
  text: string;
  text_ta: string;
  character: string; // emoji
  keywords: { word: string; meaning: string; word_ta: string; meaning_ta: string }[];
  thinkMoment?: {
    question: string;
    question_ta: string;
    options: { label: string; label_ta: string; isCorrect: boolean; feedback: string; feedback_ta: string }[];
  };
}

export interface StoryQuestion {
  question: string;
  question_ta: string;
  options: string[];
  options_ta: string[];
  answer: string;
  answer_ta: string;
}

export interface Story {
  id: string;
  subject: string;
  title: string;
  title_ta: string;
  emoji: string;
  classRange: [number, number];
  pages: StoryPage[];
  questions: StoryQuestion[];
  xpReward: number;
}

export const STORIES: Story[] = [
  // ── GENERAL (Class 1) ──
  {
    id: "story_magic_sandbox",
    subject: "General",
    title: "The Magic Sandbox",
    title_ta: "மாயாஜால மணல் பெட்டி",
    emoji: "🏖️",
    classRange: [1, 2],
    xpReward: 30,
    pages: [
      {
        text: "Rohan and Maya are playing in the magic sandbox! They build a big sandcastle. Suddenly, the sand glows green! A tiny sand-crab appears. 'Hello!' says the crab. 'Welcome to my castle!'",
        text_ta: "ரோஹனும் மாயாவும் மாயாஜால மணல் பெட்டியில் விளையாடுகிறார்கள்! அவர்கள் ஒரு பெரிய மணல் கோட்டையைக் கட்டுகிறார்கள். திடீரென்று, மணல் பச்சை நிறத்தில் ஒளிர்கிறது! ஒரு சிறிய மணல் நண்டு தோன்றுகிறது. 'வணக்கம்!' என்கிறது நண்டு. 'என் கோட்டைக்கு வரவேற்கிறோம்!'",
        character: "🦀",
        keywords: [
          { word: "sandcastle", meaning: "A castle made of sand", word_ta: "மணல் கோட்டை", meaning_ta: "மணலால் கட்டப்பட்ட கோட்டை" },
          { word: "glow", meaning: "To shine brightly", word_ta: "ஒளிர்", meaning_ta: "பிரகாசமாக ஒளிர்வது" }
        ],
        thinkMoment: {
          question: "What color did the sand glow?",
          question_ta: "மணல் எந்த நிறத்தில் ஒளிர்ந்தது?",
          options: [
            { label: "Green", label_ta: "பச்சை", isCorrect: true, feedback: "Yes! The sand glowed green! 💚", feedback_ta: "ஆம்! மணல் பச்சை நிறத்தில் ஒளிர்ந்தது! 💚" },
            { label: "Red", label_ta: "சிவப்பு", isCorrect: false, feedback: "No, read carefully! It glowed green.", feedback_ta: "இல்லை, கவனமாகப் படியுங்கள்! அது பச்சை நிறத்தில் ஒளிர்ந்தது." }
          ]
        }
      },
      {
        text: "The crab shows them 3 shiny seashells. One is blue, one is yellow, and one is pink. 'Take one as a gift!' says the crab. Maya chooses the pink shell, and Rohan chooses the blue shell.",
        text_ta: "நண்டு அவர்களுக்கு 3 பளபளப்பான சிப்பிகளைக் காட்டுகிறது. ஒன்று நீலம், ஒன்று மஞ்சள், ஒன்று இளஞ்சிவப்பு. 'பரிசாக ஒன்றை எடுத்துக் கொள்ளுங்கள்!' என்கிறது நண்டு. மாயா இளஞ்சிவப்பு சிப்பியையும், ரோஹன் நீல நிற சிப்பியையும் தேர்வு செய்கிறார்கள்.",
        character: "🐚",
        keywords: [
          { word: "seashell", meaning: "The hard shell of a sea animal", word_ta: "சிப்பி", meaning_ta: "கடல் விலங்கின் கடினமான ஓடு" },
          { word: "gift", meaning: "A present given to someone", word_ta: "பரிசு", meaning_ta: "ஒருவருக்கு கொடுக்கப்படும் பரிசு" }
        ],
      }
    ],
    questions: [
      { question: "Where are Rohan and Maya playing?", question_ta: "ரோஹனும் மாயாவும் எங்கே விளையாடுகிறார்கள்?", options: ["In a pool", "In a magic sandbox", "In the forest", "At school"], options_ta: ["குளத்தில்", "மாயாஜால மணல் பெட்டியில்", "காட்டில்", "பள்ளியில்"], answer: "In a magic sandbox", answer_ta: "மாயாஜால மணல் பெட்டியில்" },
      { question: "What do they build?", question_ta: "அவர்கள் எதைக் கட்டுகிறார்கள்?", options: ["A house", "A boat", "A sandcastle", "A car"], options_ta: ["ஒரு வீடு", "ஒரு படகு", "ஒரு மணல் கோட்டை", "ஒரு கார்"], answer: "A sandcastle", answer_ta: "ஒரு மணல் கோட்டை" },
      { question: "What suddenly happened to the sand?", question_ta: "திடீரென்று மணலுக்கு என்ன ஆனது?", options: ["It turned into water", "It blew away", "It glowed green", "It became hot"], options_ta: ["அது நீராக மாறியது", "அது பறந்துப் போனது", "அது பச்சை நிறத்தில் ஒளிர்ந்தது", "அது சூடானது"], answer: "It glowed green", answer_ta: "அது பச்சை நிறத்தில் ஒளிர்ந்தது" },
      { question: "What animal appears?", question_ta: "எந்த விலங்கு தோன்றுகிறது?", options: ["A crab", "A turtle", "A fish", "A bird"], options_ta: ["ஒரு நண்டு", "ஒரு ஆமை", "ஒரு மீன்", "ஒரு பறவை"], answer: "A crab", answer_ta: "ஒரு நண்டு" },
      { question: "Whose castle is it?", question_ta: "அது யாருடைய கோட்டை?", options: ["Rohan's", "Maya's", "The crab's", "The sun's"], options_ta: ["ரோஹனுடையது", "மாயாவுடையது", "நண்டினுடையது", "சூரியனுடையது"], answer: "The crab's", answer_ta: "நண்டினுடையது" },
      { question: "How many shiny seashells did the crab show?", question_ta: "நண்டு எத்தனை பளபளப்பான சிப்பிகளைக் காட்டியது?", options: ["2", "3", "4", "5"], options_ta: ["2", "3", "4", "5"], answer: "3", answer_ta: "3" },
      { question: "What colors were the seashells?", question_ta: "சிப்பிகள் என்ன நிறங்களில் இருந்தன?", options: ["Red, Blue, Green", "Blue, Yellow, Pink", "White, Black, Gray", "Orange, Purple, Red"], options_ta: ["சிவப்பு, நீலம், பச்சை", "நீலம், மஞ்சள், இளஞ்சிவப்பு", "வெள்ளை, கருப்பு, சாம்பல்", "ஆரஞ்சு, ஊதா, சிவப்பு"], answer: "Blue, Yellow, Pink", answer_ta: "நீலம், மஞ்சள், இளஞ்சிவப்பு" },
      { question: "What does the crab say?", question_ta: "நண்டு என்ன சொல்கிறது?", options: ["Go away!", "Take one as a gift!", "Don't touch!", "Time to sleep!"], options_ta: ["போய்விடு!", "பரிசாக ஒன்றை எடுத்துக் கொள்ளுங்கள்!", "தொடக்கூடாது!", "தூங்குவதற்கான நேரம்!"], answer: "Take one as a gift!", answer_ta: "பரிசாக ஒன்றை எடுத்துக் கொள்ளுங்கள்!" },
      { question: "Which shell does Maya choose?", question_ta: "மாயா எந்த சிப்பியைத் தேர்ந்தெடுக்கிறாள்?", options: ["Red", "Pink", "Blue", "Yellow"], options_ta: ["சிவப்பு", "இளஞ்சிவப்பு", "நீலம்", "மஞ்சள்"], answer: "Pink", answer_ta: "இளஞ்சிவப்பு" },
      { question: "Which shell does Rohan choose?", question_ta: "ரோஹன் எந்த சிப்பியைத் தேர்ந்தெடுக்கிறான்?", options: ["Yellow", "Pink", "Green", "Blue"], options_ta: ["மஞ்சள்", "இளஞ்சிவப்பு", "பச்சை", "நீலம்"], answer: "Blue", answer_ta: "நீலம்" }
    ]
  },

  // ── GENERAL (Class 3-5) ──
  {
    id: "story_mars_rover",
    subject: "General",
    title: "The Mars Rover",
    title_ta: "செவ்வாய் ரோவர்",
    emoji: "🚀",
    classRange: [3, 5],
    xpReward: 30,
    pages: [
      {
        text: "The year is 2035. Astronaut Aryan and his robot friend, Rover-X, are exploring Mars. Mars is a red planet covered in rocks and dust. Suddenly, Rover-X beeps loudly. It has found a glowing blue stone hidden under a large rock!",
        text_ta: "2035 ஆம் ஆண்டு. விண்வெளி வீரர் ஆர்யன் மற்றும் அவரது ரோபோ நண்பர் ரோவர்-எக்ஸ், செவ்வாய் கிரகத்தை ஆராய்ந்து வருகின்றனர். செவ்வாய் பாறைகள் மற்றும் தூசியால் மூடப்பட்ட ஒரு சிவப்பு கிரகம். திடீரென்று, ரோவர்-எக்ஸ் சத்தமாக ஒலிக்கிறது. இது ஒரு பெரிய பாறையின் கீழ் மறைக்கப்பட்டுள்ள ஒளிரும் நீல கல் ஒன்றைக் கண்டுபிடித்துள்ளது!",
        character: "👨‍🚀",
        keywords: [
          { word: "astronaut", meaning: "A person trained to travel in a spacecraft", word_ta: "விண்வெளி வீரர்", meaning_ta: "விண்கலத்தில் பயணிக்க பயிற்சியளிக்கப்பட்ட நபர்" },
          { word: "explore", meaning: "Travel through an unfamiliar area", word_ta: "ஆராய்தல்", meaning_ta: "பழக்கமில்லாத பகுதிகள் வழியாக பயணித்தல்" }
        ],
        thinkMoment: {
          question: "What color is the planet Mars?",
          question_ta: "செவ்வாய் கிரகம் என்ன நிறம்?",
          options: [
            { label: "Red", label_ta: "சிவப்பு", isCorrect: true, feedback: "Correct! Mars is known as the red planet.", feedback_ta: "சரி! செவ்வாய் கிரகம் சிவப்பு கிரகம் என்று அழைக்கப்படுகிறது." },
            { label: "Blue", label_ta: "நீலம்", isCorrect: false, feedback: "No, the stone was blue, but the planet is red!", feedback_ta: "இல்லை, கல் நீல நிறம், ஆனால் கிரகம் சிவப்பு!" }
          ]
        }
      },
      {
        text: "Aryan carefully picks up the blue stone with his thick space suit gloves. The stone feels warm to the touch. 'This is an amazing discovery!' he says to Mission Control on Earth. They pack the stone to bring it back home.",
        text_ta: "ஆர்யன் தனது தடிமனான விண்வெளி உடையின் கையுறைகளால் நீலக்கல்லை கவனமாக எடுக்கிறார். கல் தொடுவதற்கு கதகதப்பாக இருக்கிறது. 'இது ஒரு அற்புதமான கண்டுபிடிப்பு!' என்று அவர் பூமியில் உள்ள கட்டுப்பாட்டு அறைக்கு சொல்கிறார். அதை வீட்டிற்கு கொண்டு வருவதற்கு அவர்கள் கல்லை பேக் செய்கிறார்கள்.",
        character: "🪨",
        keywords: [
          { word: "discovery", meaning: "Finding something new", word_ta: "கண்டுபிடிப்பு", meaning_ta: "புதிதாக ஒன்றைக் கண்டுபிடிப்பது" },
          { word: "space suit", meaning: "Clothing worn in space", word_ta: "விண்வெளி உடை", meaning_ta: "விண்வெளியில் அணியும் ஆடை" }
        ],
      }
    ],
    questions: [
      { question: "Who is the astronaut?", question_ta: "விண்வெளி வீரர் யார்?", options: ["Rohan", "Aryan", "John", "Ali"], options_ta: ["ரோஹன்", "ஆர்யன்", "ஜான்", "அலி"], answer: "Aryan", answer_ta: "ஆர்யன்" },
      { question: "What is the name of the robot?", question_ta: "ரோபோவின் பெயர் என்ன?", options: ["Robo-1", "Rover-X", "Wall-E", "Max"], options_ta: ["ரோபோ-1", "ரோவர்-எக்ஸ்", "வால்-ஈ", "மேக்ஸ்"], answer: "Rover-X", answer_ta: "ரோவர்-எக்ஸ்" },
      { question: "Which planet are they exploring?", question_ta: "அவர்கள் எந்த கிரகத்தை ஆராய்கிறார்கள்?", options: ["Venus", "Jupiter", "Mars", "Saturn"], options_ta: ["வெள்ளி", "வியாழன்", "செவ்வாய்", "சனி"], answer: "Mars", answer_ta: "செவ்வாய்" },
      { question: "What color is Mars?", question_ta: "செவ்வாய் கிரகம் என்ன நிறம்?", options: ["Blue", "Green", "Red", "Yellow"], options_ta: ["நீலம்", "பச்சை", "சிவப்பு", "மஞ்சள்"], answer: "Red", answer_ta: "சிவப்பு" },
      { question: "What did Rover-X find?", question_ta: "ரோவர்-எக்ஸ் எதைக் கண்டுபிடித்தது?", options: ["A diamond", "A spaceship", "A glowing blue stone", "Water"], options_ta: ["ஒரு வைரம்", "ஒரு விண்கலம்", "ஒரு ஒளிரும் நீலக் கல்", "தண்ணீர்"], answer: "A glowing blue stone", answer_ta: "ஒரு ஒளிரும் நீலக் கல்" },
      { question: "Where was the stone hidden?", question_ta: "கல் எங்கு மறைக்கப்பட்டிருந்தது?", options: ["Under sand", "Under a rock", "In a cave", "On a mountain"], options_ta: ["மணலுக்கு அடியில்", "ஒரு பாறையின் கீழ்", "ஒரு குகையில்", "ஒரு மலையில்"], answer: "Under a rock", answer_ta: "ஒரு பாறையின் கீழ்" },
      { question: "How did Aryan pick up the stone?", question_ta: "ஆர்யன் கல்லை எப்படி எடுத்தார்?", options: ["With a machine", "With a stick", "With his gloves", "With his bare hands"], options_ta: ["ஒரு இயந்திரம் மூலம்", "ஒரு குச்சி மூலம்", "கையுறைகளைப் பயன்படுத்தி", "வெறும் கைகளால்"], answer: "With his gloves", answer_ta: "கையுறைகளைப் பயன்படுத்தி" },
      { question: "How did the stone feel to the touch?", question_ta: "கல் தொடுவதற்கு எப்படி இருந்தது?", options: ["Cold", "Warm", "Hot", "Sharp"], options_ta: ["குளிர்ச்சியாக", "கதகதப்பாக", "மிகவும் சூடாக", "கூர்மையாக"], answer: "Warm", answer_ta: "கதகதப்பாக" },
      { question: "Who did Aryan talk to?", question_ta: "ஆர்யன் யாரிடம் பேசினார்?", options: ["His family", "Mission Control", "The robot", "Aliens"], options_ta: ["அவரது குடும்பத்தினரிடம்", "கட்டுப்பாட்டு அறையுடன்", "ரோபோவிடம்", "வேற்று கிரகவாசிகளிடம்"], answer: "Mission Control", answer_ta: "கட்டுப்பாட்டு அறையுடன்" },
      { question: "What are they going to do with the stone?", question_ta: "கல்லை வைத்து அவர்கள் என்ன செய்யப் போகிறார்கள்?", options: ["Throw it away", "Leave it there", "Eat it", "Bring it home"], options_ta: ["தூக்கி எறியப் போகிறார்கள்", "அங்கேயே விட்டுவிடப் போகிறார்கள்", "சாப்பிடப் போகிறார்கள்", "வீட்டிற்கு கொண்டு வருதல்"], answer: "Bring it home", answer_ta: "வீட்டிற்கு கொண்டு வருதல்" }
    ]
  },

  // ── GENERAL (Class 6-8) ──
  {
    id: "story_ancient_library",
    subject: "General",
    title: "The Ancient Library",
    title_ta: "பழங்கால நூலகம்",
    emoji: "🏺",
    classRange: [6, 8],
    xpReward: 30,
    pages: [
      {
        text: "Dr. Meera, a renowned archaeologist, discovers a hidden door underneath the Pyramids of Giza. She uses her flashlight to illuminate a massive underground library. The shelves are filled with dusty scrolls written in ancient Egyptian hieroglyphs.",
        text_ta: "பிரபல தொல்பொருள் ஆராய்ச்சியாளர் டாக்டர் மீரா, கிசா பிரமிடுகளுக்கு அடியில் மறைக்கப்பட்ட ஒரு கதவைக் கண்டுபிடித்தார். அவர் தனது ஒளிரும் விளக்கைப் பயன்படுத்தி ஒரு பெரிய நிலத்தடி நூலகத்தை ஒளிரச் செய்கிறார். அலமாரிகளில் பண்டைய எகிப்திய ஹைரோகிளிஃப்ஸில் எழுதப்பட்ட தூசின் சுருள்கள் நிறைந்துள்ளன.",
        character: "🔦",
        keywords: [
          { word: "archaeologist", meaning: "A person who studies human history by digging up artifacts", word_ta: "தொல்பொருள் ஆராய்ச்சியாளர்", meaning_ta: "வரலாற்றை அகழ்வாராய்ச்சி மூலம் படிக்கும் நபர்" },
          { word: "illuminate", meaning: "To light up", word_ta: "ஒளிரச் செய்தல்", meaning_ta: "வெளிச்சம் கொடுத்தல்" }
        ],
        thinkMoment: {
          question: "Where did she find the hidden door?",
          question_ta: "மறைக்கப்பட்ட கதவை அவள் எங்கே கண்டுபிடித்தாள்?",
          options: [
            { label: "Under the Pyramids", label_ta: "பிரமிடுகளுக்கு அடியில்", isCorrect: true, feedback: "Correct! She found it at the Pyramids of Giza.", feedback_ta: "சரி! அவள் அதை கிசா பிரமிடுகளுக்கு அடியில் கண்டுபிடித்தாள்." },
            { label: "In the desert", label_ta: "பாலைவனத்தில்", isCorrect: false, feedback: "It's near the desert, but specifically under the Pyramids.", feedback_ta: "இது பாலைவனத்திற்கு அருகில் உள்ளது, ஆனால் குறிப்பாக பிரமிடுகளுக்கு அடியில்." }
          ]
        }
      },
      {
        text: "She unrolls the oldest scroll she can find. To her amazement, it describes a machine that can purify salt water from the ocean into fresh drinking water. If translated correctly, this ancient knowledge could solve modern water shortages worldwide.",
        text_ta: "அவள் கண்டுபிடிக்கக்கூடிய பழமையான சுருளை விரித்தாள். அவளுக்கு ஆச்சரியமாக, சமுத்திரத்திலிருந்து உப்பு நீரை சுத்திகரித்து குடிநீராக மாற்றக்கூடிய ஒரு இயந்திரத்தை இது விவரிக்கிறது. சரியாக மொழிபெயர்க்கப்பட்டால், இந்த பழங்கால அறிவு உலகெங்கிலும் உள்ள நவீன நீர் பற்றாக்குறையை தீர்க்கும்.",
        character: "📜",
        keywords: [
          { word: "purify", meaning: "To remove dirty or harmful substances", word_ta: "சுத்திகரித்தல்", meaning_ta: "அழுக்கு அல்லது தீங்கு விளைவிக்கும் பொருட்களை அகற்றுதல்" },
          { word: "shortage", meaning: "A state in which there is not enough of something", word_ta: "பற்றாக்குறை", meaning_ta: "போதிய அளவு இல்லாத நிலை" }
        ],
      }
    ],
    questions: [
      { question: "Who is Dr. Meera?", question_ta: "டாக்டர் மீரா யார்?", options: ["A doctor", "An archaeologist", "A teacher", "A pilot"], options_ta: ["ஒரு மருத்துவர்", "ஒரு தொல்பொருள் ஆராய்ச்சியாளர்", "ஒரு ஆசிரியர்", "ஒரு பைலட்"], answer: "An archaeologist", answer_ta: "ஒரு தொல்பொருள் ஆராய்ச்சியாளர்" },
      { question: "Where did she find the hidden door?", question_ta: "மறைக்கப்பட்ட கதவை அவள் எங்கே கண்டுபிடித்தாள்?", options: ["In a cave", "Under the sea", "Under the Pyramids", "In a forest"], options_ta: ["ஒரு குகையில்", "கடலுக்கடியில்", "பிரமிடுகளுக்கு அடியில்", "ஒரு காட்டில்"], answer: "Under the Pyramids", answer_ta: "பிரமிடுகளுக்கு அடியில்" },
      { question: "Which pyramids was she exploring?", question_ta: "எந்த பிரமிடுகளை அவள் ஆராய்ந்து வந்தாள்?", options: ["Maya Pyramids", "Pyramids of Giza", "Aztec Pyramids", "Sudan Pyramids"], options_ta: ["மாயா பிரமிடுகள்", "கிசா பிரமிடுகள்", "ஆஸ்டெக் பிரமிடுகள்", "சூடான் பிரமிடுகள்"], answer: "Pyramids of Giza", answer_ta: "கிசா பிரமிடுகள்" },
      { question: "What tool did she use for light?", question_ta: "வெளிச்சத்திற்காக என்ன கருவியை பயன்படுத்தினாள்?", options: ["A candle", "A match", "A lantern", "A flashlight"], options_ta: ["ஒரு மெழுகுவர்த்தி", "ஒரு தீக்குச்சி", "ஒரு லாந்தர்", "ஒரு ஒளிரும் விளக்கு"], answer: "A flashlight", answer_ta: "ஒரு ஒளிரும் விளக்கு" },
      { question: "What was inside the underground room?", question_ta: "நிலத்தடி அறைக்குள் என்ன இருந்தது?", options: ["Gold coins", "A sleeping mummy", "A massive library", "Empty boxes"], options_ta: ["தங்க நாணயங்கள்", "தூங்கும் மம்மி", "ஒரு பெரிய நூலகம்", "காலி பெட்டிகள்"], answer: "A massive library", answer_ta: "ஒரு பெரிய நூலகம்" },
      { question: "What were the scrolls written in?", question_ta: "சுருள்கள் எதில் எழுதப்பட்டிருந்தன?", options: ["Hieroglyphs", "English", "Sanskrit", "Latin"], options_ta: ["ஹைரோகிளிஃப்ஸ்", "ஆங்கிலம்", "சமஸ்கிருதம்", "லத்தீன்"], answer: "Hieroglyphs", answer_ta: "ஹைரோகிளிஃப்ஸ்" },
      { question: "Which scroll did she unroll first?", question_ta: "அவள் முதலில் எந்த சுருளை விரித்தாள்?", options: ["The newest one", "The shiny one", "The oldest one", "The biggest one"], options_ta: ["புதியது", "பளபளப்பான ஒன்று", "மிகப் பழமையானது", "மிகப் பெரியது"], answer: "The oldest one", answer_ta: "மிகப் பழமையானது" },
      { question: "What did the machine described in the scroll do?", question_ta: "சுருளில் விவரிக்கப்பட்டுள்ள இயந்திரம் என்ன செய்தது?", options: ["Make gold", "Fly", "Purify salt water", "Travel in time"], options_ta: ["தங்கம் செய்வது", "பறப்பது", "உப்பு நீரை சுத்திகரித்தது", "நேரப்பயணம் செய்வது"], answer: "Purify salt water", answer_ta: "உப்பு நீரை சுத்திகரித்தது" },
      { question: "Where would the salt water come from?", question_ta: "உப்பு நீர் எங்கிருந்து வரும்?", options: ["A river", "The ocean", "A lake", "Rain"], options_ta: ["ஒரு ஆறு", "கடலில் இருந்து", "ஒரு ஏரி", "மழை"], answer: "The ocean", answer_ta: "கடலில் இருந்து" },
      { question: "What modern problem could this solve?", question_ta: "இது எந்த நவீன பிரச்சனையை தீர்க்க முடியும்?", options: ["Global warming", "Air pollution", "Water shortages", "Traffic"], options_ta: ["புவி வெப்பமடைதல்", "காற்று மாசுபாடு", "நீர் பற்றாக்குறை", "போக்குவரத்து நெரிசல்"], answer: "Water shortages", answer_ta: "நீர் பற்றாக்குறை" }
    ]
  },

  // ── MATH (Classes 1-3) ──
  {
    id: "math_counting_animals",
    subject: "Math",
    title: "Counting at the Farm",
    title_ta: "பண்ணையில் எண்ணுதல்",
    emoji: "🐔",
    classRange: [1, 3],
    xpReward: 15,
    pages: [
      {
        text: "Priya visits Grandpa's farm! She sees 3 hens, 2 cows, and 4 goats. \"Can you count all the animals?\" asks Grandpa with a smile. Priya starts counting on her fingers: 1, 2, 3... hens! Then 4, 5... cows! Then 6, 7, 8, 9... goats!",
        text_ta: "பிரியா தாத்தாவின் பண்ணைக்கு செல்கிறாள்! அவள் 3 கோழிகள், 2 மாடுகள், 4 ஆடுகளைப் பார்க்கிறாள். \"எல்லா விலங்குகளையும் எண்ண முடியுமா?\" என்று தாத்தா சிரித்தபடி கேட்கிறார்.",
        character: "👧",
        keywords: [
          { word: "count", meaning: "To find how many there are", word_ta: "எண்ணு", meaning_ta: "எத்தனை இருக்கிறது என்று கண்டுபிடிப்பது" },
          { word: "total", meaning: "Everything added together", word_ta: "மொத்தம்", meaning_ta: "எல்லாவற்றையும் சேர்த்தது" },
        ],
      },
      {
        text: "\"Very good!\" says Grandpa. \"Now, 1 hen laid 2 eggs. How many eggs did 3 hens lay?\" Priya thinks... 2 + 2 + 2 = 6 eggs! 🥚🥚🥚🥚🥚🥚 \"You are a math star!\" Grandpa gives her a big hug.",
        text_ta: "\"மிகவும் நல்லது!\" என்கிறார் தாத்தா. \"இப்போது, 1 கோழி 2 முட்டைகள் இட்டது. 3 கோழிகள் எத்தனை முட்டைகள் இட்டன?\" பிரியா யோசிக்கிறாள்... 2 + 2 + 2 = 6 முட்டைகள்!",
        character: "👴",
        keywords: [
          { word: "addition", meaning: "Putting numbers together to get more", word_ta: "கூட்டல்", meaning_ta: "எண்களை சேர்த்து அதிகமாக பெறுவது" },
        ],
        thinkMoment: {
          question: "3 hens each laid 2 eggs. How many eggs total?",
          question_ta: "3 கோழிகள் ஒவ்வொன்றும் 2 முட்டைகள் இட்டன. மொத்தம் எத்தனை முட்டைகள்?",
          options: [
            { label: "6 eggs", label_ta: "6 முட்டைகள்", isCorrect: true, feedback: "Great job! 2 + 2 + 2 = 6 🎉", feedback_ta: "மிகவும் நல்லது! 2 + 2 + 2 = 6 🎉" },
            { label: "5 eggs", label_ta: "5 முட்டைகள்", isCorrect: false, feedback: "Try again! Each hen lays 2 eggs.", feedback_ta: "மீண்டும் முயற்சி! ஒவ்வொரு கோழியும் 2 முட்டைகள் இடுகிறது." },
            { label: "3 eggs", label_ta: "3 முட்டைகள்", isCorrect: false, feedback: "That's the number of hens, not eggs!", feedback_ta: "அது கோழிகளின் எண்ணிக்கை, முட்டைகள் அல்ல!" },
          ],
        },
      },
    ],
    questions: [
      { question: "How many hens does Grandpa have?", question_ta: "தாத்தாவிடம் எத்தனை கோழிகள் உள்ளன?", options: ["2", "3", "4", "5"], options_ta: ["2", "3", "4", "5"], answer: "3", answer_ta: "3" },
      { question: "How many animals are there in total?", question_ta: "மொத்தம் எத்தனை விலங்குகள் உள்ளன?", options: ["7", "8", "9", "10"], options_ta: ["7", "8", "9", "10"], answer: "9", answer_ta: "9" },
      { question: "How many eggs did 3 hens lay?", question_ta: "3 கோழிகள் எத்தனை முட்டைகள் இட்டன?", options: ["3", "4", "6", "8"], options_ta: ["3", "4", "6", "8"], answer: "6", answer_ta: "6" },
    ],
  },

  // ── MATH (Classes 3-6) ──
  {
    id: "math_fraction_pizza",
    subject: "Math",
    title: "The Fraction Pizza Mission",
    title_ta: "பின்னம் பீட்சா சவால்",
    emoji: "🍕",
    classRange: [3, 6],
    xpReward: 25,
    pages: [
      {
        text: "Arjun and Meena ordered a pizza for 4 friends. The shop gave them: ½ cheese pizza, ¼ corn pizza, and ¼ mushroom pizza. \"This looks delicious!\" said Arjun. But just then, Meena's phone rang...",
        text_ta: "அர்ஜுனும் மீனாவும் 4 நண்பர்களுக்கு பீட்சா ஆர்டர் செய்தனர். கடை கொடுத்தது: ½ பாலாடைக்கட்டி பீட்சா, ¼ சோள பீட்சா, ¼ காளான் பீட்சா.",
        character: "🧑‍🍳",
        keywords: [
          { word: "fraction", meaning: "A part of a whole", word_ta: "பின்னம்", meaning_ta: "ஒரு முழுமையின் ஒரு பகுதி" },
          { word: "½", meaning: "One half - 1 out of 2 equal parts", word_ta: "½", meaning_ta: "ஒரு அரை - 2 சம பாகங்களில் 1" },
        ],
      },
      {
        text: "\"Ravi can't come,\" said Meena sadly. Now there are only 3 friends. They need to share the whole pizza equally among 3 people. Arjun scratched his head. \"How do we divide this fairly?\"",
        text_ta: "\"ரவி வர முடியாது,\" என்று மீனா சோகமாக சொன்னாள். இப்போது 3 நண்பர்கள் மட்டுமே. அவர்கள் முழு பீட்சாவையும் 3 பேருக்கு சமமாக பிரிக்க வேண்டும்.",
        character: "🤔",
        keywords: [
          { word: "equally", meaning: "Same amount for everyone", word_ta: "சமமாக", meaning_ta: "அனைவருக்கும் ஒரே அளவு" },
        ],
        thinkMoment: {
          question: "What should Arjun do to divide the pizza fairly?",
          question_ta: "பீட்சாவை நியாயமாக பிரிக்க அர்ஜுன் என்ன செய்ய வேண்டும்?",
          options: [
            { label: "Cut each piece into 3 equal parts", label_ta: "ஒவ்வொரு துண்டையும் 3 சம பாகங்களாக வெட்டுங்கள்", isCorrect: true, feedback: "Correct! Each person gets ⅓ of the pizza.", feedback_ta: "சரி! ஒவ்வொருவருக்கும் பீட்சாவின் ⅓ கிடைக்கும்." },
            { label: "Give the biggest piece to himself", label_ta: "மிகப்பெரிய துண்டை தனக்கே கொடுங்கள்", isCorrect: false, feedback: "That's not fair! Everyone should get equal shares.", feedback_ta: "அது நியாயமில்லை! அனைவருக்கும் சம பங்கு கிடைக்க வேண்டும்." },
            { label: "Order another pizza", label_ta: "இன்னொரு பீட்சா ஆர்டர் செய்யுங்கள்", isCorrect: false, feedback: "That wastes money! They can share what they have.", feedback_ta: "அது பணத்தை வீணாக்குகிறது!" },
          ],
        },
      },
    ],
    questions: [
      { question: "How many friends are sharing the pizza now?", question_ta: "இப்போது எத்தனை நண்பர்கள் பீட்சாவை பகிர்ந்து கொள்கிறார்கள்?", options: ["2", "3", "4", "5"], options_ta: ["2", "3", "4", "5"], answer: "3", answer_ta: "3" },
      { question: "What fraction does each friend get?", question_ta: "ஒவ்வொரு நண்பருக்கும் எந்த பின்னம் கிடைக்கும்?", options: ["¼", "⅓", "½", "⅕"], options_ta: ["¼", "⅓", "½", "⅕"], answer: "⅓", answer_ta: "⅓" },
      { question: "Which part of the pizza is the biggest?", question_ta: "பீட்சாவின் எந்த பகுதி மிகப்பெரியது?", options: ["¼ corn", "¼ mushroom", "½ cheese", "All are equal"], options_ta: ["¼ சோளம்", "¼ காளான்", "½ பாலாடைக்கட்டி", "எல்லாம் சமம்"], answer: "½ cheese", answer_ta: "½ பாலாடைக்கட்டி" },
    ],
  },

  // ── MATH (Classes 6-8) ──
  {
    id: "math_percentage_shop",
    subject: "Math",
    title: "The Discount Detective",
    title_ta: "தள்ளுபடி துப்பறிவாளர்",
    emoji: "🏷️",
    classRange: [6, 8],
    xpReward: 35,
    pages: [
      {
        text: "Kavi wants to buy a cricket bat that costs ₹800. The shop has a sign: \"20% OFF on all sports items!\" Kavi wonders, \"How much will I actually pay?\" His friend Deepa says, \"Let me help! 20% of 800 means 20/100 × 800 = ₹160 discount.\"",
        text_ta: "கவி ₹800 விலையுள்ள கிரிக்கெட் மட்டை வாங்க விரும்புகிறான். கடையில் ஒரு அறிவிப்பு: \"அனைத்து விளையாட்டுப் பொருட்களுக்கும் 20% தள்ளுபடி!\"",
        character: "🏏",
        keywords: [
          { word: "percentage", meaning: "A number out of 100, shown with % sign", word_ta: "சதவீதம்", meaning_ta: "100-ல் ஒரு எண், % குறியீட்டுடன் காட்டப்படுகிறது" },
          { word: "discount", meaning: "Amount reduced from the original price", word_ta: "தள்ளுபடி", meaning_ta: "அசல் விலையிலிருந்து குறைக்கப்படும் தொகை" },
        ],
      },
      {
        text: "\"So I pay ₹800 - ₹160 = ₹640!\" says Kavi happily. But wait — the shopkeeper says, \"We also have an extra 10% off if you buy two items!\" Kavi also wants gloves for ₹200. Two items total = ₹640 + ₹200 = ₹840. Extra 10% off = ₹84. Final price = ₹756! \"Understanding percentages saves money!\" grins Kavi.",
        text_ta: "\"அப்போது நான் ₹800 - ₹160 = ₹640 செலுத்துவேன்!\" என்று கவி மகிழ்ச்சியாக சொல்கிறான். ஆனால் கடைக்காரர் சொல்கிறார், \"இரண்டு பொருட்கள் வாங்கினால் மேலும் 10% தள்ளுபடி!\"",
        character: "💰",
        keywords: [
          { word: "successive discount", meaning: "One discount applied after another", word_ta: "தொடர் தள்ளுபடி", meaning_ta: "ஒன்றன் பின் ஒன்றாக பயன்படுத்தப்படும் தள்ளுபடி" },
        ],
        thinkMoment: {
          question: "What is 20% of ₹800?",
          question_ta: "₹800-ன் 20% என்ன?",
          options: [
            { label: "₹160", label_ta: "₹160", isCorrect: true, feedback: "Correct! 20/100 × 800 = 160 💯", feedback_ta: "சரி! 20/100 × 800 = 160 💯" },
            { label: "₹200", label_ta: "₹200", isCorrect: false, feedback: "That would be 25%, not 20%.", feedback_ta: "அது 25%, 20% அல்ல." },
            { label: "₹80", label_ta: "₹80", isCorrect: false, feedback: "That would be 10% of 800.", feedback_ta: "அது 800-ன் 10%." },
          ],
        },
      },
    ],
    questions: [
      { question: "What is the original price of the bat?", question_ta: "மட்டையின் அசல் விலை என்ன?", options: ["₹600", "₹700", "₹800", "₹900"], options_ta: ["₹600", "₹700", "₹800", "₹900"], answer: "₹800", answer_ta: "₹800" },
      { question: "How much discount on the bat?", question_ta: "மட்டைக்கு எவ்வளவு தள்ளுபடி?", options: ["₹80", "₹120", "₹160", "₹200"], options_ta: ["₹80", "₹120", "₹160", "₹200"], answer: "₹160", answer_ta: "₹160" },
      { question: "What does 'percentage' mean?", question_ta: "'சதவீதம்' என்பதன் பொருள் என்ன?", options: ["A big number", "A number out of 100", "A fraction of 10", "A decimal point"], options_ta: ["ஒரு பெரிய எண்", "100-ல் ஒரு எண்", "10-ன் பின்னம்", "ஒரு தசம புள்ளி"], answer: "A number out of 100", answer_ta: "100-ல் ஒரு எண்" },
    ],
  },

  // ── SCIENCE (Classes 1-3) ──
  {
    id: "science_plant_seed",
    subject: "Science",
    title: "Tiny Seed's Big Journey",
    title_ta: "சிறிய விதையின் பெரிய பயணம்",
    emoji: "🌱",
    classRange: [1, 3],
    xpReward: 15,
    pages: [
      {
        text: "Meet Tiny — a small seed buried in the soil! ☀️ The sun shines warm light. 🌧️ The rain gives water. Tiny starts to grow! First, a little root goes DOWN into the soil. Then a tiny green shoot pushes UP towards the sun. \"I'm growing!\" cheers Tiny.",
        text_ta: "டைனியை சந்தியுங்கள் — மண்ணில் புதைக்கப்பட்ட ஒரு சிறிய விதை! ☀️ சூரியன் சூடான ஒளியை தருகிறது. 🌧️ மழை நீரை தருகிறது. டைனி வளரத் தொடங்குகிறது!",
        character: "🌱",
        keywords: [
          { word: "seed", meaning: "A tiny thing that grows into a plant", word_ta: "விதை", meaning_ta: "செடியாக வளரும் ஒரு சிறிய பொருள்" },
          { word: "root", meaning: "Part of the plant that goes into the ground", word_ta: "வேர்", meaning_ta: "மண்ணுக்குள் செல்லும் செடியின் பகுதி" },
        ],
      },
      {
        text: "Weeks pass. Tiny grows leaves 🍃 that catch sunlight. Then beautiful flowers 🌸 bloom! Bees come to visit. Soon the flowers turn into fruits 🍎 with new seeds inside! \"My babies will grow into new plants!\" says Tiny proudly. The circle of life continues!",
        text_ta: "வாரங்கள் கடக்கின்றன. டைனிக்கு இலைகள் 🍃 வளர்கின்றன. பிறகு அழகான பூக்கள் 🌸 பூக்கின்றன! விரைவில் பூக்கள் பழங்களாக 🍎 மாறுகின்றன!",
        character: "🌳",
        keywords: [
          { word: "leaves", meaning: "Green flat parts of a plant", word_ta: "இலைகள்", meaning_ta: "செடியின் பச்சை தட்டையான பகுதிகள்" },
        ],
        thinkMoment: {
          question: "What does a seed need to grow?",
          question_ta: "ஒரு விதை வளர என்ன தேவை?",
          options: [
            { label: "Water and sunlight", label_ta: "நீரும் சூரிய ஒளியும்", isCorrect: true, feedback: "Yes! Plants need water and sunlight to grow! 🌞", feedback_ta: "ஆம்! செடிகள் வளர நீரும் சூரிய ஒளியும் தேவை! 🌞" },
            { label: "Candy and toys", label_ta: "மிட்டாய் மற்றும் பொம்மைகள்", isCorrect: false, feedback: "Haha! Plants don't eat candy! They need water.", feedback_ta: "ஹாஹா! செடிகள் மிட்டாய் சாப்பிடாது!" },
            { label: "Only soil", label_ta: "மண் மட்டும்", isCorrect: false, feedback: "Soil helps, but plants also need water and light!", feedback_ta: "மண் உதவுகிறது, ஆனால் நீரும் ஒளியும் தேவை!" },
          ],
        },
      },
    ],
    questions: [
      { question: "What grows first from a seed?", question_ta: "விதையிலிருந்து முதலில் என்ன வளர்கிறது?", options: ["Flower", "Fruit", "Root", "Leaf"], options_ta: ["பூ", "பழம்", "வேர்", "இலை"], answer: "Root", answer_ta: "வேர்" },
      { question: "What do plants need to grow?", question_ta: "செடிகள் வளர என்ன தேவை?", options: ["Only water", "Only sun", "Water and sunlight", "Nothing"], options_ta: ["நீர் மட்டும்", "சூரியன் மட்டும்", "நீரும் சூரிய ஒளியும்", "எதுவும் இல்லை"], answer: "Water and sunlight", answer_ta: "நீரும் சூரிய ஒளியும்" },
      { question: "What comes after flowers?", question_ta: "பூக்களுக்குப் பிறகு என்ன வருகிறது?", options: ["More seeds", "Fruits", "Roots", "Leaves"], options_ta: ["மேலும் விதைகள்", "பழங்கள்", "வேர்கள்", "இலைகள்"], answer: "Fruits", answer_ta: "பழங்கள்" },
    ],
  },

  // ── SCIENCE (Classes 4-7) ──
  {
    id: "science_body_journey",
    subject: "Science",
    title: "Journey Inside the Human Body",
    title_ta: "மனித உடலுக்குள் பயணம்",
    emoji: "🫀",
    classRange: [4, 7],
    xpReward: 30,
    pages: [
      {
        text: "Meet Nano, a tiny robot sent inside a human body to learn how it works! Nano enters through the nose and rides on an oxygen molecule. \"Wheee!\" Nano zooms down through the windpipe into the lungs. The lungs are like two giant sponges, full of tiny air sacs called alveoli.",
        text_ta: "நானோவை சந்தியுங்கள், மனித உடல் எப்படி செயல்படுகிறது என்பதை கற்க உள்ளே அனுப்பப்பட்ட ஒரு சிறிய ரோபோ!",
        character: "🤖",
        keywords: [
          { word: "alveoli", meaning: "Tiny air sacs in the lungs where oxygen enters the blood", word_ta: "அல்வியோலி", meaning_ta: "நுரையீரலில் உள்ள சிறிய காற்றுப்பைகள்" },
          { word: "oxygen", meaning: "A gas we breathe to stay alive", word_ta: "ஆக்சிஜன்", meaning_ta: "நாம் உயிர்வாழ சுவாசிக்கும் வாயு" },
        ],
      },
      {
        text: "From the lungs, Nano jumps onto a red blood cell! It travels through blood vessels to reach the heart. THUMP! THUMP! The heart pumps blood to every part of the body. \"The heart is like a powerful engine!\" says Nano. The heart has 4 chambers and beats about 100,000 times a day!",
        text_ta: "நுரையீரலில் இருந்து, நானோ ஒரு சிவப்பு இரத்த அணுவின் மீது குதிக்கிறது! இதயம் உடலின் ஒவ்வொரு பகுதிக்கும் இரத்தத்தை பம்ப் செய்கிறது.",
        character: "🫀",
        keywords: [
          { word: "red blood cell", meaning: "Carries oxygen around the body", word_ta: "சிவப்பு இரத்த அணு", meaning_ta: "உடல் முழுவதும் ஆக்சிஜனை எடுத்துச் செல்கிறது" },
          { word: "chambers", meaning: "Rooms inside the heart", word_ta: "அறைகள்", meaning_ta: "இதயத்தின் உள்ளே உள்ள அறைகள்" },
        ],
        thinkMoment: {
          question: "Where should Nano go next to deliver oxygen?",
          question_ta: "ஆக்சிஜனை வழங்க நானோ அடுத்து எங்கே செல்ல வேண்டும்?",
          options: [
            { label: "To the muscles through arteries", label_ta: "தமனிகள் வழியாக தசைகளுக்கு", isCorrect: true, feedback: "Yes! Arteries carry oxygen-rich blood to muscles and organs.", feedback_ta: "ஆம்! தமனிகள் ஆக்சிஜன் நிறைந்த இரத்தத்தை எடுத்துச் செல்கின்றன." },
            { label: "Back to the nose", label_ta: "மீண்டும் மூக்குக்கு", isCorrect: false, feedback: "Not yet! The oxygen needs to reach the body's cells first.", feedback_ta: "இன்னும் இல்லை! ஆக்சிஜன் முதலில் செல்களை அடைய வேண்டும்." },
            { label: "To the stomach", label_ta: "வயிற்றுக்கு", isCorrect: false, feedback: "The stomach handles food, not oxygen delivery!", feedback_ta: "வயிறு உணவை கையாளுகிறது, ஆக்சிஜனை அல்ல!" },
          ],
        },
      },
    ],
    questions: [
      { question: "Where does oxygen enter the blood?", question_ta: "ஆக்சிஜன் எங்கே இரத்தத்தில் நுழைகிறது?", options: ["Heart", "Lungs", "Stomach", "Brain"], options_ta: ["இதயம்", "நுரையீரல்", "வயிறு", "மூளை"], answer: "Lungs", answer_ta: "நுரையீரல்" },
      { question: "Which organ pumps blood?", question_ta: "எந்த உறுப்பு இரத்தத்தை பம்ப் செய்கிறது?", options: ["Lungs", "Brain", "Heart", "Liver"], options_ta: ["நுரையீரல்", "மூளை", "இதயம்", "கல்லீரல்"], answer: "Heart", answer_ta: "இதயம்" },
      { question: "How many chambers does the heart have?", question_ta: "இதயத்தில் எத்தனை அறைகள் உள்ளன?", options: ["2", "3", "4", "5"], options_ta: ["2", "3", "4", "5"], answer: "4", answer_ta: "4" },
    ],
  },

  // ── SCIENCE (Classes 6-8) ──
  {
    id: "science_atoms_adventure",
    subject: "Science",
    title: "The Atom Explorers",
    title_ta: "அணு ஆய்வாளர்கள்",
    emoji: "⚛️",
    classRange: [6, 8],
    xpReward: 35,
    pages: [
      {
        text: "Dr. Maya shrinks her students to the size of an atom! \"Welcome to the atomic world!\" Everything is made of atoms. An atom has 3 parts: protons (+) and neutrons in the centre called the NUCLEUS, and tiny electrons (-) spinning around it like planets around the sun.",
        text_ta: "டாக்டர் மாயா தன் மாணவர்களை ஒரு அணுவின் அளவுக்கு சுருக்குகிறார்! எல்லாமே அணுக்களால் ஆனவை. ஒரு அணுவில் 3 பகுதிகள் உள்ளன: புரோட்டான்கள், நியூட்ரான்கள், எலக்ட்ரான்கள்.",
        character: "👩‍🔬",
        keywords: [
          { word: "atom", meaning: "The smallest unit of matter", word_ta: "அணு", meaning_ta: "பொருளின் மிகச்சிறிய அலகு" },
          { word: "nucleus", meaning: "The centre of an atom with protons and neutrons", word_ta: "உட்கரு", meaning_ta: "புரோட்டான்கள் மற்றும் நியூட்ரான்கள் உள்ள அணுவின் மையம்" },
          { word: "electron", meaning: "A tiny negative particle spinning around the nucleus", word_ta: "எலக்ட்ரான்", meaning_ta: "உட்கருவைச் சுற்றி வரும் எதிர்மறை துகள்" },
        ],
      },
      {
        text: "\"Look!\" says Dr. Maya. \"A hydrogen atom has 1 proton and 1 electron. An oxygen atom has 8 of each. When 2 hydrogen atoms bond with 1 oxygen atom, they make H₂O — WATER!\" 💧 \"So chemistry is just atoms making friends!\" laughs a student.",
        text_ta: "\"பாருங்கள்!\" என்கிறார் டாக்டர் மாயா. \"2 ஹைட்ரஜன் அணுக்கள் 1 ஆக்சிஜன் அணுவுடன் இணையும்போது, H₂O — நீர் உருவாகிறது!\" 💧",
        character: "⚛️",
        keywords: [
          { word: "H₂O", meaning: "The chemical formula for water — 2 hydrogen + 1 oxygen", word_ta: "H₂O", meaning_ta: "நீரின் வேதியியல் சூத்திரம்" },
        ],
        thinkMoment: {
          question: "What are the 3 parts of an atom?",
          question_ta: "ஒரு அணுவின் 3 பகுதிகள் என்ன?",
          options: [
            { label: "Protons, Neutrons, Electrons", label_ta: "புரோட்டான்கள், நியூட்ரான்கள், எலக்ட்ரான்கள்", isCorrect: true, feedback: "Perfect! You know your atomic structure! ⚛️", feedback_ta: "சரியானது! உங்களுக்கு அணு அமைப்பு தெரியும்! ⚛️" },
            { label: "Cells, Organs, Tissues", label_ta: "செல்கள், உறுப்புகள், திசுக்கள்", isCorrect: false, feedback: "Those are parts of living things, not atoms!", feedback_ta: "அவை உயிரினங்களின் பகுதிகள், அணுக்கள் அல்ல!" },
            { label: "Solids, Liquids, Gases", label_ta: "திடப்பொருட்கள், திரவங்கள், வாயுக்கள்", isCorrect: false, feedback: "Those are states of matter, not parts of an atom.", feedback_ta: "அவை பொருளின் நிலைகள், அணுவின் பகுதிகள் அல்ல." },
          ],
        },
      },
    ],
    questions: [
      { question: "What is in the centre of an atom?", question_ta: "ஒரு அணுவின் மையத்தில் என்ன உள்ளது?", options: ["Electrons", "Nucleus", "Molecules", "Cells"], options_ta: ["எலக்ட்ரான்கள்", "உட்கரு", "மூலக்கூறுகள்", "செல்கள்"], answer: "Nucleus", answer_ta: "உட்கரு" },
      { question: "What is the formula for water?", question_ta: "நீரின் சூத்திரம் என்ன?", options: ["CO₂", "H₂O", "O₂", "NaCl"], options_ta: ["CO₂", "H₂O", "O₂", "NaCl"], answer: "H₂O", answer_ta: "H₂O" },
      { question: "How many protons does hydrogen have?", question_ta: "ஹைட்ரஜனில் எத்தனை புரோட்டான்கள் உள்ளன?", options: ["0", "1", "2", "8"], options_ta: ["0", "1", "2", "8"], answer: "1", answer_ta: "1" },
    ],
  },

  // ── SOCIAL SCIENCE (Classes 1-3) ──
  {
    id: "social_my_helpers",
    subject: "Social Science",
    title: "Our Community Helpers",
    title_ta: "நம் சமுதாய உதவியாளர்கள்",
    emoji: "👮",
    classRange: [1, 3],
    xpReward: 15,
    pages: [
      {
        text: "It's Monday morning! Ravi walks to school. He sees so many helpers! 👮 The police officer keeps everyone safe. 🚒 The firefighter puts out fires. 📮 The postman brings letters. 👩‍⚕️ The doctor makes sick people well. \"Thank you, helpers!\" waves Ravi.",
        text_ta: "திங்கள் காலை! ரவி பள்ளிக்கு நடக்கிறான். அவன் நிறைய உதவியாளர்களைப் பார்க்கிறான்! 👮 காவல்துறை, 🚒 தீயணைப்பு, 📮 தபால்காரர், 👩‍⚕️ மருத்துவர்.",
        character: "👦",
        keywords: [
          { word: "community", meaning: "People living and working together", word_ta: "சமுதாயம்", meaning_ta: "ஒன்றாக வாழ்ந்து வேலை செய்யும் மக்கள்" },
          { word: "helper", meaning: "Someone who helps others", word_ta: "உதவியாளர்", meaning_ta: "மற்றவர்களுக்கு உதவுபவர்" },
        ],
      },
      {
        text: "At school, 👩‍🏫 the teacher teaches Ravi to read and write. At lunch, 👨‍🍳 the cook makes yummy food. After school, 🚌 the bus driver takes everyone home safely. Ravi thinks, \"Everyone has an important job! I want to help people too when I grow up!\"",
        text_ta: "பள்ளியில், 👩‍🏫 ஆசிரியர் கற்பிக்கிறார். மதிய உணவில், 👨‍🍳 சமையல்காரர் சுவையான உணவு சமைக்கிறார். 🚌 பேருந்து ஓட்டுநர் பாதுகாப்பாக வீட்டிற்கு அழைத்துச் செல்கிறார்.",
        character: "🏫",
        keywords: [
          { word: "job", meaning: "Work that a person does", word_ta: "வேலை", meaning_ta: "ஒரு நபர் செய்யும் பணி" },
        ],
        thinkMoment: {
          question: "Who keeps us safe on the road?",
          question_ta: "சாலையில் நம்மை யார் பாதுகாப்பாக வைக்கிறார்?",
          options: [
            { label: "Police officer", label_ta: "காவல்துறை அதிகாரி", isCorrect: true, feedback: "Yes! Police officers keep our roads safe! 👮", feedback_ta: "ஆம்! காவல்துறை அதிகாரிகள் பாதுகாப்பாக வைக்கிறார்கள்! 👮" },
            { label: "Cook", label_ta: "சமையல்காரர்", isCorrect: false, feedback: "Cooks make food, not watch roads!", feedback_ta: "சமையல்காரர்கள் உணவு செய்கிறார்கள்!" },
            { label: "Postman", label_ta: "தபால்காரர்", isCorrect: false, feedback: "Postmen bring letters!", feedback_ta: "தபால்காரர்கள் கடிதங்களை கொண்டு வருகிறார்கள்!" },
          ],
        },
      },
    ],
    questions: [
      { question: "Who puts out fires?", question_ta: "யார் தீயை அணைக்கிறார்?", options: ["Doctor", "Firefighter", "Teacher", "Postman"], options_ta: ["மருத்துவர்", "தீயணைப்பு வீரர்", "ஆசிரியர்", "தபால்காரர்"], answer: "Firefighter", answer_ta: "தீயணைப்பு வீரர்" },
      { question: "Who teaches at school?", question_ta: "பள்ளியில் யார் கற்பிக்கிறார்?", options: ["Driver", "Cook", "Teacher", "Police"], options_ta: ["ஓட்டுநர்", "சமையல்காரர்", "ஆசிரியர்", "காவல்துறை"], answer: "Teacher", answer_ta: "ஆசிரியர்" },
      { question: "Who brings letters?", question_ta: "யார் கடிதங்களை கொண்டு வருகிறார்?", options: ["Postman", "Doctor", "Firefighter", "Cook"], options_ta: ["தபால்காரர்", "மருத்துவர்", "தீயணைப்பு வீரர்", "சமையல்காரர்"], answer: "Postman", answer_ta: "தபால்காரர்" },
    ],
  },

  // ── SOCIAL SCIENCE (Classes 4-8) ──
  {
    id: "social_indus_valley",
    subject: "Social Science",
    title: "Time Travel to the Indus Valley",
    title_ta: "சிந்து சமவெளிக்கு நேரப் பயணம்",
    emoji: "🏺",
    classRange: [4, 8],
    xpReward: 25,
    pages: [
      {
        text: "You step into a glowing time machine. WHOOSH! You land in 2500 BCE — the great Indus Valley Civilization! You see perfectly planned cities with straight roads. The houses are made of baked bricks, all the same size. There's even a Great Bath — the world's oldest swimming pool!",
        text_ta: "நீங்கள் ஒளிரும் நேர இயந்திரத்தில் ஏறுகிறீர்கள். வூஷ்! கி.மு. 2500-ல் இறங்குகிறீர்கள் — பெரிய சிந்து சமவெளி நாகரிகம்!",
        character: "🕰️",
        keywords: [
          { word: "Indus Valley", meaning: "An ancient civilization near the Indus River (modern Pakistan/India)", word_ta: "சிந்து சமவெளி", meaning_ta: "சிந்து நதி அருகில் ஒரு பண்டைய நாகரிகம்" },
          { word: "Great Bath", meaning: "A large public bathing pool in Mohenjo-daro", word_ta: "பெரிய குளியல்", meaning_ta: "மொஹெஞ்சோ-தாரோவில் உள்ள பெரிய பொது குளியல் குளம்" },
        ],
      },
      {
        text: "You walk through the streets and discover the most advanced drainage system of the ancient world! Every house has its own bathroom with drains that connect to covered main drains under the streets. A local potter shows you beautiful painted pots. \"We trade these with Mesopotamia!\" he says proudly.",
        text_ta: "நீங்கள் தெருக்களில் நடந்து பண்டைய உலகின் மிக மேம்பட்ட வடிகால் அமைப்பைக் கண்டுபிடிக்கிறீர்கள்!",
        character: "🏺",
        keywords: [
          { word: "drainage", meaning: "System of pipes/channels to carry away water", word_ta: "வடிகால்", meaning_ta: "நீரை வெளியேற்றும் குழாய்/கால்வாய் அமைப்பு" },
          { word: "Mesopotamia", meaning: "Another ancient civilization (modern Iraq)", word_ta: "மெசொப்பொத்தேமியா", meaning_ta: "மற்றொரு பண்டைய நாகரிகம் (நவீன ஈராக்)" },
        ],
        thinkMoment: {
          question: "Why were the roads in the Indus Valley straight?",
          question_ta: "சிந்து சமவெளியில் சாலைகள் ஏன் நேராக இருந்தன?",
          options: [
            { label: "They were carefully planned before building", label_ta: "கட்டுவதற்கு முன் கவனமாக திட்டமிடப்பட்டன", isCorrect: true, feedback: "Yes! The Indus people were master city planners.", feedback_ta: "ஆம்! சிந்து மக்கள் சிறந்த நகர திட்டமிடுபவர்கள்." },
            { label: "They only had straight rulers", label_ta: "அவர்களிடம் நேரான அளவுகோல்கள் மட்டுமே இருந்தன", isCorrect: false, feedback: "It was more about careful planning than just tools!", feedback_ta: "இது கருவிகளைவிட கவனமான திட்டமிடல் பற்றியது!" },
          ],
        },
      },
    ],
    questions: [
      { question: "Why were the roads in Indus Valley straight?", question_ta: "சிந்து சமவெளியில் சாலைகள் ஏன் நேராக இருந்தன?", options: ["By accident", "Careful city planning", "Rivers made them", "Foreign help"], options_ta: ["தற்செயலாக", "கவனமான நகர திட்டமிடல்", "ஆறுகள் அவற்றை உருவாக்கின", "வெளிநாட்டு உதவி"], answer: "Careful city planning", answer_ta: "கவனமான நகர திட்டமிடல்" },
      { question: "What was special about their drainage?", question_ta: "அவர்களின் வடிகால் அமைப்பின் சிறப்பு என்ன?", options: ["It was made of gold", "Every house connected to covered drains", "It floated on water", "It was magical"], options_ta: ["தங்கத்தால் ஆனது", "ஒவ்வொரு வீடும் மூடிய வடிகால்களுடன் இணைக்கப்பட்டது", "நீரில் மிதந்தது", "மாயாஜாலம்"], answer: "Every house connected to covered drains", answer_ta: "ஒவ்வொரு வீடும் மூடிய வடிகால்களுடன் இணைக்கப்பட்டது" },
    ],
  },

  // ── SOCIAL SCIENCE (Classes 6-8) ──
  {
    id: "social_constitution",
    subject: "Social Science",
    title: "The Story of Our Constitution",
    title_ta: "நம் அரசியலமைப்பின் கதை",
    emoji: "📜",
    classRange: [6, 8],
    xpReward: 35,
    pages: [
      {
        text: "August 15, 1947. India is finally FREE! 🇮🇳 But a new question arises: \"How should we govern our country?\" Dr. B.R. Ambedkar leads a team to write the Constitution — the supreme law of India. It took 2 years, 11 months, and 17 days!",
        text_ta: "ஆகஸ்ட் 15, 1947. இந்தியா சுதந்திரம் பெறுகிறது! 🇮🇳 டாக்டர் பி.ஆர். அம்பேத்கர் அரசியலமைப்பை எழுத ஒரு குழுவை வழிநடத்துகிறார்.",
        character: "📜",
        keywords: [
          { word: "Constitution", meaning: "The supreme law that governs a country", word_ta: "அரசியலமைப்பு", meaning_ta: "ஒரு நாட்டை ஆளும் உச்ச சட்டம்" },
          { word: "Preamble", meaning: "The introduction to the Constitution", word_ta: "முகவுரை", meaning_ta: "அரசியலமைப்பின் அறிமுகம்" },
        ],
      },
      {
        text: "The Constitution gives us Fundamental Rights — like the right to equality, freedom, and education. It also gives us duties. India chose to be a Republic, where leaders are elected by the people. January 26 is Republic Day — when our Constitution came into effect in 1950!",
        text_ta: "அரசியலமைப்பு நமக்கு அடிப்படை உரிமைகளை வழங்குகிறது. இந்தியா குடியரசாக இருக்கத் தேர்ந்தெடுத்தது. ஜனவரி 26 குடியரசு தினம்!",
        character: "🇮🇳",
        keywords: [
          { word: "Fundamental Rights", meaning: "Basic rights given to every citizen", word_ta: "அடிப்படை உரிமைகள்", meaning_ta: "ஒவ்வொரு குடிமகனுக்கும் வழங்கப்படும் உரிமைகள்" },
          { word: "Republic", meaning: "A country where people choose their leaders", word_ta: "குடியரசு", meaning_ta: "மக்கள் தங்கள் தலைவர்களைத் தேர்ந்தெடுக்கும் நாடு" },
        ],
        thinkMoment: {
          question: "Who led the team that wrote India's Constitution?",
          question_ta: "இந்திய அரசியலமைப்பை எழுதிய குழுவை யார் வழிநடத்தினார்?",
          options: [
            { label: "Dr. B.R. Ambedkar", label_ta: "டாக்டர் பி.ஆர். அம்பேத்கர்", isCorrect: true, feedback: "Correct! He is the Father of the Indian Constitution! 📜", feedback_ta: "சரி! அவர் இந்திய அரசியலமைப்பின் தந்தை! 📜" },
            { label: "Mahatma Gandhi", label_ta: "மகாத்மா காந்தி", isCorrect: false, feedback: "Gandhi led the freedom movement, not the Constitution drafting.", feedback_ta: "காந்தி சுதந்திர இயக்கத்தை வழிநடத்தினார்." },
            { label: "Jawaharlal Nehru", label_ta: "ஜவஹர்லால் நேரு", isCorrect: false, feedback: "Nehru was the first Prime Minister.", feedback_ta: "நேரு முதல் பிரதமர்." },
          ],
        },
      },
    ],
    questions: [
      { question: "When did the Constitution come into effect?", question_ta: "அரசியலமைப்பு எப்போது நடைமுறைக்கு வந்தது?", options: ["Aug 15, 1947", "Jan 26, 1950", "Oct 2, 1949", "Nov 26, 1949"], options_ta: ["ஆகஸ்ட் 15, 1947", "ஜனவரி 26, 1950", "அக்டோபர் 2, 1949", "நவம்பர் 26, 1949"], answer: "Jan 26, 1950", answer_ta: "ஜனவரி 26, 1950" },
      { question: "What are Fundamental Rights?", question_ta: "அடிப்படை உரிமைகள் என்றால் என்ன?", options: ["Duties of citizens", "Basic rights for all", "Laws for police", "Rules for schools"], options_ta: ["குடிமக்களின் கடமைகள்", "அனைவருக்குமான அடிப்படை உரிமைகள்", "காவல்துறைக்கான சட்டங்கள்", "பள்ளிகளுக்கான விதிகள்"], answer: "Basic rights for all", answer_ta: "அனைவருக்குமான அடிப்படை உரிமைகள்" },
      { question: "What does Republic mean?", question_ta: "குடியரசு என்றால் என்ன?", options: ["King rules", "People choose leaders", "No government", "Foreign rule"], options_ta: ["அரசன் ஆட்சி", "மக்கள் தலைவர்களைத் தேர்வு", "அரசு இல்லை", "வெளிநாட்டு ஆட்சி"], answer: "People choose leaders", answer_ta: "மக்கள் தலைவர்களைத் தேர்வு" },
    ],
  },

  // ── ENGLISH (Classes 1-3) ──
  {
    id: "english_abc_adventure",
    subject: "English",
    title: "The ABC Treasure Hunt",
    title_ta: "ABC பொக்கிஷ வேட்டை",
    emoji: "🔤",
    classRange: [1, 3],
    xpReward: 15,
    pages: [
      {
        text: "Welcome to ABC Island! 🏝️ To find the treasure, you must collect letters! You find 'A' 🍎 near an Apple tree. 'B' 🦋 is hiding behind a Butterfly. 'C' 🐱 is sitting with a Cat. You now have A, B, C! \"I can spell CAB!\" you shout.",
        text_ta: "ABC தீவுக்கு வரவேற்கிறோம்! 🏝️ பொக்கிஷத்தைக் கண்டுபிடிக்க எழுத்துக்களை சேகரிக்க வேண்டும்!",
        character: "🗺️",
        keywords: [
          { word: "spell", meaning: "To put letters together to make a word", word_ta: "எழுத்துக் கோர்", meaning_ta: "எழுத்துக்களை சேர்த்து சொல் உருவாக்குவது" },
          { word: "letter", meaning: "A, B, C... parts of the alphabet", word_ta: "எழுத்து", meaning_ta: "A, B, C... நெடுங்கணக்கின் பகுதிகள்" },
        ],
      },
      {
        text: "Next you find 'D' 🐕 with a Dog and 'O' 🐙 with an Octopus! Now you can spell DOG, COD, and GOD! The treasure chest opens when you spell the magic word: 'GOOD'! 🎁 Inside is a golden star ⭐ and a note: \"Words are the greatest treasure!\"",
        text_ta: "அடுத்து 'D' 🐕 நாயுடனும் 'O' 🐙 நீள்கணவாயுடனும் காண்கிறீர்கள்! மாய சொல் 'GOOD' எழுதும்போது பொக்கிஷப் பெட்டி திறக்கிறது! 🎁",
        character: "🎁",
        keywords: [
          { word: "treasure", meaning: "Something very valuable and special", word_ta: "பொக்கிஷம்", meaning_ta: "மிகவும் மதிப்புள்ள ஒன்று" },
        ],
        thinkMoment: {
          question: "Which word can you make with D, O, G?",
          question_ta: "D, O, G கொண்டு எந்த சொல்லை உருவாக்கலாம்?",
          options: [
            { label: "DOG", label_ta: "DOG (நாய்)", isCorrect: true, feedback: "Woof woof! You spelled DOG! 🐕", feedback_ta: "வூஃப் வூஃப்! நீங்கள் DOG என்று எழுதினீர்கள்! 🐕" },
            { label: "CAT", label_ta: "CAT (பூனை)", isCorrect: false, feedback: "You need C, A, T for CAT!", feedback_ta: "CAT-க்கு C, A, T தேவை!" },
            { label: "SUN", label_ta: "SUN (சூரியன்)", isCorrect: false, feedback: "You don't have S, U, or N!", feedback_ta: "உங்களிடம் S, U, N இல்லை!" },
          ],
        },
      },
    ],
    questions: [
      { question: "What was 'A' near?", question_ta: "'A' எதன் அருகில் இருந்தது?", options: ["Ant", "Apple tree", "Airplane", "Alligator"], options_ta: ["எறும்பு", "ஆப்பிள் மரம்", "விமானம்", "முதலை"], answer: "Apple tree", answer_ta: "ஆப்பிள் மரம்" },
      { question: "What opened the treasure chest?", question_ta: "பொக்கிஷப் பெட்டியை என்ன திறந்தது?", options: ["A key", "Spelling GOOD", "A map", "Magic wand"], options_ta: ["ஒரு சாவி", "GOOD என்று எழுதுவது", "ஒரு வரைபடம்", "மாய குச்சி"], answer: "Spelling GOOD", answer_ta: "GOOD என்று எழுதுவது" },
      { question: "What was inside the treasure?", question_ta: "பொக்கிஷத்தின் உள்ளே என்ன இருந்தது?", options: ["Gold coins", "A golden star", "A book", "Candy"], options_ta: ["தங்க நாணயங்கள்", "ஒரு தங்க நட்சத்திரம்", "ஒரு புத்தகம்", "மிட்டாய்"], answer: "A golden star", answer_ta: "ஒரு தங்க நட்சத்திரம்" },
    ],
  },

  // ── ENGLISH (Classes 2-5) ──
  {
    id: "english_word_kingdom",
    subject: "English",
    title: "The Lost Word Kingdom",
    title_ta: "தொலைந்த சொல் ராஜ்ஜியம்",
    emoji: "👑",
    classRange: [2, 5],
    xpReward: 20,
    pages: [
      {
        text: "In the magical Word Kingdom, every word had a meaning. But one stormy night, the Evil Eraser stole all the meanings! \"Help!\" cried the King of Words. \"Nobody knows what anything means anymore!\" The words were confused: 'Happy' forgot it meant joy. 'Brave' forgot it meant courage.",
        text_ta: "மாயாஜால சொல் ராஜ்ஜியத்தில், ஒவ்வொரு சொல்லுக்கும் ஒரு பொருள் இருந்தது. ஆனால் தீய அழிப்பான் எல்லா பொருள்களையும் திருடிவிட்டது!",
        character: "👑",
        keywords: [
          { word: "courage", meaning: "Being brave when you're scared", word_ta: "தைரியம்", meaning_ta: "நீங்கள் பயப்படும்போது தைரியமாக இருப்பது" },
          { word: "confused", meaning: "Not understanding something", word_ta: "குழப்பமான", meaning_ta: "ஒன்றை புரிந்து கொள்ள முடியாமல் இருப்பது" },
        ],
      },
      {
        text: "You are chosen as the Word Hero! Your mission: match every word with its correct meaning. You start with the easy ones. 'Sun' → gives us light and warmth. 'Rain' → water falling from clouds. The kingdom slowly comes back to life as you restore each word's meaning!",
        text_ta: "நீங்கள் சொல் நாயகனாக தேர்ந்தெடுக்கப்படுகிறீர்கள்! உங்கள் பணி: ஒவ்வொரு சொல்லையும் அதன் சரியான அர்த்தத்துடன் பொருத்துங்கள்.",
        character: "⚔️",
        keywords: [
          { word: "mission", meaning: "An important task to complete", word_ta: "பணி", meaning_ta: "நிறைவேற்ற வேண்டிய ஒரு முக்கியமான பணி" },
          { word: "restore", meaning: "To bring back to how it was before", word_ta: "மீட்டெடு", meaning_ta: "முன்பு இருந்தபடி மீண்டும் கொண்டு வருவது" },
        ],
        thinkMoment: {
          question: "Which word means 'feeling joy'?",
          question_ta: "எந்த சொல்லின் பொருள் 'மகிழ்ச்சியாக உணர்வது'?",
          options: [
            { label: "Happy", label_ta: "மகிழ்ச்சி", isCorrect: true, feedback: "You restored 'Happy'! The kingdom cheers! 🎉", feedback_ta: "நீங்கள் 'மகிழ்ச்சி'யை மீட்டெடுத்தீர்கள்! 🎉" },
            { label: "Brave", label_ta: "தைரியமான", isCorrect: false, feedback: "'Brave' means having courage, not joy.", feedback_ta: "'தைரியமான' என்பது மகிழ்ச்சியல்ல." },
            { label: "Quiet", label_ta: "அமைதியான", isCorrect: false, feedback: "'Quiet' means making no noise.", feedback_ta: "'அமைதியான' என்பது சத்தம் இல்லாமல் இருப்பது." },
          ],
        },
      },
    ],
    questions: [
      { question: "Who stole the meanings?", question_ta: "பொருள்களை யார் திருடினார்?", options: ["The King", "Evil Eraser", "Word Hero", "The Sun"], options_ta: ["அரசன்", "தீய அழிப்பான்", "சொல் நாயகன்", "சூரியன்"], answer: "Evil Eraser", answer_ta: "தீய அழிப்பான்" },
      { question: "What does 'brave' mean?", question_ta: "'தைரியமான' என்பதன் பொருள் என்ன?", options: ["Feeling sad", "Being hungry", "Having courage", "Being fast"], options_ta: ["சோகமாக உணர்வது", "பசியாக இருப்பது", "தைரியமாக இருப்பது", "வேகமாக இருப்பது"], answer: "Having courage", answer_ta: "தைரியமாக இருப்பது" },
      { question: "What was your mission?", question_ta: "உங்கள் பணி என்ன?", options: ["Fight the King", "Match words to meanings", "Erase all words", "Build a castle"], options_ta: ["அரசனுடன் சண்டை", "சொற்களை பொருள்களுடன் பொருத்துங்கள்", "எல்லா சொற்களையும் அழிக்கவும்", "கோட்டை கட்டவும்"], answer: "Match words to meanings", answer_ta: "சொற்களை பொருள்களுடன் பொருத்துங்கள்" },
    ],
  },

  // ── ENGLISH (Classes 6-8) ──
  {
    id: "english_grammar_detective",
    subject: "English",
    title: "The Grammar Detective",
    title_ta: "இலக்கண துப்பறிவாளர்",
    emoji: "🔍",
    classRange: [6, 8],
    xpReward: 30,
    pages: [
      {
        text: "Detective Lin solves crimes using grammar! Today's case: a mysterious note was left at the museum. It reads: \"The theif has took the painting last night.\" Lin spots TWO mistakes! \"'Theif' should be 'thief' — remember 'i before e except after c'. And 'has took' should be 'has taken' — the past participle!\"",
        text_ta: "துப்பறிவாளர் லின் இலக்கணத்தைப் பயன்படுத்தி குற்றங்களை தீர்க்கிறார்! குறிப்பில் இரண்டு தவறுகள் உள்ளன!",
        character: "🔍",
        keywords: [
          { word: "past participle", meaning: "The third form of a verb (go-went-gone)", word_ta: "past participle", meaning_ta: "வினைச்சொல்லின் மூன்றாவது வடிவம்" },
          { word: "spelling rule", meaning: "A pattern to help spell words correctly", word_ta: "எழுத்துக்கூட்டல் விதி", meaning_ta: "சொற்களை சரியாக எழுத உதவும் விதி" },
        ],
      },
      {
        text: "The corrected note reads: \"The thief has taken the painting last night.\" But wait — Lin notices something else! \"'Last night' means it already happened, so we should use simple past: 'The thief TOOK the painting last night.' Case solved!\" The tense tells us WHEN something happened.",
        text_ta: "திருத்தப்பட்ட குறிப்பு: \"The thief took the painting last night.\" tense நமக்கு எப்போது நடந்தது என்பதைச் சொல்கிறது.",
        character: "📝",
        keywords: [
          { word: "tense", meaning: "Shows when an action happens — past, present, or future", word_ta: "காலம்", meaning_ta: "ஒரு செயல் எப்போது நடக்கிறது என்பதைக் காட்டுகிறது" },
        ],
        thinkMoment: {
          question: "Which sentence is correct?",
          question_ta: "எந்த வாக்கியம் சரியானது?",
          options: [
            { label: "The thief took the painting last night.", label_ta: "The thief took the painting last night.", isCorrect: true, feedback: "Perfect! Simple past with 'last night' is correct! 🎯", feedback_ta: "சரியானது! 'last night'-உடன் simple past சரி! 🎯" },
            { label: "The thief has took the painting.", label_ta: "The thief has took the painting.", isCorrect: false, feedback: "'Has took' is wrong. Use 'has taken' or just 'took'.", feedback_ta: "'Has took' தவறு." },
            { label: "The theif taked the painting.", label_ta: "The theif taked the painting.", isCorrect: false, feedback: "Two errors! 'Theif' → 'thief' and 'taked' → 'took'.", feedback_ta: "இரண்டு தவறுகள்!" },
          ],
        },
      },
    ],
    questions: [
      { question: "What is a past participle?", question_ta: "Past participle என்றால் என்ன?", options: ["First form of verb", "Second form", "Third form of verb", "Future form"], options_ta: ["முதல் வடிவம்", "இரண்டாவது வடிவம்", "மூன்றாவது வடிவம்", "எதிர்கால வடிவம்"], answer: "Third form of verb", answer_ta: "மூன்றாவது வடிவம்" },
      { question: "Which spelling is correct?", question_ta: "எந்த எழுத்துக்கூட்டல் சரி?", options: ["Theif", "Thief", "Theef", "Thiefe"], options_ta: ["Theif", "Thief", "Theef", "Thiefe"], answer: "Thief", answer_ta: "Thief" },
      { question: "What tense uses 'last night'?", question_ta: "'Last night' எந்த காலத்தைப் பயன்படுத்துகிறது?", options: ["Present", "Future", "Simple past", "Present perfect"], options_ta: ["நிகழ்காலம்", "எதிர்காலம்", "Simple past", "Present perfect"], answer: "Simple past", answer_ta: "Simple past" },
    ],
  },

  // ── GK (Classes 1-3) ──
  {
    id: "gk_animal_homes",
    subject: "GK",
    title: "Where Do Animals Live?",
    title_ta: "விலங்குகள் எங்கே வாழ்கின்றன?",
    emoji: "🏠",
    classRange: [1, 3],
    xpReward: 15,
    pages: [
      {
        text: "Let's visit animal homes! 🐦 Birds live in NESTS made of twigs high up in trees. 🐝 Bees live in HIVES where they make sweet honey. 🐰 Rabbits live in BURROWS — holes dug underground. 🕸️ Spiders live in WEBS they spin themselves! Every animal has a special home!",
        text_ta: "விலங்குகளின் வீடுகளுக்கு செல்வோம்! 🐦 பறவைகள் கூடுகளில், 🐝 தேனீக்கள் தேன்கூடுகளில், 🐰 முயல்கள் பொந்துகளில், 🕸️ சிலந்திகள் வலைகளில் வாழ்கின்றன!",
        character: "🦁",
        keywords: [
          { word: "nest", meaning: "A bird's home made of sticks", word_ta: "கூடு", meaning_ta: "குச்சிகளால் ஆன பறவையின் வீடு" },
          { word: "burrow", meaning: "A hole in the ground where animals live", word_ta: "பொந்து", meaning_ta: "விலங்குகள் வாழும் நிலத்தின் கீழ் உள்ள குழி" },
        ],
      },
      {
        text: "🐟 Fish live in WATER — rivers, lakes, and oceans! 🐻 Bears live in DENS — cozy caves in the mountains. 🐊 Crocodiles live near RIVERS and love to swim! And where do YOU live? In a HOUSE with your family! 🏡 We all need a safe home.",
        text_ta: "🐟 மீன்கள் நீரில், 🐻 கரடிகள் குகைகளில், 🐊 முதலைகள் ஆறுகளில் வாழ்கின்றன! நீங்கள் உங்கள் குடும்பத்துடன் வீட்டில் வாழ்கிறீர்கள்! 🏡",
        character: "🏡",
        keywords: [
          { word: "den", meaning: "A bear's home in a cave", word_ta: "குகை வீடு", meaning_ta: "குகையில் உள்ள கரடியின் வீடு" },
        ],
        thinkMoment: {
          question: "Where do bees live?",
          question_ta: "தேனீக்கள் எங்கே வாழ்கின்றன?",
          options: [
            { label: "Hive", label_ta: "தேன்கூடு", isCorrect: true, feedback: "Buzz buzz! Bees live in hives! 🐝", feedback_ta: "ரீங்காரம்! தேனீக்கள் தேன்கூடுகளில் வாழ்கின்றன! 🐝" },
            { label: "Nest", label_ta: "கூடு", isCorrect: false, feedback: "Nests are for birds, not bees!", feedback_ta: "கூடுகள் பறவைகளுக்கானவை!" },
            { label: "Burrow", label_ta: "பொந்து", isCorrect: false, feedback: "Burrows are for rabbits!", feedback_ta: "பொந்துகள் முயல்களுக்கானவை!" },
          ],
        },
      },
    ],
    questions: [
      { question: "Where do birds live?", question_ta: "பறவைகள் எங்கே வாழ்கின்றன?", options: ["Burrow", "Hive", "Nest", "Den"], options_ta: ["பொந்து", "தேன்கூடு", "கூடு", "குகை வீடு"], answer: "Nest", answer_ta: "கூடு" },
      { question: "Where do rabbits live?", question_ta: "முயல்கள் எங்கே வாழ்கின்றன?", options: ["Tree", "Burrow", "Water", "Web"], options_ta: ["மரம்", "பொந்து", "நீர்", "வலை"], answer: "Burrow", answer_ta: "பொந்து" },
      { question: "Where do fish live?", question_ta: "மீன்கள் எங்கே வாழ்கின்றன?", options: ["Trees", "Caves", "Water", "Nests"], options_ta: ["மரங்கள்", "குகைகள்", "நீர்", "கூடுகள்"], answer: "Water", answer_ta: "நீர்" },
    ],
  },

  // ── GK (Classes 3-7) ──
  {
    id: "gk_world_trip",
    subject: "GK",
    title: "Around the World in 5 Days",
    title_ta: "5 நாட்களில் உலகம் சுற்றி",
    emoji: "🌎",
    classRange: [3, 7],
    xpReward: 25,
    pages: [
      {
        text: "Day 1: You land in Paris, France! 🇫🇷 The Eiffel Tower sparkles at night. Paris is called the 'City of Light'! Day 2: You fly to Tokyo, Japan! 🇯🇵 Cherry blossoms fill the parks. You try sushi for the first time!",
        text_ta: "நாள் 1: பிரான்ஸின் பாரிஸ்! 🇫🇷 ஐஃபிள் கோபுரம் இரவில் மின்னுகிறது. நாள் 2: ஜப்பானின் டோக்கியோ! 🇯🇵 செர்ரி மலர்கள் பூக்கின்றன.",
        character: "✈️",
        keywords: [
          { word: "Eiffel Tower", meaning: "A famous iron tower in Paris, France", word_ta: "ஐஃபிள் கோபுரம்", meaning_ta: "பிரான்ஸின் பாரிஸில் உள்ள பிரபலமான இரும்பு கோபுரம்" },
          { word: "cherry blossoms", meaning: "Beautiful pink flowers on trees in Japan", word_ta: "செர்ரி மலர்கள்", meaning_ta: "ஜப்பானில் மரங்களில் அழகான இளஞ்சிவப்பு பூக்கள்" },
        ],
      },
      {
        text: "Day 3: You arrive in Cairo, Egypt! 🇪🇬 The Great Pyramids are HUGE — built over 4,000 years ago! Day 4: You visit Rio de Janeiro, Brazil! 🇧🇷 Day 5: Your last stop is New Delhi, India! 🇮🇳 You see the beautiful Taj Mahal and eat spicy biryani!",
        text_ta: "நாள் 3: எகிப்தின் கெய்ரோ! 🇪🇬 பிரமிடுகள் மிகப்பெரியவை! நாள் 4: பிரேசிலின் ரியோ! 🇧🇷 நாள் 5: இந்தியாவின் டெல்லி! 🇮🇳 தாஜ்மஹால்!",
        character: "🌍",
        keywords: [
          { word: "Pyramids", meaning: "Ancient stone structures built as tombs for Egyptian kings", word_ta: "பிரமிடுகள்", meaning_ta: "எகிப்திய அரசர்களுக்கான பண்டைய கல் கட்டமைப்புகள்" },
        ],
        thinkMoment: {
          question: "Which monument is in India?",
          question_ta: "எந்த நினைவுச்சின்னம் இந்தியாவில் உள்ளது?",
          options: [
            { label: "Taj Mahal", label_ta: "தாஜ்மஹால்", isCorrect: true, feedback: "Correct! The Taj Mahal is in Agra, India.", feedback_ta: "சரி! தாஜ்மஹால் ஆக்ராவில் உள்ளது." },
            { label: "Eiffel Tower", label_ta: "ஐஃபிள் கோபுரம்", isCorrect: false, feedback: "The Eiffel Tower is in Paris, France!", feedback_ta: "ஐஃபிள் கோபுரம் பாரிஸில் உள்ளது!" },
            { label: "Pyramids", label_ta: "பிரமிடுகள்", isCorrect: false, feedback: "The Pyramids are in Egypt!", feedback_ta: "பிரமிடுகள் எகிப்தில் உள்ளன!" },
          ],
        },
      },
    ],
    questions: [
      { question: "What is the capital of France?", question_ta: "பிரான்ஸின் தலைநகரம் என்ன?", options: ["London", "Paris", "Rome", "Berlin"], options_ta: ["லண்டன்", "பாரிஸ்", "ரோம்", "பெர்லின்"], answer: "Paris", answer_ta: "பாரிஸ்" },
      { question: "Which country has the Great Pyramids?", question_ta: "எந்த நாட்டில் பிரமிடுகள் உள்ளன?", options: ["India", "Brazil", "Egypt", "Japan"], options_ta: ["இந்தியா", "பிரேசில்", "எகிப்து", "ஜப்பான்"], answer: "Egypt", answer_ta: "எகிப்து" },
      { question: "What famous food comes from Japan?", question_ta: "ஜப்பானிலிருந்து என்ன பிரபலமான உணவு வருகிறது?", options: ["Pizza", "Sushi", "Biryani", "Croissant"], options_ta: ["பீட்சா", "சுஷி", "பிரியாணி", "குரோஸன்ட்"], answer: "Sushi", answer_ta: "சுஷி" },
    ],
  },

  // ── GK (Classes 6-8) ──
  {
    id: "gk_solar_system",
    subject: "GK",
    title: "Mission to the Solar System",
    title_ta: "சூரிய குடும்பத்திற்கு பயணம்",
    emoji: "🚀",
    classRange: [6, 8],
    xpReward: 35,
    pages: [
      {
        text: "Commander Aisha launches her spacecraft! 🚀 First stop: Mercury — the closest planet to the Sun and the smallest. Then Venus — the hottest planet because of its thick atmosphere trapping heat. Earth is next — the only planet with liquid water and life! Then Mars — the Red Planet.",
        text_ta: "கமாண்டர் ஆய்ஷா விண்கலத்தை ஏவுகிறாள்! 🚀 புதன், வெள்ளி, பூமி, செவ்வாய் — ஒவ்வொன்றும் தனித்துவமானது!",
        character: "👩‍🚀",
        keywords: [
          { word: "atmosphere", meaning: "The layer of gases surrounding a planet", word_ta: "வளிமண்டலம்", meaning_ta: "ஒரு கோளைச் சுற்றியுள்ள வாயுக்களின் அடுக்கு" },
          { word: "solar system", meaning: "The Sun and all the planets orbiting it", word_ta: "சூரிய குடும்பம்", meaning_ta: "சூரியன் மற்றும் அதைச் சுற்றும் கோள்கள்" },
        ],
      },
      {
        text: "Beyond Mars lies the asteroid belt! Then come the gas giants: Jupiter — the LARGEST planet with 95 known moons, and Saturn — famous for its beautiful rings made of ice and rock! Uranus and Neptune are the ice giants far away. \"8 planets, 1 Sun, and endless wonder!\" says Commander Aisha. 🌌",
        text_ta: "வியாழன் — மிகப்பெரிய கோள், சனி — அழகான வளையங்கள்! யுரேனஸ், நெப்டியூன் பனி ராட்சதர்கள். \"8 கோள்கள், 1 சூரியன், முடிவற்ற அதிசயம்!\" 🌌",
        character: "🪐",
        keywords: [
          { word: "gas giant", meaning: "A huge planet made mostly of gas (Jupiter, Saturn)", word_ta: "வாயு ராட்சதன்", meaning_ta: "வாயுவால் ஆன பெரிய கோள்" },
          { word: "asteroid belt", meaning: "A ring of rocks between Mars and Jupiter", word_ta: "சிறுகோள் பட்டை", meaning_ta: "செவ்வாய்க்கும் வியாழனுக்கும் இடையே உள்ள பாறைகள்" },
        ],
        thinkMoment: {
          question: "Which is the largest planet?",
          question_ta: "மிகப்பெரிய கோள் எது?",
          options: [
            { label: "Jupiter", label_ta: "வியாழன்", isCorrect: true, feedback: "Correct! Jupiter is so big, 1,300 Earths could fit inside! 🪐", feedback_ta: "சரி! 1,300 பூமிகள் உள்ளே பொருந்தும்! 🪐" },
            { label: "Saturn", label_ta: "சனி", isCorrect: false, feedback: "Saturn is the second largest.", feedback_ta: "சனி இரண்டாவது பெரியது." },
            { label: "Earth", label_ta: "பூமி", isCorrect: false, feedback: "Earth is small compared to gas giants!", feedback_ta: "பூமி சிறியது!" },
          ],
        },
      },
    ],
    questions: [
      { question: "Which planet is closest to the Sun?", question_ta: "சூரியனுக்கு மிக அருகிலுள்ள கோள் எது?", options: ["Venus", "Earth", "Mercury", "Mars"], options_ta: ["வெள்ளி", "பூமி", "புதன்", "செவ்வாய்"], answer: "Mercury", answer_ta: "புதன்" },
      { question: "Which planet has beautiful rings?", question_ta: "எந்த கோளுக்கு வளையங்கள் உள்ளன?", options: ["Jupiter", "Mars", "Saturn", "Neptune"], options_ta: ["வியாழன்", "செவ்வாய்", "சனி", "நெப்டியூன்"], answer: "Saturn", answer_ta: "சனி" },
      { question: "How many planets are in our solar system?", question_ta: "சூரிய குடும்பத்தில் எத்தனை கோள்கள்?", options: ["6", "7", "8", "9"], options_ta: ["6", "7", "8", "9"], answer: "8", answer_ta: "8" },
    ],
  },
];

export const filterStoriesByClass = (stories: Story[], classLevel: number): Story[] =>
  stories.filter((s) => classLevel >= s.classRange[0] && classLevel <= s.classRange[1]);
