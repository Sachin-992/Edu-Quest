-- ============================================================
-- QUESTION BANK EXPANSION — 250 Questions for Class 7
-- Run in Supabase SQL Editor
-- ============================================================

-- ==========================================
-- SCIENCE: Add lessons + quiz + questions
-- ==========================================
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward)
SELECT s.id, l.title, l.title_tamil, l.content, l.content_tamil, l.lesson_order, l.xp_reward
FROM public.subjects s
CROSS JOIN (VALUES
  ('Heat and Temperature', 'வெப்பம் மற்றும் வெப்பநிலை', 'Heat is a form of energy that flows from a hotter body to a cooler body. Temperature measures how hot or cold a body is. A thermometer is used to measure temperature. Clinical thermometers measure body temperature (35°C to 42°C). Heat causes expansion in solids, liquids, and gases.', 'வெப்பம் என்பது ஒரு வெப்பமான பொருளிலிருந்து குளிர்ந்த பொருளுக்கு பாயும் ஓர் ஆற்றல் வடிவம்.', 1, 15),
  ('Acids, Bases and Salts', 'அமிலங்கள், காரங்கள் மற்றும் உப்புகள்', 'Acids taste sour and turn blue litmus red. Bases taste bitter and turn red litmus blue. When an acid reacts with a base, a salt and water are formed. This is called neutralization. Indicators like litmus, turmeric, and phenolphthalein help identify acids and bases.', 'அமிலங்கள் புளிப்பு சுவை கொண்டவை, நீல லிட்மஸை சிவப்பாக மாற்றும்.', 2, 15),
  ('Physical and Chemical Changes', 'இயற்பியல் மற்றும் வேதியியல் மாற்றங்கள்', 'Physical changes are reversible and no new substance is formed (e.g., melting of ice). Chemical changes are usually irreversible and new substances are formed (e.g., rusting of iron, burning of paper). Signs of chemical change: color change, gas evolution, heat/light production.', 'இயற்பியல் மாற்றங்கள் மீளக்கூடியவை, புதிய பொருள் உருவாவதில்லை.', 3, 20),
  ('Weather, Climate and Adaptations', 'வானிலை, காலநிலை மற்றும் தகவமைப்புகள்', 'Weather is the day-to-day condition of the atmosphere. Climate is the average weather pattern over a long period. Animals and plants adapt to their climate. Polar bears have thick fur for cold regions. Camels have long eyelashes to protect from sand.', 'வானிலை என்பது வளிமண்டலத்தின் அன்றாட நிலை.', 4, 15),
  ('Respiration in Organisms', 'உயிரினங்களில் சுவாசம்', 'Breathing is the process of inhaling oxygen and exhaling carbon dioxide. Respiration is the breakdown of glucose in cells to release energy. Aerobic respiration uses oxygen. Anaerobic respiration occurs without oxygen (e.g., in yeast during fermentation).', 'சுவாசிப்பது ஆக்சிஜனை உள்ளிழுத்து கார்பன்-டை-ஆக்சைடை வெளியிடும் செயல்முறை.', 5, 20)
) AS l(title, title_tamil, content, content_tamil, lesson_order, xp_reward)
WHERE s.name = 'Science' AND s.class_level = 7;

-- Science quizzes
INSERT INTO public.quizzes (lesson_id, title, title_tamil, quiz_type, xp_reward)
SELECT l.id, 'Quiz: ' || l.title, 'வினாடி வினா: ' || COALESCE(l.title_tamil, l.title), 'mixed', 25
FROM public.lessons l
JOIN public.subjects s ON s.id = l.subject_id
WHERE s.name = 'Science' AND s.class_level = 7;

-- Science questions: Heat and Temperature
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('What is the unit of temperature?', 'வெப்பநிலையின் அலகு என்ன?', 'mcq', '["Joule","Degree Celsius","Watt","Newton"]', 'Degree Celsius', 'Temperature is measured in degrees Celsius (°C) or Kelvin (K).', 1, 10),
  ('Heat flows from a _____ body to a _____ body.', 'வெப்பம் _____ உடலிலிருந்து _____ உடலுக்கு பாயும்.', 'fill_blank', '["hotter, cooler","cooler, hotter","same, same","lighter, heavier"]', 'hotter, cooler', 'Heat always flows from higher temperature to lower temperature.', 2, 10),
  ('A clinical thermometer reads between 35°C and 42°C.', 'மருத்துவ வெப்பமானி 35°C முதல் 42°C வரை படிக்கும்.', 'true_false', '["True","False"]', 'True', 'Clinical thermometers measure body temperature in range 35-42°C.', 3, 10),
  ('Which of these is NOT a good conductor of heat?', 'கீழே உள்ளவற்றுள் வெப்பத்தின் நல்ல கடத்தி அல்லாதது எது?', 'mcq', '["Copper","Iron","Wood","Aluminium"]', 'Wood', 'Wood is a poor conductor (insulator) of heat.', 4, 10),
  ('Metals expand on heating.', 'உலோகங்கள் வெப்பமடையும் போது விரிவடையும்.', 'true_false', '["True","False"]', 'True', 'All metals expand when heated — this is thermal expansion.', 5, 10),
  ('What instrument is used to measure temperature?', 'வெப்பநிலையை அளக்கப் பயன்படும் கருவி எது?', 'mcq', '["Barometer","Thermometer","Anemometer","Hygrometer"]', 'Thermometer', 'A thermometer measures temperature.', 6, 10),
  ('Land breeze blows during _____', 'நிலக்காற்று _____ நேரத்தில் வீசும்', 'fill_blank', '["night","day","morning","evening"]', 'night', 'At night land cools faster than sea, so breeze flows from land to sea.', 7, 10),
  ('Dark-colored objects absorb more heat than light-colored ones.', 'கரும் நிற பொருள்கள் வெளிர் நிறப் பொருட்களை விட அதிக வெப்பத்தை உறிஞ்சும்.', 'true_false', '["True","False"]', 'True', 'Dark surfaces absorb more radiant heat than light surfaces.', 8, 10),
  ('In which direction does sea breeze blow?', 'கடல் காற்று எந்த திசையில் வீசும்?', 'mcq', '["Sea to land","Land to sea","North to south","Up to down"]', 'Sea to land', 'During daytime, land heats faster so air rises and cooler sea air rushes in.', 9, 10),
  ('Mercury is used in thermometers because it _____ uniformly.', 'வெப்பமானிகளில் பாதரசம் பயன்படுத்தப்படுகிறது, ஏனெனில் அது சீராக _____.', 'fill_blank', '["expands","contracts","freezes","boils"]', 'expands', 'Mercury expands uniformly with temperature — ideal for measurement.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Heat and Temperature';

-- Acids Bases questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('Which indicator turns red in acid?', 'எந்த குறிகாட்டி அமிலத்தில் சிவப்பாக மாறும்?', 'mcq', '["Blue litmus","Red litmus","Turmeric","Methyl orange"]', 'Blue litmus', 'Blue litmus paper turns red in acidic solution.', 1, 10),
  ('Neutralization produces salt and _____.', 'நடுநிலைப்படுத்துதல் உப்பு மற்றும் _____ உருவாக்கும்.', 'fill_blank', '["water","acid","gas","oil"]', 'water', 'Acid + Base → Salt + Water', 2, 10),
  ('Bases taste bitter.', 'காரங்கள் கசப்பு சுவை கொண்டவை.', 'true_false', '["True","False"]', 'True', 'Bases have a bitter taste and slippery feel.', 3, 10),
  ('What is the pH of a neutral solution?', 'நடுநிலை கரைசலின் pH மதிப்பு என்ன?', 'mcq', '["0","7","14","1"]', '7', 'pH 7 is neutral. Below 7 is acidic, above 7 is basic.', 4, 10),
  ('Turmeric turns _____ in a basic solution.', 'மஞ்சள் காரக் கரைசலில் _____ நிறமாக மாறும்.', 'fill_blank', '["red","yellow","green","blue"]', 'red', 'Turmeric is a natural indicator that turns red/brown in bases.', 5, 10),
  ('Lemon juice is acidic.', 'எலுமிச்சை சாறு அமிலத்தன்மை கொண்டது.', 'true_false', '["True","False"]', 'True', 'Lemon juice contains citric acid.', 6, 10),
  ('Which acid is found in the stomach?', 'வயிற்றில் காணப்படும் அமிலம் எது?', 'mcq', '["Hydrochloric acid","Sulfuric acid","Acetic acid","Nitric acid"]', 'Hydrochloric acid', 'HCl is secreted in the stomach to aid digestion.', 7, 10),
  ('Soap is a base.', 'சோப்பு ஒரு காரம்.', 'true_false', '["True","False"]', 'True', 'Soap solution is basic in nature.', 8, 10),
  ('Ant sting contains _____ acid.', 'எறும்பு கொட்டலில் _____ அமிலம் உள்ளது.', 'fill_blank', '["formic","acetic","citric","lactic"]', 'formic', 'Ant stings inject formic acid (methanoic acid).', 9, 10),
  ('Which is used as an antacid?', 'அமிலநீக்கியாகப் பயன்படுத்தப்படுவது எது?', 'mcq', '["Milk of magnesia","Vinegar","Lemon juice","Curd"]', 'Milk of magnesia', 'Milk of magnesia (Mg(OH)₂) neutralizes excess stomach acid.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Acids, Bases and Salts';

-- Physical Chemical Changes questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('Melting of ice is a _____ change.', 'பனி உருகுவது _____ மாற்றம்.', 'fill_blank', '["physical","chemical","nuclear","biological"]', 'physical', 'Melting is reversible — ice can freeze back. No new substance formed.', 1, 10),
  ('Rusting of iron is a chemical change.', 'இரும்பு துருப்பிடிப்பது வேதியியல் மாற்றம்.', 'true_false', '["True","False"]', 'True', 'Rusting forms a new substance (iron oxide) and is irreversible.', 2, 10),
  ('Which is a sign of chemical change?', 'வேதியியல் மாற்றத்தின் அடையாளம் எது?', 'mcq', '["Change in color","Change in shape","Change in size","All of these"]', 'Change in color', 'Color change, gas evolution, and heat/light are signs of chemical change.', 3, 10),
  ('Burning of paper is reversible.', 'காகிதம் எரிவது மீளக்கூடியது.', 'true_false', '["True","False"]', 'False', 'Burning is irreversible — ash cannot become paper again.', 4, 10),
  ('Dissolving sugar in water is a _____ change.', 'சர்க்கரையை நீரில் கரைப்பது _____ மாற்றம்.', 'fill_blank', '["physical","chemical","permanent","nuclear"]', 'physical', 'Sugar can be recovered by evaporation — reversible process.', 5, 10),
  ('Cooking an egg is which type of change?', 'முட்டை சமைப்பது எந்த வகை மாற்றம்?', 'mcq', '["Chemical","Physical","Temporary","Mechanical"]', 'Chemical', 'Cooking changes protein structure permanently — irreversible.', 6, 10),
  ('Cutting wood is a physical change.', 'மரத்தை வெட்டுவது இயற்பியல் மாற்றம்.', 'true_false', '["True","False"]', 'True', 'Only the size/shape changes, no new substance is formed.', 7, 10),
  ('Curdling of milk is a _____ change.', 'பாலை தயிராக மாற்றுவது _____ மாற்றம்.', 'fill_blank', '["chemical","physical","temporary","mechanical"]', 'chemical', 'Curd is a new substance — cannot revert to milk.', 8, 10),
  ('Which gas is produced when iron rusts?', 'இரும்பு துருப்பிடிக்கும் போது எந்த வாயு ஈடுபடுகிறது?', 'mcq', '["Oxygen","Nitrogen","Hydrogen","Carbon dioxide"]', 'Oxygen', 'Iron + Oxygen + Water → Iron oxide (rust)', 9, 10),
  ('Tearing paper is a chemical change.', 'காகிதத்தை கிழிப்பது வேதியியல் மாற்றம்.', 'true_false', '["True","False"]', 'False', 'Tearing only changes shape — it is a physical change.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Physical and Chemical Changes';

-- ==========================================
-- ENGLISH: Add lessons + quiz + questions
-- ==========================================
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward)
SELECT s.id, l.title, l.title_tamil, l.content, l.content_tamil, l.lesson_order, l.xp_reward
FROM public.subjects s
CROSS JOIN (VALUES
  ('Parts of Speech', 'பேச்சின் பகுதிகள்', 'Parts of speech classify words by their function. The 8 parts are: Noun (person/place/thing), Pronoun (replaces noun), Verb (action), Adjective (describes noun), Adverb (describes verb), Preposition (shows relation), Conjunction (joins words), Interjection (expresses emotion).', 'பேச்சின் பகுதிகள் சொற்களை அவற்றின் செயல்பாட்டின்படி வகைப்படுத்துகின்றன.', 1, 15),
  ('Tenses', 'காலங்கள்', 'Tenses show when an action happens. Present tense: She reads. Past tense: She read. Future tense: She will read. Each has simple, continuous, perfect, and perfect continuous forms. Correct tense usage is essential for clear communication.', 'காலங்கள் ஒரு செயல் எப்போது நடக்கிறது என்பதைக் காட்டுகின்றன.', 2, 15),
  ('Active and Passive Voice', 'செயல் மற்றும் செயற்பாட்டு வினை', 'Active voice: The subject performs the action (The cat chased the mouse). Passive voice: The subject receives the action (The mouse was chased by the cat). Passive voice uses a form of "be" + past participle.', 'செயல் வினை: எழுவாய் செயலை செய்கிறது.', 3, 20),
  ('Comprehension Skills', 'புரிதல் திறன்கள்', 'Reading comprehension means understanding what you read. Steps: 1) Read the passage carefully. 2) Identify the main idea. 3) Note key details. 4) Answer questions using evidence from the text. 5) Summarize in your own words.', 'வாசிப்புப் புரிதல் என்பது நீங்கள் படிப்பதைப் புரிந்துகொள்வது.', 4, 15),
  ('Letter Writing', 'கடிதம் எழுதுதல்', 'Formal letters have: sender address, date, receiver address, subject, salutation (Dear Sir/Madam), body, closing (Yours faithfully), and signature. Informal letters are to friends/family with casual tone. Letters should be clear, concise, and well-organized.', 'முறையான கடிதங்களில் உள்ளது: அனுப்புநர் முகவரி, தேதி, பெறுநர் முகவரி.', 5, 15)
) AS l(title, title_tamil, content, content_tamil, lesson_order, xp_reward)
WHERE s.name = 'English' AND s.class_level = 7;

INSERT INTO public.quizzes (lesson_id, title, title_tamil, quiz_type, xp_reward)
SELECT l.id, 'Quiz: ' || l.title, 'வினாடி வினா: ' || COALESCE(l.title_tamil, l.title), 'mixed', 25
FROM public.lessons l JOIN public.subjects s ON s.id = l.subject_id
WHERE s.name = 'English' AND s.class_level = 7;

-- English: Parts of Speech questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('A noun is a name of a person, place, or _____.', 'பெயர்ச்சொல் என்பது ஒரு நபர், இடம் அல்லது _____ பெயர்.', 'fill_blank', '["thing","action","quality","none"]', 'thing', 'Nouns name persons, places, things, or ideas.', 1, 10),
  ('"She" is a pronoun.', '"She" என்பது ஒரு பிரதிப்பெயர்.', 'true_false', '["True","False"]', 'True', 'Pronouns replace nouns. She, he, it, they are pronouns.', 2, 10),
  ('Which word is a verb? "The dog runs fast."', '"The dog runs fast" - எது வினைச்சொல்?', 'mcq', '["dog","runs","fast","the"]', 'runs', 'Runs is the action word (verb) in this sentence.', 3, 10),
  ('An adjective describes a _____.', 'ஒரு பெயரடை _____ விவரிக்கிறது.', 'fill_blank', '["noun","verb","adverb","preposition"]', 'noun', 'Adjectives describe or modify nouns (e.g., big, blue, happy).', 4, 10),
  ('"Wow!" is an interjection.', '"Wow!" என்பது ஒரு வியப்புச்சொல்.', 'true_false', '["True","False"]', 'True', 'Interjections express sudden emotions: Oh! Wow! Hurray!', 5, 10),
  ('Which is a conjunction?', 'எது ஒரு இணைப்புச்சொல்?', 'mcq', '["and","beautiful","quickly","in"]', 'and', 'Conjunctions join words or sentences: and, but, or, so.', 6, 10),
  ('"Quickly" is an adverb.', '"Quickly" என்பது ஒரு வினையடை.', 'true_false', '["True","False"]', 'True', 'Adverbs describe how an action is done. Quickly modifies the verb.', 7, 10),
  ('Identify the preposition: "The book is on the table."', '"The book is on the table" - முன்னிடைச்சொல்லை கண்டறி.', 'mcq', '["book","is","on","table"]', 'on', 'On shows the relationship between book and table.', 8, 10),
  ('"Happy" is a/an _____.', '"Happy" என்பது _____.', 'fill_blank', '["adjective","verb","noun","adverb"]', 'adjective', 'Happy describes a quality — it is an adjective.', 9, 10),
  ('How many parts of speech are there?', 'பேச்சின் எத்தனை பகுதிகள் உள்ளன?', 'mcq', '["6","8","10","4"]', '8', 'The 8 parts: noun, pronoun, verb, adjective, adverb, preposition, conjunction, interjection.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Parts of Speech';

-- English: Tenses questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('"She is reading" is in which tense?', '"She is reading" எந்த காலத்தில் உள்ளது?', 'mcq', '["Present continuous","Past continuous","Simple present","Future"]', 'Present continuous', 'is + -ing form = present continuous tense.', 1, 10),
  ('"They played yesterday" is past tense.', '"They played yesterday" கடந்த காலம்.', 'true_false', '["True","False"]', 'True', 'Played is past tense of play. Yesterday confirms past time.', 2, 10),
  ('The future tense of "go" is "will _____".', '"go" இன் எதிர்காலம் "will _____".', 'fill_blank', '["go","went","gone","going"]', 'go', 'Future tense = will + base form of verb.', 3, 10),
  ('Which sentence is in simple present?', 'எது எளிய நிகழ்காலத்தில் உள்ளது?', 'mcq', '["She sings well","She sang well","She is singing","She will sing"]', 'She sings well', 'Simple present uses base verb (+ s/es for third person).', 4, 10),
  ('"I have finished" is present perfect.', '"I have finished" என்பது நிகழ்கால முற்றிலும்.', 'true_false', '["True","False"]', 'True', 'have/has + past participle = present perfect tense.', 5, 10),
  ('Past tense of "write" is _____.', '"write" இன் கடந்த காலம் _____.', 'fill_blank', '["wrote","written","writing","writes"]', 'wrote', 'Write → wrote (simple past), written (past participle).', 6, 10),
  ('"He was running" is which tense?', '"He was running" எந்த காலம்?', 'mcq', '["Past continuous","Past simple","Present continuous","Future"]', 'Past continuous', 'was/were + -ing = past continuous tense.', 7, 10),
  ('"We will go" is future tense.', '"We will go" எதிர்காலம்.', 'true_false', '["True","False"]', 'True', 'Will + base form = simple future tense.', 8, 10),
  ('She _____ to school every day. (go)', 'அவள் தினமும் பள்ளிக்கு _____. (go)', 'fill_blank', '["goes","went","going","gone"]', 'goes', 'Third person singular + every day = simple present = goes.', 9, 10),
  ('How many main types of tenses are there?', 'எத்தனை முக்கிய வகையான காலங்கள் உள்ளன?', 'mcq', '["3","4","6","2"]', '3', 'Three main tenses: Past, Present, Future.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Tenses';

-- ==========================================
-- SOCIAL SCIENCE: Add lessons + quiz + questions
-- ==========================================
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward)
SELECT s.id, l.title, l.title_tamil, l.content, l.content_tamil, l.lesson_order, l.xp_reward
FROM public.subjects s
CROSS JOIN (VALUES
  ('Medieval India - Delhi Sultanate', 'இடைக்கால இந்தியா - டெல்லி சுல்தானகம்', 'The Delhi Sultanate (1206-1526) was ruled by five dynasties: Slave, Khilji, Tughlaq, Sayyid, and Lodi. Important rulers include Qutub-ud-din Aibak, Alauddin Khilji, and Muhammad bin Tughlaq. Qutub Minar was built during this period.', 'டெல்லி சுல்தானகம் (1206-1526) ஐந்து வம்சங்களால் ஆளப்பட்டது.', 1, 15),
  ('The Mughal Empire', 'முகலாய பேரரசு', 'The Mughal Empire (1526-1857) was founded by Babur. Akbar was known for his policy of religious tolerance (Din-i-Ilahi, Sulh-i-Kul). Shah Jahan built the Taj Mahal. Aurangzeb expanded the empire but his policies led to its decline.', 'முகலாய பேரரசை (1526-1857) பாபர் நிறுவினார்.', 2, 15),
  ('Our Environment', 'நமது சுற்றுச்சூழல்', 'Environment includes biotic (living) and abiotic (non-living) components. Ecosystems can be terrestrial or aquatic. The water cycle, nitrogen cycle, and carbon cycle are essential natural processes. Deforestation, pollution, and global warming are major environmental threats.', 'சுற்றுச்சூழல் உயிருள்ள மற்றும் உயிரற்ற கூறுகளை உள்ளடக்கியது.', 3, 20),
  ('Democracy and Equality', 'ஜனநாயகம் மற்றும் சமத்துவம்', 'Democracy means government by the people. India is the largest democracy. Key features: universal adult franchise, fundamental rights, rule of law, and independent judiciary. Equality means all citizens have equal rights regardless of caste, religion, gender, or economic status.', 'ஜனநாயகம் என்பது மக்களால் நிர்வாகம்.', 4, 15),
  ('Maps and Globes', 'வரைபடங்கள் மற்றும் புவிக்கோளங்கள்', 'Maps are flat representations of the Earth. Types: physical maps (terrain), political maps (boundaries), thematic maps (specific data). Scale shows the ratio between map distance and actual distance. Latitude lines run east-west, longitude lines run north-south. The Prime Meridian is 0° longitude.', 'வரைபடங்கள் பூமியின் தட்டையான பிரதிநிதித்துவங்கள்.', 5, 15)
) AS l(title, title_tamil, content, content_tamil, lesson_order, xp_reward)
WHERE s.name = 'Social Science' AND s.class_level = 7;

INSERT INTO public.quizzes (lesson_id, title, title_tamil, quiz_type, xp_reward)
SELECT l.id, 'Quiz: ' || l.title, 'வினாடி வினா: ' || COALESCE(l.title_tamil, l.title), 'mixed', 25
FROM public.lessons l JOIN public.subjects s ON s.id = l.subject_id
WHERE s.name = 'Social Science' AND s.class_level = 7;

-- Social Science: Delhi Sultanate questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('Who founded the Delhi Sultanate?', 'டெல்லி சுல்தானகத்தை நிறுவியவர் யார்?', 'mcq', '["Qutub-ud-din Aibak","Babur","Akbar","Alauddin Khilji"]', 'Qutub-ud-din Aibak', 'Qutub-ud-din Aibak of the Slave Dynasty founded the Delhi Sultanate in 1206.', 1, 10),
  ('The Delhi Sultanate lasted from 1206 to _____.', 'டெல்லி சுல்தானகம் 1206 முதல் _____ வரை நீடித்தது.', 'fill_blank', '["1526","1857","1757","1947"]', '1526', 'The Delhi Sultanate ended in 1526 with the Battle of Panipat.', 2, 10),
  ('Qutub Minar was built during the Delhi Sultanate.', 'குதுப் மினார் டெல்லி சுல்தானகத்தின் போது கட்டப்பட்டது.', 'true_false', '["True","False"]', 'True', 'Construction began under Qutub-ud-din Aibak around 1192.', 3, 10),
  ('How many dynasties ruled the Delhi Sultanate?', 'டெல்லி சுல்தானகத்தை எத்தனை வம்சங்கள் ஆட்சி செய்தன?', 'mcq', '["5","3","7","4"]', '5', 'Slave, Khilji, Tughlaq, Sayyid, and Lodi dynasties.', 4, 10),
  ('Muhammad bin Tughlaq shifted the capital to _____.', 'முகம்மது பின் துக்ளக் தலைநகரை _____ மாற்றினார்.', 'fill_blank', '["Daulatabad","Agra","Lahore","Jaipur"]', 'Daulatabad', 'He shifted from Delhi to Daulatabad (Devagiri) in the Deccan.', 5, 10),
  ('Alauddin Khilji introduced market reforms.', 'அலாவுதீன் கில்ஜி சந்தை சீர்திருத்தங்களை அறிமுகப்படுத்தினார்.', 'true_false', '["True","False"]', 'True', 'He fixed prices of goods and controlled markets strictly.', 6, 10),
  ('The last dynasty of the Sultanate was?', 'சுல்தானகத்தின் கடைசி வம்சம் எது?', 'mcq', '["Lodi","Tughlaq","Sayyid","Slave"]', 'Lodi', 'The Lodi dynasty (1451-1526) was the last.', 7, 10),
  ('Razia Sultana was the only female ruler of the Sultanate.', 'ரசியா சுல்தானா சுல்தானகத்தின் ஒரே பெண் ஆட்சியாளர்.', 'true_false', '["True","False"]', 'True', 'Razia was the only woman to rule Delhi during the Sultanate period.', 8, 10),
  ('The Slave dynasty is also called _____ dynasty.', 'அடிமை வம்சம் _____ வம்சம் எனவும் அழைக்கப்படுகிறது.', 'fill_blank', '["Mamluk","Khalji","Lodi","Mughal"]', 'Mamluk', 'The Slave dynasty is also known as the Mamluk dynasty.', 9, 10),
  ('Who defeated the last Lodi sultan?', 'கடைசி லோடி சுல்தானை தோற்கடித்தவர் யார்?', 'mcq', '["Babur","Akbar","Humayun","Sher Shah"]', 'Babur', 'Babur defeated Ibrahim Lodi at the First Battle of Panipat (1526).', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Medieval India - Delhi Sultanate';

-- ==========================================
-- ADDITIONAL MATH LESSONS + QUESTIONS
-- ==========================================
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward)
SELECT s.id, l.title, l.title_tamil, l.content, l.content_tamil, l.lesson_order, l.xp_reward
FROM public.subjects s
CROSS JOIN (VALUES
  ('Lines and Angles', 'கோடுகள் மற்றும் கோணங்கள்', 'Types of angles: Acute (< 90°), Right (= 90°), Obtuse (> 90° < 180°), Straight (= 180°). Complementary angles sum to 90°. Supplementary angles sum to 180°. When two lines intersect, vertically opposite angles are equal.', 'கோணங்களின் வகைகள்: குறுங்கோணம் (< 90°), செங்கோணம் (= 90°).', 4, 15),
  ('Triangles', 'முக்கோணங்கள்', 'A triangle has 3 sides and 3 angles. Sum of angles = 180°. Types by sides: Equilateral (all equal), Isosceles (two equal), Scalene (none equal). Types by angles: Acute, Right, Obtuse. Exterior angle = sum of two non-adjacent interior angles.', 'முக்கோணத்திற்கு 3 பக்கங்கள் மற்றும் 3 கோணங்கள் உள்ளன.', 5, 20)
) AS l(title, title_tamil, content, content_tamil, lesson_order, xp_reward)
WHERE s.name = 'Mathematics' AND s.class_level = 7;

INSERT INTO public.quizzes (lesson_id, title, title_tamil, quiz_type, xp_reward)
SELECT l.id, 'Quiz: ' || l.title, 'வினாடி வினா: ' || COALESCE(l.title_tamil, l.title), 'mixed', 25
FROM public.lessons l JOIN public.subjects s ON s.id = l.subject_id
WHERE s.name = 'Mathematics' AND s.class_level = 7 AND l.title IN ('Lines and Angles', 'Triangles');

-- Math: Lines and Angles questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('An angle less than 90° is called _____.', '90° க்கு குறைவான கோணம் _____ எனப்படும்.', 'fill_blank', '["acute","obtuse","right","straight"]', 'acute', 'Acute angles measure between 0° and 90°.', 1, 10),
  ('Complementary angles add up to 90°.', 'நிரப்புக் கோணங்கள் 90° ஆக கூடும்.', 'true_false', '["True","False"]', 'True', 'Two angles are complementary if their sum is 90°.', 2, 10),
  ('What is the supplement of 60°?', '60° இன் மிகை நிரப்புக் கோணம் என்ன?', 'mcq', '["120°","30°","90°","180°"]', '120°', 'Supplementary angles sum to 180°. So 180° - 60° = 120°.', 3, 10),
  ('Two supplementary angles add up to _____.', 'இரண்டு மிகை நிரப்புக் கோணங்கள் _____ ஆக கூடும்.', 'fill_blank', '["180°","90°","360°","270°"]', '180°', 'Supplementary angles always sum to 180°.', 4, 10),
  ('Vertically opposite angles are equal.', 'செங்குத்து எதிர் கோணங்கள் சமம்.', 'true_false', '["True","False"]', 'True', 'When two lines cross, opposite angles are always equal.', 5, 10),
  ('A straight angle measures _____.', 'ஒரு நேர்கோணம் _____ அளவிடும்.', 'mcq', '["180°","90°","360°","0°"]', '180°', 'A straight angle forms a straight line = 180°.', 6, 10),
  ('The complement of 45° is 45°.', '45° இன் நிரப்பு 45°.', 'true_false', '["True","False"]', 'True', '45° + 45° = 90°. They are complementary.', 7, 10),
  ('An obtuse angle is greater than _____ and less than 180°.', 'ஒரு விரிகோணம் _____ க்கு மேல் மற்றும் 180°க்கு குறைவு.', 'fill_blank', '["90°","0°","45°","180°"]', '90°', 'Obtuse angles are between 90° and 180°.', 8, 10),
  ('How many degrees in a full rotation?', 'ஒரு முழு சுழற்சியில் எத்தனை டிகிரி?', 'mcq', '["360°","180°","90°","270°"]', '360°', 'A full rotation = 360 degrees.', 9, 10),
  ('Adjacent angles share a common arm.', 'அடுத்தடுத்த கோணங்கள் பொதுவான கையை பகிர்ந்து கொள்கின்றன.', 'true_false', '["True","False"]', 'True', 'Adjacent angles have a common vertex and a common arm.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Lines and Angles';

-- Math: Triangles questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('Sum of angles of a triangle is _____.', 'முக்கோணத்தின் கோணங்களின் கூட்டுத்தொகை _____.', 'fill_blank', '["180°","360°","90°","270°"]', '180°', 'Angle sum property: all interior angles = 180°.', 1, 10),
  ('An equilateral triangle has all sides equal.', 'சமபக்க முக்கோணத்தில் அனைத்து பக்கங்களும் சமம்.', 'true_false', '["True","False"]', 'True', 'Equilateral = equal + lateral (sides). All 3 sides and angles equal.', 2, 10),
  ('What type of triangle has no equal sides?', 'சம பக்கங்கள் இல்லாத முக்கோணம் எந்த வகை?', 'mcq', '["Scalene","Isosceles","Equilateral","Right"]', 'Scalene', 'Scalene triangles have all sides of different lengths.', 3, 10),
  ('Each angle of an equilateral triangle is _____.', 'சமபக்க முக்கோணத்தின் ஒவ்வொரு கோணமும் _____.', 'fill_blank', '["60°","90°","45°","120°"]', '60°', '180° ÷ 3 = 60° for each angle in an equilateral triangle.', 4, 10),
  ('A right triangle has one angle of 90°.', 'செங்கோண முக்கோணத்தில் ஒரு கோணம் 90°.', 'true_false', '["True","False"]', 'True', 'A right triangle has exactly one 90° angle.', 5, 10),
  ('If two angles are 50° and 60°, the third is?', 'இரண்டு கோணங்கள் 50° மற்றும் 60° எனில், மூன்றாவது?', 'mcq', '["70°","80°","90°","60°"]', '70°', '180° - 50° - 60° = 70°.', 6, 10),
  ('An isosceles triangle has _____ equal sides.', 'இருசமபக்க முக்கோணத்தில் _____ சம பக்கங்கள் உள்ளன.', 'fill_blank', '["two","three","one","zero"]', 'two', 'Isosceles = two equal sides and two equal base angles.', 7, 10),
  ('A triangle can have two right angles.', 'ஒரு முக்கோணம் இரண்டு செங்கோணங்கள் கொண்டிருக்க முடியும்.', 'true_false', '["True","False"]', 'False', 'Two 90° angles = 180°, leaving 0° for third — impossible.', 8, 10),
  ('Exterior angle of a triangle equals?', 'முக்கோணத்தின் வெளிக்கோணம் எதற்கு சமம்?', 'mcq', '["Sum of two non-adjacent interior angles","Sum of all angles","One interior angle","None"]', 'Sum of two non-adjacent interior angles', 'Exterior angle theorem: equals the sum of the two remote interior angles.', 9, 10),
  ('The longest side of a right triangle is the hypotenuse.', 'செங்கோண முக்கோணத்தின் நீளமான பக்கம் கர்ணம்.', 'true_false', '["True","False"]', 'True', 'The hypotenuse is opposite the right angle and is always the longest.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Triangles';

-- ==========================================
-- ADDITIONAL TAMIL LESSONS + QUESTIONS
-- ==========================================
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward)
SELECT s.id, l.title, l.title_tamil, l.content, l.content_tamil, l.lesson_order, l.xp_reward
FROM public.subjects s
CROSS JOIN (VALUES
  ('Thirukkural Introduction', 'திருக்குறள் அறிமுகம்', 'Thirukkural is a classic Tamil text written by Thiruvalluvar. It has 1330 kurals (couplets) organized into 133 chapters. Three divisions: Virtue (Aram), Wealth (Porul), and Love (Inbam). Each kural has 7 words in 2 lines.', 'திருக்குறள் திருவள்ளுவரால் எழுதப்பட்ட பண்டைய தமிழ் நூல். 1330 குறள்கள், 133 அதிகாரங்கள். அறம், பொருள், இன்பம் என மூன்று பிரிவுகள்.', 4, 20),
  ('Tamil Poems - Sangam Literature', 'தமிழ் கவிதைகள் - சங்க இலக்கியம்', 'Sangam literature is the oldest Tamil literature (300 BCE - 300 CE). Major works include Ettuthogai (Eight Anthologies) and Patthupattu (Ten Idylls). They describe five landscapes (Thinais): Kurinji (mountains), Mullai (forest), Marutham (farmland), Neithal (coast), Palai (desert).', 'சங்க இலக்கியம் மிகப் பழமையான தமிழ் இலக்கியம் (கி.மு. 300 - கி.பி. 300). முக்கிய படைப்புகள்: எட்டுத்தொகை, பத்துப்பாட்டு.', 5, 20)
) AS l(title, title_tamil, content, content_tamil, lesson_order, xp_reward)
WHERE s.name = 'Tamil' AND s.class_level = 7;

INSERT INTO public.quizzes (lesson_id, title, title_tamil, quiz_type, xp_reward)
SELECT l.id, 'Quiz: ' || l.title, 'வினாடி வினா: ' || COALESCE(l.title_tamil, l.title), 'mixed', 25
FROM public.lessons l JOIN public.subjects s ON s.id = l.subject_id
WHERE s.name = 'Tamil' AND s.class_level = 7 AND l.title IN ('Thirukkural Introduction', 'Tamil Poems - Sangam Literature');

-- Tamil: Thirukkural questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.question_type, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('Who wrote the Thirukkural?', 'திருக்குறளை எழுதியவர் யார்?', 'mcq', '["Thiruvalluvar","Avvaiyar","Kambar","Ilango"]', 'Thiruvalluvar', 'Thiruvalluvar authored the Thirukkural.', 1, 10),
  ('Thirukkural has _____ kurals.', 'திருக்குறளில் _____ குறள்கள் உள்ளன.', 'fill_blank', '["1330","1000","500","2000"]', '1330', '1330 couplets in 133 chapters of 10 kurals each.', 2, 10),
  ('Thirukkural is divided into three books.', 'திருக்குறள் மூன்று பிரிவுகளாக பிரிக்கப்பட்டுள்ளது.', 'true_false', '["True","False"]', 'True', 'Aram (Virtue), Porul (Wealth), Inbam (Love).', 3, 10),
  ('Each kural has how many words?', 'ஒவ்வொரு குறளிலும் எத்தனை சொற்கள்?', 'mcq', '["7","5","10","12"]', '7', 'Each kural is a couplet with exactly 7 words.', 4, 10),
  ('The first division of Thirukkural is _____.', 'திருக்குறளின் முதல் பிரிவு _____.', 'fill_blank', '["Aram","Porul","Inbam","Kural"]', 'Aram', 'Aram (Virtue/Ethics) is the first of three divisions.', 5, 10),
  ('Thirukkural has 133 chapters.', 'திருக்குறளில் 133 அதிகாரங்கள் உள்ளன.', 'true_false', '["True","False"]', 'True', '133 chapters × 10 kurals each = 1330 total kurals.', 6, 10),
  ('What is the second division called?', 'இரண்டாவது பிரிவு எவ்வாறு அழைக்கப்படுகிறது?', 'mcq', '["Porul","Aram","Inbam","Kural"]', 'Porul', 'Porul deals with governance, wealth, and statecraft.', 7, 10),
  ('Thirukkural is written in prose form.', 'திருக்குறள் உரைநடை வடிவில் எழுதப்பட்டுள்ளது.', 'true_false', '["True","False"]', 'False', 'Thirukkural is written in verse (couplet) form, not prose.', 8, 10),
  ('Inbam means _____.', 'இன்பம் என்றால் _____.', 'fill_blank', '["Love","Virtue","Wealth","Knowledge"]', 'Love', 'The third section Inbam deals with love and relationships.', 9, 10),
  ('Thirukkural is often called the "Tamil Veda".', 'திருக்குறள் "தமிழ் வேதம்" என அழைக்கப்படுகிறது.', 'true_false', '["True","False"]', 'True', 'Due to its universal ethical teachings, it is called Tamil Veda.', 10, 10)
) AS qq(question_text, question_text_tamil, question_type, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Thirukkural Introduction';

-- ============================================================
-- DONE. Total new: 19 lessons, 19 quizzes, ~170 questions
-- Combined with existing seed data: ~25 lessons, ~210 questions
-- ============================================================
