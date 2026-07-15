// Adventure world definitions and level question generators

export interface AdventureWorld {
  id: string;
  name: string;
  name_ta: string;
  emoji: string;
  theme: string; // tailwind gradient
  bgEmojis: string[];
  description: string;
  description_ta: string;
  subjectMatch: string; // maps to subject name
  category: "school" | "real-world";
  isNew?: boolean;
  levels: AdventureLevel[];
}

export interface AdventureLevel {
  number: number;
  title: string;
  title_ta: string;
  isBoss: boolean;
  questions: AdventureQuestion[];
}

export interface AdventureQuestion {
  q: string;
  q_ta: string;
  options: string[];
  options_ta: string[];
  answer: string;
  answer_ta: string;
}

// ── Math World: Enchanted Forest 🌲 ──
function generateForestMathLevels(classLevel: number): AdventureLevel[] {
  const levels: AdventureLevel[] = [];
  
  const mathTopics = [
    {
      title: "Addition Trail", title_ta: "கூட்டல் பாதை",
      generate: (cl: number): AdventureQuestion[] => {
        const qs: AdventureQuestion[] = [];
        for (let i = 0; i < 5; i++) {
          const a = Math.floor(Math.random() * (cl * 15)) + 10;
          const b = Math.floor(Math.random() * (cl * 10)) + 5;
          const ans = a + b;
          const opts = shuffle([ans, ans + 3, ans - 2, ans + 7]);
          qs.push({
            q: `What is ${a} + ${b}?`, q_ta: `${a} + ${b} = ?`,
            options: opts.map(String), options_ta: opts.map(String),
            answer: String(ans), answer_ta: String(ans),
          });
        }
        return qs;
      },
    },
    {
      title: "Multiplication Cave", title_ta: "பெருக்கல் குகை",
      generate: (cl: number): AdventureQuestion[] => {
        const qs: AdventureQuestion[] = [];
        for (let i = 0; i < 5; i++) {
          const a = Math.floor(Math.random() * (cl + 5)) + 2;
          const b = Math.floor(Math.random() * 12) + 2;
          const ans = a * b;
          const opts = shuffle([ans, ans + a, ans - b, ans + b + 1]);
          qs.push({
            q: `What is ${a} × ${b}?`, q_ta: `${a} × ${b} = ?`,
            options: opts.map(String), options_ta: opts.map(String),
            answer: String(ans), answer_ta: String(ans),
          });
        }
        return qs;
      },
    },
    {
      title: "Division Bridge", title_ta: "வகுத்தல் பாலம்",
      generate: (cl: number): AdventureQuestion[] => {
        const qs: AdventureQuestion[] = [];
        for (let i = 0; i < 5; i++) {
          const b = Math.floor(Math.random() * 8) + 2;
          const ans = Math.floor(Math.random() * (cl * 3)) + 2;
          const a = ans * b;
          const opts = shuffle([ans, ans + 1, ans - 1, ans + 3]);
          qs.push({
            q: `What is ${a} ÷ ${b}?`, q_ta: `${a} ÷ ${b} = ?`,
            options: opts.map(String), options_ta: opts.map(String),
            answer: String(ans), answer_ta: String(ans),
          });
        }
        return qs;
      },
    },
    {
      title: "Fraction Forest", title_ta: "பின்ன காடு",
      generate: (): AdventureQuestion[] => [
        { q: "What is 1/2 + 1/4?", q_ta: "1/2 + 1/4 = ?", options: ["3/4", "1/3", "2/4", "1/6"], options_ta: ["3/4", "1/3", "2/4", "1/6"], answer: "3/4", answer_ta: "3/4" },
        { q: "Which is bigger: 2/3 or 3/5?", q_ta: "எது பெரியது: 2/3 அல்லது 3/5?", options: ["2/3", "3/5", "Equal", "Can't tell"], options_ta: ["2/3", "3/5", "சமம்", "சொல்ல இயலாது"], answer: "2/3", answer_ta: "2/3" },
        { q: "Simplify 4/8", q_ta: "4/8 ஐ எளிமைப்படுத்து", options: ["1/2", "2/4", "1/4", "2/8"], options_ta: ["1/2", "2/4", "1/4", "2/8"], answer: "1/2", answer_ta: "1/2" },
        { q: "What is 3/4 of 20?", q_ta: "20 இன் 3/4 = ?", options: ["15", "12", "16", "10"], options_ta: ["15", "12", "16", "10"], answer: "15", answer_ta: "15" },
        { q: "What is 2/5 + 1/5?", q_ta: "2/5 + 1/5 = ?", options: ["3/5", "3/10", "1/5", "2/10"], options_ta: ["3/5", "3/10", "1/5", "2/10"], answer: "3/5", answer_ta: "3/5" },
      ],
    },
  ];

  mathTopics.forEach((topic, idx) => {
    levels.push({
      number: idx + 1,
      title: topic.title,
      title_ta: topic.title_ta,
      isBoss: false,
      questions: topic.generate(classLevel),
    });
  });

  // Boss level
  levels.push({
    number: 5,
    title: "Forest Guardian Boss 🐻",
    title_ta: "காட்டு காவலர் போஸ் 🐻",
    isBoss: true,
    questions: [
      { q: "Solve: (15 + 7) × 3 = ?", q_ta: "(15 + 7) × 3 = ?", options: ["66", "54", "72", "60"], options_ta: ["66", "54", "72", "60"], answer: "66", answer_ta: "66" },
      { q: "What is 144 ÷ 12?", q_ta: "144 ÷ 12 = ?", options: ["12", "14", "11", "13"], options_ta: ["12", "14", "11", "13"], answer: "12", answer_ta: "12" },
      { q: "Find the missing: 7 × ? = 56", q_ta: "7 × ? = 56", options: ["8", "7", "9", "6"], options_ta: ["8", "7", "9", "6"], answer: "8", answer_ta: "8" },
      { q: "25% of 80 = ?", q_ta: "80 இன் 25% = ?", options: ["20", "25", "16", "30"], options_ta: ["20", "25", "16", "30"], answer: "20", answer_ta: "20" },
      { q: "What is 3² + 4²?", q_ta: "3² + 4² = ?", options: ["25", "24", "49", "7"], options_ta: ["25", "24", "49", "7"], answer: "25", answer_ta: "25" },
    ],
  });

  return levels;
}

// ── Science World: Space Station 🚀 ──
function generateSpaceScienceLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Solar System Explorer", title_ta: "சூரிய குடும்ப ஆராய்ச்சி", isBoss: false,
      questions: [
        { q: "Which planet is closest to the Sun?", q_ta: "சூரியனுக்கு அருகில் உள்ள கோள் எது?", options: ["Mercury", "Venus", "Earth", "Mars"], options_ta: ["புதன்", "வெள்ளி", "பூமி", "செவ்வாய்"], answer: "Mercury", answer_ta: "புதன்" },
        { q: "How many planets are in our solar system?", q_ta: "நமது சூரிய குடும்பத்தில் எத்தனை கோள்கள்?", options: ["8", "7", "9", "10"], options_ta: ["8", "7", "9", "10"], answer: "8", answer_ta: "8" },
        { q: "Which planet is known as the Red Planet?", q_ta: "சிவப்பு கோள் என்று அழைக்கப்படுவது?", options: ["Mars", "Jupiter", "Venus", "Saturn"], options_ta: ["செவ்வாய்", "வியாழன்", "வெள்ளி", "சனி"], answer: "Mars", answer_ta: "செவ்வாய்" },
        { q: "What is the largest planet?", q_ta: "மிகப்பெரிய கோள் எது?", options: ["Jupiter", "Saturn", "Neptune", "Uranus"], options_ta: ["வியாழன்", "சனி", "நெப்டியூன்", "யுரேனஸ்"], answer: "Jupiter", answer_ta: "வியாழன்" },
        { q: "Which planet has rings?", q_ta: "எந்த கோளுக்கு வளையங்கள் உள்ளன?", options: ["Saturn", "Mars", "Venus", "Mercury"], options_ta: ["சனி", "செவ்வாய்", "வெள்ளி", "புதன்"], answer: "Saturn", answer_ta: "சனி" },
      ],
    },
    {
      number: 2, title: "Human Body Mission", title_ta: "மனித உடல் பயணம்", isBoss: false,
      questions: [
        { q: "How many bones does an adult have?", q_ta: "ஒரு பெரியவருக்கு எத்தனை எலும்புகள்?", options: ["206", "300", "106", "250"], options_ta: ["206", "300", "106", "250"], answer: "206", answer_ta: "206" },
        { q: "Which organ pumps blood?", q_ta: "இரத்தத்தை பம்ப் செய்யும் உறுப்பு?", options: ["Heart", "Lungs", "Brain", "Liver"], options_ta: ["இதயம்", "நுரையீரல்", "மூளை", "கல்லீரல்"], answer: "Heart", answer_ta: "இதயம்" },
        { q: "What is the largest organ of the body?", q_ta: "உடலின் மிகப்பெரிய உறுப்பு எது?", options: ["Skin", "Liver", "Brain", "Lungs"], options_ta: ["தோல்", "கல்லீரல்", "மூளை", "நுரையீரல்"], answer: "Skin", answer_ta: "தோல்" },
        { q: "Which gas do we breathe in?", q_ta: "நாம் சுவாசிக்கும் வாயு எது?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], options_ta: ["ஆக்சிஜன்", "கார்பன் டை ஆக்சைடு", "நைட்ரஜன்", "ஹைட்ரஜன்"], answer: "Oxygen", answer_ta: "ஆக்சிஜன்" },
        { q: "How many teeth does an adult have?", q_ta: "ஒரு பெரியவருக்கு எத்தனை பற்கள்?", options: ["32", "28", "30", "36"], options_ta: ["32", "28", "30", "36"], answer: "32", answer_ta: "32" },
      ],
    },
    {
      number: 3, title: "States of Matter", title_ta: "பொருளின் நிலைகள்", isBoss: false,
      questions: [
        { q: "What are the 3 states of matter?", q_ta: "பொருளின் 3 நிலைகள் என்ன?", options: ["Solid, Liquid, Gas", "Hot, Cold, Warm", "Big, Small, Medium", "Hard, Soft, Rough"], options_ta: ["திடம், திரவம், வாயு", "சூடு, குளிர், வெதுவெதுப்பு", "பெரிய, சிறிய, நடுத்தர", "கடினம், மென்மை, கரடு"], answer: "Solid, Liquid, Gas", answer_ta: "திடம், திரவம், வாயு" },
        { q: "What happens when ice melts?", q_ta: "பனிக்கட்டி உருகும்போது என்ன நடக்கும்?", options: ["Becomes water", "Becomes gas", "Disappears", "Becomes harder"], options_ta: ["நீராகிறது", "வாயுவாகிறது", "மறைகிறது", "கடினமாகிறது"], answer: "Becomes water", answer_ta: "நீராகிறது" },
        { q: "Which is an example of gas?", q_ta: "வாயுவிற்கு உதாரணம் எது?", options: ["Air", "Water", "Stone", "Wood"], options_ta: ["காற்று", "நீர்", "கல்", "மரம்"], answer: "Air", answer_ta: "காற்று" },
        { q: "What is evaporation?", q_ta: "ஆவியாதல் என்றால் என்ன?", options: ["Liquid to gas", "Gas to liquid", "Solid to liquid", "Liquid to solid"], options_ta: ["திரவம் வாயுவாதல்", "வாயு திரவமாதல்", "திடம் திரவமாதல்", "திரவம் திடமாதல்"], answer: "Liquid to gas", answer_ta: "திரவம் வாயுவாதல்" },
        { q: "At what temperature does water boil?", q_ta: "நீர் எத்தனை °C இல் கொதிக்கும்?", options: ["100°C", "50°C", "0°C", "200°C"], options_ta: ["100°C", "50°C", "0°C", "200°C"], answer: "100°C", answer_ta: "100°C" },
      ],
    },
    {
      number: 4, title: "Energy & Forces", title_ta: "ஆற்றல் & விசைகள்", isBoss: false,
      questions: [
        { q: "What is the force that pulls things down?", q_ta: "பொருட்களை கீழே இழுக்கும் விசை எது?", options: ["Gravity", "Magnetism", "Friction", "Push"], options_ta: ["புவியீர்ப்பு", "காந்தவிசை", "உராய்வு", "தள்ளுதல்"], answer: "Gravity", answer_ta: "புவியீர்ப்பு" },
        { q: "What type of energy does the Sun give?", q_ta: "சூரியன் எந்த ஆற்றலை தருகிறது?", options: ["Light & Heat", "Sound", "Electrical", "Nuclear"], options_ta: ["ஒளி & வெப்பம்", "ஒலி", "மின்சாரம்", "அணு"], answer: "Light & Heat", answer_ta: "ஒளி & வெப்பம்" },
        { q: "Which is a renewable energy source?", q_ta: "புதுப்பிக்கத்தக்க ஆற்றல் எது?", options: ["Solar", "Coal", "Oil", "Gas"], options_ta: ["சூரிய", "நிலக்கரி", "எண்ணெய்", "வாயு"], answer: "Solar", answer_ta: "சூரிய" },
        { q: "What does friction do?", q_ta: "உராய்வு என்ன செய்கிறது?", options: ["Slows things down", "Speeds up", "Makes lighter", "Creates sound"], options_ta: ["மெதுவாக்குகிறது", "வேகமாக்குகிறது", "லேசாக்குகிறது", "ஒலி உருவாக்குகிறது"], answer: "Slows things down", answer_ta: "மெதுவாக்குகிறது" },
        { q: "What is potential energy?", q_ta: "நிலை ஆற்றல் என்றால்?", options: ["Stored energy", "Moving energy", "Heat energy", "Light energy"], options_ta: ["சேமிக்கப்பட்ட ஆற்றல்", "இயக்க ஆற்றல்", "வெப்ப ஆற்றல்", "ஒளி ஆற்றல்"], answer: "Stored energy", answer_ta: "சேமிக்கப்பட்ட ஆற்றல்" },
      ],
    },
    {
      number: 5, title: "Space Commander Boss 👾", title_ta: "விண்வெளி தளபதி போஸ் 👾", isBoss: true,
      questions: [
        { q: "What is photosynthesis?", q_ta: "ஒளிச்சேர்க்கை என்றால் என்ன?", options: ["Plants making food from sunlight", "Animals eating plants", "Water cycle", "Rock formation"], options_ta: ["தாவரங்கள் சூரிய ஒளியில் உணவு தயாரித்தல்", "விலங்குகள் தாவரங்களை உண்ணுதல்", "நீர் சுழற்சி", "பாறை உருவாக்கம்"], answer: "Plants making food from sunlight", answer_ta: "தாவரங்கள் சூரிய ஒளியில் உணவு தயாரித்தல்" },
        { q: "Which layer of Earth do we live on?", q_ta: "நாம் பூமியின் எந்த அடுக்கில் வாழ்கிறோம்?", options: ["Crust", "Mantle", "Core", "Atmosphere"], options_ta: ["புறப்பரப்பு", "கவசம்", "உட்கரு", "வளிமண்டலம்"], answer: "Crust", answer_ta: "புறப்பரப்பு" },
        { q: "What causes day and night?", q_ta: "பகல் இரவு ஏற்பட காரணம்?", options: ["Earth's rotation", "Moon's orbit", "Sun moving", "Clouds"], options_ta: ["பூமி சுழற்சி", "நிலவின் சுற்று", "சூரியன் நகர்வு", "மேகங்கள்"], answer: "Earth's rotation", answer_ta: "பூமி சுழற்சி" },
        { q: "What is H₂O?", q_ta: "H₂O என்றால் என்ன?", options: ["Water", "Oxygen", "Hydrogen", "Salt"], options_ta: ["நீர்", "ஆக்சிஜன்", "ஹைட்ரஜன்", "உப்பு"], answer: "Water", answer_ta: "நீர்" },
        { q: "Newton's 1st law is about?", q_ta: "நியூட்டனின் 1வது விதி எதைப்பற்றியது?", options: ["Inertia", "Gravity", "Speed", "Light"], options_ta: ["நிலைமம்", "புவியீர்ப்பு", "வேகம்", "ஒளி"], answer: "Inertia", answer_ta: "நிலைமம்" },
      ],
    },
  ];
}

// ── English World: Ocean 🌊 ──
function generateOceanEnglishLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Grammar Reef", title_ta: "இலக்கண பாறை", isBoss: false,
      questions: [
        { q: "Choose the correct: She ___ to school.", q_ta: "சரியானதை தேர்வுசெய்: She ___ to school.", options: ["goes", "go", "going", "gone"], options_ta: ["goes", "go", "going", "gone"], answer: "goes", answer_ta: "goes" },
        { q: "What is the plural of 'child'?", q_ta: "'child' இன் பன்மை என்ன?", options: ["children", "childs", "childrens", "child"], options_ta: ["children", "childs", "childrens", "child"], answer: "children", answer_ta: "children" },
        { q: "Which is an adjective?", q_ta: "எது பெயரடை?", options: ["Beautiful", "Running", "Quickly", "And"], options_ta: ["Beautiful", "Running", "Quickly", "And"], answer: "Beautiful", answer_ta: "Beautiful" },
        { q: "Past tense of 'run'?", q_ta: "'run' இன் இறந்தகாலம்?", options: ["ran", "runned", "running", "runs"], options_ta: ["ran", "runned", "running", "runs"], answer: "ran", answer_ta: "ran" },
        { q: "Choose: I ___ a book yesterday.", q_ta: "I ___ a book yesterday.", options: ["read", "reads", "reading", "readed"], options_ta: ["read", "reads", "reading", "readed"], answer: "read", answer_ta: "read" },
      ],
    },
    {
      number: 2, title: "Vocabulary Lagoon", title_ta: "சொல்வளம் கடல்", isBoss: false,
      questions: [
        { q: "What does 'enormous' mean?", q_ta: "'enormous' என்பதன் பொருள்?", options: ["Very large", "Very small", "Very fast", "Very old"], options_ta: ["மிகப் பெரிய", "மிகச் சிறிய", "மிக வேகமான", "மிகப் பழமையான"], answer: "Very large", answer_ta: "மிகப் பெரிய" },
        { q: "Synonym of 'happy'?", q_ta: "'happy' இன் ஒத்த சொல்?", options: ["Joyful", "Sad", "Angry", "Tired"], options_ta: ["மகிழ்ச்சியான", "சோகமான", "கோபமான", "சோர்வான"], answer: "Joyful", answer_ta: "மகிழ்ச்சியான" },
        { q: "Antonym of 'brave'?", q_ta: "'brave' இன் எதிர்ச்சொல்?", options: ["Cowardly", "Strong", "Kind", "Smart"], options_ta: ["கோழையான", "வலிமையான", "கருணையான", "புத்திசாலி"], answer: "Cowardly", answer_ta: "கோழையான" },
        { q: "What does 'ancient' mean?", q_ta: "'ancient' என்பதன் பொருள்?", options: ["Very old", "Very new", "Very big", "Very fast"], options_ta: ["மிகப் பழமையான", "புதியது", "பெரியது", "வேகமானது"], answer: "Very old", answer_ta: "மிகப் பழமையான" },
        { q: "What is a 'fable'?", q_ta: "'fable' என்றால் என்ன?", options: ["A story with a moral", "A poem", "A letter", "A song"], options_ta: ["நீதிக்கதை", "கவிதை", "கடிதம்", "பாடல்"], answer: "A story with a moral", answer_ta: "நீதிக்கதை" },
      ],
    },
    {
      number: 3, title: "Comprehension Cove", title_ta: "புரிதல் வளைகுடா", isBoss: false,
      questions: [
        { q: "A noun is a name of?", q_ta: "பெயர்ச்சொல் என்ன பெயர்?", options: ["Person, place or thing", "Action", "Description", "Joining word"], options_ta: ["நபர், இடம் அல்லது பொருள்", "செயல்", "விவரிப்பு", "இணைப்புச் சொல்"], answer: "Person, place or thing", answer_ta: "நபர், இடம் அல்லது பொருள்" },
        { q: "Which is a pronoun?", q_ta: "எது பிரதிபெயர்?", options: ["He", "Run", "Beautiful", "Quickly"], options_ta: ["He", "Run", "Beautiful", "Quickly"], answer: "He", answer_ta: "He" },
        { q: "What is a verb?", q_ta: "வினைச்சொல் என்றால்?", options: ["An action word", "A naming word", "A describing word", "A joining word"], options_ta: ["செயல் சொல்", "பெயர் சொல்", "விவரிப்பு சொல்", "இணைப்பு சொல்"], answer: "An action word", answer_ta: "செயல் சொல்" },
        { q: "Fill: The cat sat ___ the mat.", q_ta: "The cat sat ___ the mat.", options: ["on", "in", "at", "by"], options_ta: ["on", "in", "at", "by"], answer: "on", answer_ta: "on" },
        { q: "Which sentence is correct?", q_ta: "எது சரியான வாக்கியம்?", options: ["I am happy.", "I is happy.", "I are happy.", "I be happy."], options_ta: ["I am happy.", "I is happy.", "I are happy.", "I be happy."], answer: "I am happy.", answer_ta: "I am happy." },
      ],
    },
    {
      number: 4, title: "Poetry Pearl", title_ta: "கவிதை முத்து", isBoss: false,
      questions: [
        { q: "Words that sound the same are called?", q_ta: "ஒலி ஒத்த சொற்கள் என்ன?", options: ["Rhyming words", "Synonyms", "Antonyms", "Homophones"], options_ta: ["ஒலி ஒத்த சொற்கள்", "ஒத்த சொற்கள்", "எதிர்ச்சொற்கள்", "ஒரே ஒலி சொற்கள்"], answer: "Rhyming words", answer_ta: "ஒலி ஒத்த சொற்கள்" },
        { q: "Which rhymes with 'cat'?", q_ta: "'cat' உடன் ஒலி ஒத்தது?", options: ["bat", "dog", "cup", "pen"], options_ta: ["bat", "dog", "cup", "pen"], answer: "bat", answer_ta: "bat" },
        { q: "A simile uses?", q_ta: "உவமை எதைப் பயன்படுத்துகிறது?", options: ["Like or as", "But or and", "Is or was", "Not or nor"], options_ta: ["Like or as", "But or and", "Is or was", "Not or nor"], answer: "Like or as", answer_ta: "Like or as" },
        { q: "'As brave as a lion' is a?", q_ta: "'சிங்கம் போல் துணிச்சலான' என்பது?", options: ["Simile", "Metaphor", "Alliteration", "Rhyme"], options_ta: ["உவமை", "உருவகம்", "மோனை", "எதுகை"], answer: "Simile", answer_ta: "உவமை" },
        { q: "A story's main character is the?", q_ta: "கதையின் முக்கிய கதாபாத்திரம்?", options: ["Protagonist", "Villain", "Narrator", "Author"], options_ta: ["கதாநாயகன்", "வில்லன்", "கதை சொல்பவர்", "ஆசிரியர்"], answer: "Protagonist", answer_ta: "கதாநாயகன்" },
      ],
    },
    {
      number: 5, title: "Ocean King Boss 🐙", title_ta: "கடல் அரசன் போஸ் 🐙", isBoss: true,
      questions: [
        { q: "Which is a compound sentence?", q_ta: "எது கூட்டு வாக்கியம்?", options: ["I like tea and she likes coffee.", "I like tea.", "She likes coffee.", "Tea is good."], options_ta: ["I like tea and she likes coffee.", "I like tea.", "She likes coffee.", "Tea is good."], answer: "I like tea and she likes coffee.", answer_ta: "I like tea and she likes coffee." },
        { q: "What does 'magnificent' mean?", q_ta: "'magnificent' என்பதன் பொருள்?", options: ["Grand and impressive", "Small and weak", "Quiet and calm", "Dark and scary"], options_ta: ["பிரமாண்டமான", "சிறிய மற்றும் பலவீனமான", "அமைதியான", "இருண்ட மற்றும் பயமுறுத்தும்"], answer: "Grand and impressive", answer_ta: "பிரமாண்டமான" },
        { q: "An autobiography is about?", q_ta: "சுயசரிதை எதைப்பற்றியது?", options: ["The author's own life", "Someone else's life", "A fictional story", "A news article"], options_ta: ["ஆசிரியரின் சொந்த வாழ்க்கை", "மற்றொருவர் வாழ்க்கை", "கற்பனைக் கதை", "செய்தி கட்டுரை"], answer: "The author's own life", answer_ta: "ஆசிரியரின் சொந்த வாழ்க்கை" },
        { q: "Choose the correct punctuation:", q_ta: "சரியான நிறுத்தற்குறி தேர்வுசெய்:", options: ["Where are you going?", "Where are you going.", "Where are you going!", "where are you going"], options_ta: ["Where are you going?", "Where are you going.", "Where are you going!", "where are you going"], answer: "Where are you going?", answer_ta: "Where are you going?" },
        { q: "'Once upon a time' starts a?", q_ta: "'ஒரு காலத்தில்' என்பது எதை ஆரம்பிக்கும்?", options: ["Fairy tale", "News report", "Essay", "Poem"], options_ta: ["விசித்திரக் கதை", "செய்தி", "கட்டுரை", "கவிதை"], answer: "Fairy tale", answer_ta: "விசித்திரக் கதை" },
      ],
    },
  ];
}

// ── Social World: History Kingdom 🏰 ──
function generateHistorySocialLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Ancient India", title_ta: "பண்டைய இந்தியா", isBoss: false,
      questions: [
        { q: "Who discovered India's sea route?", q_ta: "இந்தியாவின் கடல் வழியை கண்டுபிடித்தவர்?", options: ["Vasco da Gama", "Columbus", "Magellan", "Drake"], options_ta: ["வாஸ்கோ டி காமா", "கொலம்பஸ்", "மெகல்லன்", "டிரேக்"], answer: "Vasco da Gama", answer_ta: "வாஸ்கோ டி காமா" },
        { q: "Indus Valley civilization is also called?", q_ta: "சிந்து சமவெளி நாகரிகம் வேறு பெயர்?", options: ["Harappan", "Vedic", "Gupta", "Maurya"], options_ta: ["ஹரப்பா", "வேத", "குப்த", "மௌரிய"], answer: "Harappan", answer_ta: "ஹரப்பா" },
        { q: "Who was the first emperor of Maurya dynasty?", q_ta: "மௌரிய வம்சத்தின் முதல் மன்னர் யார்?", options: ["Chandragupta", "Ashoka", "Bindusara", "Akbar"], options_ta: ["சந்திரகுப்தர்", "அசோகர்", "பிந்துசாரர்", "அக்பர்"], answer: "Chandragupta", answer_ta: "சந்திரகுப்தர்" },
        { q: "Ashoka embraced which religion after war?", q_ta: "போருக்குப் பின் அசோகர் எந்த மதத்தை ஏற்றார்?", options: ["Buddhism", "Hinduism", "Jainism", "Islam"], options_ta: ["புத்தம்", "இந்து", "சமணம்", "இஸ்லாம்"], answer: "Buddhism", answer_ta: "புத்தம்" },
        { q: "The Vedas were written in which language?", q_ta: "வேதங்கள் எந்த மொழியில் எழுதப்பட்டன?", options: ["Sanskrit", "Tamil", "Hindi", "Pali"], options_ta: ["சமஸ்கிருதம்", "தமிழ்", "இந்தி", "பாலி"], answer: "Sanskrit", answer_ta: "சமஸ்கிருதம்" },
      ],
    },
    {
      number: 2, title: "Freedom Fighters", title_ta: "சுதந்திர போராட்ட வீரர்கள்", isBoss: false,
      questions: [
        { q: "Who is the Father of the Nation?", q_ta: "தேசத்தந்தை யார்?", options: ["Mahatma Gandhi", "Nehru", "Subhash", "Bhagat Singh"], options_ta: ["மகாத்மா காந்தி", "நேரு", "சுபாஷ்", "பகத் சிங்"], answer: "Mahatma Gandhi", answer_ta: "மகாத்மா காந்தி" },
        { q: "When did India get independence?", q_ta: "இந்தியா எப்போது சுதந்திரம் பெற்றது?", options: ["1947", "1950", "1942", "1930"], options_ta: ["1947", "1950", "1942", "1930"], answer: "1947", answer_ta: "1947" },
        { q: "Who gave the slogan 'Do or Die'?", q_ta: "'செய் அல்லது செத்துமடி' யார் சொன்னார்?", options: ["Gandhi", "Nehru", "Bose", "Tilak"], options_ta: ["காந்தி", "நேரு", "போஸ்", "திலக்"], answer: "Gandhi", answer_ta: "காந்தி" },
        { q: "First Prime Minister of India?", q_ta: "இந்தியாவின் முதல் பிரதமர்?", options: ["Jawaharlal Nehru", "Sardar Patel", "Rajendra Prasad", "Ambedkar"], options_ta: ["ஜவஹர்லால் நேரு", "சர்தார் படேல்", "ராஜேந்திர பிரசாத்", "அம்பேத்கர்"], answer: "Jawaharlal Nehru", answer_ta: "ஜவஹர்லால் நேரு" },
        { q: "The Dandi March was against?", q_ta: "தண்டி யாத்திரை எதற்கு எதிரானது?", options: ["Salt Tax", "Land Tax", "Income Tax", "Water Tax"], options_ta: ["உப்பு வரி", "நில வரி", "வருமான வரி", "நீர் வரி"], answer: "Salt Tax", answer_ta: "உப்பு வரி" },
      ],
    },
    {
      number: 3, title: "World Geography", title_ta: "உலக புவியியல்", isBoss: false,
      questions: [
        { q: "Largest continent?", q_ta: "மிகப்பெரிய கண்டம்?", options: ["Asia", "Africa", "Europe", "America"], options_ta: ["ஆசியா", "ஆப்பிரிக்கா", "ஐரோப்பா", "அமெரிக்கா"], answer: "Asia", answer_ta: "ஆசியா" },
        { q: "Longest river in the world?", q_ta: "உலகின் நீளமான நதி?", options: ["Nile", "Amazon", "Ganges", "Mississippi"], options_ta: ["நைல்", "அமேசான்", "கங்கை", "மிசிசிப்பி"], answer: "Nile", answer_ta: "நைல்" },
        { q: "How many continents are there?", q_ta: "எத்தனை கண்டங்கள் உள்ளன?", options: ["7", "5", "6", "8"], options_ta: ["7", "5", "6", "8"], answer: "7", answer_ta: "7" },
        { q: "Which ocean is the largest?", q_ta: "மிகப்பெரிய பெருங்கடல்?", options: ["Pacific", "Atlantic", "Indian", "Arctic"], options_ta: ["பசிபிக்", "அட்லாண்டிக்", "இந்தியப் பெருங்கடல்", "ஆர்க்டிக்"], answer: "Pacific", answer_ta: "பசிபிக்" },
        { q: "Highest mountain in the world?", q_ta: "உலகின் மிக உயரமான மலை?", options: ["Mt. Everest", "K2", "Kangchenjunga", "Makalu"], options_ta: ["எவரெஸ்ட்", "K2", "கஞ்சன்ஜங்கா", "மகாலு"], answer: "Mt. Everest", answer_ta: "எவரெஸ்ட்" },
      ],
    },
    {
      number: 4, title: "Tamil Heritage", title_ta: "தமிழ் பாரம்பரியம்", isBoss: false,
      questions: [
        { q: "Who wrote Thirukkural?", q_ta: "திருக்குறளை எழுதியவர்?", options: ["Thiruvalluvar", "Bharathi", "Ilango", "Kambar"], options_ta: ["திருவள்ளுவர்", "பாரதி", "இளங்கோ", "கம்பர்"], answer: "Thiruvalluvar", answer_ta: "திருவள்ளுவர்" },
        { q: "Capital of Tamil Nadu?", q_ta: "தமிழ்நாட்டின் தலைநகரம்?", options: ["Chennai", "Madurai", "Coimbatore", "Salem"], options_ta: ["சென்னை", "மதுரை", "கோயம்புத்தூர்", "சேலம்"], answer: "Chennai", answer_ta: "சென்னை" },
        { q: "Tamil is one of the ___ languages.", q_ta: "தமிழ் ஒரு ___ மொழி.", options: ["Classical", "Modern", "Foreign", "New"], options_ta: ["செம்மொழி", "நவீன", "அந்நிய", "புதிய"], answer: "Classical", answer_ta: "செம்மொழி" },
        { q: "Chola dynasty is famous for?", q_ta: "சோழ வம்சம் எதற்கு புகழ்பெற்றது?", options: ["Temples", "Forts", "Paintings", "Weapons"], options_ta: ["கோயில்கள்", "கோட்டைகள்", "ஓவியங்கள்", "ஆயுதங்கள்"], answer: "Temples", answer_ta: "கோயில்கள்" },
        { q: "Which dance form is from Tamil Nadu?", q_ta: "தமிழ்நாட்டின் நடன வடிவம்?", options: ["Bharatanatyam", "Kathak", "Odissi", "Kathakali"], options_ta: ["பரதநாட்டியம்", "கதக்", "ஒடிசி", "கதகளி"], answer: "Bharatanatyam", answer_ta: "பரதநாட்டியம்" },
      ],
    },
    {
      number: 5, title: "History Emperor Boss 👑", title_ta: "வரலாற்று மன்னர் போஸ் 👑", isBoss: true,
      questions: [
        { q: "Who built the Taj Mahal?", q_ta: "தாஜ்மஹாலை கட்டியவர்?", options: ["Shah Jahan", "Akbar", "Aurangzeb", "Babur"], options_ta: ["ஷாஜகான்", "அக்பர்", "ஔரங்கசீப்", "பாபர்"], answer: "Shah Jahan", answer_ta: "ஷாஜகான்" },
        { q: "The Indian Constitution was adopted on?", q_ta: "இந்திய அரசியலமைப்பு ஏற்றுக்கொள்ளப்பட்ட நாள்?", options: ["26 Jan 1950", "15 Aug 1947", "26 Nov 1949", "1 Jan 1950"], options_ta: ["26 ஜன 1950", "15 ஆக 1947", "26 நவ 1949", "1 ஜன 1950"], answer: "26 Jan 1950", answer_ta: "26 ஜன 1950" },
        { q: "Who is known as Missile Man of India?", q_ta: "இந்தியாவின் ஏவுகணை மனிதர்?", options: ["APJ Abdul Kalam", "Vikram Sarabhai", "Homi Bhabha", "C.V. Raman"], options_ta: ["APJ அப்துல் கலாம்", "விக்ரம் சாராபாய்", "ஹோமி பாபா", "C.V. ராமன்"], answer: "APJ Abdul Kalam", answer_ta: "APJ அப்துல் கலாம்" },
        { q: "The national bird of India?", q_ta: "இந்தியாவின் தேசிய பறவை?", options: ["Peacock", "Parrot", "Sparrow", "Eagle"], options_ta: ["மயில்", "கிளி", "சிட்டுக்குருவி", "கழுகு"], answer: "Peacock", answer_ta: "மயில்" },
        { q: "Which river is considered sacred?", q_ta: "புனிதமாக கருதப்படும் நதி?", options: ["Ganges", "Yamuna", "Kaveri", "Narmada"], options_ta: ["கங்கை", "யமுனா", "காவிரி", "நர்மதா"], answer: "Ganges", answer_ta: "கங்கை" },
      ],
    },
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 🧠 AI & Future Tech World ──
function generateAITechLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "What is AI? 🤖", title_ta: "AI என்றால் என்ன? 🤖", isBoss: false,
      questions: [
        { q: "What does AI stand for? 🤖", q_ta: "AI என்பதன் விரிவாக்கம்? 🤖", options: ["Artificial Intelligence", "Auto Internet", "Advanced Invention", "Alien Intelligence"], options_ta: ["செயற்கை நுண்ணறிவு", "தானியங்கி இணையம்", "மேம்பட்ட கண்டுபிடிப்பு", "வேற்றுகிரக நுண்ணறிவு"], answer: "Artificial Intelligence", answer_ta: "செயற்கை நுண்ணறிவு" },
        { q: "AI is basically a computer that can... 🧠", q_ta: "AI என்பது அடிப்படையில்... 🧠", options: ["Learn and think", "Cook food", "Fly planes alone", "Read minds"], options_ta: ["கற்றுக்கொள்ளும் & சிந்திக்கும்", "சமையல் செய்யும்", "தனியாக விமானம் ஓட்டும்", "மனம் படிக்கும்"], answer: "Learn and think", answer_ta: "கற்றுக்கொள்ளும் & சிந்திக்கும்" },
        { q: "Which of these uses AI every day? 📱", q_ta: "இவற்றில் தினமும் AI பயன்படுத்துவது? 📱", options: ["YouTube recommendations", "A paper notebook", "A wooden chair", "A glass window"], options_ta: ["YouTube பரிந்துரைகள்", "காகித நோட்புக்", "மர நாற்காலி", "கண்ணாடி ஜன்னல்"], answer: "YouTube recommendations", answer_ta: "YouTube பரிந்துரைகள்" },
        { q: "Siri, Alexa, and Google Assistant are all... 🗣️", q_ta: "Siri, Alexa, Google Assistant அனைத்தும்... 🗣️", options: ["AI voice assistants", "Video games", "Social media apps", "Search engines"], options_ta: ["AI குரல் உதவியாளர்கள்", "வீடியோ கேம்கள்", "சோஷியல் மீடியா ஆப்கள்", "தேடல் இயந்திரங்கள்"], answer: "AI voice assistants", answer_ta: "AI குரல் உதவியாளர்கள்" },
        { q: "Can AI feel emotions like humans? 💭", q_ta: "AI மனிதர்களைப் போல உணர்ச்சிகளை உணர முடியுமா? 💭", options: ["No, it only simulates", "Yes, just like us", "Only when it's sad", "Only on weekends"], options_ta: ["இல்லை, பாசாங்கு மட்டுமே", "ஆம், நம்மைப் போலவே", "சோகமாக இருக்கும்போது மட்டும்", "வார இறுதிகளில் மட்டும்"], answer: "No, it only simulates", answer_ta: "இல்லை, பாசாங்கு மட்டுமே" },
      ],
    },
    {
      number: 2, title: "How ChatGPT Works 💬", title_ta: "ChatGPT எப்படி வேலை செய்கிறது 💬", isBoss: false,
      questions: [
        { q: "ChatGPT is an example of a... 🤖", q_ta: "ChatGPT என்பது ஒரு... 🤖", options: ["Large Language Model", "Video game", "Social media", "Operating system"], options_ta: ["பெரிய மொழி மாடல்", "வீடியோ கேம்", "சோஷியல் மீடியா", "இயக்க அமைப்பு"], answer: "Large Language Model", answer_ta: "பெரிய மொழி மாடல்" },
        { q: "How did ChatGPT learn to talk? 📚", q_ta: "ChatGPT எப்படி பேசக் கற்றுக்கொண்டது? 📚", options: ["By reading billions of texts", "By going to school", "By watching TV", "By listening to music"], options_ta: ["கோடிக்கணக்கான உரைகளைப் படித்து", "பள்ளிக்குச் சென்று", "TV பார்த்து", "இசை கேட்டு"], answer: "By reading billions of texts", answer_ta: "கோடிக்கணக்கான உரைகளைப் படித்து" },
        { q: "What is 'prompt engineering'? ✍️", q_ta: "'Prompt engineering' என்றால் என்ன? ✍️", options: ["Asking AI smart questions", "Building a robot", "Writing code", "Designing websites"], options_ta: ["AI-க்கு புத்திசாலித்தனமான கேள்விகள் கேட்பது", "ரோபோ உருவாக்குவது", "குறியீடு எழுதுவது", "வலைத்தளங்கள் வடிவமைப்பது"], answer: "Asking AI smart questions", answer_ta: "AI-க்கு புத்திசாலித்தனமான கேள்விகள் கேட்பது" },
        { q: "Which company created ChatGPT? 🏢", q_ta: "ChatGPT-ஐ உருவாக்கிய நிறுவனம்? 🏢", options: ["OpenAI", "Google", "Apple", "Microsoft"], options_ta: ["OpenAI", "Google", "Apple", "Microsoft"], answer: "OpenAI", answer_ta: "OpenAI" },
        { q: "ChatGPT can NOT do which of these? ❌", q_ta: "ChatGPT இவற்றில் எதை செய்ய இயலாது? ❌", options: ["See through walls", "Write stories", "Answer questions", "Translate languages"], options_ta: ["சுவர் வழியாகப் பார்ப்பது", "கதைகள் எழுதுவது", "கேள்விகளுக்கு பதிலளிப்பது", "மொழிபெயர்ப்பது"], answer: "See through walls", answer_ta: "சுவர் வழியாகப் பார்ப்பது" },
      ],
    },
    {
      number: 3, title: "Robots & Future Jobs 🦾", title_ta: "ரோபோக்கள் & எதிர்கால வேலைகள் 🦾", isBoss: false,
      questions: [
        { q: "Which job is MOST likely to use AI? 🏥", q_ta: "எந்த வேலையில் AI அதிகம் பயன்படும்? 🏥", options: ["Doctor diagnosing diseases", "Eating lunch", "Sleeping", "Playing in a park"], options_ta: ["நோய் கண்டறியும் மருத்துவர்", "மதிய உணவு சாப்பிடுவது", "தூங்குவது", "பூங்காவில் விளையாடுவது"], answer: "Doctor diagnosing diseases", answer_ta: "நோய் கண்டறியும் மருத்துவர்" },
        { q: "Self-driving cars use AI to... 🚗", q_ta: "சுயமாக ஓடும் கார்கள் AI-ஐ பயன்படுத்தி... 🚗", options: ["See roads and avoid crashes", "Play music", "Wash themselves", "Change tires"], options_ta: ["சாலைகளைப் பார்த்து விபத்தை தவிர்க்கும்", "இசை இசைக்கும்", "தன்னைத் தானே கழுவும்", "டயர் மாற்றும்"], answer: "See roads and avoid crashes", answer_ta: "சாலைகளைப் பார்த்து விபத்தை தவிர்க்கும்" },
        { q: "A future job that doesn't exist today might be... 🚀", q_ta: "இன்று இல்லாத எதிர்கால வேலை... 🚀", options: ["AI Trainer", "Blacksmith", "Town crier", "Lamplighter"], options_ta: ["AI பயிற்சியாளர்", "கொல்லர்", "நகர அறிவிப்பாளர்", "விளக்கு ஏற்றுபவர்"], answer: "AI Trainer", answer_ta: "AI பயிற்சியாளர்" },
        { q: "What is a 'drone'? 🛸", q_ta: "'Drone' என்றால் என்ன? 🛸", options: ["An unmanned flying machine", "A type of fish", "A musical instrument", "A board game"], options_ta: ["ஆளில்லா பறக்கும் இயந்திரம்", "ஒரு வகை மீன்", "இசைக் கருவி", "பலகை விளையாட்டு"], answer: "An unmanned flying machine", answer_ta: "ஆளில்லா பறக்கும் இயந்திரம்" },
        { q: "Which skill will be MOST valuable in the AI age? 💡", q_ta: "AI யுகத்தில் மிகவும் மதிப்புள்ள திறன்? 💡", options: ["Creative thinking", "Memorizing facts", "Copying text", "Sitting quietly"], options_ta: ["படைப்பாற்றல் சிந்தனை", "உண்மைகளை மனப்பாடம் செய்வது", "உரை நகலெடுப்பது", "அமைதியாக உட்காருவது"], answer: "Creative thinking", answer_ta: "படைப்பாற்றல் சிந்தனை" },
      ],
    },
    {
      number: 4, title: "Smart Devices & Space Tech 🛰️", title_ta: "ஸ்மார்ட் சாதனங்கள் & விண்வெளி தொழில்நுட்பம் 🛰️", isBoss: false,
      questions: [
        { q: "A 'smart home' device can... 🏠", q_ta: "'Smart home' சாதனம் செய்யக்கூடியது... 🏠", options: ["Turn lights on by voice", "Cook by itself", "Clean the roof", "Build furniture"], options_ta: ["குரலால் விளக்குகளை ஒளிரச் செய்யும்", "தானே சமைக்கும்", "கூரையை சுத்தம் செய்யும்", "மரச்சாமான்கள் செய்யும்"], answer: "Turn lights on by voice", answer_ta: "குரலால் விளக்குகளை ஒளிரச் செய்யும்" },
        { q: "SpaceX was founded by... 🚀", q_ta: "SpaceX-ஐ நிறுவியவர்... 🚀", options: ["Elon Musk", "Jeff Bezos", "Bill Gates", "Steve Jobs"], options_ta: ["எலான் மஸ்க்", "ஜெஃப் பெசோஸ்", "பில் கேட்ஸ்", "ஸ்டீவ் ஜாப்ஸ்"], answer: "Elon Musk", answer_ta: "எலான் மஸ்க்" },
        { q: "What does IoT stand for? 📡", q_ta: "IoT என்பதன் விரிவாக்கம்? 📡", options: ["Internet of Things", "Inside of Technology", "Intelligence of Tomorrow", "Internet of Telephones"], options_ta: ["பொருட்களின் இணையம்", "தொழில்நுட்பத்தின் உள்ளே", "நாளைய நுண்ணறிவு", "தொலைபேசிகளின் இணையம்"], answer: "Internet of Things", answer_ta: "பொருட்களின் இணையம்" },
        { q: "NASA's Mars rover is called... 🔴", q_ta: "NASA-வின் செவ்வாய் ரோவரின் பெயர்... 🔴", options: ["Perseverance", "Discovery", "Explorer", "Voyager"], options_ta: ["பெர்சிவரன்ஸ்", "டிஸ்கவரி", "எக்ஸ்ப்ளோரர்", "வாயேஜர்"], answer: "Perseverance", answer_ta: "பெர்சிவரன்ஸ்" },
        { q: "A smartwatch can track your... ⌚", q_ta: "ஸ்மார்ட் வாட்ச் உங்கள் ___ கண்காணிக்கும்... ⌚", options: ["Heart rate and steps", "Homework answers", "Friend's location", "Future events"], options_ta: ["இதயத் துடிப்பு & அடிகள்", "வீட்டுப்பாட பதில்கள்", "நண்பரின் இருப்பிடம்", "எதிர்கால நிகழ்வுகள்"], answer: "Heart rate and steps", answer_ta: "இதயத் துடிப்பு & அடிகள்" },
      ],
    },
    {
      number: 5, title: "AI Ethics Boss 🤯", title_ta: "AI நெறிமுறை போஸ் 🤯", isBoss: true,
      questions: [
        { q: "A 'deepfake' is a... 🎭", q_ta: "'Deepfake' என்றால்... 🎭", options: ["Fake video made by AI", "Deep sea creature", "Type of password", "Video game level"], options_ta: ["AI-ஆல் உருவாக்கப்பட்ட போலி வீடியோ", "ஆழ்கடல் உயிரினம்", "ஒரு வகை கடவுச்சொல்", "வீடியோ கேம் நிலை"], answer: "Fake video made by AI", answer_ta: "AI-ஆல் உருவாக்கப்பட்ட போலி வீடியோ" },
        { q: "Should AI decide who goes to jail? ⚖️", q_ta: "யார் சிறைக்குச் செல்வது என்று AI முடிவு செய்யலாமா? ⚖️", options: ["No, humans should decide", "Yes, AI is always right", "Only on Mondays", "Only for small crimes"], options_ta: ["இல்லை, மனிதர்கள் முடிவு செய்ய வேண்டும்", "ஆம், AI எப்போதும் சரி", "திங்கட்கிழமை மட்டும்", "சிறிய குற்றங்களுக்கு மட்டும்"], answer: "No, humans should decide", answer_ta: "இல்லை, மனிதர்கள் முடிவு செய்ய வேண்டும்" },
        { q: "AI bias means... 🚫", q_ta: "AI bias என்றால்... 🚫", options: ["AI learns unfair patterns from data", "AI is always fair", "AI likes blue color", "AI doesn't work"], options_ta: ["AI தரவிலிருந்து நியாயமற்ற முறைகளைக் கற்றுக்கொள்கிறது", "AI எப்போதும் நியாயமானது", "AI நீல நிறத்தை விரும்புகிறது", "AI வேலை செய்யாது"], answer: "AI learns unfair patterns from data", answer_ta: "AI தரவிலிருந்து நியாயமற்ற முறைகளைக் கற்றுக்கொள்கிறது" },
        { q: "Who is responsible when AI makes a mistake? 🤔", q_ta: "AI தவறு செய்யும்போது யார் பொறுப்பு? 🤔", options: ["The humans who built it", "The AI itself", "Nobody", "The internet"], options_ta: ["அதை உருவாக்கிய மனிதர்கள்", "AI தானே", "யாரும் இல்லை", "இணையம்"], answer: "The humans who built it", answer_ta: "அதை உருவாக்கிய மனிதர்கள்" },
        { q: "The BEST way to use AI is to... ✅", q_ta: "AI-ஐ பயன்படுத்த சிறந்த வழி... ✅", options: ["Help humans, not replace them", "Replace all teachers", "Do all homework", "Control everything"], options_ta: ["மனிதர்களுக்கு உதவுவது, மாற்றுவது அல்ல", "எல்லா ஆசிரியர்களையும் மாற்றுவது", "எல்லா வீட்டுப்பாடமும் செய்வது", "எல்லாவற்றையும் கட்டுப்படுத்துவது"], answer: "Help humans, not replace them", answer_ta: "மனிதர்களுக்கு உதவுவது, மாற்றுவது அல்ல" },
      ],
    },
  ];
}

// ── 🌐 Internet Explorer World ──
function generateInternetLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Internet History 📜", title_ta: "இணைய வரலாறு 📜", isBoss: false,
      questions: [
        { q: "The internet was originally created for... 🏛️", q_ta: "இணையம் முதலில் உருவாக்கப்பட்டது... 🏛️", options: ["Military communication", "Playing games", "Watching movies", "Shopping online"], options_ta: ["இராணுவ தகவல் தொடர்பு", "கேம் விளையாடுவது", "திரைப்படம் பார்ப்பது", "ஆன்லைன் ஷாப்பிங்"], answer: "Military communication", answer_ta: "இராணுவ தகவல் தொடர்பு" },
        { q: "The first website ever was created in... 📅", q_ta: "முதல் வலைத்தளம் உருவாக்கப்பட்ட ஆண்டு... 📅", options: ["1991", "2005", "1975", "2010"], options_ta: ["1991", "2005", "1975", "2010"], answer: "1991", answer_ta: "1991" },
        { q: "What does 'WWW' stand for? 🌐", q_ta: "'WWW' என்பதன் விரிவாக்கம்? 🌐", options: ["World Wide Web", "We Want Wi-Fi", "Wireless Web World", "Wide World Waves"], options_ta: ["உலகளாவிய வலை", "நாங்கள் Wi-Fi விரும்புகிறோம்", "வயர்லெஸ் வலை உலகம்", "பரந்த உலக அலைகள்"], answer: "World Wide Web", answer_ta: "உலகளாவிய வலை" },
        { q: "Google was started in a... 🏠", q_ta: "Google தொடங்கப்பட்ட இடம்... 🏠", options: ["Garage", "Skyscraper", "School", "Hospital"], options_ta: ["கேரேஜ்", "வானளாவிய கட்டிடம்", "பள்ளி", "மருத்துவமனை"], answer: "Garage", answer_ta: "கேரேஜ்" },
        { q: "WiFi uses ___ to send data 📡", q_ta: "WiFi தரவை அனுப்ப ___ பயன்படுத்துகிறது 📡", options: ["Radio waves", "Laser beams", "Sound waves", "Magic spells"], options_ta: ["ரேடியோ அலைகள்", "லேசர் கதிர்கள்", "ஒலி அலைகள்", "மந்திர மாய வித்தைகள்"], answer: "Radio waves", answer_ta: "ரேடியோ அலைகள்" },
      ],
    },
    {
      number: 2, title: "Memes & Viral Trends 😂", title_ta: "மீம்ஸ் & வைரல் ட்ரெண்ட்ஸ் 😂", isBoss: false,
      questions: [
        { q: "A 'meme' is basically... 😂", q_ta: "'மீம்' என்பது அடிப்படையில்... 😂", options: ["A funny idea shared online", "A computer virus", "A type of food", "A video game"], options_ta: ["ஆன்லைனில் பகிரப்படும் வேடிக்கையான யோசனை", "கணினி வைரஸ்", "ஒரு வகை உணவு", "வீடியோ கேம்"], answer: "A funny idea shared online", answer_ta: "ஆன்லைனில் பகிரப்படும் வேடிக்கையான யோசனை" },
        { q: "What makes content go 'viral'? 🔥", q_ta: "உள்ளடக்கம் 'வைரல்' ஆவது எப்படி? 🔥", options: ["Millions share it quickly", "It has a virus", "It's very expensive", "It's printed on paper"], options_ta: ["லட்சக்கணக்கானோர் விரைவாக பகிர்வார்கள்", "அதில் வைரஸ் இருக்கிறது", "மிகவும் விலை உயர்ந்தது", "காகிதத்தில் அச்சிடப்படுகிறது"], answer: "Millions share it quickly", answer_ta: "லட்சக்கணக்கானோர் விரைவாக பகிர்வார்கள்" },
        { q: "The 'algorithm' on social media decides... 🤖", q_ta: "சோஷியல் மீடியா 'அல்காரிதம்' முடிவு செய்வது... 🤖", options: ["What you see in your feed", "Your phone's battery", "Your school grades", "The weather"], options_ta: ["உங்கள் ஃபீடில் என்ன காண்பிப்பது", "உங்கள் போன் பேட்டரி", "உங்கள் பள்ளி மதிப்பெண்கள்", "வானிலை"], answer: "What you see in your feed", answer_ta: "உங்கள் ஃபீடில் என்ன காண்பிப்பது" },
        { q: "A 'hashtag' (#) is used to... #️⃣", q_ta: "'Hashtag' (#) பயன்படுவது... #️⃣", options: ["Group similar posts", "Lock your account", "Delete messages", "Change your name"], options_ta: ["ஒத்த பதிவுகளை குழுவாக்குவது", "உங்கள் கணக்கை பூட்டுவது", "செய்திகளை நீக்குவது", "உங்கள் பெயரை மாற்றுவது"], answer: "Group similar posts", answer_ta: "ஒத்த பதிவுகளை குழுவாக்குவது" },
        { q: "The 'creator economy' means... 💰", q_ta: "'Creator economy' என்றால்... 💰", options: ["People earn money making content", "Factories making things", "Banks creating coins", "Teachers creating exams"], options_ta: ["மக்கள் உள்ளடக்கம் உருவாக்கி பணம் சம்பாதிப்பது", "பொருட்கள் தயாரிக்கும் தொழிற்சாலைகள்", "நாணயங்கள் உருவாக்கும் வங்கிகள்", "தேர்வு உருவாக்கும் ஆசிரியர்கள்"], answer: "People earn money making content", answer_ta: "மக்கள் உள்ளடக்கம் உருவாக்கி பணம் சம்பாதிப்பது" },
      ],
    },
    {
      number: 3, title: "Cyber Safety Shield 🛡️", title_ta: "இணைய பாதுகாப்பு கவசம் 🛡️", isBoss: false,
      questions: [
        { q: "A strong password should have... 🔐", q_ta: "வலுவான கடவுச்சொல்லில் இருக்க வேண்டியது... 🔐", options: ["Letters, numbers & symbols", "Only your name", "Only 123456", "Your birthday"], options_ta: ["எழுத்துகள், எண்கள் & குறியீடுகள்", "உங்கள் பெயர் மட்டும்", "123456 மட்டும்", "உங்கள் பிறந்தநாள்"], answer: "Letters, numbers & symbols", answer_ta: "எழுத்துகள், எண்கள் & குறியீடுகள்" },
        { q: "A stranger online asks for your address. You should... 🚨", q_ta: "ஆன்லைனில் அறிமுகமில்லாதவர் உங்கள் முகவரி கேட்கிறார்... 🚨", options: ["Never share it", "Share immediately", "Ask for theirs first", "Post it publicly"], options_ta: ["ஒருபோதும் பகிர வேண்டாம்", "உடனடியாக பகிருங்கள்", "முதலில் அவர்களுடையதை கேளுங்கள்", "பகிரங்கமாக போடுங்கள்"], answer: "Never share it", answer_ta: "ஒருபோதும் பகிர வேண்டாம்" },
        { q: "What is 'phishing'? 🎣", q_ta: "'Phishing' என்றால் என்ன? 🎣", options: ["Fake emails stealing your info", "Catching real fish", "A video game", "A type of phone"], options_ta: ["உங்கள் தகவலை திருடும் போலி மின்னஞ்சல்கள்", "உண்மையான மீன்பிடித்தல்", "ஒரு வீடியோ கேம்", "ஒரு வகை போன்"], answer: "Fake emails stealing your info", answer_ta: "உங்கள் தகவலை திருடும் போலி மின்னஞ்சல்கள்" },
        { q: "Your 'digital footprint' is... 👣", q_ta: "உங்கள் 'digital footprint' என்பது... 👣", options: ["Everything you do online stays", "Your shoe size", "A phone app", "A game character"], options_ta: ["ஆன்லைனில் நீங்கள் செய்வது அனைத்தும் நிலைத்திருக்கும்", "உங்கள் காலணி அளவு", "ஒரு போன் ஆப்", "ஒரு கேம் கதாபாத்திரம்"], answer: "Everything you do online stays", answer_ta: "ஆன்லைனில் நீங்கள் செய்வது அனைத்தும் நிலைத்திருக்கும்" },
        { q: "Two-factor authentication (2FA) adds... 🔒", q_ta: "Two-factor authentication (2FA) சேர்ப்பது... 🔒", options: ["Extra security layer", "Extra games", "Extra storage", "Extra speed"], options_ta: ["கூடுதல் பாதுகாப்பு அடுக்கு", "கூடுதல் கேம்கள்", "கூடுதல் சேமிப்பு", "கூடுதல் வேகம்"], answer: "Extra security layer", answer_ta: "கூடுதல் பாதுகாப்பு அடுக்கு" },
      ],
    },
    {
      number: 4, title: "Fake News Detective 🕵️", title_ta: "போலி செய்தி துப்பறிவாளர் 🕵️", isBoss: false,
      questions: [
        { q: "How to spot fake news? 🔍", q_ta: "போலி செய்தியை எப்படி கண்டறிவது? 🔍", options: ["Check multiple sources", "Believe everything you read", "Share it immediately", "Only read headlines"], options_ta: ["பல ஆதாரங்களை சரிபாருங்கள்", "படிப்பதை எல்லாம் நம்புங்கள்", "உடனடியாக பகிருங்கள்", "தலைப்புகளை மட்டும் படியுங்கள்"], answer: "Check multiple sources", answer_ta: "பல ஆதாரங்களை சரிபாருங்கள்" },
        { q: "A 'clickbait' headline is designed to... 🖱️", q_ta: "'Clickbait' தலைப்பு வடிவமைக்கப்பட்டது... 🖱️", options: ["Trick you into clicking", "Give accurate info", "Help you study", "Save your time"], options_ta: ["கிளிக் செய்ய ஏமாற்றுவது", "துல்லியமான தகவல் தருவது", "படிக்க உதவுவது", "நேரத்தை மிச்சப்படுத்துவது"], answer: "Trick you into clicking", answer_ta: "கிளிக் செய்ய ஏமாற்றுவது" },
        { q: "If a website has no author name, it might be... ⚠️", q_ta: "ஒரு வலைத்தளத்தில் ஆசிரியர் பெயர் இல்லை என்றால்... ⚠️", options: ["Unreliable", "Very trustworthy", "Government official", "Always true"], options_ta: ["நம்பகத்தன்மையற்றது", "மிகவும் நம்பகமானது", "அரசாங்க அதிகாரி", "எப்போதும் உண்மை"], answer: "Unreliable", answer_ta: "நம்பகத்தன்மையற்றது" },
        { q: "An online scam usually offers... 💸", q_ta: "ஆன்லைன் மோசடி பொதுவாக வழங்குவது... 💸", options: ["Free money too good to be true", "Free education", "Free books", "Free homework help"], options_ta: ["நம்ப முடியாத இலவச பணம்", "இலவச கல்வி", "இலவச புத்தகங்கள்", "இலவச வீட்டுப்பாட உதவி"], answer: "Free money too good to be true", answer_ta: "நம்ப முடியாத இலவச பணம்" },
        { q: "Before sharing news, always... ✅", q_ta: "செய்தியை பகிர்வதற்கு முன், எப்போதும்... ✅", options: ["Verify if it's true", "Share it fast for likes", "Add your own story", "Change the headline"], options_ta: ["உண்மையா என்று சரிபாருங்கள்", "லைக்குக்காக வேகமாக பகிருங்கள்", "உங்கள் சொந்த கதையை சேருங்கள்", "தலைப்பை மாற்றுங்கள்"], answer: "Verify if it's true", answer_ta: "உண்மையா என்று சரிபாருங்கள்" },
      ],
    },
    {
      number: 5, title: "Digital Citizen Boss 🌐", title_ta: "டிஜிட்டல் குடிமகன் போஸ் 🌐", isBoss: true,
      questions: [
        { q: "Cyberbullying is... 😔", q_ta: "இணையத் துன்புறுத்தல் என்றால்... 😔", options: ["Hurting someone online", "Playing games online", "Studying online", "Shopping online"], options_ta: ["ஆன்லைனில் யாரையாவது புண்படுத்துவது", "ஆன்லைனில் கேம் விளையாடுவது", "ஆன்லைனில் படிப்பது", "ஆன்லைனில் ஷாப்பிங்"], answer: "Hurting someone online", answer_ta: "ஆன்லைனில் யாரையாவது புண்படுத்துவது" },
        { q: "The minimum age for most social media is... 📱", q_ta: "பெரும்பாலான சோஷியல் மீடியாவின் குறைந்தபட்ச வயது... 📱", options: ["13 years", "5 years", "18 years", "No limit"], options_ta: ["13 வயது", "5 வயது", "18 வயது", "வரம்பு இல்லை"], answer: "13 years", answer_ta: "13 வயது" },
        { q: "Screen time should be... ⏰", q_ta: "திரை நேரம் இருக்க வேண்டும்... ⏰", options: ["Balanced with outdoor play", "24 hours a day", "Only at night", "While eating"], options_ta: ["வெளிப்புற விளையாட்டுடன் சமநிலையில்", "நாளில் 24 மணி நேரம்", "இரவில் மட்டும்", "சாப்பிடும் போது"], answer: "Balanced with outdoor play", answer_ta: "வெளிப்புற விளையாட்டுடன் சமநிலையில்" },
        { q: "Copyright means... ©️", q_ta: "பதிப்புரிமை என்றால்... ©️", options: ["You can't copy someone's work", "Everything is free to use", "Only books have rights", "Music has no owner"], options_ta: ["மற்றவர் படைப்பை நகலெடுக்க முடியாது", "எல்லாம் இலவசமாக பயன்படுத்தலாம்", "புத்தகங்களுக்கு மட்டுமே உரிமை", "இசைக்கு உரிமையாளர் இல்லை"], answer: "You can't copy someone's work", answer_ta: "மற்றவர் படைப்பை நகலெடுக்க முடியாது" },
        { q: "Being a good digital citizen means... 🌟", q_ta: "நல்ல டிஜிட்டல் குடிமகனாக இருப்பது என்றால்... 🌟", options: ["Being kind & safe online", "Having the most followers", "Posting everything", "Never going offline"], options_ta: ["ஆன்லைனில் அன்பாகவும் பாதுகாப்பாகவும் இருப்பது", "அதிக followers வைத்திருப்பது", "எல்லாவற்றையும் பதிவிடுவது", "ஒருபோதும் ஆஃப்லைன் ஆகாதிருப்பது"], answer: "Being kind & safe online", answer_ta: "ஆன்லைனில் அன்பாகவும் பாதுகாப்பாகவும் இருப்பது" },
      ],
    },
  ];
}

// ── 🚀 Innovation Lab World ──
function generateInnovationLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Startup Thinking 💡", title_ta: "ஸ்டார்ட்அப் சிந்தனை 💡", isBoss: false,
      questions: [
        { q: "A 'startup' is a... 🚀", q_ta: "'ஸ்டார்ட்அப்' என்பது... 🚀", options: ["New business solving a problem", "A type of car", "A school club", "A cooking recipe"], options_ta: ["ஒரு பிரச்சனையை தீர்க்கும் புதிய வணிகம்", "ஒரு வகை கார்", "ஒரு பள்ளி கிளப்", "ஒரு சமையல் குறிப்பு"], answer: "New business solving a problem", answer_ta: "ஒரு பிரச்சனையை தீர்க்கும் புதிய வணிகம்" },
        { q: "The first step to start a business is... 📝", q_ta: "வணிகம் தொடங்குவதற்கான முதல் படி... 📝", options: ["Finding a problem to solve", "Buying a building", "Hiring 100 people", "Making a logo"], options_ta: ["தீர்க்க ஒரு பிரச்சனையை கண்டுபிடிப்பது", "ஒரு கட்டிடம் வாங்குவது", "100 பேரை பணியமர்த்துவது", "லோகோ செய்வது"], answer: "Finding a problem to solve", answer_ta: "தீர்க்க ஒரு பிரச்சனையை கண்டுபிடிப்பது" },
        { q: "An 'entrepreneur' is someone who... 🧑‍💼", q_ta: "'தொழில்முனைவோர்' என்பவர்... 🧑‍💼", options: ["Starts their own business", "Only works for others", "Never takes risks", "Avoids new ideas"], options_ta: ["சொந்த வணிகம் தொடங்குபவர்", "மற்றவர்களுக்கு மட்டும் வேலை செய்பவர்", "ஒருபோதும் ரிஸ்க் எடுக்காதவர்", "புதிய யோசனைகளை தவிர்ப்பவர்"], answer: "Starts their own business", answer_ta: "சொந்த வணிகம் தொடங்குபவர்" },
        { q: "A 'pitch' in business means... 🎤", q_ta: "வணிகத்தில் 'pitch' என்றால்... 🎤", options: ["Presenting your idea", "Throwing a ball", "Singing a song", "Writing an exam"], options_ta: ["உங்கள் யோசனையை முன்வைப்பது", "பந்து வீசுவது", "பாட்டு பாடுவது", "தேர்வு எழுதுவது"], answer: "Presenting your idea", answer_ta: "உங்கள் யோசனையை முன்வைப்பது" },
        { q: "MVP stands for... 🎯", q_ta: "MVP என்பதன் விரிவாக்கம்... 🎯", options: ["Minimum Viable Product", "Most Valuable Player", "Maximum Video Power", "My Very Popular"], options_ta: ["குறைந்தபட்ச சாத்தியமான தயாரிப்பு", "மிகவும் மதிப்புமிக்க வீரர்", "அதிகபட்ச வீடியோ சக்தி", "என் மிகவும் பிரபலமான"], answer: "Minimum Viable Product", answer_ta: "குறைந்தபட்ச சாத்தியமான தயாரிப்பு" },
      ],
    },
    {
      number: 2, title: "Famous Founders 🌟", title_ta: "புகழ்பெற்ற நிறுவனர்கள் 🌟", isBoss: false,
      questions: [
        { q: "Who founded Apple? 🍎", q_ta: "Apple-ஐ நிறுவியவர்? 🍎", options: ["Steve Jobs", "Elon Musk", "Mark Zuckerberg", "Bill Gates"], options_ta: ["ஸ்டீவ் ஜாப்ஸ்", "எலான் மஸ்க்", "மார்க் சக்கர்பெர்க்", "பில் கேட்ஸ்"], answer: "Steve Jobs", answer_ta: "ஸ்டீவ் ஜாப்ஸ்" },
        { q: "Mark Zuckerberg created which platform? 👤", q_ta: "மார்க் சக்கர்பெர்க் உருவாக்கிய தளம்? 👤", options: ["Facebook", "Twitter", "YouTube", "TikTok"], options_ta: ["Facebook", "Twitter", "YouTube", "TikTok"], answer: "Facebook", answer_ta: "Facebook" },
        { q: "Jeff Bezos started Amazon as a... 📦", q_ta: "ஜெஃப் பெசோஸ் Amazon-ஐ தொடங்கியது... 📦", options: ["Online bookstore", "Pizza shop", "Car company", "Movie studio"], options_ta: ["ஆன்லைன் புத்தகக் கடை", "பீஸ்ஸா கடை", "கார் நிறுவனம்", "திரைப்பட ஸ்டுடியோ"], answer: "Online bookstore", answer_ta: "ஆன்லைன் புத்தகக் கடை" },
        { q: "YouTube was bought by ___ for $1.65 billion 🤯", q_ta: "YouTube-ஐ $1.65 பில்லியனுக்கு வாங்கியது... 🤯", options: ["Google", "Apple", "Microsoft", "Amazon"], options_ta: ["Google", "Apple", "Microsoft", "Amazon"], answer: "Google", answer_ta: "Google" },
        { q: "Instagram started as a ___ sharing app 📸", q_ta: "Instagram தொடங்கியது ஒரு ___ பகிர்வு ஆப்பாக 📸", options: ["Photo", "Music", "Video", "Book"], options_ta: ["புகைப்படம்", "இசை", "வீடியோ", "புத்தகம்"], answer: "Photo", answer_ta: "புகைப்படம்" },
      ],
    },
    {
      number: 3, title: "Billion-Dollar Ideas 💎", title_ta: "பில்லியன் டாலர் யோசனைகள் 💎", isBoss: false,
      questions: [
        { q: "Uber solved the problem of... 🚕", q_ta: "Uber தீர்த்த பிரச்சனை... 🚕", options: ["Finding rides easily", "Making food", "Building houses", "Teaching kids"], options_ta: ["எளிதாக வாகனம் கிடைப்பது", "உணவு தயாரிப்பது", "வீடு கட்டுவது", "குழந்தைகளுக்கு கற்பிப்பது"], answer: "Finding rides easily", answer_ta: "எளிதாக வாகனம் கிடைப்பது" },
        { q: "Netflix disrupted the ___ industry 📺", q_ta: "Netflix ___ துறையை மாற்றியது 📺", options: ["Entertainment / Movies", "Education", "Healthcare", "Agriculture"], options_ta: ["பொழுதுபோக்கு / திரைப்படம்", "கல்வி", "சுகாதாரம்", "விவசாயம்"], answer: "Entertainment / Movies", answer_ta: "பொழுதுபோக்கு / திரைப்படம்" },
        { q: "A 'unicorn' startup is valued at... 🦄", q_ta: "'யூனிகார்ன்' ஸ்டார்ட்அப் மதிப்பு... 🦄", options: ["$1 billion or more", "$100", "$1 million", "$10,000"], options_ta: ["$1 பில்லியன் அல்லது அதிகம்", "$100", "$1 மில்லியன்", "$10,000"], answer: "$1 billion or more", answer_ta: "$1 பில்லியன் அல்லது அதிகம்" },
        { q: "WhatsApp was acquired for ___ billion 💰", q_ta: "WhatsApp வாங்கப்பட்ட தொகை ___ பில்லியன் 💰", options: ["$19", "$1", "$5", "$50"], options_ta: ["$19", "$1", "$5", "$50"], answer: "$19", answer_ta: "$19" },
        { q: "A good business idea usually comes from... 💭", q_ta: "நல்ல வணிக யோசனை பொதுவாக வருவது... 💭", options: ["Solving real problems", "Copying others exactly", "Spending lots of money", "Waiting for luck"], options_ta: ["உண்மையான பிரச்சனைகளை தீர்ப்பது", "மற்றவர்களை அப்படியே நகலெடுப்பது", "நிறைய பணம் செலவழிப்பது", "அதிர்ஷ்டத்திற்காக காத்திருப்பது"], answer: "Solving real problems", answer_ta: "உண்மையான பிரச்சனைகளை தீர்ப்பது" },
      ],
    },
    {
      number: 4, title: "Business Basics 📊", title_ta: "வணிக அடிப்படைகள் 📊", isBoss: false,
      questions: [
        { q: "A 'brand' is... 🏷️", q_ta: "'Brand' என்றால்... 🏷️", options: ["How people recognize your business", "A type of food", "A school subject", "A sport"], options_ta: ["மக்கள் உங்கள் வணிகத்தை அடையாளம் காணும் விதம்", "ஒரு வகை உணவு", "ஒரு பள்ளி பாடம்", "ஒரு விளையாட்டு"], answer: "How people recognize your business", answer_ta: "மக்கள் உங்கள் வணிகத்தை அடையாளம் காணும் விதம்" },
        { q: "A 'logo' helps people... 🎨", q_ta: "'லோகோ' மக்களுக்கு உதவுவது... 🎨", options: ["Remember your brand instantly", "Forget your product", "Buy more expensive things", "Change their phone"], options_ta: ["உங்கள் brand-ஐ உடனடியாக நினைவில் கொள்வது", "உங்கள் தயாரிப்பை மறப்பது", "அதிக விலை பொருட்கள் வாங்குவது", "போனை மாற்றுவது"], answer: "Remember your brand instantly", answer_ta: "உங்கள் brand-ஐ உடனடியாக நினைவில் கொள்வது" },
        { q: "'Profit' means... 💵", q_ta: "'லாபம்' என்றால்... 💵", options: ["Money earned minus costs", "Total money spent", "Money in a piggy bank", "Your allowance"], options_ta: ["சம்பாதித்த பணம் - செலவுகள்", "மொத்தம் செலவழித்த பணம்", "உண்டியலில் உள்ள பணம்", "உங்கள் பாக்கெட் மணி"], answer: "Money earned minus costs", answer_ta: "சம்பாதித்த பணம் - செலவுகள்" },
        { q: "'Marketing' is about... 📢", q_ta: "'மார்க்கெட்டிங்' என்பது... 📢", options: ["Telling people about your product", "Going to the market to buy fruits", "Studying math", "Playing sports"], options_ta: ["உங்கள் தயாரிப்பைப் பற்றி மக்களுக்கு சொல்வது", "பழங்கள் வாங்க மார்க்கெட் போவது", "கணிதம் படிப்பது", "விளையாட்டு விளையாடுவது"], answer: "Telling people about your product", answer_ta: "உங்கள் தயாரிப்பைப் பற்றி மக்களுக்கு சொல்வது" },
        { q: "A 'customer' is... 👤", q_ta: "'வாடிக்கையாளர்' என்பவர்... 👤", options: ["Someone who buys your product", "Your best friend", "Your teacher", "Your pet"], options_ta: ["உங்கள் தயாரிப்பை வாங்குபவர்", "உங்கள் சிறந்த நண்பர்", "உங்கள் ஆசிரியர்", "உங்கள் செல்லப்பிராணி"], answer: "Someone who buys your product", answer_ta: "உங்கள் தயாரிப்பை வாங்குபவர்" },
      ],
    },
    {
      number: 5, title: "Future Founder Boss 🏆", title_ta: "எதிர்கால நிறுவனர் போஸ் 🏆", isBoss: true,
      questions: [
        { q: "The most important trait of an entrepreneur? 💪", q_ta: "தொழில்முனைவோரின் முக்கியமான குணம்? 💪", options: ["Never giving up", "Being the smartest", "Having the most money", "Being the tallest"], options_ta: ["ஒருபோதும் விட்டுக்கொடுக்காதது", "மிகவும் புத்திசாலியாக இருப்பது", "அதிக பணம் வைத்திருப்பது", "மிகவும் உயரமாக இருப்பது"], answer: "Never giving up", answer_ta: "ஒருபோதும் விட்டுக்கொடுக்காதது" },
        { q: "A successful business needs to know its... 🎯", q_ta: "வெற்றிகரமான வணிகம் தெரிந்துகொள்ள வேண்டியது... 🎯", options: ["Target audience", "Favorite color", "Lucky number", "Best joke"], options_ta: ["இலக்கு வாடிக்கையாளர்கள்", "பிடித்த நிறம்", "அதிர்ஷ்ட எண்", "சிறந்த நகைச்சுவை"], answer: "Target audience", answer_ta: "இலக்கு வாடிக்கையாளர்கள்" },
        { q: "Innovation means... 🔬", q_ta: "புதுமை என்றால்... 🔬", options: ["Creating something new & useful", "Copying exactly what exists", "Breaking things", "Doing nothing new"], options_ta: ["புதியதும் பயனுள்ளதும் உருவாக்குவது", "இருப்பதை அப்படியே நகலெடுப்பது", "பொருட்களை உடைப்பது", "புதியது எதுவும் செய்யாதிருப்பது"], answer: "Creating something new & useful", answer_ta: "புதியதும் பயனுள்ளதும் உருவாக்குவது" },
        { q: "Failure in business should be seen as... 📖", q_ta: "வணிகத்தில் தோல்வியை எப்படி பார்க்க வேண்டும்... 📖", options: ["A lesson to learn from", "A reason to quit forever", "Someone else's fault", "Bad luck only"], options_ta: ["கற்றுக்கொள்ள ஒரு பாடம்", "எப்போதும் விட்டுவிட ஒரு காரணம்", "வேறொருவரின் தவறு", "துரதிர்ஷ்டம் மட்டுமே"], answer: "A lesson to learn from", answer_ta: "கற்றுக்கொள்ள ஒரு பாடம்" },
        { q: "To succeed, entrepreneurs must... 🌟", q_ta: "வெற்றிபெற, தொழில்முனைவோர்... 🌟", options: ["Solve problems creatively", "Wait for someone to help", "Only follow rules", "Avoid all challenges"], options_ta: ["பிரச்சனைகளை படைப்பாற்றலுடன் தீர்க்க வேண்டும்", "யாரோ உதவ காத்திருக்க வேண்டும்", "விதிகளை மட்டும் பின்பற்ற வேண்டும்", "எல்லா சவால்களையும் தவிர்க்க வேண்டும்"], answer: "Solve problems creatively", answer_ta: "பிரச்சனைகளை படைப்பாற்றலுடன் தீர்க்க வேண்டும்" },
      ],
    },
  ];
}

// ── 😂 Fun Facts Universe ──
function generateFunFactsLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Weird Science 🔬", title_ta: "வினோத அறிவியல் 🔬", isBoss: false,
      questions: [
        { q: "How many times does your heart beat per day? 💓", q_ta: "உங்கள் இதயம் ஒரு நாளில் எத்தனை முறை துடிக்கிறது? 💓", options: ["~100,000 times", "~1,000 times", "~10 times", "~1 million times"], options_ta: ["~100,000 முறை", "~1,000 முறை", "~10 முறை", "~1 மில்லியன் முறை"], answer: "~100,000 times", answer_ta: "~100,000 முறை" },
        { q: "Honey never... 🍯", q_ta: "தேன் ஒருபோதும்... 🍯", options: ["Spoils or expires", "Tastes sweet", "Is yellow", "Comes from bees"], options_ta: ["கெடாது அல்லது காலாவதியாகாது", "இனிப்பாக இருக்கும்", "மஞ்சள் நிறமாக இருக்கும்", "தேனீக்களிடமிருந்து வரும்"], answer: "Spoils or expires", answer_ta: "கெடாது அல்லது காலாவதியாகாது" },
        { q: "Octopuses have ___ hearts! 🐙", q_ta: "ஆக்டோபஸுக்கு ___ இதயங்கள்! 🐙", options: ["3", "1", "5", "8"], options_ta: ["3", "1", "5", "8"], answer: "3", answer_ta: "3" },
        { q: "A bolt of lightning is ___ times hotter than the Sun! ⚡", q_ta: "ஒரு மின்னல் சூரியனை விட ___ மடங்கு சூடானது! ⚡", options: ["5", "2", "10", "Half"], options_ta: ["5", "2", "10", "பாதி"], answer: "5", answer_ta: "5" },
        { q: "Bananas are slightly... 🍌", q_ta: "வாழைப்பழங்கள் சற்று... 🍌", options: ["Radioactive!", "Magnetic", "Invisible", "Square-shaped"], options_ta: ["கதிரியக்கமானவை!", "காந்தமானவை", "கண்ணுக்கு தெரியாதவை", "சதுர வடிவமானவை"], answer: "Radioactive!", answer_ta: "கதிரியக்கமானவை!" },
      ],
    },
    {
      number: 2, title: "Brain Tricks 🧠", title_ta: "மூளை தந்திரங்கள் 🧠", isBoss: false,
      questions: [
        { q: "Your brain uses about ___% of your body's energy 🧠", q_ta: "உங்கள் மூளை உடலின் ___% ஆற்றலை பயன்படுத்துகிறது 🧠", options: ["20%", "5%", "50%", "1%"], options_ta: ["20%", "5%", "50%", "1%"], answer: "20%", answer_ta: "20%" },
        { q: "Optical illusions trick your... 👁️", q_ta: "ஒளியியல் மாயைகள் ஏமாற்றுவது... 👁️", options: ["Brain's perception", "Nose", "Ears", "Tongue"], options_ta: ["மூளையின் புலனுணர்வை", "மூக்கை", "காதுகளை", "நாக்கை"], answer: "Brain's perception", answer_ta: "மூளையின் புலனுணர்வை" },
        { q: "You dream about ___ hours per night 💤", q_ta: "நீங்கள் ஒரு இரவில் ___ மணி நேரம் கனவு காண்பீர்கள் 💤", options: ["~2 hours", "~8 hours", "~0 hours", "~30 minutes"], options_ta: ["~2 மணி", "~8 மணி", "~0 மணி", "~30 நிமிடங்கள்"], answer: "~2 hours", answer_ta: "~2 மணி" },
        { q: "The brain can process images in just ___ milliseconds! 📸", q_ta: "மூளை ___ மில்லி வினாடிகளில் படங்களை செயலாக்கும்! 📸", options: ["13", "1000", "500", "100"], options_ta: ["13", "1000", "500", "100"], answer: "13", answer_ta: "13" },
        { q: "Laughing uses ___ muscles in your face 😂", q_ta: "சிரிப்பது உங்கள் முகத்தில் ___ தசைகளை பயன்படுத்துகிறது 😂", options: ["17", "2", "100", "1"], options_ta: ["17", "2", "100", "1"], answer: "17", answer_ta: "17" },
      ],
    },
    {
      number: 3, title: "Space Mysteries 🌌", title_ta: "விண்வெளி மர்மங்கள் 🌌", isBoss: false,
      questions: [
        { q: "One day on Venus is longer than its... 🌍", q_ta: "வீனஸில் ஒரு நாள் அதன் ___ விட நீளமானது... 🌍", options: ["Year!", "Hour", "Minute", "Second"], options_ta: ["ஆண்டை விட!", "மணியை விட", "நிமிடத்தை விட", "வினாடியை விட"], answer: "Year!", answer_ta: "ஆண்டை விட!" },
        { q: "A teaspoon of a neutron star weighs... ⭐", q_ta: "நியூட்ரான் நட்சத்திரத்தின் ஒரு தேக்கரண்டி எடை... ⭐", options: ["~6 billion tons", "~1 kg", "~100 kg", "Nothing"], options_ta: ["~6 பில்லியன் டன்", "~1 கிலோ", "~100 கிலோ", "எதுவும் இல்லை"], answer: "~6 billion tons", answer_ta: "~6 பில்லியன் டன்" },
        { q: "How many Earths could fit inside the Sun? ☀️", q_ta: "சூரியனுக்குள் எத்தனை பூமிகள் பொருந்தும்? ☀️", options: ["~1.3 million", "~100", "~10", "~1 billion"], options_ta: ["~13 லட்சம்", "~100", "~10", "~100 கோடி"], answer: "~1.3 million", answer_ta: "~13 லட்சம்" },
        { q: "There are more stars in the universe than... ✨", q_ta: "பிரபஞ்சத்தில் நட்சத்திரங்கள் ___ விட அதிகம்... ✨", options: ["Grains of sand on Earth", "Fish in the sea", "Cars on roads", "Books in libraries"], options_ta: ["பூமியில் உள்ள மணல் துகள்களை விட", "கடலில் உள்ள மீன்களை விட", "சாலைகளில் உள்ள கார்களை விட", "நூலகங்களில் உள்ள புத்தகங்களை விட"], answer: "Grains of sand on Earth", answer_ta: "பூமியில் உள்ள மணல் துகள்களை விட" },
        { q: "In space, astronauts grow about ___ taller! 🧑‍🚀", q_ta: "விண்வெளியில், விண்வெளி வீரர்கள் ___ உயரமாக வளர்வார்கள்! 🧑‍🚀", options: ["2 inches / 5 cm", "1 foot", "Nothing changes", "They shrink"], options_ta: ["2 அங்குலம் / 5 செமீ", "1 அடி", "எந்த மாற்றமும் இல்லை", "சுருங்குவார்கள்"], answer: "2 inches / 5 cm", answer_ta: "2 அங்குலம் / 5 செமீ" },
      ],
    },
    {
      number: 4, title: "Animal Intelligence 🦊", title_ta: "விலங்கு நுண்ணறிவு 🦊", isBoss: false,
      questions: [
        { q: "Dolphins sleep with one ___ open! 🐬", q_ta: "டால்பின்கள் ஒரு ___ திறந்து தூங்கும்! 🐬", options: ["Eye", "Mouth", "Fin", "Ear"], options_ta: ["கண்", "வாய்", "துடுப்பு", "காது"], answer: "Eye", answer_ta: "கண்" },
        { q: "Crows can recognize human... 🐦‍⬛", q_ta: "காகங்கள் மனிதர்களின் ___ அடையாளம் காணும்... 🐦‍⬛", options: ["Faces!", "Shoes", "Cars", "Houses"], options_ta: ["முகங்களை!", "காலணிகளை", "கார்களை", "வீடுகளை"], answer: "Faces!", answer_ta: "முகங்களை!" },
        { q: "Elephants are the only animals that can't... 🐘", q_ta: "குதிக்க முடியாத ஒரே விலங்கு... 🐘", options: ["Jump", "Walk", "Eat", "Sleep"], options_ta: ["குதிக்க முடியாது", "நடக்க முடியாது", "சாப்பிட முடியாது", "தூங்க முடியாது"], answer: "Jump", answer_ta: "குதிக்க முடியாது" },
        { q: "A group of flamingos is called a... 🦩", q_ta: "ஃப்ளமிங்கோக்களின் குழு அழைக்கப்படுவது... 🦩", options: ["Flamboyance", "Flock", "Pack", "Herd"], options_ta: ["ஃப்ளாம்பாயன்ஸ்", "ஃப்ளாக்", "பேக்", "ஹெர்ட்"], answer: "Flamboyance", answer_ta: "ஃப்ளாம்பாயன்ஸ்" },
        { q: "Octopuses have ___ brains! 🐙🧠", q_ta: "ஆக்டோபஸுக்கு ___ மூளைகள்! 🐙🧠", options: ["9 (1 main + 8 in arms)", "1", "2", "4"], options_ta: ["9 (1 முக்கிய + 8 கைகளில்)", "1", "2", "4"], answer: "9 (1 main + 8 in arms)", answer_ta: "9 (1 முக்கிய + 8 கைகளில்)" },
      ],
    },
    {
      number: 5, title: "Knowledge King Boss 👑", title_ta: "அறிவு அரசன் போஸ் 👑", isBoss: true,
      questions: [
        { q: "The world's shortest war lasted ___ 🏳️", q_ta: "உலகின் மிகக் குறுகிய போர் ___ நீடித்தது 🏳️", options: ["38 minutes", "3 days", "1 year", "24 hours"], options_ta: ["38 நிமிடங்கள்", "3 நாட்கள்", "1 ஆண்டு", "24 மணி நேரம்"], answer: "38 minutes", answer_ta: "38 நிமிடங்கள்" },
        { q: "A human body contains enough carbon to make ___ pencils ✏️", q_ta: "மனித உடலில் ___ பென்சில்கள் செய்ய போதுமான கார்பன் உள்ளது ✏️", options: ["~9,000", "~10", "~100", "~1 million"], options_ta: ["~9,000", "~10", "~100", "~10 லட்சம்"], answer: "~9,000", answer_ta: "~9,000" },
        { q: "The Great Wall of China is NOT visible from... 🧱", q_ta: "சீனப் பெருஞ்சுவர் ___ இருந்து தெரியாது... 🧱", options: ["Space (a common myth!)", "An airplane", "A tall building", "A nearby mountain"], options_ta: ["விண்வெளி (ஒரு பொதுவான புராணம்!)", "விமானத்திலிருந்து", "உயரமான கட்டிடத்திலிருந்து", "அருகிலுள்ள மலையிலிருந்து"], answer: "Space (a common myth!)", answer_ta: "விண்வெளி (ஒரு பொதுவான புராணம்!)" },
        { q: "Cleopatra lived closer to the ___ than the building of pyramids 🏛️", q_ta: "கிளியோபாட்ரா பிரமிடுகள் கட்டப்பட்ட காலத்தை விட ___ நெருக்கமாக வாழ்ந்தாள் 🏛️", options: ["Moon landing", "Roman Empire", "World War 1", "Stone Age"], options_ta: ["நிலவில் இறங்கியதை", "ரோமானிய பேரரசு", "முதல் உலகப் போர்", "கற்காலம்"], answer: "Moon landing", answer_ta: "நிலவில் இறங்கியதை" },
        { q: "A day on Jupiter lasts only ___ ⏱️", q_ta: "வியாழனில் ஒரு நாள் ___ மட்டுமே ⏱️", options: ["10 hours", "24 hours", "100 hours", "1 hour"], options_ta: ["10 மணி நேரம்", "24 மணி நேரம்", "100 மணி நேரம்", "1 மணி நேரம்"], answer: "10 hours", answer_ta: "10 மணி நேரம்" },
      ],
    },
  ];
}

// ── 🎮 Gaming & Creativity World ──
function generateGamingCreativityLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "How Games Are Made 🕹️", title_ta: "கேம்கள் எப்படி உருவாக்கப்படுகின்றன 🕹️", isBoss: false,
      questions: [
        { q: "The people who create game worlds are called... 🎮", q_ta: "கேம் உலகங்களை உருவாக்குபவர்கள்... 🎮", options: ["Game developers", "Game players", "Game watchers", "Game testers only"], options_ta: ["கேம் டெவலப்பர்கள்", "கேம் வீரர்கள்", "கேம் பார்வையாளர்கள்", "கேம் சோதனையாளர்கள் மட்டும்"], answer: "Game developers", answer_ta: "கேம் டெவலப்பர்கள்" },
        { q: "Minecraft was created by one person named... ⛏️", q_ta: "Minecraft-ஐ ஒருவர் உருவாக்கினார், அவர் பெயர்... ⛏️", options: ["Markus 'Notch' Persson", "Steve Jobs", "Elon Musk", "Mario Luigi"], options_ta: ["மார்கஸ் 'Notch' பெர்சன்", "ஸ்டீவ் ஜாப்ஸ்", "எலான் மஸ்க்", "மரியோ லூயிகி"], answer: "Markus 'Notch' Persson", answer_ta: "மார்கஸ் 'Notch' பெர்சன்" },
        { q: "The 3D objects in games are called... 🧊", q_ta: "கேம்களில் உள்ள 3D பொருட்கள் அழைக்கப்படுவது... 🧊", options: ["3D models/meshes", "Photographs", "Paintings", "Stickers"], options_ta: ["3D மாடல்கள்/mesh", "புகைப்படங்கள்", "ஓவியங்கள்", "ஸ்டிக்கர்கள்"], answer: "3D models/meshes", answer_ta: "3D மாடல்கள்/mesh" },
        { q: "Game 'physics' makes things feel... 🎯", q_ta: "கேம் 'physics' பொருட்களை ___ உணர வைக்கும்... 🎯", options: ["Realistic (gravity, bouncing)", "Invisible", "Frozen", "Boring"], options_ta: ["யதார்த்தமாக (ஈர்ப்பு, குதித்தல்)", "கண்ணுக்கு தெரியாமல்", "உறைந்ததாக", "சலிப்பாக"], answer: "Realistic (gravity, bouncing)", answer_ta: "யதார்த்தமாக (ஈர்ப்பு, குதித்தல்)" },
        { q: "A 'bug' in a game means... 🐛", q_ta: "கேமில் 'bug' என்றால்... 🐛", options: ["A mistake or error in the code", "An actual insect", "A power-up", "A new level"], options_ta: ["குறியீட்டில் ஒரு தவறு", "உண்மையான பூச்சி", "ஒரு பவர்-அப்", "ஒரு புதிய நிலை"], answer: "A mistake or error in the code", answer_ta: "குறியீட்டில் ஒரு தவறு" },
      ],
    },
    {
      number: 2, title: "Animation Basics 🎬", title_ta: "அனிமேஷன் அடிப்படைகள் 🎬", isBoss: false,
      questions: [
        { q: "Animation works by showing many ___ quickly 🎞️", q_ta: "அனிமேஷன் பல ___ விரைவாக காட்டி வேலை செய்கிறது 🎞️", options: ["Still images (frames)", "Real videos", "Sounds", "Colors"], options_ta: ["நிலையான படங்கள் (பிரேம்கள்)", "உண்மையான வீடியோக்கள்", "ஒலிகள்", "நிறங்கள்"], answer: "Still images (frames)", answer_ta: "நிலையான படங்கள் (பிரேம்கள்)" },
        { q: "FPS in animation stands for... 📊", q_ta: "அனிமேஷனில் FPS என்பது... 📊", options: ["Frames Per Second", "Fun Per Show", "Fast Photo Speed", "Film Production Studio"], options_ta: ["வினாடிக்கான பிரேம்கள்", "நிகழ்ச்சிக்கான வேடிக்கை", "வேகமான புகைப்பட வேகம்", "திரைப்பட தயாரிப்பு அரங்கு"], answer: "Frames Per Second", answer_ta: "வினாடிக்கான பிரேம்கள்" },
        { q: "Disney's first full-length animated movie was... 🏰", q_ta: "டிஸ்னியின் முதல் முழு நீள அனிமேஷன் திரைப்படம்... 🏰", options: ["Snow White (1937)", "The Lion King", "Frozen", "Toy Story"], options_ta: ["Snow White (1937)", "The Lion King", "Frozen", "Toy Story"], answer: "Snow White (1937)", answer_ta: "Snow White (1937)" },
        { q: "Anime is a style of animation from... 🇯🇵", q_ta: "Anime என்பது ___ நாட்டின் அனிமேஷன் பாணி... 🇯🇵", options: ["Japan", "USA", "India", "France"], options_ta: ["ஜப்பான்", "அமெரிக்கா", "இந்தியா", "பிரான்ஸ்"], answer: "Japan", answer_ta: "ஜப்பான்" },
        { q: "Pixar's first movie was... 🤠", q_ta: "Pixar-இன் முதல் திரைப்படம்... 🤠", options: ["Toy Story", "Finding Nemo", "Cars", "Up"], options_ta: ["Toy Story", "Finding Nemo", "Cars", "Up"], answer: "Toy Story", answer_ta: "Toy Story" },
      ],
    },
    {
      number: 3, title: "YouTube Creator 📹", title_ta: "YouTube கிரியேட்டர் 📹", isBoss: false,
      questions: [
        { q: "A 'thumbnail' on YouTube is... 🖼️", q_ta: "YouTube-இல் 'thumbnail' என்பது... 🖼️", options: ["The preview image you click", "Your thumb's photo", "A mini game", "A sound effect"], options_ta: ["நீங்கள் கிளிக் செய்யும் முன்னோட்ட படம்", "உங்கள் கட்டை விரல் புகைப்படம்", "ஒரு மினி கேம்", "ஒரு ஒலி விளைவு"], answer: "The preview image you click", answer_ta: "நீங்கள் கிளிக் செய்யும் முன்னோட்ட படம்" },
        { q: "To be a successful creator, the most important thing is... 🌟", q_ta: "வெற்றிகரமான கிரியேட்டராக மிக முக்கியமான விஷயம்... 🌟", options: ["Consistency & good content", "Expensive camera", "Being famous already", "Having millions of friends"], options_ta: ["தொடர்ச்சி & நல்ல உள்ளடக்கம்", "விலை உயர்ந்த கேமரா", "ஏற்கனவே பிரபலமாக இருப்பது", "லட்சக்கணக்கான நண்பர்கள் இருப்பது"], answer: "Consistency & good content", answer_ta: "தொடர்ச்சி & நல்ல உள்ளடக்கம்" },
        { q: "MrBeast is famous for... 🎁", q_ta: "MrBeast புகழ்பெற்றது... 🎁", options: ["Giving away money & challenges", "Cooking shows", "Movie reviews", "Science lectures"], options_ta: ["பணம் வழங்குவது & சவால்கள்", "சமையல் நிகழ்ச்சிகள்", "திரைப்பட விமர்சனங்கள்", "அறிவியல் விரிவுரைகள்"], answer: "Giving away money & challenges", answer_ta: "பணம் வழங்குவது & சவால்கள்" },
        { q: "'Editing' a video means... ✂️", q_ta: "வீடியோவை 'Edit' செய்வது என்றால்... ✂️", options: ["Cutting & arranging clips", "Deleting the video", "Watching it again", "Uploading it faster"], options_ta: ["கிளிப்களை வெட்டி அமைப்பது", "வீடியோவை நீக்குவது", "மீண்டும் பார்ப்பது", "வேகமாக அப்லோட் செய்வது"], answer: "Cutting & arranging clips", answer_ta: "கிளிப்களை வெட்டி அமைப்பது" },
        { q: "Streaming means... 📡", q_ta: "Streaming என்றால்... 📡", options: ["Broadcasting live to viewers", "Swimming in a stream", "Downloading files", "Printing documents"], options_ta: ["பார்வையாளர்களுக்கு நேரலையில் ஒளிபரப்புவது", "நீரோடையில் நீச்சல் அடிப்பது", "கோப்புகளை பதிவிறக்குவது", "ஆவணங்களை அச்சிடுவது"], answer: "Broadcasting live to viewers", answer_ta: "பார்வையாளர்களுக்கு நேரலையில் ஒளிபரப்புவது" },
      ],
    },
    {
      number: 4, title: "Storytelling & Comics 📖", title_ta: "கதை சொல்லுதல் & காமிக்ஸ் 📖", isBoss: false,
      questions: [
        { q: "Every great story needs a... 📖", q_ta: "ஒவ்வொரு சிறந்த கதைக்கும் ___ தேவை... 📖", options: ["Beginning, middle & end", "Only an ending", "Only pictures", "Only dialogue"], options_ta: ["ஆரம்பம், நடு & முடிவு", "முடிவு மட்டும்", "படங்கள் மட்டும்", "உரையாடல் மட்டும்"], answer: "Beginning, middle & end", answer_ta: "ஆரம்பம், நடு & முடிவு" },
        { q: "The 'antagonist' in a story is the... 😈", q_ta: "கதையில் 'எதிர்நாயகன்' என்பவர்... 😈", options: ["Villain or obstacle", "Hero", "Narrator", "Side character"], options_ta: ["வில்லன் அல்லது தடை", "கதாநாயகன்", "கதை சொல்பவர்", "துணை கதாபாத்திரம்"], answer: "Villain or obstacle", answer_ta: "வில்லன் அல்லது தடை" },
        { q: "A 'manga' is a type of comic from... 📚", q_ta: "'Manga' என்பது ___ நாட்டின் காமிக் வகை... 📚", options: ["Japan", "USA", "India", "Brazil"], options_ta: ["ஜப்பான்", "அமெரிக்கா", "இந்தியா", "பிரேசில்"], answer: "Japan", answer_ta: "ஜப்பான்" },
        { q: "In comics, 'speech bubbles' show... 💬", q_ta: "காமிக்ஸில் 'speech bubbles' காட்டுவது... 💬", options: ["What characters are saying", "The weather", "The time", "The page number"], options_ta: ["கதாபாத்திரங்கள் என்ன சொல்கிறார்கள்", "வானிலை", "நேரம்", "பக்க எண்"], answer: "What characters are saying", answer_ta: "கதாபாத்திரங்கள் என்ன சொல்கிறார்கள்" },
        { q: "A 'cliffhanger' ending makes you want to... 😱", q_ta: "'Cliffhanger' முடிவு உங்களை ___ செய்ய வைக்கும்... 😱", options: ["Know what happens next!", "Sleep immediately", "Close the book forever", "Forget the story"], options_ta: ["அடுத்து என்ன நடக்கும் என்று தெரிந்துகொள்ள!", "உடனடியாக தூங்க", "புத்தகத்தை எப்போதும் மூட", "கதையை மறக்க"], answer: "Know what happens next!", answer_ta: "அடுத்து என்ன நடக்கும் என்று தெரிந்துகொள்ள!" },
      ],
    },
    {
      number: 5, title: "Creative Master Boss 🎨", title_ta: "படைப்பாற்றல் மாஸ்டர் போஸ் 🎨", isBoss: true,
      questions: [
        { q: "Roblox lets players ___ their own games! 🎮", q_ta: "Roblox வீரர்களை சொந்தமாக கேம்கள் ___ அனுமதிக்கிறது! 🎮", options: ["Create and share", "Only play", "Only watch", "Only buy"], options_ta: ["உருவாக்கி பகிர", "விளையாட மட்டும்", "பார்க்க மட்டும்", "வாங்க மட்டும்"], answer: "Create and share", answer_ta: "உருவாக்கி பகிர" },
        { q: "The first video game ever made was... 🕹️", q_ta: "முதல் வீடியோ கேம்... 🕹️", options: ["Pong (1972)", "Minecraft", "Fortnite", "GTA"], options_ta: ["Pong (1972)", "Minecraft", "Fortnite", "GTA"], answer: "Pong (1972)", answer_ta: "Pong (1972)" },
        { q: "A 'storyboard' is used to... 📋", q_ta: "'Storyboard' பயன்படுவது... 📋", options: ["Plan scenes before creating", "Play board games", "Build furniture", "Write exams"], options_ta: ["உருவாக்கும் முன் காட்சிகளை திட்டமிட", "போர்ட் கேம்கள் விளையாட", "மரச்சாமான்கள் செய்ய", "தேர்வு எழுத"], answer: "Plan scenes before creating", answer_ta: "உருவாக்கும் முன் காட்சிகளை திட்டமிட" },
        { q: "The gaming industry earns MORE than... 💰", q_ta: "கேமிங் தொழில் ___ விட அதிகம் சம்பாதிக்கிறது... 💰", options: ["Movies AND Music combined!", "Only music", "Only sports", "Only books"], options_ta: ["திரைப்படம் மற்றும் இசை இரண்டையும் சேர்த்த!", "இசை மட்டும்", "விளையாட்டு மட்டும்", "புத்தகங்கள் மட்டும்"], answer: "Movies AND Music combined!", answer_ta: "திரைப்படம் மற்றும் இசை இரண்டையும் சேர்த்த!" },
        { q: "The BEST way to get creative is to... 🌈", q_ta: "படைப்பாற்றல் பெற சிறந்த வழி... 🌈", options: ["Practice every day", "Wait for inspiration", "Copy others exactly", "Never try new things"], options_ta: ["தினமும் பயிற்சி செய்வது", "உத்வேகத்திற்காக காத்திருப்பது", "மற்றவர்களை அப்படியே நகலெடுப்பது", "புதிய விஷயங்களை ஒருபோதும் முயற்சிக்காதிருப்பது"], answer: "Practice every day", answer_ta: "தினமும் பயிற்சி செய்வது" },
      ],
    },
  ];
}

// ── 🌎 Real Life Skills World ──
function generateLifeSkillsLevels(): AdventureLevel[] {
  return [
    {
      number: 1, title: "Communication Power 🗣️", title_ta: "தொடர்பு திறன் 🗣️", isBoss: false,
      questions: [
        { q: "Good communication means... 🗣️", q_ta: "நல்ல தொடர்பு என்றால்... 🗣️", options: ["Listening AND speaking well", "Only speaking loudly", "Only sending texts", "Never talking"], options_ta: ["நன்றாக கேட்பதும் பேசுவதும்", "சத்தமாக மட்டும் பேசுவது", "குறுஞ்செய்தி அனுப்புவது மட்டும்", "ஒருபோதும் பேசாதிருப்பது"], answer: "Listening AND speaking well", answer_ta: "நன்றாக கேட்பதும் பேசுவதும்" },
        { q: "Eye contact shows that you are... 👀", q_ta: "கண் தொடர்பு காட்டுவது நீங்கள்... 👀", options: ["Paying attention", "Being rude", "Scared", "Bored"], options_ta: ["கவனம் செலுத்துகிறீர்கள்", "முரட்டுத்தனமாக இருக்கிறீர்கள்", "பயப்படுகிறீர்கள்", "சலிப்படைகிறீர்கள்"], answer: "Paying attention", answer_ta: "கவனம் செலுத்துகிறீர்கள்" },
        { q: "Active listening means... 👂", q_ta: "செயலில் கேட்பது என்றால்... 👂", options: ["Fully focusing on the speaker", "Pretending to listen", "Thinking about games", "Sleeping while listening"], options_ta: ["பேசுபவரை முழுமையாக கவனிப்பது", "கேட்பது போல் நடிப்பது", "கேம்களைப் பற்றி நினைப்பது", "கேட்கும்போது தூங்குவது"], answer: "Fully focusing on the speaker", answer_ta: "பேசுபவரை முழுமையாக கவனிப்பது" },
        { q: "In a group project, the best approach is... 🤝", q_ta: "குழு திட்டத்தில் சிறந்த அணுகுமுறை... 🤝", options: ["Divide work & collaborate", "Do everything alone", "Let one person do all", "Don't participate"], options_ta: ["வேலையை பிரித்து ஒத்துழைப்பது", "எல்லாவற்றையும் தனியாக செய்வது", "ஒருவர் எல்லாம் செய்ய விடுவது", "பங்கேற்காமல் இருப்பது"], answer: "Divide work & collaborate", answer_ta: "வேலையை பிரித்து ஒத்துழைப்பது" },
        { q: "Body language is... 💪", q_ta: "உடல் மொழி என்பது... 💪", options: ["Communicating without words", "Speaking another language", "Dancing", "Exercising"], options_ta: ["வார்த்தைகள் இல்லாமல் தொடர்புகொள்வது", "வேறு மொழி பேசுவது", "நடனமாடுவது", "உடற்பயிற்சி செய்வது"], answer: "Communicating without words", answer_ta: "வார்த்தைகள் இல்லாமல் தொடர்புகொள்வது" },
      ],
    },
    {
      number: 2, title: "Time Management ⏰", title_ta: "நேர மேலாண்மை ⏰", isBoss: false,
      questions: [
        { q: "The Pomodoro Technique uses ___ minute work blocks 🍅", q_ta: "Pomodoro நுட்பம் ___ நிமிட வேலை தொகுதிகளை பயன்படுத்துகிறது 🍅", options: ["25", "60", "5", "120"], options_ta: ["25", "60", "5", "120"], answer: "25", answer_ta: "25" },
        { q: "Procrastination means... 🐌", q_ta: "தள்ளிப்போடுதல் என்றால்... 🐌", options: ["Delaying important tasks", "Working very fast", "Finishing early", "Helping others"], options_ta: ["முக்கிய பணிகளை தாமதப்படுத்துவது", "மிக வேகமாக வேலை செய்வது", "சீக்கிரம் முடிப்பது", "மற்றவர்களுக்கு உதவுவது"], answer: "Delaying important tasks", answer_ta: "முக்கிய பணிகளை தாமதப்படுத்துவது" },
        { q: "A to-do list helps you... 📝", q_ta: "To-do list உங்களுக்கு உதவுவது... 📝", options: ["Organize your tasks", "Waste time", "Forget everything", "Skip work"], options_ta: ["உங்கள் பணிகளை ஒழுங்கமைக்க", "நேரத்தை வீணடிக்க", "எல்லாவற்றையும் மறக்க", "வேலையை தவிர்க்க"], answer: "Organize your tasks", answer_ta: "உங்கள் பணிகளை ஒழுங்கமைக்க" },
        { q: "The best time to study is when you feel... 📚", q_ta: "படிக்க சிறந்த நேரம் நீங்கள் ___ உணரும்போது... 📚", options: ["Alert and focused", "Very sleepy", "Very hungry", "Very angry"], options_ta: ["விழிப்பாகவும் கவனமாகவும்", "மிகவும் தூக்கமாக", "மிகவும் பசியாக", "மிகவும் கோபமாக"], answer: "Alert and focused", answer_ta: "விழிப்பாகவும் கவனமாகவும்" },
        { q: "Multitasking actually makes you... 🔄", q_ta: "Multitasking உண்மையில் உங்களை... 🔄", options: ["Less productive", "Super productive", "Smarter", "More creative"], options_ta: ["குறைவான உற்பத்தித்திறன்", "அதிக உற்பத்தித்திறன்", "புத்திசாலியாக", "அதிக படைப்பாற்றல்"], answer: "Less productive", answer_ta: "குறைவான உற்பத்தித்திறன்" },
      ],
    },
    {
      number: 3, title: "Money Basics 💰", title_ta: "பண அடிப்படைகள் 💰", isBoss: false,
      questions: [
        { q: "Saving money means... 🏦", q_ta: "பணம் சேமிப்பது என்றால்... 🏦", options: ["Keeping some for the future", "Spending everything now", "Throwing it away", "Giving it all away"], options_ta: ["எதிர்காலத்திற்காக சிலவற்றை வைத்திருப்பது", "எல்லாவற்றையும் இப்போது செலவழிப்பது", "தூக்கி எறிவது", "எல்லாவற்றையும் கொடுப்பது"], answer: "Keeping some for the future", answer_ta: "எதிர்காலத்திற்காக சிலவற்றை வைத்திருப்பது" },
        { q: "A 'budget' helps you... 📊", q_ta: "'Budget' உங்களுக்கு உதவுவது... 📊", options: ["Plan how to spend money", "Spend money faster", "Forget about money", "Lose money"], options_ta: ["பணத்தை எப்படி செலவழிக்க வேண்டும் என்று திட்டமிட", "பணத்தை வேகமாக செலவழிக்க", "பணத்தை மறக்க", "பணத்தை இழக்க"], answer: "Plan how to spend money", answer_ta: "பணத்தை எப்படி செலவழிக்க வேண்டும் என்று திட்டமிட" },
        { q: "A 'need' vs a 'want' — food is a... 🍎", q_ta: "'தேவை' vs 'விருப்பம்' — உணவு ஒரு... 🍎", options: ["Need", "Want", "Luxury", "Game"], options_ta: ["தேவை", "விருப்பம்", "ஆடம்பரம்", "கேம்"], answer: "Need", answer_ta: "தேவை" },
        { q: "Interest in a bank account means... 💵", q_ta: "வங்கி கணக்கில் வட்டி என்றால்... 💵", options: ["Bank pays you for saving", "You pay the bank", "Money disappears", "Nothing happens"], options_ta: ["சேமிப்பதற்காக வங்கி உங்களுக்கு பணம் தரும்", "நீங்கள் வங்கிக்கு பணம் தருவீர்கள்", "பணம் மறைந்துவிடும்", "எதுவும் நடக்காது"], answer: "Bank pays you for saving", answer_ta: "சேமிப்பதற்காக வங்கி உங்களுக்கு பணம் தரும்" },
        { q: "The '50-30-20' rule means... 📐", q_ta: "'50-30-20' விதி என்றால்... 📐", options: ["50% needs, 30% wants, 20% savings", "50% games, 30% food, 20% sleep", "50% TV, 30% phone, 20% study", "50% work, 30% play, 20% rest"], options_ta: ["50% தேவைகள், 30% விருப்பங்கள், 20% சேமிப்பு", "50% கேம்கள், 30% உணவு, 20% தூக்கம்", "50% TV, 30% போன், 20% படிப்பு", "50% வேலை, 30% விளையாட்டு, 20% ஓய்வு"], answer: "50% needs, 30% wants, 20% savings", answer_ta: "50% தேவைகள், 30% விருப்பங்கள், 20% சேமிப்பு" },
      ],
    },
    {
      number: 4, title: "Emotional Intelligence 💛", title_ta: "உணர்வு நுண்ணறிவு 💛", isBoss: false,
      questions: [
        { q: "Emotional intelligence means... 💛", q_ta: "உணர்வு நுண்ணறிவு என்றால்... 💛", options: ["Understanding your own & others' feelings", "Being very smart at math", "Never showing emotions", "Always being happy"], options_ta: ["உங்கள் & மற்றவர்களின் உணர்வுகளை புரிந்துகொள்வது", "கணிதத்தில் மிகவும் புத்திசாலியாக இருப்பது", "ஒருபோதும் உணர்ச்சிகளை காட்டாதிருப்பது", "எப்போதும் மகிழ்ச்சியாக இருப்பது"], answer: "Understanding your own & others' feelings", answer_ta: "உங்கள் & மற்றவர்களின் உணர்வுகளை புரிந்துகொள்வது" },
        { q: "Empathy means... 🤗", q_ta: "பச்சாதாபம் என்றால்... 🤗", options: ["Feeling what others feel", "Being angry at everyone", "Ignoring everyone", "Only caring about yourself"], options_ta: ["மற்றவர்கள் உணர்வதை உணர்வது", "எல்லோரையும் கோபப்படுவது", "எல்லோரையும் புறக்கணிப்பது", "உங்களைப் பற்றி மட்டும் கவலைப்படுவது"], answer: "Feeling what others feel", answer_ta: "மற்றவர்கள் உணர்வதை உணர்வது" },
        { q: "When you're angry, the best thing to do is... 😤", q_ta: "நீங்கள் கோபமாக இருக்கும்போது செய்ய வேண்டியது... 😤", options: ["Take deep breaths & calm down", "Shout at everyone", "Break things", "Never talk again"], options_ta: ["ஆழமாக மூச்சு விட்டு அமைதியாகு", "எல்லோரையும் கத்து", "பொருட்களை உடை", "ஒருபோதும் மீண்டும் பேசாதே"], answer: "Take deep breaths & calm down", answer_ta: "ஆழமாக மூச்சு விட்டு அமைதியாகு" },
        { q: "A growth mindset believes that... 🌱", q_ta: "வளர்ச்சி மனநிலை நம்புவது... 🌱", options: ["You can improve with effort", "You can never change", "Only talent matters", "Effort is useless"], options_ta: ["முயற்சியால் முன்னேற முடியும்", "ஒருபோதும் மாற முடியாது", "திறமை மட்டுமே முக்கியம்", "முயற்சி பயனற்றது"], answer: "You can improve with effort", answer_ta: "முயற்சியால் முன்னேற முடியும்" },
        { q: "Confidence comes from... 💪", q_ta: "தன்னம்பிக்கை வருவது... 💪", options: ["Practice & believing in yourself", "Being perfect at everything", "Never making mistakes", "Bragging about yourself"], options_ta: ["பயிற்சி & உங்களை நம்புவது", "எல்லாவற்றிலும் சரியாக இருப்பது", "ஒருபோதும் தவறு செய்யாதிருப்பது", "உங்களைப் பற்றி பெருமை பேசுவது"], answer: "Practice & believing in yourself", answer_ta: "பயிற்சி & உங்களை நம்புவது" },
      ],
    },
    {
      number: 5, title: "Life Champion Boss 🏅", title_ta: "வாழ்க்கை சாம்பியன் போஸ் 🏅", isBoss: true,
      questions: [
        { q: "Leadership is about... 👑", q_ta: "தலைமைத்துவம் என்பது... 👑", options: ["Inspiring & helping others succeed", "Bossing everyone around", "Being the loudest", "Doing everything alone"], options_ta: ["மற்றவர்களை ஊக்குவிப்பது & வெற்றிபெற உதவுவது", "எல்லோரையும் ஆணையிடுவது", "மிகவும் சத்தமாக இருப்பது", "எல்லாவற்றையும் தனியாக செய்வது"], answer: "Inspiring & helping others succeed", answer_ta: "மற்றவர்களை ஊக்குவிப்பது & வெற்றிபெற உதவுவது" },
        { q: "Public speaking fear can be overcome by... 🎤", q_ta: "பொது பேச்சு பயத்தை கடக்க... 🎤", options: ["Practice & preparation", "Avoiding it forever", "Imagining the worst", "Never trying"], options_ta: ["பயிற்சி & தயாரிப்பு", "எப்போதும் தவிர்ப்பது", "மோசமானதை கற்பனை செய்வது", "ஒருபோதும் முயற்சிக்காதிருப்பது"], answer: "Practice & preparation", answer_ta: "பயிற்சி & தயாரிப்பு" },
        { q: "The best way to learn from failure is... 📖", q_ta: "தோல்வியிலிருந்து கற்றுக்கொள்ள சிறந்த வழி... 📖", options: ["Analyze what went wrong & try again", "Give up immediately", "Blame everyone else", "Pretend it didn't happen"], options_ta: ["என்ன தவறு நடந்தது என்று பகுப்பாய்வு செய்து மீண்டும் முயற்சிக்கவும்", "உடனடியாக விட்டுவிடுங்கள்", "எல்லோரையும் குறை சொல்லுங்கள்", "நடக்கவில்லை என்று நடிக்கவும்"], answer: "Analyze what went wrong & try again", answer_ta: "என்ன தவறு நடந்தது என்று பகுப்பாய்வு செய்து மீண்டும் முயற்சிக்கவும்" },
        { q: "Setting goals should be... 🎯", q_ta: "இலக்குகள் நிர்ணயிப்பது... 🎯", options: ["Specific & achievable", "Impossible & vague", "Only about money", "Never written down"], options_ta: ["குறிப்பிட்ட & அடையக்கூடிய", "சாத்தியமற்ற & தெளிவற்ற", "பணத்தைப் பற்றி மட்டும்", "ஒருபோதும் எழுதாத"], answer: "Specific & achievable", answer_ta: "குறிப்பிட்ட & அடையக்கூடிய" },
        { q: "The most important life skill is... 🌟", q_ta: "மிக முக்கியமான வாழ்க்கை திறன்... 🌟", options: ["Never stop learning!", "Knowing everything already", "Avoiding challenges", "Following others blindly"], options_ta: ["கற்றுக்கொள்வதை நிறுத்தாதீர்கள்!", "ஏற்கனவே எல்லாம் தெரிந்திருப்பது", "சவால்களை தவிர்ப்பது", "மற்றவர்களை கண்மூடித்தனமாக பின்பற்றுவது"], answer: "Never stop learning!", answer_ta: "கற்றுக்கொள்வதை நிறுத்தாதீர்கள்!" },
      ],
    },
  ];
}

export function getAdventureWorlds(classLevel: number): AdventureWorld[] {
  return [
    // ── SCHOOL WORLDS ──
    {
      id: "forest_math",
      name: "Enchanted Forest",
      name_ta: "மந்திர காடு",
      emoji: "🌲",
      theme: "from-emerald-500 to-green-600",
      bgEmojis: ["🌲", "🍃", "🌿", "🐿️", "🦊", "🍄"],
      description: "Master math through forest adventures!",
      description_ta: "காட்டு சாகசத்தில் கணிதம் கற்றுக்கொள்!",
      subjectMatch: "math",
      category: "school",
      levels: generateForestMathLevels(classLevel),
    },
    {
      id: "space_science",
      name: "Space Station",
      name_ta: "விண்வெளி நிலையம்",
      emoji: "🚀",
      theme: "from-indigo-500 to-purple-600",
      bgEmojis: ["🚀", "⭐", "🌙", "🪐", "☄️", "👽"],
      description: "Explore science across the galaxy!",
      description_ta: "விண்மீன் வழியே அறிவியல் ஆராய்!",
      subjectMatch: "science",
      category: "school",
      levels: generateSpaceScienceLevels(),
    },
    {
      id: "ocean_english",
      name: "Deep Ocean",
      name_ta: "ஆழ்கடல்",
      emoji: "🌊",
      theme: "from-cyan-500 to-blue-600",
      bgEmojis: ["🌊", "🐠", "🐙", "🦈", "🐚", "🪸"],
      description: "Dive into English mastery!",
      description_ta: "ஆங்கிலத்தில் மூழ்கு!",
      subjectMatch: "english",
      category: "school",
      levels: generateOceanEnglishLevels(),
    },
    {
      id: "history_social",
      name: "History Kingdom",
      name_ta: "வரலாற்று ராஜ்யம்",
      emoji: "🏰",
      theme: "from-amber-500 to-orange-600",
      bgEmojis: ["🏰", "⚔️", "👑", "📜", "🗺️", "🏛️"],
      description: "Conquer history & social studies!",
      description_ta: "வரலாறு & சமூக அறிவியல் வெல்!",
      subjectMatch: "social",
      category: "school",
      levels: generateHistorySocialLevels(),
    },
    // ── REAL-WORLD KNOWLEDGE WORLDS ──
    {
      id: "ai_tech",
      name: "AI & Future Tech",
      name_ta: "AI & எதிர்கால தொழில்நுட்பம்",
      emoji: "🤖",
      theme: "from-violet-500 to-purple-700",
      bgEmojis: ["🤖", "🧠", "💡", "🛸", "⚡", "🔮"],
      description: "Discover how AI is changing the world!",
      description_ta: "AI உலகை எப்படி மாற்றுகிறது கண்டறி!",
      subjectMatch: "technology",
      category: "real-world",
      isNew: true,
      levels: generateAITechLevels(),
    },
    {
      id: "internet_safety",
      name: "Internet Explorer",
      name_ta: "இணைய ஆராய்ச்சியாளர்",
      emoji: "🌐",
      theme: "from-cyan-400 to-teal-600",
      bgEmojis: ["🌐", "🔐", "📱", "🛡️", "💬", "📡"],
      description: "Master the internet & stay safe online!",
      description_ta: "இணையத்தை கற்று ஆன்லைனில் பாதுகாப்பாக இரு!",
      subjectMatch: "digital",
      category: "real-world",
      isNew: true,
      levels: generateInternetLevels(),
    },
    {
      id: "innovation_lab",
      name: "Innovation Lab",
      name_ta: "புதுமை ஆய்வகம்",
      emoji: "💡",
      theme: "from-amber-400 to-orange-600",
      bgEmojis: ["💡", "🚀", "💎", "🦄", "📊", "🏆"],
      description: "Think like an entrepreneur & innovator!",
      description_ta: "தொழில்முனைவோர் & புதுமையாளர் போல சிந்தி!",
      subjectMatch: "business",
      category: "real-world",
      isNew: true,
      levels: generateInnovationLevels(),
    },
    {
      id: "fun_facts",
      name: "Fun Facts Universe",
      name_ta: "வேடிக்கை உண்மைகள் பிரபஞ்சம்",
      emoji: "🎪",
      theme: "from-pink-500 to-rose-600",
      bgEmojis: ["🎪", "🤯", "🧠", "🐙", "⚡", "🌌"],
      description: "Mind-blowing facts that'll make you go WOW!",
      description_ta: "WOW என்று சொல்ல வைக்கும் அற்புத உண்மைகள்!",
      subjectMatch: "general",
      category: "real-world",
      isNew: true,
      levels: generateFunFactsLevels(),
    },
    {
      id: "gaming_creativity",
      name: "Gaming & Creativity",
      name_ta: "கேமிங் & படைப்பாற்றல்",
      emoji: "🎮",
      theme: "from-green-400 to-emerald-600",
      bgEmojis: ["🎮", "🎬", "📹", "🎨", "🕹️", "📖"],
      description: "Learn how games, animations & content are made!",
      description_ta: "கேம்கள், அனிமேஷன் & உள்ளடக்கம் எப்படி செய்யப்படுகிறது!",
      subjectMatch: "creative",
      category: "real-world",
      isNew: true,
      levels: generateGamingCreativityLevels(),
    },
    {
      id: "life_skills",
      name: "Real Life Skills",
      name_ta: "உண்மையான வாழ்க்கை திறன்கள்",
      emoji: "🎯",
      theme: "from-blue-500 to-indigo-600",
      bgEmojis: ["🎯", "💪", "🗣️", "💰", "⏰", "🌟"],
      description: "Skills that make you awesome at life!",
      description_ta: "வாழ்க்கையில் சிறந்தவராக மாற்றும் திறன்கள்!",
      subjectMatch: "lifeskills",
      category: "real-world",
      isNew: true,
      levels: generateLifeSkillsLevels(),
    },
  ];
}

