import type { SkillLesson } from './types';

const PRIMARY_LESSONS: SkillLesson[] = [
  {
    "id": "engli-g12-1",
    "categoryId": "english-communication",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Polite Greetings",
    "subtitle": "Learn how to say hello!",
    "character": "Ravi",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Politeness",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi wants to greet their teacher in the morning. They are not sure which words to use.",
        "illustration": "🐱",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Greeting others politely makes them feel happy. It also shows respect and good manners.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Ravi greet the teacher?",
      "options": [
        {
          "id": "engli-g12-1-opt-right",
          "text": "Say \"Good Morning, Teacher!\" with a smile.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher smiles back and says \"Good Morning! Have a great day!\"",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying Good Morning with a smile is polite and friendly."
          }
        },
        {
          "id": "engli-g12-1-opt-wrong",
          "text": "Wave hand and shout \"Hey there!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The teacher is surprised and gently explains that we should greet elders with respect.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting \"Hey there\" to a teacher is too casual. Polite greetings are better."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a polite way to greet a teacher in the morning?",
        "options": [
          "Hey you",
          "Good Morning, Teacher!",
          "Hello buddy",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Good Morning is the standard polite morning greeting for teachers."
      },
      {
        "question": "What should you add to your greeting to make it warm?",
        "options": [
          "A big frown",
          "A loud shout",
          "A friendly smile",
          "A jump"
        ],
        "correctIndex": 2,
        "explanation": "A smile makes any greeting feel warm and friendly."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "engli-g12-2",
    "categoryId": "english-communication",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Expressing Thanks",
    "subtitle": "The power of thank you",
    "character": "Kavitha",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Politeness",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha wants to greet their teacher in the morning. They are not sure which words to use.",
        "illustration": "🐶",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Greeting others politely makes them feel happy. It also shows respect and good manners.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Kavitha greet the teacher?",
      "options": [
        {
          "id": "engli-g12-2-opt-right",
          "text": "Say \"Good Morning, Teacher!\" with a smile.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher smiles back and says \"Good Morning! Have a great day!\"",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying Good Morning with a smile is polite and friendly."
          }
        },
        {
          "id": "engli-g12-2-opt-wrong",
          "text": "Wave hand and shout \"Hey there!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The teacher is surprised and gently explains that we should greet elders with respect.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting \"Hey there\" to a teacher is too casual. Polite greetings are better."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a polite way to greet a teacher in the morning?",
        "options": [
          "Hey you",
          "Good Morning, Teacher!",
          "Hello buddy",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Good Morning is the standard polite morning greeting for teachers."
      },
      {
        "question": "What should you add to your greeting to make it warm?",
        "options": [
          "A big frown",
          "A loud shout",
          "A friendly smile",
          "A jump"
        ],
        "correctIndex": 2,
        "explanation": "A smile makes any greeting feel warm and friendly."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "engli-g34-1",
    "categoryId": "english-communication",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Polite Greetings",
    "subtitle": "Learn how to say hello!",
    "character": "Vijay",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Politeness",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Vijay wants to greet their teacher in the morning. They are not sure which words to use.",
        "illustration": "🐼",
        "speaker": "Vijay",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Greeting others politely makes them feel happy. It also shows respect and good manners.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Vijay greet the teacher?",
      "options": [
        {
          "id": "engli-g34-1-opt-right",
          "text": "Say \"Good Morning, Teacher!\" with a smile.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher smiles back and says \"Good Morning! Have a great day!\"",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying Good Morning with a smile is polite and friendly."
          }
        },
        {
          "id": "engli-g34-1-opt-wrong",
          "text": "Wave hand and shout \"Hey there!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The teacher is surprised and gently explains that we should greet elders with respect.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting \"Hey there\" to a teacher is too casual. Polite greetings are better."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a polite way to greet a teacher in the morning?",
        "options": [
          "Hey you",
          "Good Morning, Teacher!",
          "Hello buddy",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Good Morning is the standard polite morning greeting for teachers."
      },
      {
        "question": "What should you add to your greeting to make it warm?",
        "options": [
          "A big frown",
          "A loud shout",
          "A friendly smile",
          "A jump"
        ],
        "correctIndex": 2,
        "explanation": "A smile makes any greeting feel warm and friendly."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "engli-g34-2",
    "categoryId": "english-communication",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Expressing Thanks",
    "subtitle": "The power of thank you",
    "character": "Deepak",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Politeness",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Deepak wants to greet their teacher in the morning. They are not sure which words to use.",
        "illustration": "🐨",
        "speaker": "Deepak",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Greeting others politely makes them feel happy. It also shows respect and good manners.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Deepak greet the teacher?",
      "options": [
        {
          "id": "engli-g34-2-opt-right",
          "text": "Say \"Good Morning, Teacher!\" with a smile.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher smiles back and says \"Good Morning! Have a great day!\"",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying Good Morning with a smile is polite and friendly."
          }
        },
        {
          "id": "engli-g34-2-opt-wrong",
          "text": "Wave hand and shout \"Hey there!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The teacher is surprised and gently explains that we should greet elders with respect.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting \"Hey there\" to a teacher is too casual. Polite greetings are better."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a polite way to greet a teacher in the morning?",
        "options": [
          "Hey you",
          "Good Morning, Teacher!",
          "Hello buddy",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Good Morning is the standard polite morning greeting for teachers."
      },
      {
        "question": "What should you add to your greeting to make it warm?",
        "options": [
          "A big frown",
          "A loud shout",
          "A friendly smile",
          "A jump"
        ],
        "correctIndex": 2,
        "explanation": "A smile makes any greeting feel warm and friendly."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "tamil-g12-1",
    "categoryId": "tamil-learning",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Vanakkam & Culture",
    "subtitle": "Say hello in Tamil",
    "character": "Sai",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Culture",
      "Respect"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Sai is visiting their grandparents in the village. They want to greet them respectfully.",
        "illustration": "🦁",
        "speaker": "Sai",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Grandparents love it when we speak in Tamil. Greet them with a warm gesture.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Sai greet their grandparents?",
      "options": [
        {
          "id": "tamil-g12-1-opt-right",
          "text": "Fold hands and say \"Vanakkam!\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Grandparents hug Sai and feel extremely proud.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Vanakkam is the traditional respectful Tamil greeting."
          }
        },
        {
          "id": "tamil-g12-1-opt-wrong",
          "text": "Just wave and say \"Hi guys!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Grandparents smile but feel a bit sad that Sai did not greet them traditionally.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Greeting grandparents traditionally shows deep respect for elders."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does \"Vanakkam\" mean in Tamil?",
        "options": [
          "Goodbye",
          "Thank you",
          "Welcome / Greetings",
          "Please"
        ],
        "correctIndex": 2,
        "explanation": "Vanakkam is the traditional Tamil greeting of respect."
      },
      {
        "question": "How do we traditionally gesture when saying Vanakkam?",
        "options": [
          "Folds hands together",
          "High five",
          "Salute",
          "Wave one hand"
        ],
        "correctIndex": 0,
        "explanation": "Folding hands together in front of the chest is the gesture of respect."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "tamil-g12-2",
    "categoryId": "tamil-learning",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Tamil Festivals",
    "subtitle": "Celebrate Pongal",
    "character": "Diya",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Culture",
      "Respect"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Diya is visiting their grandparents in the village. They want to greet them respectfully.",
        "illustration": "🦊",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Grandparents love it when we speak in Tamil. Greet them with a warm gesture.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Diya greet their grandparents?",
      "options": [
        {
          "id": "tamil-g12-2-opt-right",
          "text": "Fold hands and say \"Vanakkam!\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Grandparents hug Diya and feel extremely proud.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Vanakkam is the traditional respectful Tamil greeting."
          }
        },
        {
          "id": "tamil-g12-2-opt-wrong",
          "text": "Just wave and say \"Hi guys!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Grandparents smile but feel a bit sad that Diya did not greet them traditionally.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Greeting grandparents traditionally shows deep respect for elders."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does \"Vanakkam\" mean in Tamil?",
        "options": [
          "Goodbye",
          "Thank you",
          "Welcome / Greetings",
          "Please"
        ],
        "correctIndex": 2,
        "explanation": "Vanakkam is the traditional Tamil greeting of respect."
      },
      {
        "question": "How do we traditionally gesture when saying Vanakkam?",
        "options": [
          "Folds hands together",
          "High five",
          "Salute",
          "Wave one hand"
        ],
        "correctIndex": 0,
        "explanation": "Folding hands together in front of the chest is the gesture of respect."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "tamil-g34-1",
    "categoryId": "tamil-learning",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Vanakkam & Culture",
    "subtitle": "Say hello in Tamil",
    "character": "Arun",
    "characterEmoji": "🦉",
    "valuesTaught": [
      "Culture",
      "Respect"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Arun is visiting their grandparents in the village. They want to greet them respectfully.",
        "illustration": "🦉",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Grandparents love it when we speak in Tamil. Greet them with a warm gesture.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Arun greet their grandparents?",
      "options": [
        {
          "id": "tamil-g34-1-opt-right",
          "text": "Fold hands and say \"Vanakkam!\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Grandparents hug Arun and feel extremely proud.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Vanakkam is the traditional respectful Tamil greeting."
          }
        },
        {
          "id": "tamil-g34-1-opt-wrong",
          "text": "Just wave and say \"Hi guys!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Grandparents smile but feel a bit sad that Arun did not greet them traditionally.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Greeting grandparents traditionally shows deep respect for elders."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does \"Vanakkam\" mean in Tamil?",
        "options": [
          "Goodbye",
          "Thank you",
          "Welcome / Greetings",
          "Please"
        ],
        "correctIndex": 2,
        "explanation": "Vanakkam is the traditional Tamil greeting of respect."
      },
      {
        "question": "How do we traditionally gesture when saying Vanakkam?",
        "options": [
          "Folds hands together",
          "High five",
          "Salute",
          "Wave one hand"
        ],
        "correctIndex": 0,
        "explanation": "Folding hands together in front of the chest is the gesture of respect."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "tamil-g34-2",
    "categoryId": "tamil-learning",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Tamil Festivals",
    "subtitle": "Celebrate Pongal",
    "character": "Maya",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Culture",
      "Respect"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya is visiting their grandparents in the village. They want to greet them respectfully.",
        "illustration": "🐱",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Grandparents love it when we speak in Tamil. Greet them with a warm gesture.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Maya greet their grandparents?",
      "options": [
        {
          "id": "tamil-g34-2-opt-right",
          "text": "Fold hands and say \"Vanakkam!\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Grandparents hug Maya and feel extremely proud.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Vanakkam is the traditional respectful Tamil greeting."
          }
        },
        {
          "id": "tamil-g34-2-opt-wrong",
          "text": "Just wave and say \"Hi guys!\"",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Grandparents smile but feel a bit sad that Maya did not greet them traditionally.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Greeting grandparents traditionally shows deep respect for elders."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does \"Vanakkam\" mean in Tamil?",
        "options": [
          "Goodbye",
          "Thank you",
          "Welcome / Greetings",
          "Please"
        ],
        "correctIndex": 2,
        "explanation": "Vanakkam is the traditional Tamil greeting of respect."
      },
      {
        "question": "How do we traditionally gesture when saying Vanakkam?",
        "options": [
          "Folds hands together",
          "High five",
          "Salute",
          "Wave one hand"
        ],
        "correctIndex": 0,
        "explanation": "Folding hands together in front of the chest is the gesture of respect."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "life--g12-1",
    "categoryId": "life-skills",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Tying Your Shoes",
    "subtitle": "Step by step coordination",
    "character": "Arun",
    "characterEmoji": "🐵",
    "valuesTaught": [
      "Independence",
      "Discipline"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Arun is getting ready for school. The shoe laces are untied and loose.",
        "illustration": "🐵",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Walking with untied laces can cause you to trip and fall down.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Arun do about the loose laces?",
      "options": [
        {
          "id": "life--g12-1-opt-right",
          "text": "Sit down and tie the double loop bunny ears.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Arun walks confidently and safely to the school bus.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Tying laces keeps you safe from tripping."
          }
        },
        {
          "id": "life--g12-1-opt-wrong",
          "text": "Tuck the laces inside the shoes and run.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The laces slip out and Arun trips on the stairs.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Tucking laces is unsafe. It is always better to tie them securely."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Why should we keep our shoe laces tied?",
        "options": [
          "To run slower",
          "To prevent tripping and falling",
          "To look cool",
          "To save time"
        ],
        "correctIndex": 1,
        "explanation": "Tied laces ensure safety and stability when walking or running."
      },
      {
        "question": "Which loop method is commonly used for tying laces?",
        "options": [
          "Double knot",
          "Bunny Ears",
          "Single line",
          "Tape"
        ],
        "correctIndex": 1,
        "explanation": "Bunny Ears is a popular, easy-to-learn method for kids."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "life--g12-2",
    "categoryId": "life-skills",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Packing School Bag",
    "subtitle": "Organize for school",
    "character": "Maya",
    "characterEmoji": "🐰",
    "valuesTaught": [
      "Independence",
      "Discipline"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya is getting ready for school. The shoe laces are untied and loose.",
        "illustration": "🐰",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Walking with untied laces can cause you to trip and fall down.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Maya do about the loose laces?",
      "options": [
        {
          "id": "life--g12-2-opt-right",
          "text": "Sit down and tie the double loop bunny ears.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Maya walks confidently and safely to the school bus.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Tying laces keeps you safe from tripping."
          }
        },
        {
          "id": "life--g12-2-opt-wrong",
          "text": "Tuck the laces inside the shoes and run.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The laces slip out and Maya trips on the stairs.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Tucking laces is unsafe. It is always better to tie them securely."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Why should we keep our shoe laces tied?",
        "options": [
          "To run slower",
          "To prevent tripping and falling",
          "To look cool",
          "To save time"
        ],
        "correctIndex": 1,
        "explanation": "Tied laces ensure safety and stability when walking or running."
      },
      {
        "question": "Which loop method is commonly used for tying laces?",
        "options": [
          "Double knot",
          "Bunny Ears",
          "Single line",
          "Tape"
        ],
        "correctIndex": 1,
        "explanation": "Bunny Ears is a popular, easy-to-learn method for kids."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "life--g34-1",
    "categoryId": "life-skills",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Tying Your Shoes",
    "subtitle": "Step by step coordination",
    "character": "Priya",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Independence",
      "Discipline"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya is getting ready for school. The shoe laces are untied and loose.",
        "illustration": "🦁",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Walking with untied laces can cause you to trip and fall down.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Priya do about the loose laces?",
      "options": [
        {
          "id": "life--g34-1-opt-right",
          "text": "Sit down and tie the double loop bunny ears.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Priya walks confidently and safely to the school bus.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Tying laces keeps you safe from tripping."
          }
        },
        {
          "id": "life--g34-1-opt-wrong",
          "text": "Tuck the laces inside the shoes and run.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The laces slip out and Priya trips on the stairs.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Tucking laces is unsafe. It is always better to tie them securely."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Why should we keep our shoe laces tied?",
        "options": [
          "To run slower",
          "To prevent tripping and falling",
          "To look cool",
          "To save time"
        ],
        "correctIndex": 1,
        "explanation": "Tied laces ensure safety and stability when walking or running."
      },
      {
        "question": "Which loop method is commonly used for tying laces?",
        "options": [
          "Double knot",
          "Bunny Ears",
          "Single line",
          "Tape"
        ],
        "correctIndex": 1,
        "explanation": "Bunny Ears is a popular, easy-to-learn method for kids."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "life--g34-2",
    "categoryId": "life-skills",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Packing School Bag",
    "subtitle": "Organize for school",
    "character": "Ravi",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Independence",
      "Discipline"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi is getting ready for school. The shoe laces are untied and loose.",
        "illustration": "🦊",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Walking with untied laces can cause you to trip and fall down.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Ravi do about the loose laces?",
      "options": [
        {
          "id": "life--g34-2-opt-right",
          "text": "Sit down and tie the double loop bunny ears.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Ravi walks confidently and safely to the school bus.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Tying laces keeps you safe from tripping."
          }
        },
        {
          "id": "life--g34-2-opt-wrong",
          "text": "Tuck the laces inside the shoes and run.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The laces slip out and Ravi trips on the stairs.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Tucking laces is unsafe. It is always better to tie them securely."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Why should we keep our shoe laces tied?",
        "options": [
          "To run slower",
          "To prevent tripping and falling",
          "To look cool",
          "To save time"
        ],
        "correctIndex": 1,
        "explanation": "Tied laces ensure safety and stability when walking or running."
      },
      {
        "question": "Which loop method is commonly used for tying laces?",
        "options": [
          "Double knot",
          "Bunny Ears",
          "Single line",
          "Tape"
        ],
        "correctIndex": 1,
        "explanation": "Bunny Ears is a popular, easy-to-learn method for kids."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "money-g12-1",
    "categoryId": "money-management",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Smart Piggy Bank",
    "subtitle": "Start saving coins",
    "character": "Maya",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Saving",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya got some pocket money from their uncle. They want to buy a toy now.",
        "illustration": "🐶",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Saving today helps you buy bigger, more useful things in the future.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Maya do with the pocket money?",
      "options": [
        {
          "id": "money-g12-1-opt-right",
          "text": "Save half in the piggy bank, spend the rest.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Later, Maya has enough money to buy an amazing storybook.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saving regularly builds a strong financial habit."
          }
        },
        {
          "id": "money-g12-1-opt-wrong",
          "text": "Spend all of it immediately on candies.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The candies are finished quickly, and Maya has no savings left.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Spending all money on temporary wants leaves you with nothing for needs."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a piggy bank used for?",
        "options": [
          "Playing games",
          "Storing trash",
          "Saving money",
          "Feeding animals"
        ],
        "correctIndex": 2,
        "explanation": "A piggy bank helps kids save coins and small bills safely."
      },
      {
        "question": "If you save 10 coins every week, how many coins will you have in 5 weeks?",
        "options": [
          "10 coins",
          "50 coins",
          "25 coins",
          "100 coins"
        ],
        "correctIndex": 1,
        "explanation": "10 multiplied by 5 is 50. Saving builds up quickly!"
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "money-g12-2",
    "categoryId": "money-management",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Needs vs Wants",
    "subtitle": "Spend money wisely",
    "character": "Priya",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Saving",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya got some pocket money from their uncle. They want to buy a toy now.",
        "illustration": "🐼",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Saving today helps you buy bigger, more useful things in the future.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Priya do with the pocket money?",
      "options": [
        {
          "id": "money-g12-2-opt-right",
          "text": "Save half in the piggy bank, spend the rest.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Later, Priya has enough money to buy an amazing storybook.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saving regularly builds a strong financial habit."
          }
        },
        {
          "id": "money-g12-2-opt-wrong",
          "text": "Spend all of it immediately on candies.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The candies are finished quickly, and Priya has no savings left.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Spending all money on temporary wants leaves you with nothing for needs."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a piggy bank used for?",
        "options": [
          "Playing games",
          "Storing trash",
          "Saving money",
          "Feeding animals"
        ],
        "correctIndex": 2,
        "explanation": "A piggy bank helps kids save coins and small bills safely."
      },
      {
        "question": "If you save 10 coins every week, how many coins will you have in 5 weeks?",
        "options": [
          "10 coins",
          "50 coins",
          "25 coins",
          "100 coins"
        ],
        "correctIndex": 1,
        "explanation": "10 multiplied by 5 is 50. Saving builds up quickly!"
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "money-g34-1",
    "categoryId": "money-management",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Smart Piggy Bank",
    "subtitle": "Start saving coins",
    "character": "Ravi",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Saving",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi got some pocket money from their uncle. They want to buy a toy now.",
        "illustration": "🐨",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Saving today helps you buy bigger, more useful things in the future.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Ravi do with the pocket money?",
      "options": [
        {
          "id": "money-g34-1-opt-right",
          "text": "Save half in the piggy bank, spend the rest.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Later, Ravi has enough money to buy an amazing storybook.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saving regularly builds a strong financial habit."
          }
        },
        {
          "id": "money-g34-1-opt-wrong",
          "text": "Spend all of it immediately on candies.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The candies are finished quickly, and Ravi has no savings left.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Spending all money on temporary wants leaves you with nothing for needs."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a piggy bank used for?",
        "options": [
          "Playing games",
          "Storing trash",
          "Saving money",
          "Feeding animals"
        ],
        "correctIndex": 2,
        "explanation": "A piggy bank helps kids save coins and small bills safely."
      },
      {
        "question": "If you save 10 coins every week, how many coins will you have in 5 weeks?",
        "options": [
          "10 coins",
          "50 coins",
          "25 coins",
          "100 coins"
        ],
        "correctIndex": 1,
        "explanation": "10 multiplied by 5 is 50. Saving builds up quickly!"
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "money-g34-2",
    "categoryId": "money-management",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Needs vs Wants",
    "subtitle": "Spend money wisely",
    "character": "Kavitha",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Saving",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha got some pocket money from their uncle. They want to buy a toy now.",
        "illustration": "🐸",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Saving today helps you buy bigger, more useful things in the future.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Kavitha do with the pocket money?",
      "options": [
        {
          "id": "money-g34-2-opt-right",
          "text": "Save half in the piggy bank, spend the rest.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Later, Kavitha has enough money to buy an amazing storybook.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saving regularly builds a strong financial habit."
          }
        },
        {
          "id": "money-g34-2-opt-wrong",
          "text": "Spend all of it immediately on candies.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The candies are finished quickly, and Kavitha has no savings left.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Spending all money on temporary wants leaves you with nothing for needs."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a piggy bank used for?",
        "options": [
          "Playing games",
          "Storing trash",
          "Saving money",
          "Feeding animals"
        ],
        "correctIndex": 2,
        "explanation": "A piggy bank helps kids save coins and small bills safely."
      },
      {
        "question": "If you save 10 coins every week, how many coins will you have in 5 weeks?",
        "options": [
          "10 coins",
          "50 coins",
          "25 coins",
          "100 coins"
        ],
        "correctIndex": 1,
        "explanation": "10 multiplied by 5 is 50. Saving builds up quickly!"
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "kindn-g12-1",
    "categoryId": "kindness-empathy",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Sharing is Caring",
    "subtitle": "Share lunch with others",
    "character": "Diya",
    "characterEmoji": "🐵",
    "valuesTaught": [
      "Generosity",
      "Friendship"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Diya notices that their classmate forgot their lunch box today.",
        "illustration": "🐵",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A hungry friend cannot study well. Sharing makes both of you happy.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Diya do to help their classmate?",
      "options": [
        {
          "id": "kindn-g12-1-opt-right",
          "text": "Offer to share half of their sandwich.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both friends eat together happily and become closer friends.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Sharing food builds strong bonds and helps those in need."
          }
        },
        {
          "id": "kindn-g12-1-opt-wrong",
          "text": "Eat alone quickly so no one asks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The classmate sits sadly, and Diya feels guilty inside.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Eating alone when a friend is hungry is not kind. Sharing is caring."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does empathy mean?",
        "options": [
          "Ignoring others",
          "Understanding how others feel",
          "Winning a race",
          "Shouting loudly"
        ],
        "correctIndex": 1,
        "explanation": "Empathy is placing yourself in someone else's shoes to feel what they feel."
      },
      {
        "question": "What is a simple act of kindness you can do at school?",
        "options": [
          "Taking a toy without asking",
          "Sharing a pencil with a friend",
          "Running in the corridor",
          "Laughing at mistakes"
        ],
        "correctIndex": 1,
        "explanation": "Sharing stationery is a very common and simple way to show kindness."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "kindn-g12-2",
    "categoryId": "kindness-empathy",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Helping a Friend",
    "subtitle": "Be a support system",
    "character": "Arun",
    "characterEmoji": "🐰",
    "valuesTaught": [
      "Generosity",
      "Friendship"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Arun notices that their classmate forgot their lunch box today.",
        "illustration": "🐰",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A hungry friend cannot study well. Sharing makes both of you happy.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Arun do to help their classmate?",
      "options": [
        {
          "id": "kindn-g12-2-opt-right",
          "text": "Offer to share half of their sandwich.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both friends eat together happily and become closer friends.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Sharing food builds strong bonds and helps those in need."
          }
        },
        {
          "id": "kindn-g12-2-opt-wrong",
          "text": "Eat alone quickly so no one asks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The classmate sits sadly, and Arun feels guilty inside.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Eating alone when a friend is hungry is not kind. Sharing is caring."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does empathy mean?",
        "options": [
          "Ignoring others",
          "Understanding how others feel",
          "Winning a race",
          "Shouting loudly"
        ],
        "correctIndex": 1,
        "explanation": "Empathy is placing yourself in someone else's shoes to feel what they feel."
      },
      {
        "question": "What is a simple act of kindness you can do at school?",
        "options": [
          "Taking a toy without asking",
          "Sharing a pencil with a friend",
          "Running in the corridor",
          "Laughing at mistakes"
        ],
        "correctIndex": 1,
        "explanation": "Sharing stationery is a very common and simple way to show kindness."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "kindn-g34-1",
    "categoryId": "kindness-empathy",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Sharing is Caring",
    "subtitle": "Share lunch with others",
    "character": "Maya",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Generosity",
      "Friendship"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya notices that their classmate forgot their lunch box today.",
        "illustration": "🦁",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A hungry friend cannot study well. Sharing makes both of you happy.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Maya do to help their classmate?",
      "options": [
        {
          "id": "kindn-g34-1-opt-right",
          "text": "Offer to share half of their sandwich.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both friends eat together happily and become closer friends.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Sharing food builds strong bonds and helps those in need."
          }
        },
        {
          "id": "kindn-g34-1-opt-wrong",
          "text": "Eat alone quickly so no one asks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The classmate sits sadly, and Maya feels guilty inside.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Eating alone when a friend is hungry is not kind. Sharing is caring."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does empathy mean?",
        "options": [
          "Ignoring others",
          "Understanding how others feel",
          "Winning a race",
          "Shouting loudly"
        ],
        "correctIndex": 1,
        "explanation": "Empathy is placing yourself in someone else's shoes to feel what they feel."
      },
      {
        "question": "What is a simple act of kindness you can do at school?",
        "options": [
          "Taking a toy without asking",
          "Sharing a pencil with a friend",
          "Running in the corridor",
          "Laughing at mistakes"
        ],
        "correctIndex": 1,
        "explanation": "Sharing stationery is a very common and simple way to show kindness."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "kindn-g34-2",
    "categoryId": "kindness-empathy",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Helping a Friend",
    "subtitle": "Be a support system",
    "character": "Priya",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Generosity",
      "Friendship"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya notices that their classmate forgot their lunch box today.",
        "illustration": "🦊",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A hungry friend cannot study well. Sharing makes both of you happy.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Priya do to help their classmate?",
      "options": [
        {
          "id": "kindn-g34-2-opt-right",
          "text": "Offer to share half of their sandwich.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both friends eat together happily and become closer friends.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Sharing food builds strong bonds and helps those in need."
          }
        },
        {
          "id": "kindn-g34-2-opt-wrong",
          "text": "Eat alone quickly so no one asks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The classmate sits sadly, and Priya feels guilty inside.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Eating alone when a friend is hungry is not kind. Sharing is caring."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What does empathy mean?",
        "options": [
          "Ignoring others",
          "Understanding how others feel",
          "Winning a race",
          "Shouting loudly"
        ],
        "correctIndex": 1,
        "explanation": "Empathy is placing yourself in someone else's shoes to feel what they feel."
      },
      {
        "question": "What is a simple act of kindness you can do at school?",
        "options": [
          "Taking a toy without asking",
          "Sharing a pencil with a friend",
          "Running in the corridor",
          "Laughing at mistakes"
        ],
        "correctIndex": 1,
        "explanation": "Sharing stationery is a very common and simple way to show kindness."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "learn-g12-1",
    "categoryId": "learn-say-no",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Safe Boundaries",
    "subtitle": "Your body, your rules",
    "character": "Arun",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Safety",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A stranger near the school gate offers Arun a delicious chocolate bar.",
        "illustration": "🐶",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "We should never take food or gifts from people we do not know.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Arun respond to the stranger?",
      "options": [
        {
          "id": "learn-g12-1-opt-right",
          "text": "Say \"No, thank you\" and walk to a teacher immediately.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher praises Arun for making a safe choice.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying no to strangers keeps you safe from danger."
          }
        },
        {
          "id": "learn-g12-1-opt-wrong",
          "text": "Take the chocolate and eat it.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The stranger tries to talk more. Arun feels scared and runs away.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Taking gifts from strangers is unsafe. Always refuse and tell an adult."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Should you take candy from a stranger?",
        "options": [
          "Yes, if it is sweet",
          "No, never",
          "Only if you are hungry",
          "If they look nice"
        ],
        "correctIndex": 1,
        "explanation": "Never take food or gifts from strangers for your personal safety."
      },
      {
        "question": "Who is a safe adult you can tell if a stranger makes you uncomfortable?",
        "options": [
          "Another stranger",
          "A teacher or parent",
          "Nobody",
          "A pet animal"
        ],
        "correctIndex": 1,
        "explanation": "Parents and teachers are trusted adults who can protect you."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "learn-g12-2",
    "categoryId": "learn-say-no",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Saying No to Bullying",
    "subtitle": "Stand up for yourself",
    "character": "Maya",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Safety",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A stranger near the school gate offers Maya a delicious chocolate bar.",
        "illustration": "🐼",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "We should never take food or gifts from people we do not know.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Maya respond to the stranger?",
      "options": [
        {
          "id": "learn-g12-2-opt-right",
          "text": "Say \"No, thank you\" and walk to a teacher immediately.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher praises Maya for making a safe choice.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying no to strangers keeps you safe from danger."
          }
        },
        {
          "id": "learn-g12-2-opt-wrong",
          "text": "Take the chocolate and eat it.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The stranger tries to talk more. Maya feels scared and runs away.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Taking gifts from strangers is unsafe. Always refuse and tell an adult."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Should you take candy from a stranger?",
        "options": [
          "Yes, if it is sweet",
          "No, never",
          "Only if you are hungry",
          "If they look nice"
        ],
        "correctIndex": 1,
        "explanation": "Never take food or gifts from strangers for your personal safety."
      },
      {
        "question": "Who is a safe adult you can tell if a stranger makes you uncomfortable?",
        "options": [
          "Another stranger",
          "A teacher or parent",
          "Nobody",
          "A pet animal"
        ],
        "correctIndex": 1,
        "explanation": "Parents and teachers are trusted adults who can protect you."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "learn-g34-1",
    "categoryId": "learn-say-no",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Safe Boundaries",
    "subtitle": "Your body, your rules",
    "character": "Priya",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Safety",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A stranger near the school gate offers Priya a delicious chocolate bar.",
        "illustration": "🐨",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "We should never take food or gifts from people we do not know.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Priya respond to the stranger?",
      "options": [
        {
          "id": "learn-g34-1-opt-right",
          "text": "Say \"No, thank you\" and walk to a teacher immediately.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher praises Priya for making a safe choice.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying no to strangers keeps you safe from danger."
          }
        },
        {
          "id": "learn-g34-1-opt-wrong",
          "text": "Take the chocolate and eat it.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The stranger tries to talk more. Priya feels scared and runs away.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Taking gifts from strangers is unsafe. Always refuse and tell an adult."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Should you take candy from a stranger?",
        "options": [
          "Yes, if it is sweet",
          "No, never",
          "Only if you are hungry",
          "If they look nice"
        ],
        "correctIndex": 1,
        "explanation": "Never take food or gifts from strangers for your personal safety."
      },
      {
        "question": "Who is a safe adult you can tell if a stranger makes you uncomfortable?",
        "options": [
          "Another stranger",
          "A teacher or parent",
          "Nobody",
          "A pet animal"
        ],
        "correctIndex": 1,
        "explanation": "Parents and teachers are trusted adults who can protect you."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "learn-g34-2",
    "categoryId": "learn-say-no",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Saying No to Bullying",
    "subtitle": "Stand up for yourself",
    "character": "Ravi",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Safety",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A stranger near the school gate offers Ravi a delicious chocolate bar.",
        "illustration": "🐸",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "We should never take food or gifts from people we do not know.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Ravi respond to the stranger?",
      "options": [
        {
          "id": "learn-g34-2-opt-right",
          "text": "Say \"No, thank you\" and walk to a teacher immediately.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The teacher praises Ravi for making a safe choice.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Saying no to strangers keeps you safe from danger."
          }
        },
        {
          "id": "learn-g34-2-opt-wrong",
          "text": "Take the chocolate and eat it.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The stranger tries to talk more. Ravi feels scared and runs away.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Taking gifts from strangers is unsafe. Always refuse and tell an adult."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "Should you take candy from a stranger?",
        "options": [
          "Yes, if it is sweet",
          "No, never",
          "Only if you are hungry",
          "If they look nice"
        ],
        "correctIndex": 1,
        "explanation": "Never take food or gifts from strangers for your personal safety."
      },
      {
        "question": "Who is a safe adult you can tell if a stranger makes you uncomfortable?",
        "options": [
          "Another stranger",
          "A teacher or parent",
          "Nobody",
          "A pet animal"
        ],
        "correctIndex": 1,
        "explanation": "Parents and teachers are trusted adults who can protect you."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "negot-g12-1",
    "categoryId": "negotiation",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Sharing the Swing",
    "subtitle": "Resolve play conflicts",
    "character": "Priya",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Fairness",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Both Priya and their friend want to ride the only swing in the park.",
        "illustration": "🐶",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Fighting over the swing will waste time and ruin the fun for both.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How can they resolve this playground conflict?",
      "options": [
        {
          "id": "negot-g12-1-opt-right",
          "text": "Suggest 5 minutes on the swing for each, taking turns.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both get to swing and they have a great time playing together.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking turns is the fairest way to share a single toy."
          }
        },
        {
          "id": "negot-g12-1-opt-wrong",
          "text": "Push the friend away and claim the swing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The friend starts crying, and the parents stop the play session.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Selfishness spoils the game. Sharing and negotiation ensure everyone plays."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a win-win solution?",
        "options": [
          "Only I win",
          "Only you win",
          "A solution where both are happy",
          "Nobody wins"
        ],
        "correctIndex": 2,
        "explanation": "A win-win solution is the goal of fair negotiations."
      },
      {
        "question": "How do you decide who goes first when sharing?",
        "options": [
          "By fighting",
          "Rock-Paper-Scissors or flipping a coin",
          "Running away",
          "Crying loudly"
        ],
        "correctIndex": 1,
        "explanation": "A simple game of chance is a friendly and fair way to decide order."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "negot-g12-2",
    "categoryId": "negotiation",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Taking Turns",
    "subtitle": "Cooperate on the playground",
    "character": "Ravi",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Fairness",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Both Ravi and their friend want to ride the only swing in the park.",
        "illustration": "🐼",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Fighting over the swing will waste time and ruin the fun for both.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How can they resolve this playground conflict?",
      "options": [
        {
          "id": "negot-g12-2-opt-right",
          "text": "Suggest 5 minutes on the swing for each, taking turns.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both get to swing and they have a great time playing together.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking turns is the fairest way to share a single toy."
          }
        },
        {
          "id": "negot-g12-2-opt-wrong",
          "text": "Push the friend away and claim the swing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The friend starts crying, and the parents stop the play session.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Selfishness spoils the game. Sharing and negotiation ensure everyone plays."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a win-win solution?",
        "options": [
          "Only I win",
          "Only you win",
          "A solution where both are happy",
          "Nobody wins"
        ],
        "correctIndex": 2,
        "explanation": "A win-win solution is the goal of fair negotiations."
      },
      {
        "question": "How do you decide who goes first when sharing?",
        "options": [
          "By fighting",
          "Rock-Paper-Scissors or flipping a coin",
          "Running away",
          "Crying loudly"
        ],
        "correctIndex": 1,
        "explanation": "A simple game of chance is a friendly and fair way to decide order."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "negot-g34-1",
    "categoryId": "negotiation",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Sharing the Swing",
    "subtitle": "Resolve play conflicts",
    "character": "Kavitha",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Fairness",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Both Kavitha and their friend want to ride the only swing in the park.",
        "illustration": "🐨",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Fighting over the swing will waste time and ruin the fun for both.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How can they resolve this playground conflict?",
      "options": [
        {
          "id": "negot-g34-1-opt-right",
          "text": "Suggest 5 minutes on the swing for each, taking turns.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both get to swing and they have a great time playing together.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking turns is the fairest way to share a single toy."
          }
        },
        {
          "id": "negot-g34-1-opt-wrong",
          "text": "Push the friend away and claim the swing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The friend starts crying, and the parents stop the play session.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Selfishness spoils the game. Sharing and negotiation ensure everyone plays."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a win-win solution?",
        "options": [
          "Only I win",
          "Only you win",
          "A solution where both are happy",
          "Nobody wins"
        ],
        "correctIndex": 2,
        "explanation": "A win-win solution is the goal of fair negotiations."
      },
      {
        "question": "How do you decide who goes first when sharing?",
        "options": [
          "By fighting",
          "Rock-Paper-Scissors or flipping a coin",
          "Running away",
          "Crying loudly"
        ],
        "correctIndex": 1,
        "explanation": "A simple game of chance is a friendly and fair way to decide order."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "negot-g34-2",
    "categoryId": "negotiation",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Taking Turns",
    "subtitle": "Cooperate on the playground",
    "character": "Vijay",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Fairness",
      "Patience"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Both Vijay and their friend want to ride the only swing in the park.",
        "illustration": "🐸",
        "speaker": "Vijay",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Fighting over the swing will waste time and ruin the fun for both.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How can they resolve this playground conflict?",
      "options": [
        {
          "id": "negot-g34-2-opt-right",
          "text": "Suggest 5 minutes on the swing for each, taking turns.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Both get to swing and they have a great time playing together.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking turns is the fairest way to share a single toy."
          }
        },
        {
          "id": "negot-g34-2-opt-wrong",
          "text": "Push the friend away and claim the swing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The friend starts crying, and the parents stop the play session.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Selfishness spoils the game. Sharing and negotiation ensure everyone plays."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is a win-win solution?",
        "options": [
          "Only I win",
          "Only you win",
          "A solution where both are happy",
          "Nobody wins"
        ],
        "correctIndex": 2,
        "explanation": "A win-win solution is the goal of fair negotiations."
      },
      {
        "question": "How do you decide who goes first when sharing?",
        "options": [
          "By fighting",
          "Rock-Paper-Scissors or flipping a coin",
          "Running away",
          "Crying loudly"
        ],
        "correctIndex": 1,
        "explanation": "A simple game of chance is a friendly and fair way to decide order."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "commu-g12-1",
    "categoryId": "communication",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Active Listening",
    "subtitle": "Listen with your ears and eyes",
    "character": "Maya",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Attention",
      "Clarity"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya's mother is explaining the homework instructions, but Maya is watching TV.",
        "illustration": "🐶",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Not listening carefully leads to mistakes and incomplete work later.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Maya do while their mother is speaking?",
      "options": [
        {
          "id": "commu-g12-1-opt-right",
          "text": "Turn off the TV, look at mother, and listen.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Maya understands the homework perfectly and finishes it on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Active listening helps you learn and shows respect."
          }
        },
        {
          "id": "commu-g12-1-opt-wrong",
          "text": "Keep watching TV and nod without listening.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Maya makes many mistakes and has to redo the entire homework.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Distractions prevent active listening. Always focus when someone speaks to you."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is active listening?",
        "options": [
          "Looking away",
          "Listening and showing you understand",
          "Interrupting others",
          "Singing a song"
        ],
        "correctIndex": 1,
        "explanation": "Active listening involves paying full attention and responding appropriately."
      },
      {
        "question": "What should you do if you don't understand the instructions?",
        "options": [
          "Ignore it",
          "Cry",
          "Ask the speaker to repeat or clarify",
          "Guess blindly"
        ],
        "correctIndex": 2,
        "explanation": "Asking clarifying questions is a sign of good communication."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "commu-g12-2",
    "categoryId": "communication",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Asking for Help",
    "subtitle": "Speak up when stuck",
    "character": "Priya",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Attention",
      "Clarity"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya's mother is explaining the homework instructions, but Priya is watching TV.",
        "illustration": "🐼",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Not listening carefully leads to mistakes and incomplete work later.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Priya do while their mother is speaking?",
      "options": [
        {
          "id": "commu-g12-2-opt-right",
          "text": "Turn off the TV, look at mother, and listen.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Priya understands the homework perfectly and finishes it on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Active listening helps you learn and shows respect."
          }
        },
        {
          "id": "commu-g12-2-opt-wrong",
          "text": "Keep watching TV and nod without listening.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Priya makes many mistakes and has to redo the entire homework.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Distractions prevent active listening. Always focus when someone speaks to you."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is active listening?",
        "options": [
          "Looking away",
          "Listening and showing you understand",
          "Interrupting others",
          "Singing a song"
        ],
        "correctIndex": 1,
        "explanation": "Active listening involves paying full attention and responding appropriately."
      },
      {
        "question": "What should you do if you don't understand the instructions?",
        "options": [
          "Ignore it",
          "Cry",
          "Ask the speaker to repeat or clarify",
          "Guess blindly"
        ],
        "correctIndex": 2,
        "explanation": "Asking clarifying questions is a sign of good communication."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "commu-g34-1",
    "categoryId": "communication",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Active Listening",
    "subtitle": "Listen with your ears and eyes",
    "character": "Ravi",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Attention",
      "Clarity"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi's mother is explaining the homework instructions, but Ravi is watching TV.",
        "illustration": "🐨",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Not listening carefully leads to mistakes and incomplete work later.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Ravi do while their mother is speaking?",
      "options": [
        {
          "id": "commu-g34-1-opt-right",
          "text": "Turn off the TV, look at mother, and listen.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Ravi understands the homework perfectly and finishes it on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Active listening helps you learn and shows respect."
          }
        },
        {
          "id": "commu-g34-1-opt-wrong",
          "text": "Keep watching TV and nod without listening.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Ravi makes many mistakes and has to redo the entire homework.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Distractions prevent active listening. Always focus when someone speaks to you."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is active listening?",
        "options": [
          "Looking away",
          "Listening and showing you understand",
          "Interrupting others",
          "Singing a song"
        ],
        "correctIndex": 1,
        "explanation": "Active listening involves paying full attention and responding appropriately."
      },
      {
        "question": "What should you do if you don't understand the instructions?",
        "options": [
          "Ignore it",
          "Cry",
          "Ask the speaker to repeat or clarify",
          "Guess blindly"
        ],
        "correctIndex": 2,
        "explanation": "Asking clarifying questions is a sign of good communication."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "commu-g34-2",
    "categoryId": "communication",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Asking for Help",
    "subtitle": "Speak up when stuck",
    "character": "Kavitha",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Attention",
      "Clarity"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha's mother is explaining the homework instructions, but Kavitha is watching TV.",
        "illustration": "🐸",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Not listening carefully leads to mistakes and incomplete work later.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Kavitha do while their mother is speaking?",
      "options": [
        {
          "id": "commu-g34-2-opt-right",
          "text": "Turn off the TV, look at mother, and listen.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Kavitha understands the homework perfectly and finishes it on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Active listening helps you learn and shows respect."
          }
        },
        {
          "id": "commu-g34-2-opt-wrong",
          "text": "Keep watching TV and nod without listening.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Kavitha makes many mistakes and has to redo the entire homework.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Distractions prevent active listening. Always focus when someone speaks to you."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is active listening?",
        "options": [
          "Looking away",
          "Listening and showing you understand",
          "Interrupting others",
          "Singing a song"
        ],
        "correctIndex": 1,
        "explanation": "Active listening involves paying full attention and responding appropriately."
      },
      {
        "question": "What should you do if you don't understand the instructions?",
        "options": [
          "Ignore it",
          "Cry",
          "Ask the speaker to repeat or clarify",
          "Guess blindly"
        ],
        "correctIndex": 2,
        "explanation": "Asking clarifying questions is a sign of good communication."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "inter-g12-1",
    "categoryId": "internet-tech",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Screen Time Balance",
    "subtitle": "Limit your digital world",
    "character": "Anjali",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Moderation",
      "Digital Safety"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Anjali has been playing mobile games for two hours and eyes are hurting.",
        "illustration": "🐱",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Too much screen time can strain eyes and prevent healthy outdoor play.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Anjali do next?",
      "options": [
        {
          "id": "inter-g12-1-opt-right",
          "text": "Put down the phone and go play in the garden.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Anjali's eyes feel rested, and they have fun playing catch.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Balancing screen time with physical activity keeps you healthy."
          }
        },
        {
          "id": "inter-g12-1-opt-wrong",
          "text": "Ignore the eye strain and keep playing games.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Anjali gets a bad headache and cannot sleep well tonight.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Listen to your body. Take regular breaks from digital screens."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Put down the phone and go play in the garden.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "inter-g12-2",
    "categoryId": "internet-tech",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Safe Web Surfing",
    "subtitle": "Click links carefully",
    "character": "Sai",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Moderation",
      "Digital Safety"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Sai has been playing mobile games for two hours and eyes are hurting.",
        "illustration": "🐶",
        "speaker": "Sai",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Too much screen time can strain eyes and prevent healthy outdoor play.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Sai do next?",
      "options": [
        {
          "id": "inter-g12-2-opt-right",
          "text": "Put down the phone and go play in the garden.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Sai's eyes feel rested, and they have fun playing catch.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Balancing screen time with physical activity keeps you healthy."
          }
        },
        {
          "id": "inter-g12-2-opt-wrong",
          "text": "Ignore the eye strain and keep playing games.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Sai gets a bad headache and cannot sleep well tonight.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Listen to your body. Take regular breaks from digital screens."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Put down the phone and go play in the garden.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Sai learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "inter-g34-1",
    "categoryId": "internet-tech",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Screen Time Balance",
    "subtitle": "Limit your digital world",
    "character": "Diya",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Moderation",
      "Digital Safety"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Diya has been playing mobile games for two hours and eyes are hurting.",
        "illustration": "🐼",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Too much screen time can strain eyes and prevent healthy outdoor play.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Diya do next?",
      "options": [
        {
          "id": "inter-g34-1-opt-right",
          "text": "Put down the phone and go play in the garden.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Diya's eyes feel rested, and they have fun playing catch.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Balancing screen time with physical activity keeps you healthy."
          }
        },
        {
          "id": "inter-g34-1-opt-wrong",
          "text": "Ignore the eye strain and keep playing games.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Diya gets a bad headache and cannot sleep well tonight.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Listen to your body. Take regular breaks from digital screens."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Put down the phone and go play in the garden.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Diya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "inter-g34-2",
    "categoryId": "internet-tech",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Safe Web Surfing",
    "subtitle": "Click links carefully",
    "character": "Arun",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Moderation",
      "Digital Safety"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Arun has been playing mobile games for two hours and eyes are hurting.",
        "illustration": "🐨",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Too much screen time can strain eyes and prevent healthy outdoor play.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Arun do next?",
      "options": [
        {
          "id": "inter-g34-2-opt-right",
          "text": "Put down the phone and go play in the garden.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Arun's eyes feel rested, and they have fun playing catch.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Balancing screen time with physical activity keeps you healthy."
          }
        },
        {
          "id": "inter-g34-2-opt-wrong",
          "text": "Ignore the eye strain and keep playing games.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Arun gets a bad headache and cannot sleep well tonight.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Listen to your body. Take regular breaks from digital screens."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Put down the phone and go play in the garden.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Arun learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "ai-ch-g12-1",
    "categoryId": "ai-chatbots",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro What is AI?",
    "subtitle": "Meet the smart machines",
    "character": "Diya",
    "characterEmoji": "🐵",
    "valuesTaught": [
      "Curiosity",
      "Tech Literacy"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Diya hears about artificial intelligence and wonders if it is a real human.",
        "illustration": "🐵",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "AI is a computer program trained on a lot of information to help answer questions.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Diya think about AI?",
      "options": [
        {
          "id": "ai-ch-g12-1-opt-right",
          "text": "As a smart tool that can help me search and learn.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Diya uses AI to find cool facts about planets for school.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "AI is a supportive learning assistant, not a human friend."
          }
        },
        {
          "id": "ai-ch-g12-1-opt-wrong",
          "text": "As a magical magic box that knows everything perfectly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Diya copies an AI mistake and gets a wrong answer on the test.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "AI can make mistakes. Always verify facts with books or teachers."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "As a smart tool that can help me search and learn.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Diya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "ai-ch-g12-2",
    "categoryId": "ai-chatbots",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro AI Voice Assistants",
    "subtitle": "Talk to smart speakers",
    "character": "Arun",
    "characterEmoji": "🐰",
    "valuesTaught": [
      "Curiosity",
      "Tech Literacy"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Arun hears about artificial intelligence and wonders if it is a real human.",
        "illustration": "🐰",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "AI is a computer program trained on a lot of information to help answer questions.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Arun think about AI?",
      "options": [
        {
          "id": "ai-ch-g12-2-opt-right",
          "text": "As a smart tool that can help me search and learn.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Arun uses AI to find cool facts about planets for school.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "AI is a supportive learning assistant, not a human friend."
          }
        },
        {
          "id": "ai-ch-g12-2-opt-wrong",
          "text": "As a magical magic box that knows everything perfectly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Arun copies an AI mistake and gets a wrong answer on the test.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "AI can make mistakes. Always verify facts with books or teachers."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "As a smart tool that can help me search and learn.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Arun learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "ai-ch-g34-1",
    "categoryId": "ai-chatbots",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro What is AI?",
    "subtitle": "Meet the smart machines",
    "character": "Maya",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Curiosity",
      "Tech Literacy"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya hears about artificial intelligence and wonders if it is a real human.",
        "illustration": "🦁",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "AI is a computer program trained on a lot of information to help answer questions.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Maya think about AI?",
      "options": [
        {
          "id": "ai-ch-g34-1-opt-right",
          "text": "As a smart tool that can help me search and learn.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Maya uses AI to find cool facts about planets for school.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "AI is a supportive learning assistant, not a human friend."
          }
        },
        {
          "id": "ai-ch-g34-1-opt-wrong",
          "text": "As a magical magic box that knows everything perfectly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Maya copies an AI mistake and gets a wrong answer on the test.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "AI can make mistakes. Always verify facts with books or teachers."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "As a smart tool that can help me search and learn.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Maya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "ai-ch-g34-2",
    "categoryId": "ai-chatbots",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro AI Voice Assistants",
    "subtitle": "Talk to smart speakers",
    "character": "Priya",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Curiosity",
      "Tech Literacy"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya hears about artificial intelligence and wonders if it is a real human.",
        "illustration": "🦊",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "AI is a computer program trained on a lot of information to help answer questions.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Priya think about AI?",
      "options": [
        {
          "id": "ai-ch-g34-2-opt-right",
          "text": "As a smart tool that can help me search and learn.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Priya uses AI to find cool facts about planets for school.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "AI is a supportive learning assistant, not a human friend."
          }
        },
        {
          "id": "ai-ch-g34-2-opt-wrong",
          "text": "As a magical magic box that knows everything perfectly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Priya copies an AI mistake and gets a wrong answer on the test.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "AI can make mistakes. Always verify facts with books or teachers."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "As a smart tool that can help me search and learn.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Priya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "creat-g12-1",
    "categoryId": "creativity",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Building Block Castle",
    "subtitle": "Imagine and construct",
    "character": "Maya",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Imagination",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya wants to build a giant toy castle but doesn't have enough red blocks.",
        "illustration": "🐸",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Creative thinkers use alternative items when their first choice is missing.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Maya do to build the castle?",
      "options": [
        {
          "id": "creat-g12-1-opt-right",
          "text": "Use blue and green blocks to make a multi-color castle.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The castle looks unique, and friends love the colorful design!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Creativity means adapting and using your imagination."
          }
        },
        {
          "id": "creat-g12-1-opt-wrong",
          "text": "Stop building and feel sad about the red blocks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No castle is built, and the blocks lie unused on the floor.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Do not let small limits stop you. Use what you have to create."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use blue and green blocks to make a multi-color castle.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Maya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "creat-g12-2",
    "categoryId": "creativity",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Making Story Plots",
    "subtitle": "Create a hero adventure",
    "character": "Priya",
    "characterEmoji": "🐵",
    "valuesTaught": [
      "Imagination",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya wants to build a giant toy castle but doesn't have enough red blocks.",
        "illustration": "🐵",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Creative thinkers use alternative items when their first choice is missing.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Priya do to build the castle?",
      "options": [
        {
          "id": "creat-g12-2-opt-right",
          "text": "Use blue and green blocks to make a multi-color castle.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The castle looks unique, and friends love the colorful design!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Creativity means adapting and using your imagination."
          }
        },
        {
          "id": "creat-g12-2-opt-wrong",
          "text": "Stop building and feel sad about the red blocks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No castle is built, and the blocks lie unused on the floor.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Do not let small limits stop you. Use what you have to create."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use blue and green blocks to make a multi-color castle.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Priya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "creat-g34-1",
    "categoryId": "creativity",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Building Block Castle",
    "subtitle": "Imagine and construct",
    "character": "Ravi",
    "characterEmoji": "🐰",
    "valuesTaught": [
      "Imagination",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi wants to build a giant toy castle but doesn't have enough red blocks.",
        "illustration": "🐰",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Creative thinkers use alternative items when their first choice is missing.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Ravi do to build the castle?",
      "options": [
        {
          "id": "creat-g34-1-opt-right",
          "text": "Use blue and green blocks to make a multi-color castle.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The castle looks unique, and friends love the colorful design!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Creativity means adapting and using your imagination."
          }
        },
        {
          "id": "creat-g34-1-opt-wrong",
          "text": "Stop building and feel sad about the red blocks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No castle is built, and the blocks lie unused on the floor.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Do not let small limits stop you. Use what you have to create."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use blue and green blocks to make a multi-color castle.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Ravi learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "creat-g34-2",
    "categoryId": "creativity",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Making Story Plots",
    "subtitle": "Create a hero adventure",
    "character": "Kavitha",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Imagination",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha wants to build a giant toy castle but doesn't have enough red blocks.",
        "illustration": "🦁",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Creative thinkers use alternative items when their first choice is missing.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Kavitha do to build the castle?",
      "options": [
        {
          "id": "creat-g34-2-opt-right",
          "text": "Use blue and green blocks to make a multi-color castle.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The castle looks unique, and friends love the colorful design!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Creativity means adapting and using your imagination."
          }
        },
        {
          "id": "creat-g34-2-opt-wrong",
          "text": "Stop building and feel sad about the red blocks.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No castle is built, and the blocks lie unused on the floor.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Do not let small limits stop you. Use what you have to create."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use blue and green blocks to make a multi-color castle.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Kavitha learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "confi-g12-1",
    "categoryId": "confidence",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Trying New Things",
    "subtitle": "Ride bicycle without support",
    "character": "Maya",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Self-Belief",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Maya wants to learn cycling but is afraid of falling and getting hurt.",
        "illustration": "🐶",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Every expert was once a beginner. Falling down is just a part of learning.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Maya start learning?",
      "options": [
        {
          "id": "confi-g12-1-opt-right",
          "text": "Wear a helmet, start slowly with an adult holding the seat.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Maya rides a short distance safely and feels super proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Confidence grows when we take safe steps to try new things."
          }
        },
        {
          "id": "confi-g12-1-opt-wrong",
          "text": "Refuse to touch the bicycle and stay inside.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Maya watches friends ride around and feels left out.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Fear stops us from enjoying new adventures. Be brave and try!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Wear a helmet, start slowly with an adult holding the seat.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Maya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "confi-g12-2",
    "categoryId": "confidence",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Overcoming Mistakes",
    "subtitle": "Stand up after a fall",
    "character": "Priya",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Self-Belief",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Priya wants to learn cycling but is afraid of falling and getting hurt.",
        "illustration": "🐼",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Every expert was once a beginner. Falling down is just a part of learning.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Priya start learning?",
      "options": [
        {
          "id": "confi-g12-2-opt-right",
          "text": "Wear a helmet, start slowly with an adult holding the seat.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Priya rides a short distance safely and feels super proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Confidence grows when we take safe steps to try new things."
          }
        },
        {
          "id": "confi-g12-2-opt-wrong",
          "text": "Refuse to touch the bicycle and stay inside.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Priya watches friends ride around and feels left out.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Fear stops us from enjoying new adventures. Be brave and try!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Wear a helmet, start slowly with an adult holding the seat.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Priya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "confi-g34-1",
    "categoryId": "confidence",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Trying New Things",
    "subtitle": "Ride bicycle without support",
    "character": "Ravi",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Self-Belief",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi wants to learn cycling but is afraid of falling and getting hurt.",
        "illustration": "🐨",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Every expert was once a beginner. Falling down is just a part of learning.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Ravi start learning?",
      "options": [
        {
          "id": "confi-g34-1-opt-right",
          "text": "Wear a helmet, start slowly with an adult holding the seat.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Ravi rides a short distance safely and feels super proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Confidence grows when we take safe steps to try new things."
          }
        },
        {
          "id": "confi-g34-1-opt-wrong",
          "text": "Refuse to touch the bicycle and stay inside.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Ravi watches friends ride around and feels left out.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Fear stops us from enjoying new adventures. Be brave and try!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Wear a helmet, start slowly with an adult holding the seat.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Ravi learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "confi-g34-2",
    "categoryId": "confidence",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Overcoming Mistakes",
    "subtitle": "Stand up after a fall",
    "character": "Kavitha",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Self-Belief",
      "Courage"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha wants to learn cycling but is afraid of falling and getting hurt.",
        "illustration": "🐸",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Every expert was once a beginner. Falling down is just a part of learning.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Kavitha start learning?",
      "options": [
        {
          "id": "confi-g34-2-opt-right",
          "text": "Wear a helmet, start slowly with an adult holding the seat.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Kavitha rides a short distance safely and feels super proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Confidence grows when we take safe steps to try new things."
          }
        },
        {
          "id": "confi-g34-2-opt-wrong",
          "text": "Refuse to touch the bicycle and stay inside.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Kavitha watches friends ride around and feels left out.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Fear stops us from enjoying new adventures. Be brave and try!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Wear a helmet, start slowly with an adult holding the seat.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Kavitha learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "leade-g12-1",
    "categoryId": "leadership",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Class Monitor Helper",
    "subtitle": "Help organize the classroom",
    "character": "Arun",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Responsibility",
      "Teamwork"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "The teacher asks Arun to hand out notebooks while the class is making noise.",
        "illustration": "🐶",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A good leader communicates calmly and guides others by setting a good example.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Arun handle the noisy classroom?",
      "options": [
        {
          "id": "leade-g12-1-opt-right",
          "text": "Speak in a polite voice and ask rows to collect books quietly.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class quiets down, and notebooks are distributed quickly.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Polite and clear communication is the mark of a great leader."
          }
        },
        {
          "id": "leade-g12-1-opt-wrong",
          "text": "Shout loudly at everyone to shut up.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The students shout back, and the classroom becomes even noisier.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting causes conflict. Lead with calm actions and polite words."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Speak in a polite voice and ask rows to collect books quietly.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Arun learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "leade-g12-2",
    "categoryId": "leadership",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Leading the Clean-Up",
    "subtitle": "Teamwork starts with you",
    "character": "Maya",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Responsibility",
      "Teamwork"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "The teacher asks Maya to hand out notebooks while the class is making noise.",
        "illustration": "🐼",
        "speaker": "Maya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A good leader communicates calmly and guides others by setting a good example.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Maya handle the noisy classroom?",
      "options": [
        {
          "id": "leade-g12-2-opt-right",
          "text": "Speak in a polite voice and ask rows to collect books quietly.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class quiets down, and notebooks are distributed quickly.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Polite and clear communication is the mark of a great leader."
          }
        },
        {
          "id": "leade-g12-2-opt-wrong",
          "text": "Shout loudly at everyone to shut up.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The students shout back, and the classroom becomes even noisier.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting causes conflict. Lead with calm actions and polite words."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Speak in a polite voice and ask rows to collect books quietly.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Maya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "leade-g34-1",
    "categoryId": "leadership",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Class Monitor Helper",
    "subtitle": "Help organize the classroom",
    "character": "Priya",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Responsibility",
      "Teamwork"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "The teacher asks Priya to hand out notebooks while the class is making noise.",
        "illustration": "🐨",
        "speaker": "Priya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A good leader communicates calmly and guides others by setting a good example.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Priya handle the noisy classroom?",
      "options": [
        {
          "id": "leade-g34-1-opt-right",
          "text": "Speak in a polite voice and ask rows to collect books quietly.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class quiets down, and notebooks are distributed quickly.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Polite and clear communication is the mark of a great leader."
          }
        },
        {
          "id": "leade-g34-1-opt-wrong",
          "text": "Shout loudly at everyone to shut up.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The students shout back, and the classroom becomes even noisier.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting causes conflict. Lead with calm actions and polite words."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Speak in a polite voice and ask rows to collect books quietly.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Priya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "leade-g34-2",
    "categoryId": "leadership",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Leading the Clean-Up",
    "subtitle": "Teamwork starts with you",
    "character": "Ravi",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Responsibility",
      "Teamwork"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "The teacher asks Ravi to hand out notebooks while the class is making noise.",
        "illustration": "🐸",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "A good leader communicates calmly and guides others by setting a good example.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Ravi handle the noisy classroom?",
      "options": [
        {
          "id": "leade-g34-2-opt-right",
          "text": "Speak in a polite voice and ask rows to collect books quietly.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class quiets down, and notebooks are distributed quickly.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Polite and clear communication is the mark of a great leader."
          }
        },
        {
          "id": "leade-g34-2-opt-wrong",
          "text": "Shout loudly at everyone to shut up.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The students shout back, and the classroom becomes even noisier.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Shouting causes conflict. Lead with calm actions and polite words."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Speak in a polite voice and ask rows to collect books quietly.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Ravi learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "focus-g12-1",
    "categoryId": "focus-discipline",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Homework First",
    "subtitle": "Finish tasks before play",
    "character": "Kavitha",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Discipline",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha wants to watch cartoon shows, but their homework is not finished yet.",
        "illustration": "🐶",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Finishing important tasks first lets you enjoy play time without stress.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What choice should Kavitha make?",
      "options": [
        {
          "id": "focus-g12-1-opt-right",
          "text": "Complete the math homework first, then watch cartoons.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Homework is neat and correct, and play time feels relaxing.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Discipline means doing what needs to be done first."
          }
        },
        {
          "id": "focus-g12-1-opt-wrong",
          "text": "Watch cartoons first and delay the homework.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "It gets late, Kavitha is sleepy, and the homework has many mistakes.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Delaying tasks causes rushed work and stress. Do homework first."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Complete the math homework first, then watch cartoons.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Kavitha learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "focus-g12-2",
    "categoryId": "focus-discipline",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro The Quiet Study Area",
    "subtitle": "Avoid study distractions",
    "character": "Vijay",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Discipline",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Vijay wants to watch cartoon shows, but their homework is not finished yet.",
        "illustration": "🐼",
        "speaker": "Vijay",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Finishing important tasks first lets you enjoy play time without stress.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What choice should Vijay make?",
      "options": [
        {
          "id": "focus-g12-2-opt-right",
          "text": "Complete the math homework first, then watch cartoons.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Homework is neat and correct, and play time feels relaxing.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Discipline means doing what needs to be done first."
          }
        },
        {
          "id": "focus-g12-2-opt-wrong",
          "text": "Watch cartoons first and delay the homework.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "It gets late, Vijay is sleepy, and the homework has many mistakes.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Delaying tasks causes rushed work and stress. Do homework first."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Complete the math homework first, then watch cartoons.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Vijay learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "focus-g34-1",
    "categoryId": "focus-discipline",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Homework First",
    "subtitle": "Finish tasks before play",
    "character": "Deepak",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Discipline",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Deepak wants to watch cartoon shows, but their homework is not finished yet.",
        "illustration": "🐨",
        "speaker": "Deepak",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Finishing important tasks first lets you enjoy play time without stress.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What choice should Deepak make?",
      "options": [
        {
          "id": "focus-g34-1-opt-right",
          "text": "Complete the math homework first, then watch cartoons.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Homework is neat and correct, and play time feels relaxing.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Discipline means doing what needs to be done first."
          }
        },
        {
          "id": "focus-g34-1-opt-wrong",
          "text": "Watch cartoons first and delay the homework.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "It gets late, Deepak is sleepy, and the homework has many mistakes.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Delaying tasks causes rushed work and stress. Do homework first."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Complete the math homework first, then watch cartoons.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Deepak learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "focus-g34-2",
    "categoryId": "focus-discipline",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro The Quiet Study Area",
    "subtitle": "Avoid study distractions",
    "character": "Anjali",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Discipline",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Anjali wants to watch cartoon shows, but their homework is not finished yet.",
        "illustration": "🐸",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Finishing important tasks first lets you enjoy play time without stress.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What choice should Anjali make?",
      "options": [
        {
          "id": "focus-g34-2-opt-right",
          "text": "Complete the math homework first, then watch cartoons.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Homework is neat and correct, and play time feels relaxing.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Discipline means doing what needs to be done first."
          }
        },
        {
          "id": "focus-g34-2-opt-wrong",
          "text": "Watch cartoons first and delay the homework.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "It gets late, Anjali is sleepy, and the homework has many mistakes.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Delaying tasks causes rushed work and stress. Do homework first."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Complete the math homework first, then watch cartoons.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "safet-g12-1",
    "categoryId": "safety",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Crossing the Road",
    "subtitle": "Look right, look left",
    "character": "Anjali",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Safety",
      "Awareness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Anjali needs to cross the street to reach the playground. Traffic is moving.",
        "illustration": "🦁",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Road safety rules protect us from fast cars and accidents.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Anjali cross the road safely?",
      "options": [
        {
          "id": "safet-g12-1-opt-right",
          "text": "Use the pedestrian zebra crossing and look both ways.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Anjali crosses safely when the pedestrian light turns green.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Always cross at zebra crossings and check traffic."
          }
        },
        {
          "id": "safet-g12-1-opt-wrong",
          "text": "Run across the middle of the road quickly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "A car honks loudly and stops suddenly. Anjali is safe but very scared.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Running blindly across the road is extremely dangerous. Be safe."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use the pedestrian zebra crossing and look both ways.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "safet-g12-2",
    "categoryId": "safety",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Fire Drill Safety",
    "subtitle": "Stay calm in emergency",
    "character": "Sai",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Safety",
      "Awareness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Sai needs to cross the street to reach the playground. Traffic is moving.",
        "illustration": "🦊",
        "speaker": "Sai",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Road safety rules protect us from fast cars and accidents.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Sai cross the road safely?",
      "options": [
        {
          "id": "safet-g12-2-opt-right",
          "text": "Use the pedestrian zebra crossing and look both ways.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Sai crosses safely when the pedestrian light turns green.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Always cross at zebra crossings and check traffic."
          }
        },
        {
          "id": "safet-g12-2-opt-wrong",
          "text": "Run across the middle of the road quickly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "A car honks loudly and stops suddenly. Sai is safe but very scared.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Running blindly across the road is extremely dangerous. Be safe."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use the pedestrian zebra crossing and look both ways.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Sai learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "safet-g34-1",
    "categoryId": "safety",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Crossing the Road",
    "subtitle": "Look right, look left",
    "character": "Diya",
    "characterEmoji": "🦉",
    "valuesTaught": [
      "Safety",
      "Awareness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Diya needs to cross the street to reach the playground. Traffic is moving.",
        "illustration": "🦉",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Road safety rules protect us from fast cars and accidents.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Diya cross the road safely?",
      "options": [
        {
          "id": "safet-g34-1-opt-right",
          "text": "Use the pedestrian zebra crossing and look both ways.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Diya crosses safely when the pedestrian light turns green.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Always cross at zebra crossings and check traffic."
          }
        },
        {
          "id": "safet-g34-1-opt-wrong",
          "text": "Run across the middle of the road quickly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "A car honks loudly and stops suddenly. Diya is safe but very scared.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Running blindly across the road is extremely dangerous. Be safe."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use the pedestrian zebra crossing and look both ways.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Diya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "safet-g34-2",
    "categoryId": "safety",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Fire Drill Safety",
    "subtitle": "Stay calm in emergency",
    "character": "Arun",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Safety",
      "Awareness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Arun needs to cross the street to reach the playground. Traffic is moving.",
        "illustration": "🐱",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Road safety rules protect us from fast cars and accidents.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Arun cross the road safely?",
      "options": [
        {
          "id": "safet-g34-2-opt-right",
          "text": "Use the pedestrian zebra crossing and look both ways.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Arun crosses safely when the pedestrian light turns green.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Always cross at zebra crossings and check traffic."
          }
        },
        {
          "id": "safet-g34-2-opt-wrong",
          "text": "Run across the middle of the road quickly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "A car honks loudly and stops suddenly. Arun is safe but very scared.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Running blindly across the road is extremely dangerous. Be safe."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Use the pedestrian zebra crossing and look both ways.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Arun learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "socia-g12-1",
    "categoryId": "social-skills",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Making a Friend",
    "subtitle": "Introduce yourself",
    "character": "Anjali",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Social Bond",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A new student joins the class and sits alone. Anjali wants to talk to them.",
        "illustration": "🐶",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Welcoming new classmates helps them feel comfortable and make friends.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Anjali approach the new classmate?",
      "options": [
        {
          "id": "socia-g12-1-opt-right",
          "text": "Sit next to them, smile, and say: \"Hi! I am Anjali. What is your name?\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The classmate smiles, introduces themselves, and they talk about games.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "A simple, friendly introduction is the start of a great friendship."
          }
        },
        {
          "id": "socia-g12-1-opt-wrong",
          "text": "Stare at them from a distance and make comments.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The new student feels nervous and looks down at their desk.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Staring makes people feel uncomfortable. Be warm and welcoming instead."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Sit next to them, smile, and say: \"Hi! I am Anjali. What is your name?\"",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "socia-g12-2",
    "categoryId": "social-skills",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Apologizing Sincerely",
    "subtitle": "Say sorry with meaning",
    "character": "Sai",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Social Bond",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A new student joins the class and sits alone. Sai wants to talk to them.",
        "illustration": "🐼",
        "speaker": "Sai",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Welcoming new classmates helps them feel comfortable and make friends.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Sai approach the new classmate?",
      "options": [
        {
          "id": "socia-g12-2-opt-right",
          "text": "Sit next to them, smile, and say: \"Hi! I am Sai. What is your name?\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The classmate smiles, introduces themselves, and they talk about games.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "A simple, friendly introduction is the start of a great friendship."
          }
        },
        {
          "id": "socia-g12-2-opt-wrong",
          "text": "Stare at them from a distance and make comments.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The new student feels nervous and looks down at their desk.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Staring makes people feel uncomfortable. Be warm and welcoming instead."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Sit next to them, smile, and say: \"Hi! I am Sai. What is your name?\"",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Sai learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "socia-g34-1",
    "categoryId": "social-skills",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Making a Friend",
    "subtitle": "Introduce yourself",
    "character": "Diya",
    "characterEmoji": "🐨",
    "valuesTaught": [
      "Social Bond",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A new student joins the class and sits alone. Diya wants to talk to them.",
        "illustration": "🐨",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Welcoming new classmates helps them feel comfortable and make friends.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Diya approach the new classmate?",
      "options": [
        {
          "id": "socia-g34-1-opt-right",
          "text": "Sit next to them, smile, and say: \"Hi! I am Diya. What is your name?\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The classmate smiles, introduces themselves, and they talk about games.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "A simple, friendly introduction is the start of a great friendship."
          }
        },
        {
          "id": "socia-g34-1-opt-wrong",
          "text": "Stare at them from a distance and make comments.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The new student feels nervous and looks down at their desk.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Staring makes people feel uncomfortable. Be warm and welcoming instead."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Sit next to them, smile, and say: \"Hi! I am Diya. What is your name?\"",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Diya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "socia-g34-2",
    "categoryId": "social-skills",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Apologizing Sincerely",
    "subtitle": "Say sorry with meaning",
    "character": "Arun",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Social Bond",
      "Communication"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "A new student joins the class and sits alone. Arun wants to talk to them.",
        "illustration": "🐸",
        "speaker": "Arun",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Welcoming new classmates helps them feel comfortable and make friends.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Arun approach the new classmate?",
      "options": [
        {
          "id": "socia-g34-2-opt-right",
          "text": "Sit next to them, smile, and say: \"Hi! I am Arun. What is your name?\"",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The classmate smiles, introduces themselves, and they talk about games.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "A simple, friendly introduction is the start of a great friendship."
          }
        },
        {
          "id": "socia-g34-2-opt-wrong",
          "text": "Stare at them from a distance and make comments.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The new student feels nervous and looks down at their desk.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Staring makes people feel uncomfortable. Be warm and welcoming instead."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Sit next to them, smile, and say: \"Hi! I am Arun. What is your name?\"",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Arun learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "habit-g12-1",
    "categoryId": "habit-building",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Brushing Your Teeth",
    "subtitle": "Protect your bright smile",
    "character": "Deepak",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Hygiene",
      "consistency"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Deepak is sleepy at night and wants to skip brushing their teeth before bed.",
        "illustration": "🦁",
        "speaker": "Deepak",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Food particles left overnight can cause painful cavities and bad breath.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Deepak do before sleeping?",
      "options": [
        {
          "id": "habit-g12-1-opt-right",
          "text": "Spend 2 minutes brushing teeth thoroughly with paste.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Deepak's teeth are clean, fresh, and cavity-free.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Brushing twice daily keeps your teeth and gums healthy."
          }
        },
        {
          "id": "habit-g12-1-opt-wrong",
          "text": "Go straight to sleep without brushing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Over time, Deepak gets a painful toothache and has to visit the dentist.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Skipping hygiene routines leads to bad health. Consistency is key."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Spend 2 minutes brushing teeth thoroughly with paste.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Deepak learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "habit-g12-2",
    "categoryId": "habit-building",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Morning Routine Setup",
    "subtitle": "Start the day right",
    "character": "Anjali",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Hygiene",
      "consistency"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Anjali is sleepy at night and wants to skip brushing their teeth before bed.",
        "illustration": "🦊",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Food particles left overnight can cause painful cavities and bad breath.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Anjali do before sleeping?",
      "options": [
        {
          "id": "habit-g12-2-opt-right",
          "text": "Spend 2 minutes brushing teeth thoroughly with paste.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Anjali's teeth are clean, fresh, and cavity-free.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Brushing twice daily keeps your teeth and gums healthy."
          }
        },
        {
          "id": "habit-g12-2-opt-wrong",
          "text": "Go straight to sleep without brushing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Over time, Anjali gets a painful toothache and has to visit the dentist.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Skipping hygiene routines leads to bad health. Consistency is key."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Spend 2 minutes brushing teeth thoroughly with paste.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "habit-g34-1",
    "categoryId": "habit-building",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Brushing Your Teeth",
    "subtitle": "Protect your bright smile",
    "character": "Sai",
    "characterEmoji": "🦉",
    "valuesTaught": [
      "Hygiene",
      "consistency"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Sai is sleepy at night and wants to skip brushing their teeth before bed.",
        "illustration": "🦉",
        "speaker": "Sai",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Food particles left overnight can cause painful cavities and bad breath.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Sai do before sleeping?",
      "options": [
        {
          "id": "habit-g34-1-opt-right",
          "text": "Spend 2 minutes brushing teeth thoroughly with paste.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Sai's teeth are clean, fresh, and cavity-free.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Brushing twice daily keeps your teeth and gums healthy."
          }
        },
        {
          "id": "habit-g34-1-opt-wrong",
          "text": "Go straight to sleep without brushing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Over time, Sai gets a painful toothache and has to visit the dentist.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Skipping hygiene routines leads to bad health. Consistency is key."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Spend 2 minutes brushing teeth thoroughly with paste.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Sai learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "habit-g34-2",
    "categoryId": "habit-building",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Morning Routine Setup",
    "subtitle": "Start the day right",
    "character": "Diya",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Hygiene",
      "consistency"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Diya is sleepy at night and wants to skip brushing their teeth before bed.",
        "illustration": "🐱",
        "speaker": "Diya",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Food particles left overnight can cause painful cavities and bad breath.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Diya do before sleeping?",
      "options": [
        {
          "id": "habit-g34-2-opt-right",
          "text": "Spend 2 minutes brushing teeth thoroughly with paste.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Diya's teeth are clean, fresh, and cavity-free.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Brushing twice daily keeps your teeth and gums healthy."
          }
        },
        {
          "id": "habit-g34-2-opt-wrong",
          "text": "Go straight to sleep without brushing.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "Over time, Diya gets a painful toothache and has to visit the dentist.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Skipping hygiene routines leads to bad health. Consistency is key."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Spend 2 minutes brushing teeth thoroughly with paste.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Diya learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "emoti-g12-1",
    "categoryId": "emotional-control",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Calming Big Anger",
    "subtitle": "Take deep breaths",
    "character": "Ravi",
    "characterEmoji": "🦉",
    "valuesTaught": [
      "Self-Control",
      "Mindfulness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Ravi's paper tower fell down. They feel like crying and kicking the blocks.",
        "illustration": "🦉",
        "speaker": "Ravi",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Feeling angry is natural, but acting aggressively doesn't solve the problem.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Ravi handle this big feeling?",
      "options": [
        {
          "id": "emoti-g12-1-opt-right",
          "text": "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Ravi feels calm, rebuilds a stronger tower, and has fun.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking deep breaths helps calm the brain down in angry moments."
          }
        },
        {
          "id": "emoti-g12-1-opt-wrong",
          "text": "Kick the blocks across the room and yell loudly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The blocks hit a vase, it breaks, and Ravi's mother is upset.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Yelling and kicking cause damage. Calm down first before reacting."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Ravi learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "emoti-g12-2",
    "categoryId": "emotional-control",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Handling Disappointment",
    "subtitle": "Keep calm when losing",
    "character": "Kavitha",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Self-Control",
      "Mindfulness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha's paper tower fell down. They feel like crying and kicking the blocks.",
        "illustration": "🐱",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Feeling angry is natural, but acting aggressively doesn't solve the problem.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Kavitha handle this big feeling?",
      "options": [
        {
          "id": "emoti-g12-2-opt-right",
          "text": "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Kavitha feels calm, rebuilds a stronger tower, and has fun.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking deep breaths helps calm the brain down in angry moments."
          }
        },
        {
          "id": "emoti-g12-2-opt-wrong",
          "text": "Kick the blocks across the room and yell loudly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The blocks hit a vase, it breaks, and Kavitha's mother is upset.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Yelling and kicking cause damage. Calm down first before reacting."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Kavitha learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "emoti-g34-1",
    "categoryId": "emotional-control",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Calming Big Anger",
    "subtitle": "Take deep breaths",
    "character": "Vijay",
    "characterEmoji": "🐶",
    "valuesTaught": [
      "Self-Control",
      "Mindfulness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Vijay's paper tower fell down. They feel like crying and kicking the blocks.",
        "illustration": "🐶",
        "speaker": "Vijay",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Feeling angry is natural, but acting aggressively doesn't solve the problem.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Vijay handle this big feeling?",
      "options": [
        {
          "id": "emoti-g34-1-opt-right",
          "text": "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Vijay feels calm, rebuilds a stronger tower, and has fun.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking deep breaths helps calm the brain down in angry moments."
          }
        },
        {
          "id": "emoti-g34-1-opt-wrong",
          "text": "Kick the blocks across the room and yell loudly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The blocks hit a vase, it breaks, and Vijay's mother is upset.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Yelling and kicking cause damage. Calm down first before reacting."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Vijay learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "emoti-g34-2",
    "categoryId": "emotional-control",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Handling Disappointment",
    "subtitle": "Keep calm when losing",
    "character": "Deepak",
    "characterEmoji": "🐼",
    "valuesTaught": [
      "Self-Control",
      "Mindfulness"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Deepak's paper tower fell down. They feel like crying and kicking the blocks.",
        "illustration": "🐼",
        "speaker": "Deepak",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Feeling angry is natural, but acting aggressively doesn't solve the problem.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "How should Deepak handle this big feeling?",
      "options": [
        {
          "id": "emoti-g34-2-opt-right",
          "text": "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "Deepak feels calm, rebuilds a stronger tower, and has fun.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Taking deep breaths helps calm the brain down in angry moments."
          }
        },
        {
          "id": "emoti-g34-2-opt-wrong",
          "text": "Kick the blocks across the room and yell loudly.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The blocks hit a vase, it breaks, and Deepak's mother is upset.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Yelling and kicking cause damage. Calm down first before reacting."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stop, close eyes, take 3 deep breaths, then rebuild.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Deepak learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "probl-g12-1",
    "categoryId": "problem-solving",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Finding the Lost Key",
    "subtitle": "Search step by step",
    "character": "Kavitha",
    "characterEmoji": "🐸",
    "valuesTaught": [
      "Logic",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha cannot find the house keys. The bag is messy, and they are in a rush.",
        "illustration": "🐸",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Searching randomly makes us panic. A systematic search is much faster.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What is the best way for Kavitha to search?",
      "options": [
        {
          "id": "probl-g12-1-opt-right",
          "text": "Check the pockets, then the main bag compartment, one by one.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The key is found in the side zipper pocket! Kavitha leaves on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Systematic searching saves time and prevents panic."
          }
        },
        {
          "id": "probl-g12-1-opt-wrong",
          "text": "Dump everything on the floor and shout in stress.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The items get mixed up, and finding the key takes double the time.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Panic blocks your thinking. Stay calm and search one spot at a time."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Check the pockets, then the main bag compartment, one by one.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Kavitha learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "probl-g12-2",
    "categoryId": "problem-solving",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Grouping Similar Shapes",
    "subtitle": "Sort by attributes",
    "character": "Vijay",
    "characterEmoji": "🐵",
    "valuesTaught": [
      "Logic",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Vijay cannot find the house keys. The bag is messy, and they are in a rush.",
        "illustration": "🐵",
        "speaker": "Vijay",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Searching randomly makes us panic. A systematic search is much faster.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What is the best way for Vijay to search?",
      "options": [
        {
          "id": "probl-g12-2-opt-right",
          "text": "Check the pockets, then the main bag compartment, one by one.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The key is found in the side zipper pocket! Vijay leaves on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Systematic searching saves time and prevents panic."
          }
        },
        {
          "id": "probl-g12-2-opt-wrong",
          "text": "Dump everything on the floor and shout in stress.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The items get mixed up, and finding the key takes double the time.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Panic blocks your thinking. Stay calm and search one spot at a time."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Check the pockets, then the main bag compartment, one by one.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Vijay learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "probl-g34-1",
    "categoryId": "problem-solving",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Finding the Lost Key",
    "subtitle": "Search step by step",
    "character": "Deepak",
    "characterEmoji": "🐰",
    "valuesTaught": [
      "Logic",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Deepak cannot find the house keys. The bag is messy, and they are in a rush.",
        "illustration": "🐰",
        "speaker": "Deepak",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Searching randomly makes us panic. A systematic search is much faster.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What is the best way for Deepak to search?",
      "options": [
        {
          "id": "probl-g34-1-opt-right",
          "text": "Check the pockets, then the main bag compartment, one by one.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The key is found in the side zipper pocket! Deepak leaves on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Systematic searching saves time and prevents panic."
          }
        },
        {
          "id": "probl-g34-1-opt-wrong",
          "text": "Dump everything on the floor and shout in stress.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The items get mixed up, and finding the key takes double the time.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Panic blocks your thinking. Stay calm and search one spot at a time."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Check the pockets, then the main bag compartment, one by one.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Deepak learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "probl-g34-2",
    "categoryId": "problem-solving",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Grouping Similar Shapes",
    "subtitle": "Sort by attributes",
    "character": "Anjali",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Logic",
      "Focus"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Anjali cannot find the house keys. The bag is messy, and they are in a rush.",
        "illustration": "🦁",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Searching randomly makes us panic. A systematic search is much faster.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What is the best way for Anjali to search?",
      "options": [
        {
          "id": "probl-g34-2-opt-right",
          "text": "Check the pockets, then the main bag compartment, one by one.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The key is found in the side zipper pocket! Anjali leaves on time.",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Systematic searching saves time and prevents panic."
          }
        },
        {
          "id": "probl-g34-2-opt-wrong",
          "text": "Dump everything on the floor and shout in stress.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "The items get mixed up, and finding the key takes double the time.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Panic blocks your thinking. Stay calm and search one spot at a time."
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Check the pockets, then the main bag compartment, one by one.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "publi-g12-1",
    "categoryId": "public-speaking",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Show and Tell Prep",
    "subtitle": "Talk about your favorite toy",
    "character": "Kavitha",
    "characterEmoji": "🦁",
    "valuesTaught": [
      "Expression",
      "Confidence"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Kavitha has to talk about their pet puppy in front of the class today.",
        "illustration": "🦁",
        "speaker": "Kavitha",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Stage fright is normal. Looking at smiling friends helps you feel safe.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Kavitha do on the stage?",
      "options": [
        {
          "id": "publi-g12-1-opt-right",
          "text": "Stand tall, look at friends, and speak in a clear voice.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class claps, and Kavitha feels incredibly happy and proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Speaking clearly and looking at your audience builds connection."
          }
        },
        {
          "id": "publi-g12-1-opt-wrong",
          "text": "Look at the floor, whisper, and run back to the desk.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No one could hear the talk. Kavitha feels disappointed with themselves.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Whispering blocks your voice. Believe in yourself and speak up!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stand tall, look at friends, and speak in a clear voice.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Kavitha learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "publi-g12-2",
    "categoryId": "public-speaking",
    "gradeMin": 1,
    "gradeMax": 2,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Speaking Loud & Clear",
    "subtitle": "Speak with confidence",
    "character": "Vijay",
    "characterEmoji": "🦊",
    "valuesTaught": [
      "Expression",
      "Confidence"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Vijay has to talk about their pet puppy in front of the class today.",
        "illustration": "🦊",
        "speaker": "Vijay",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Stage fright is normal. Looking at smiling friends helps you feel safe.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Vijay do on the stage?",
      "options": [
        {
          "id": "publi-g12-2-opt-right",
          "text": "Stand tall, look at friends, and speak in a clear voice.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class claps, and Vijay feels incredibly happy and proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Speaking clearly and looking at your audience builds connection."
          }
        },
        {
          "id": "publi-g12-2-opt-wrong",
          "text": "Look at the floor, whisper, and run back to the desk.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No one could hear the talk. Vijay feels disappointed with themselves.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Whispering blocks your voice. Believe in yourself and speak up!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stand tall, look at friends, and speak in a clear voice.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Vijay learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 25,
    "coinReward": 15
  },
  {
    "id": "publi-g34-1",
    "categoryId": "public-speaking",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "beginner",
    "order": 1,
    "title": "Intro Show and Tell Prep",
    "subtitle": "Talk about your favorite toy",
    "character": "Deepak",
    "characterEmoji": "🦉",
    "valuesTaught": [
      "Expression",
      "Confidence"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Deepak has to talk about their pet puppy in front of the class today.",
        "illustration": "🦉",
        "speaker": "Deepak",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Stage fright is normal. Looking at smiling friends helps you feel safe.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Deepak do on the stage?",
      "options": [
        {
          "id": "publi-g34-1-opt-right",
          "text": "Stand tall, look at friends, and speak in a clear voice.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class claps, and Deepak feels incredibly happy and proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Speaking clearly and looking at your audience builds connection."
          }
        },
        {
          "id": "publi-g34-1-opt-wrong",
          "text": "Look at the floor, whisper, and run back to the desk.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No one could hear the talk. Deepak feels disappointed with themselves.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Whispering blocks your voice. Believe in yourself and speak up!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stand tall, look at friends, and speak in a clear voice.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Deepak learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  },
  {
    "id": "publi-g34-2",
    "categoryId": "public-speaking",
    "gradeMin": 3,
    "gradeMax": 4,
    "difficulty": "intermediate",
    "order": 2,
    "title": "Intro Speaking Loud & Clear",
    "subtitle": "Speak with confidence",
    "character": "Anjali",
    "characterEmoji": "🐱",
    "valuesTaught": [
      "Expression",
      "Confidence"
    ],
    "scenes": [
      {
        "title": "Scene 1: The Dilemma",
        "text": "Anjali has to talk about their pet puppy in front of the class today.",
        "illustration": "🐱",
        "speaker": "Anjali",
        "dialogue": "\"Oh, what should I do here? I want to make the right choice!\""
      },
      {
        "title": "Scene 2: Core Concept",
        "text": "Stage fright is normal. Looking at smiling friends helps you feel safe.",
        "illustration": "💡",
        "speaker": "Narrator",
        "dialogue": "\"Making thoughtful choices builds your character and helps those around you.\""
      }
    ],
    "decision": {
      "question": "What should Anjali do on the stage?",
      "options": [
        {
          "id": "publi-g34-2-opt-right",
          "text": "Stand tall, look at friends, and speak in a clear voice.",
          "emoji": "✅",
          "consequence": {
            "title": "Great Choice!",
            "text": "The class claps, and Anjali feels incredibly happy and proud!",
            "illustration": "🎉",
            "dialogue": "\"Awesome! This worked out so well!\"",
            "isCorrect": true,
            "lesson": "Speaking clearly and looking at your audience builds connection."
          }
        },
        {
          "id": "publi-g34-2-opt-wrong",
          "text": "Look at the floor, whisper, and run back to the desk.",
          "emoji": "❌",
          "consequence": {
            "title": "Not Quite Right",
            "text": "No one could hear the talk. Anjali feels disappointed with themselves.",
            "illustration": "🧐",
            "dialogue": "\"Let's think about this... Maybe there's a better way.\"",
            "isCorrect": false,
            "lesson": "Whispering blocks your voice. Believe in yourself and speak up!"
          }
        }
      ]
    },
    "quiz": [
      {
        "question": "What is the correct action here?",
        "options": [
          "Option A",
          "Stand tall, look at friends, and speak in a clear voice.",
          "Option C",
          "Option D"
        ],
        "correctIndex": 1,
        "explanation": "Making the correct, ethical choice teaches accountability."
      },
      {
        "question": "What did Anjali learn from this lesson?",
        "options": [
          "To act impulsively",
          "To seek help and choose wisely",
          "To ignore others",
          "Nothing"
        ],
        "correctIndex": 1,
        "explanation": "Thinking before acting leads to better decisions and builds confidence."
      }
    ],
    "xpReward": 35,
    "coinReward": 15
  }
];

export default PRIMARY_LESSONS;
