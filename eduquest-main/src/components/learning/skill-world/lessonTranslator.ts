// ═══════════════════════════════════════════════════════════════
// Skill World Lesson Translation Helper
// ═══════════════════════════════════════════════════════════════

import type { SkillLesson } from './types';

const namesMap: Record<string, string> = {
  'Arun': 'அருண்',
  'Maya': 'மாயா',
  'Priya': 'பிரியா',
  'Ravi': 'ரவி',
  'Kavitha': 'கவிதா',
  'Vijay': 'விஜய்',
  'Deepak': 'தீபக்',
  'Anjali': 'அஞ்சலி',
  'Sai': 'சாய்',
  'Diya': 'தியா',
  'Narrator': 'கதைசொல்லி'
};

const valueTranslations: Record<string, string> = {
  'Politeness': 'பண்புடைமை',
  'Communication': 'தொடர்புத்திறன்',
  'Culture': 'கலாச்சாரம்',
  'Respect': 'மரியாதை',
  'Independence': 'தன்னம்பிக்கை',
  'Discipline': 'ஒழுக்கம்',
  'Saving': 'சேமிப்பு',
  'Patience': 'பொறுமை',
  'Generosity': 'கொடைக்குணம்',
  'Friendship': 'நட்பு',
  'Safety': 'பாதுகாப்பு',
  'Courage': 'துணிச்சல்',
  'Fairness': 'நேர்மை',
  'Attention': 'கவனம்',
  'Clarity': 'தெளிவு',
  'Moderation': 'மிதமான அளவு',
  'Digital Safety': 'டிஜிட்டல் பாதுகாப்பு',
  'Curiosity': 'ஆர்வம்',
  'Tech Literacy': 'தொழில்நுட்ப அறிவு',
  'Imagination': 'கற்பனைத்திறன்',
  'Focus': 'கவனம்',
  'Self-Belief': 'தன்னம்பிக்கை',
  'Responsibility': 'பொறுப்புணர்ச்சி',
  'Teamwork': 'கூட்டுப்பணி',
  'Awareness': 'விழிப்புணர்வு',
  'Social Bond': 'சமூக பிணைப்பு',
  'Hygiene': 'சுகாதாரம்',
  'consistency': 'தொடர்முயற்சி',
  'Self-Control': 'சுய கட்டுப்பாடு',
  'Mindfulness': 'மன ஒருமைப்பாடு',
  'Logic': 'தருக்க அறிவு',
  'Expression': 'வெளிப்பாடு',
  'Wisdom': 'அறிவு',
  'Action': 'செயல்'
};

const sceneTitleTranslations: Record<string, string> = {
  'Scene 1: The Dilemma': 'காட்சி 1: இக்கட்டான நிலை',
  'Scene 2: Core Concept': 'காட்சி 2: முக்கியக் கருத்து'
};

const dialogueTranslations: Record<string, string> = {
  '"Oh, what should I do here? I want to make the right choice!"': '"ஓ, நான் இங்கே என்ன செய்ய வேண்டும்? நான் சரியான முடிவை எடுக்க விரும்புகிறேன்!"',
  '"Making thoughtful choices builds your character and helps those around you."': '"சிந்தனையுடன் முடிவுகளை எடுப்பது உங்கள் நற்பண்புகளை வளர்க்கிறது மற்றும் உங்களைச் சுற்றியுள்ளவர்களுக்கு உதவுகிறது."'
};

const dictionary: Record<string, string> = {
  // English Communication
  'Polite Greetings': 'பண்பான வாழ்த்துகள்',
  'Expressing Thanks': 'நன்றியுரைத்தல்',
  'Learn how to say hello!': 'வணக்கம் கூறக் கற்றுக்கொள்ளுங்கள்!',
  'The power of thank you': 'நன்றி கூறுவதன் சக்தி',
  '{name} wants to greet their teacher in the morning. They are not sure which words to use.': '{name} காலையில் தனது ஆசிரியரை வாழ்த்த விரும்புகிறார். எந்த வார்த்தைகளைப் பயன்படுத்துவது என்று அவருக்குத் தெரியவில்லை.',
  'Greeting others politely makes them feel happy. It also shows respect and good manners.': 'மற்றவர்களைப் பண்பாக வாழ்த்துவது அவர்களை மகிழ்ச்சியடையச் செய்கிறது. மேலும் அது மரியாதையையும் நற்பண்புகளையும் காட்டுகிறது.',
  'How should {name} greet the teacher?': '{name} ஆசிரியரை எவ்வாறு வாழ்த்த வேண்டும்?',
  'Say "Good Morning, Teacher!" with a smile.': 'புன்னகையுடன் "காலை வணக்கம், ஆசிரியர்!" என்று கூறுங்கள்.',
  'The teacher smiles back and says "Good Morning! Have a great day!"': 'ஆசிரியர் புன்னகைத்து "காலை வணக்கம்! இந்நாள் இனிய நாளாக அமையட்டும்!" என்கிறார்.',
  'Saying Good Morning with a smile is polite and friendly.': 'புன்னகையுடன் காலை வணக்கம் கூறுவது பண்பானது மற்றும் நட்பானது.',
  'Wave hand and shout "Hey there!"': 'கையை அசைத்து "ஹே அங்கே!" என்று கத்துங்கள்.',
  'The teacher is surprised and gently explains that we should greet elders with respect.': 'ஆசிரியர் ஆச்சரியமடைந்து, பெரியவர்களை மரியாதையுடன் வாழ்த்த வேண்டும் என்று மெதுவாக விளக்குகிறார்.',
  'Shouting "Hey there" to a teacher is too casual. Polite greetings are better.': 'ஆசிரியரை "ஹே அங்கே" என்று கத்துவது மிகவும் சாதாரணமானது. பண்பான வாழ்த்துகளே சிறந்தது.',
  'What is a polite way to greet a teacher in the morning?': 'காலையில் ஆசிரியரை வாழ்த்தும் பண்பான வழி எது?',
  'Hey you': 'ஹே நீ',
  'Good Morning, Teacher!': 'காலை வணக்கம், ஆசிரியர்!',
  'Hello buddy': 'ஹலோ நண்பா',
  'Nothing': 'ஒன்றுமில்லை',
  'Good Morning is the standard polite morning greeting for teachers.': 'ஆசிரியர்களுக்கு காலை வணக்கம் கூறுவதே நிலையான பண்பான வாழ்த்தாகும்.',
  'What should you add to your greeting to make it warm?': 'உங்கள் வாழ்த்தை இதமாக்க எதைச் சேர்க்க வேண்டும்?',
  'A big frown': 'பெரிய முகம் சுளிப்பு',
  'A loud shout': 'உரத்த கத்தல்',
  'A friendly smile': 'நட்பான புன்னகை',
  'A jump': 'ஒரு குதிப்பு',
  'A smile makes any greeting feel warm and friendly.': 'ஒரு புன்னகை எந்தவொரு வாழ்த்தையும் இதமாகவும் நட்பாகவும் மாற்றும்.',

  // Tamil Learning
  'Vanakkam & Culture': 'வணக்கம் & பண்பாடு',
  'Tamil Festivals': 'தமிழ் திருவிழாக்கள்',
  'Say hello in Tamil': 'தமிழில் வணக்கம் கூறுங்கள்',
  'Celebrate Pongal': 'பொங்கல் கொண்டாட்டம்',
  '{name} is visiting their grandparents in the village. They want to greet them respectfully.': '{name} கிராமத்தில் உள்ள தனது தாத்தா பாட்டியைச் சந்திக்கிறார். அவர்களை மரியாதையுடன் வாழ்த்த விரும்புகிறார்.',
  'Grandparents love it when we speak in Tamil. Greet them with a warm gesture.': 'தாத்தா பாட்டிக்கு நாம் தமிழில் பேசுவது மிகவும் பிடிக்கும். அவர்களை இதமான சைகையுடன் வாழ்த்துங்கள்.',
  'How should {name} greet their grandparents?': '{name} தாத்தா பாட்டியை எவ்வாறு வாழ்த்த வேண்டும்?',
  'Fold hands and say "Vanakkam!"': 'கைகளைக் கூப்பி "வணக்கம்!" என்று கூறுங்கள்.',
  'Grandparents hug {name} and feel extremely proud.': 'தாத்தா பாட்டி {name}-ஐக் கட்டிப்பிடித்து மிகவும் பெருமிதம் கொள்கிறார்கள்.',
  'Vanakkam is the traditional respectful Tamil greeting.': 'வணக்கம் என்பது பாரம்பரிய மரியாதைக்குரிய தமிழ் வாழ்த்தாகும்.',
  'Just wave and say "Hi guys!"': 'சும்மா கையை அசைத்து "ஹாய் நண்பர்களே!" என்று கூறுங்கள்.',
  'Grandparents smile but feel a bit sad that {name} did not greet them traditionally.': 'தாத்தா பாட்டி புன்னகைத்தாலும், {name} பாரம்பரியமாக வாழ்த்தாததால் சற்று வருத்தமடைகிறார்கள்.',
  'Greeting grandparents traditionally shows deep respect for elders.': 'தாத்தா பாட்டியைப் பாரம்பரியமாக வாழ்த்துவது முதியவர்கள் மீது நாம் வைத்துள்ள ஆழ்ந்த மரியாதையைக் காட்டுகிறது.',
  'What does "Vanakkam" mean in Tamil?': 'தமிழில் "வணக்கம்" என்பதன் பொருள் என்ன?',
  'Goodbye': 'சென்று வருகிறேன்',
  'Welcome / Greetings': 'வரவேற்பு / வாழ்த்துகள்',
  'Please': 'தயவுசெய்து',
  'Vanakkam is the traditional Tamil greeting of respect.': 'வணக்கம் என்பது பாரம்பரிய மரியாதைக்குரிய தமிழ் வாழ்த்தாகும்.',
  'How do we traditionally gesture when saying Vanakkam?': 'வணக்கம் கூறும்போது நாம் பாரம்பரியமாக எப்படி சைகை செய்கிறோம்?',
  'Folds hands together': 'கைகளைக் கூப்புகிறோம்',
  'High five': 'கைதட்டுகிறோம்',
  'Salute': 'வணக்கம் செலுத்துகிறோம்',
  'Wave one hand': 'ஒரு கையை அசைக்கிறோம்',
  'Folding hands together in front of the chest is the gesture of respect.': 'நெஞ்சுக்கு முன்னால் கைகளைக் கூப்புவது மரியாதையின் அடையாளமாகும்.',

  // Life Skills
  'Tying Your Shoes': 'காலணி வாரைக் கட்டுதல்',
  'Packing School Bag': 'பள்ளிப் பையை அடுக்குதல்',
  'Step by step coordination': 'படிபடியாகத் தேடுதல்',
  'Organize for school': 'பள்ளிக்கு ஒழுங்கமைத்தல்',
  '{name} is getting ready for school. The shoe laces are untied and loose.': '{name} பள்ளிக்குத் தயாராகி வருகிறார். காலணி வார் கட்டப்படாமல் தளர்வாக உள்ளது.',
  'Walking with untied laces can cause you to trip and fall down.': 'கட்டப்படாத வாருடன் நடப்பது உங்களைத் தடுமாறச் செய்து கீழே விழச் செய்யலாம்.',
  'What should {name} do about the loose laces?': '{name} தளர்வான காலணி வாரை என்ன செய்ய வேண்டும்?',
  'Sit down and tie the double loop bunny ears.': 'அமர்ந்து முயல் காது போன்ற இரட்டை வளைய முடிச்சை போடுங்கள்.',
  '{name} walks confidently and safely to the school bus.': '{name} பள்ளிப் பேருந்திற்கு நம்பிக்கையுடனும் பாதுகாப்பாகவும் நடந்து செல்கிறார்.',
  'Tying laces keeps you safe from tripping.': 'வாரைக் கட்டுவது உங்களைத் தடுமாறி விழுவதிலிருந்து பாதுகாக்கிறது.',
  'Tuck the laces inside the shoes and run.': 'வாரைக் காலணிக்குள்ளே சொருகிக் கொண்டு ஓடுங்கள்.',
  'The laces slip out and {name} trips on the stairs.': 'வார் வெளியே நழுவி, {name} படிகளில் தடுமாறி விழுகிறார்.',
  'Tucking laces is unsafe. It is always better to tie them securely.': 'வாரைச் சொருகுவது பாதுகாப்பற்றது. அதை எப்போதும் பாதுகாப்பாகக் கட்டுவதே சிறந்தது.',
  'Why should we keep our shoe laces tied?': 'நாம் ஏன் காலணி வாரைக் கட்டி வைத்திருக்க வேண்டும்?',
  'To run slower': 'மெதுவாக ஓட',
  'To prevent tripping and falling': 'தடுமாறி விழுவதைத் தடுக்க',
  'To look cool': 'அழகாகத் தெரிய',
  'To save time': 'நேரத்தை மிச்சப்படுத்த',
  'Tied laces ensure safety and stability when walking or running.': 'கட்டிய வார் நடக்கும்போதும் ஓடும்போதும் பாதுகாப்பையும் நிலைத்தன்மையையும் உறுதி செய்கிறது.',
  'Which loop method is commonly used for tying laces?': 'வாரைக் கட்டுவதற்கு பொதுவாக எந்த வளைய முறை பயன்படுத்தப்படுகிறது?',
  'Double knot': 'இரட்டை முடிச்சு',
  'Bunny Ears': 'முயல் காது முறை',
  'Single line': 'ஒற்றை வரி',
  'Tape': 'ஒட்டுநாடா',
  'Bunny Ears is a popular, easy-to-learn method for kids.': 'முயல் காது முறை குழந்தைகளுக்குப் பிடித்தமான, எளிதில் கற்றுக்கொள்ளக்கூடிய ஒரு முறையாகும்.',

  // Money Management
  'Smart Piggy Bank': 'புத்திசாலி உண்டியல்',
  'Needs vs Wants': 'தேவைகள் எதிர் விருப்பங்கள்',
  'Start saving coins': 'நாணயங்களைச் சேமிக்கத் தொடங்குங்கள்',
  'Spend money wisely': 'பணத்தை புத்திசாலித்தனமாகச் செலவிடுங்கள்',
  '{name} got some pocket money from their uncle. They want to buy a toy now.': '{name}-க்கு அவரது மாமாவிடமிருந்து பாக்கெட் மணி கிடைத்தது. அவர் இப்போது ஒரு பொம்மை வாங்க விரும்புகிறார்.',
  'Saving today helps you buy bigger, more useful things in the future.': 'இன்று சேமிப்பது எதிர்காலத்தில் பெரிய, பயனுள்ள பொருட்களை வாங்க உதவுகிறது.',
  'What should {name} do with the pocket money?': '{name} பாக்கெட் மணியை என்ன செய்ய வேண்டும்?',
  'Save half in the piggy bank, spend the rest.': 'பாதியை உண்டியலில் சேமித்து, மீதியைச் செலவிடுங்கள்.',
  'Later, {name} has enough money to buy an amazing storybook.': 'பின்னர், {name}-இடம் ஒரு கதைப் புத்தகத்தை வாங்குவதற்குப் போதுமான பணம் இருக்கும்.',
  'Saving regularly builds a strong financial habit.': 'தொடர்ந்து சேமிப்பது ஒரு வலுவான நிதிப் பழக்கத்தை உருவாக்குகிறது.',
  'Spend all of it immediately on candies.': 'அனைத்துப் பணத்தையும் உடனடியாக மிட்டாய்களுக்குச் செலவிடுங்கள்.',
  'The candies are finished quickly, and {name} has no savings left.': 'மிட்டாய்கள் விரைவாக முடிந்துவிடும், {name}-இடம் சேமிப்பு எதுவும் மிஞ்சாது.',
  'Spending all money on temporary wants leaves you with nothing for needs.': 'தற்காலிக விருப்பங்களுக்கு அனைத்துப் பணத்தையும் செலவிடுவது தேவைகளுக்கு எதுவும் இல்லாமல் செய்துவிடும்.',
  'What is a piggy bank used for?': 'உண்டியல் எதற்காகப் பயன்படுத்தப்படுகிறது?',
  'Playing games': 'விளையாடுவதற்கு',
  'Storing trash': 'குப்பைகளைச் சேமிக்க',
  'Saving money': 'பணத்தைச் சேமிக்க',
  'Feeding animals': 'விலங்குகளுக்கு உணவளிக்க',
  'A piggy bank helps kids save coins and small bills safely.': 'உண்டியல் குழந்தைகள் நாணயங்களையும் சிறு பணத்தையும் பாதுகாப்பாகச் சேமிக்க உதவுகிறது.',
  'If you save 10 coins every week, how many coins will you have in 5 weeks?': 'ஒவ்வொரு வாரமும் 10 நாணயங்களைச் சேமித்தால், 5 வாரங்களில் உங்களிடம் எத்தனை நாணயங்கள் இருக்கும்?',
  '10 coins': '10 நாணயங்கள்',
  '50 coins': '50 நாணயங்கள்',
  '25 coins': '25 நாணயங்கள்',
  '100 coins': '100 நாணயங்கள்',
  '10 multiplied by 5 is 50. Saving builds up quickly!': '10 பெருக்கல் 5 என்பது 50. சேமிப்பு வேகமாக வளரும்!',

  // Kindness & Empathy
  'Sharing is Caring': 'பகிர்வதே அன்பு',
  'Helping a Friend': 'நண்பனுக்கு உதவுதல்',
  'Share lunch with others': 'மற்றவர்களுடன் மதிய உணவைப் பகிர்ந்து கொள்ளுங்கள்',
  'Be a support system': 'துணையாக இருங்கள்',
  '{name} notices that their classmate forgot their lunch box today.': '{name} தனது வகுப்புத் தோழன் இன்று மதிய உணவுப் பெட்டியைக் கொண்டுவர மறந்ததை கவனிக்கிறார்.',
  'A hungry friend cannot study well. Sharing makes both of you happy.': 'பசியுள்ள நண்பனால் நன்றாகப் படிக்க முடியாது. பகிர்வது உங்கள் இருவரையும் மகிழ்ச்சியடையச் செய்யும்.',
  'What should {name} do to help their classmate?': '{name} வகுப்புத் தோழனுக்கு உதவ என்ன செய்ய வேண்டும்?',
  'Offer to share half of their sandwich.': 'தனது சாண்ட்விச்சில் பாதியை பகிர்ந்து கொள்ள முன்வருங்கள்.',
  'Both friends eat together happily and become closer friends.': 'இரு நண்பர்களும் சேர்ந்து மகிழ்ச்சியுடன் சாப்பிட்டு நெருங்கிய நண்பர்களாகிறார்கள்.',
  'Sharing food builds strong bonds and helps those in need.': 'உணவைப் பகிர்ந்து கொள்வது வலுவான பிணைப்பை உருவாக்கி தேவைப்படுபவர்களுக்கு உதவுகிறது.',
  'Eat alone quickly so no one asks.': 'யாரும் கேட்காதபடி தனியாக வேகமாகச் சாப்பிடுங்கள்.',
  'The classmate sits sadly, and {name} feels guilty inside.': 'வகுப்புத் தோழன் சோகமாக அமர்ந்திருக்கிறார், {name} உள்ளுக்குள் குற்ற உணர்ச்சியை உணர்கிறார்.',
  'Eating alone when a friend is hungry is not kind. Sharing is caring.': 'நண்பன் பசியாக இருக்கும்போது தனியாகச் சாப்பிடுவது அன்பல்ல. பகிர்வதே அன்பு.',
  'What does empathy mean?': 'இரக்கம் (Empathy) என்றால் என்ன?',
  'Ignoring others': 'மற்றவர்களைப் புறக்கணிப்பது',
  'Understanding how others feel': 'மற்றவர்கள் எப்படி உணர்கிறார்கள் என்பதைப் புரிந்துகொள்வது',
  'Winning a race': 'பந்தயத்தில் வெற்றி பெறுவது',
  'Shouting loudly': 'சத்தமாகக் கத்துவது',
  'Empathy is placing yourself in someone else\'s shoes to feel what they feel.': 'இரக்கம் என்பது மற்றவர்களின் நிலையில் இருந்து அவர்கள் உணர்வதை உணர்வதாகும்.',
  'What is a simple act of kindness you can do at school?': 'பள்ளியில் நீங்கள் செய்யக்கூடிய எளிய அன்பான செயல் எது?',
  'Taking a toy without asking': 'கேட்காமல் பொம்மையை எடுப்பது',
  'Sharing a pencil with a friend': 'நண்பனுடன் பென்சிலைப் பகிர்ந்து கொள்வது',
  'Running in the corridor': 'வராந்தாவில் ஓடுவது',
  'Laughing at mistakes': 'தவறுகளைப் பார்த்து சிரிப்பது',
  'Sharing stationery is a very common and simple way to show kindness.': 'பொருட்களைப் பகிர்ந்து கொள்வது அன்பைக் காட்டுவதற்கான பொதுவான எளிய வழியாகும்.',

  // Learn to Say NO
  'Safe Boundaries': 'பாதுகாப்பான எல்லைகள்',
  'Saying No to Bullying': 'துன்புறுத்தலுக்கு இல்லை என்று கூறுங்கள்',
  'Your body, your rules': 'உங்கள் உடல், உங்கள் விதிகள்',
  'Stand up for yourself': 'உங்களுக்காக எழுந்து நில்லுங்கள்',
  'A stranger near the school gate offers {name} a delicious chocolate bar.': 'பள்ளி வாசலுக்கு அருகில் ஒரு அறிமுகமில்லாத நபர் {name}-க்கு ஒரு சுவையான சாக்லேட்டை வழங்குகிறார்.',
  'We should never take food or gifts from people we do not know.': 'நமக்குத் தெரியாத நபர்களிடமிருந்து நாம் ஒருபோதும் உணவு அல்லது பரிசுகளை வாங்கக்கூடாது.',
  'How should {name} respond to the stranger?': '{name} அந்த நபருக்கு எவ்வாறு பதிலளிக்க வேண்டும்?',
  'Say "No, thank you" and walk to a teacher immediately.': '"இல்லை, நன்றி" என்று கூறிவிட்டு உடனடியாக ஆசிரியரிடம் செல்லுங்கள்.',
  'The teacher praises {name} for making a safe choice.': 'பாதுகாப்பான முடிவை எடுத்ததற்காக ஆசிரியர் {name}-ஐப் பாராட்டுகிறார்.',
  'Saying no to strangers keeps you safe from danger.': 'அறிமுகமில்லாதவர்களுக்கு இல்லை என்று சொல்வது ஆபத்திலிருந்து உங்களைப் பாதுகாக்கிறது.',
  'Take the chocolate and eat it.': 'சாக்லேட்டை வாங்கிச் சாப்பிடுங்கள்.',
  'The stranger tries to talk more. {name} feels scared and runs away.': 'அறிமுகமில்லாத நபர் மேலும் பேச முயற்சிக்கிறார். {name} பயந்து ஓடிவிடுகிறார்.',
  'Taking gifts from strangers is unsafe. Always refuse and tell an adult.': 'அறிமுகமில்லாதவர்களிடமிருந்து பரிசுகளைப் பெறுவது பாதுகாப்பற்றது. எப்போதும் மறுத்து பெரியவர்களிடம் சொல்லுங்கள்.',
  'Should you take candy from a stranger?': 'அறிமுகமில்லாதவரிடமிருந்து மிட்டாய் வாங்கலாமா?',
  'Yes, if it is sweet': 'ஆம், அது இனிப்பாக இருந்தால்',
  'No, never': 'இல்லை, ஒருபோதும் கூடாது',
  'Only if you are hungry': 'பசியாக இருந்தால் மட்டும்',
  'If they look nice': 'அவர்கள் நல்லவர்களாகத் தெரிந்தால்',
  'Never take food or gifts from strangers for your personal safety.': 'உங்கள் தனிப்பட்ட பாதுகாப்பிற்காக அறிமுகமில்லாதவர்களிடமிருந்து உணவு அல்லது பரிசுகளை ஒருபோதும் வாங்க வேண்டாம்.',
  'Who is a safe adult you can tell if a stranger makes you uncomfortable?': 'அறிமுகமில்லாத நபர் உங்களுக்கு அசௌகரியத்தை ஏற்படுத்தினால் யாரிடம் சொல்லலாம்?',
  'Another stranger': 'மற்றொரு அறிமுகமில்லாத நபர்',
  'A teacher or parent': 'ஆசிரியர் அல்லது பெற்றோர்',
  'Nobody': 'யாருமில்லை',
  'A pet animal': 'செல்லப்பிராணி',
  'Parents and teachers are trusted adults who can protect you.': 'பெற்றோர்களும் ஆசிரியர்களும் உங்களைப் பாதுகாக்கக்கூடிய நம்பகமான பெரியவர்கள்.',

  // Negotiation Skills
  'Sharing the Swing': 'ஊஞ்சலைப் பகிர்ந்து கொள்ளுதல்',
  'Taking Turns': 'முறைப்படி விளையாடுதல்',
  'Resolve play conflicts': 'விளையாட்டு மோதல்களைத் தீர்த்தல்',
  'Cooperate on the playground': 'விளையாட்டு மைதானத்தில் ஒத்துழையுங்கள்',
  'Both {name} and their friend want to ride the only swing in the park.': '{name} மற்றும் அவரது நண்பர் இருவரும் பூங்காவில் உள்ள ஒரே ஒரு ஊஞ்சலில் விளையாட விரும்புகிறார்கள்.',
  'Fighting over the swing will waste time and ruin the fun for both.': 'ஊஞ்சலுக்காக சண்டையிடுவது நேரத்தை வீணடித்து இருவரின் மகிழ்ச்சியையும் கெடுக்கும்.',
  'How can they resolve this playground conflict?': 'அவர்கள் இந்த விளையாட்டு மைதான மோதலை எவ்வாறு தீர்க்கலாம்?',
  'Suggest 5 minutes on the swing for each, taking turns.': 'ஒவ்வொருவருக்கும் 5 நிமிடங்கள் என முறைப்படி விளையாட முன்மொழியுங்கள்.',
  'Both get to swing and they have a great time playing together.': 'இருவரும் ஊஞ்சலாடி, ஒன்றாகச் சேர்ந்து மகிழ்ச்சியாக விளையாடுகிறார்கள்.',
  'Taking turns is the fairest way to share a single toy.': 'ஒரே ஒரு பொம்மையைப் பகிர்ந்து கொள்ள முறைப்படி விளையாடுவதே சிறந்த வழியாகும்.',
  'Push the friend away and claim the swing.': 'நண்பனைத் தள்ளிவிட்டு ஊஞ்சலைக் கைப்பற்றுங்கள்.',
  'The friend starts crying, and the parents stop the play session.': 'நண்பன் அழத் தொடங்குகிறார், பெற்றோர் விளையாட்டை நிறுத்திவிடுகிறார்கள்.',
  'Selfishness spoils the game. Sharing and negotiation ensure everyone plays.': 'சுயநலம் விளையாட்டைக் கெடுக்கும். பகிர்வும் பேச்சுவார்த்தையும் எல்லாரும் விளையாடுவதை உறுதி செய்யும்.',
  'What is a win-win solution?': 'வெற்றி-வெற்றி (win-win) தீர்வு என்றால் என்ன?',
  'Only I win': 'நான் மட்டும் வெல்வது',
  'Only you win': 'நீ மட்டும் வெல்வது',
  'A solution where both are happy': 'இருவரும் மகிழ்ச்சியடையும் ஒரு தீர்வு',
  'Nobody wins': 'யாரும் வெல்லாமல் இருப்பது',
  'A win-win solution is the goal of fair negotiations.': 'வெற்றி-வெற்றி தீர்வு என்பது நியாயமான பேச்சுவார்த்தையின் இலக்காகும்.',
  'How do you decide who goes first when sharing?': 'பகிர்ந்து கொள்ளும்போது யார் முதலில் செல்வது என்பதை எப்படி முடிவு செய்வீர்கள்?',
  'By fighting': 'சண்டையிடுவதன் மூலம்',
  'Rock-Paper-Scissors or flipping a coin': 'கல்லா-மண்ணா-கத்தரிக்கோல் அல்லது நாணயத்தைச் சுழற்றுவது',
  'Running away': 'ஓடிவிடுவதன் மூலம்',
  'Crying loudly': 'சத்தமாக அழுவதன் மூலம்',
  'A simple game of chance is a friendly and fair way to decide order.': 'ஒரு எளிய விளையாட்டு முறை வரிசையைத் தீர்மானிக்க ஒரு நட்பு மற்றும் நியாயமான வழியாகும்.',

  // Communication Skills
  'Active Listening': 'கவனித்துக் கேட்டல்',
  'Asking for Help': 'உதவி கேட்டல்',
  'Listen with your ears and eyes': 'காதுகளாலும் கண்களாலும் கவனியுங்கள்',
  'Speak up when stuck': 'சிரமப்படும்போது பேசுங்கள்',
  '{name}\'s mother is explaining the homework instructions, but {name} is watching TV.': '{name}-இன் அம்மா வீட்டுப்பாட வழிமுறைகளை விளக்குகிறார், ஆனால் {name} டிவி பார்த்துக் கொண்டிருக்கிறார்.',
  'Not listening carefully leads to mistakes and incomplete work later.': 'கவனமாகக் கேட்காமல் இருப்பது தவறுகளுக்கும் அரைகுறையான வேலைகளுக்கும் வழிவகுக்கும்.',
  'What should {name} do while their mother is speaking?': 'அம்மா பேசும்போது {name} என்ன செய்ய வேண்டும்?',
  'Turn off the TV, look at mother, and listen.': 'டிவியை அணைத்துவிட்டு, அம்மாவைப் பார்த்து கவனமாகக் கேளுங்கள்.',
  '{name} understands the homework perfectly and finishes it on time.': '{name} வீட்டுப்பாடத்தை நன்றாகப் புரிந்துகொண்டு குறித்த நேரத்தில் முடிக்கிறார்.',
  'Active listening helps you learn and shows respect.': 'கவனித்துக் கேட்பது கற்றுக்கொள்ள உதவுகிறது மற்றும் மரியாதையைக் காட்டுகிறது.',
  'Keep watching TV and nod without listening.': 'டிவியைப் பார்த்துக் கொண்டே கேட்காமல் தலையசைக்கவும்.',
  '{name} makes many mistakes and has to redo the entire homework.': '{name} பல தவறுகளைச் செய்து, முழு வீட்டுப்பாடத்தையும் மீண்டும் செய்ய வேண்டியதாகிறது.',
  'Distractions prevent active listening. Always focus when someone speaks to you.': 'கவனச்சிதறல்கள் கவனிப்பதைத் தடுக்கின்றன. யாராவது உங்களிடம் பேசும்போது எப்போதும் கவனம் செலுத்துங்கள்.',
  'What is active listening?': 'கவனித்துக் கேட்டல் (Active listening) என்றால் என்ன?',
  'Looking away': 'விலகிப் பார்ப்பது',
  'Listening and showing you understand': 'கேட்டுவிட்டு, புரிந்துகொண்டதைக் காட்டுவது',
  'Interrupting others': 'மற்றவர்களைக் குறுக்கிடுவது',
  'Singing a song': 'பாட்டுப் பாடுவது',
  'Active listening involves paying full attention and responding appropriately.': 'கவனித்துக் கேட்டல் என்பது முழு கவனம் செலுத்தி அதற்கேற்ப பதிலளிப்பதை உள்ளடக்குகிறது.',
  'What should you do if you don\'t understand the instructions?': 'உங்களுக்கு வழிமுறைகள் புரியவில்லை என்றால் என்ன செய்ய வேண்டும்?',
  'Ignore it': 'புறக்கணிக்க வேண்டும்',
  'Cry': 'அழ வேண்டும்',
  'Ask the speaker to repeat or clarify': 'பேசுபவரை மீண்டும் சொல்ல அல்லது விளக்கக் கேட்க வேண்டும்',
  'Guess blindly': 'குருட்டுத்தனமாக யூகிக்க வேண்டும்',
  'Asking clarifying questions is a sign of good communication.': 'புரியாததைக் கேட்டுத் தெளிவுபடுத்துவது நல்ல தகவல்தொடர்பின் அடையாளமாகும்.',

  // Internet & Technology
  'Screen Time Balance': 'திரை நேர சமநிலை',
  'Safe Web Surfing': 'பாதுகாப்பான இணைய உலாவுதல்',
  'Limit your digital world': 'டிஜிட்டல் உலகை வரையறுக்கவும்',
  'Click links carefully': 'இணைப்புகளைக் கவனமாகத் தட்டவும்',
  '{name} has been playing mobile games for two hours and eyes are hurting.': '{name} இரண்டு மணிநேரமாக மொபைல் கேம்களை விளையாடி வருகிறார், கண்கள் வலிக்கின்றன.',
  'Too much screen time can strain eyes and prevent healthy outdoor play.': 'அதிகப்படியான திரை நேரம் கண்களைக் காயப்படுத்தும் மற்றும் ஆரோக்கியமான வெளிப்புற விளையாட்டுகளைத் தடுக்கும்.',
  'What should {name} do next?': '{name} அடுத்து என்ன செய்ய வேண்டும்?',
  'Put down the phone and go play in the garden.': 'தொலைபேசியை கீழே வைத்துவிட்டு தோட்டத்தில் விளையாடச் செல்லுங்கள்.',
  '{name}\'s eyes feel rested, and they have fun playing catch.': '{name}-இன் கண்கள் ஓய்வு பெறுகின்றன, மேலும் விளையாடி மகிழ்கிறார்.',
  'Balancing screen time with physical activity keeps you healthy.': 'திரை நேரத்தையும் உடற்பயிற்சியையும் சமநிலைப்படுத்துவது உங்களை ஆரோக்கியமாக வைத்திருக்கும்.',
  'Ignore the eye strain and keep playing games.': 'கண் வலியைப் புறக்கணித்துவிட்டு தொடர்ந்து விளையாடுங்கள்.',
  '{name} gets a bad headache and cannot sleep well tonight.': '{name}-க்கு கடுமையான தலைவலி ஏற்பட்டு இன்று இரவு நன்றாக தூங்க முடியாது.',
  'Listen to your body. Take regular breaks from digital screens.': 'உங்கள் உடலுக்குச் செவிசாய்க்கவும். டிஜிட்டல் திரைகளிலிருந்து வழக்கமான இடைவெளிகளை எடுக்கவும்.',
  'How often should you take a break from screens?': 'திரைகளில் இருந்து எவ்வளவு நேரத்திற்கு ஒருமுறை இடைவெளி எடுக்க வேண்டும்?',
  'Every 20-30 minutes': 'ஒவ்வொரு 20-30 நிமிடங்களுக்கும்',
  'Only when the battery dies': 'பேட்டரி தீரும்போது மட்டும்',
  'Every 5 hours': 'ஒவ்வொரு 5 மணிநேரத்திற்கும்',
  'The 20-20-20 rule suggests taking a screen break every 20 minutes.': '20-20-20 விதி ஒவ்வொரு 20 நிமிடங்களுக்கும் திரை இடைவெளி எடுக்க பரிந்துரைக்கிறது.',
  'What is a healthy alternative to screen time?': 'திரை நேரத்திற்கு ஒரு ஆரோக்கியமான மாற்று எது?',
  'Reading a book or playing outdoors': 'புத்தகம் படிப்பது அல்லது வெளியில் விளையாடுவது',
  'Looking at a tablet': 'டேப்லெட்டைப் பார்ப்பது',
  'Outdoor play and reading engage the brain and body healthily.': 'வெளிப்புற விளையாட்டுகளும் வாசிப்பும் மூளையையும் உடலையும் ஆரோக்கியமாக வைத்திருக்கின்றன.',

  // AI & Chatbots
  'AI Voice Assistants': 'AI குரல் உதவியாளர்கள்',
  'Meet the smart machines': 'புத்திசாலி இயந்திரங்களைச் சந்தியுங்கள்',
  'Talk to smart speakers': 'புத்திசாலி ஸ்பீக்கர்களிடம் பேசுங்கள்',
  '{name} hears about artificial intelligence and wonders if it is a real human.': '{name} செயற்கை நுண்ணறிவு (AI) பற்றி கேள்விப்பட்டு, அது ஒரு உண்மையான மனிதனா என்று வியக்கிறார்.',
  'AI is a computer program trained on a lot of information to help answer questions.': 'AI என்பது கேள்விகளுக்குப் பதிலளிக்க உதவும் வகையில் ஏராளமான தகவல்களைக் கொண்டு பயிற்சி அளிக்கப்பட்ட கணினி நிரலாகும்.',
  'How should {name} think about AI?': '{name} AI-யை எவ்வாறு நினைக்க வேண்டும்?',
  'As a smart tool that can help me search and learn.': 'தேடவும் கற்றுக்கொள்ளவும் உதவும் ஒரு புத்திசாலித்தனமான கருவியாக.',
  '{name} uses AI to find cool facts about planets for school.': '{name} பள்ளிப் பணிக்காகப் கிரகங்களைப் பற்றிய சுவாரஸ்யமான தகவல்களைக் கண்டறிய AI-யைப் பயன்படுத்துகிறார்.',
  'AI is a supportive learning assistant, not a human friend.': 'AI என்பது ஒரு ஆதரவான கற்றல் உதவியாளர், மனித நண்பர் அல்ல.',
  'As a magical magic box that knows everything perfectly.': 'அனைத்தையும் சரியாக அறிந்த ஒரு மாயாஜால பெட்டியாக.',
  '{name} copies an AI mistake and gets a wrong answer on the test.': '{name} AI செய்த ஒரு தவறை நகலெடுத்து தேர்வில் தவறான பதிலைப் பெறுகிறார்.',
  'AI can make mistakes. Always verify facts with books or teachers.': 'AI தவறுகள் செய்யலாம். புத்தகங்கள் அல்லது ஆசிரியர்களைக் கொண்டு எப்போதும் உண்மைகளைச் சரிபார்க்கவும்.',
  'What does AI stand for?': 'AI என்பதன் விரிவாக்கம் என்ன?',
  'Artificial Intelligence': 'செயற்கை நுண்ணறிவு (Artificial Intelligence)',
  'Awesome Internet': 'ஆசம் இன்டர்நெட்',
  'Automatic Idea': 'ஆட்டோமேடிக் ஐடியா',
  'AI stands for Artificial Intelligence—programs that mimic human learning.': 'AI என்பது செயற்கை நுண்ணறிவைக் குறிக்கிறது—மனித கற்றலைப் பிரதிபலிக்கும் நிரல்கள்.',
  'Can AI make mistakes?': 'AI தவறுகள் செய்ய முடியுமா?',
  'Yes, it can sometimes give incorrect answers': 'ஆம், சில நேரங்களில் தவறான பதில்களை வழங்கலாம்',
  'Only in math': 'கணிதத்தில் மட்டும்',
  'Only on Mondays': 'திங்கட்கிழமைகளில் மட்டும்',
  'AI works on patterns and can hallucinate or output wrong facts.': 'AI வடிவங்களின் அடிப்படையில் செயல்படுகிறது, சில நேரங்களில் தவறான உண்மைகளை வெளியிடலாம்.',

  // Creativity & Imagination
  'Building Block Castle': 'கட்டடக் கட்டை கோட்டை',
  'Making Story Plots': 'கதைக்களம் உருவாக்குதல்',
  'Imagine and construct': 'கற்பனை செய்து உருவாக்குங்கள்',
  'Create a hero adventure': 'ஹீரோ சாகசத்தை உருவாக்குங்கள்',
  '{name} wants to build a giant toy castle but doesn\'t have enough red blocks.': '{name} ஒரு பெரிய பொம்மை கோட்டையைக் கட்ட விரும்புகிறார், ஆனால் அவரிடம் போதுமான சிவப்பு கட்டைகள் இல்லை.',
  'Creative thinkers use alternative items when their first choice is missing.': 'படைப்பாற்றல் மிக்கவர்கள் தங்கள் முதல் தேர்வு இல்லாதபோது மாற்றுப் பொருட்களைப் பயன்படுத்துகிறார்கள்.',
  'What should {name} do to build the castle?': '{name} கோட்டையைக் கட்ட என்ன செய்ய வேண்டும்?',
  'Use blue and green blocks to make a multi-color castle.': 'வண்ணமயமான கோட்டையை உருவாக்க நீலம் மற்றும் பச்சை கட்டைகளைப் பயன்படுத்துங்கள்.',
  'The castle looks unique, and friends love the colorful design!': 'கோட்டை தனித்துவமாகத் தெரிகிறது, மேலும் நண்பர்கள் அதன் வண்ணமயமான வடிவமைப்பை விரும்புகிறார்கள்!',
  'Creativity means adapting and using your imagination.': 'படைப்பாற்றல் என்பது சூழ்நிலைக்கு ஏற்ப உங்கள் கற்பனையைப் பயன்படுத்துவதாகும்.',
  'Stop building and feel sad about the red blocks.': 'கோட்டை கட்டுவதை நிறுத்திவிட்டு, சிவப்பு கட்டைகள் இல்லாததை நினைத்து வருத்தப்படுங்கள்.',
  'No castle is built, and the blocks lie unused on the floor.': 'கோட்டை எதுவும் கட்டப்படவில்லை, கட்டைகள் தரையில் பயன்படுத்தப்படாமல் கிடக்கின்றன.',
  'Do not let small limits stop you. Use what you have to create.': 'சிறு வரம்புகள் உங்களைத் தடுக்க அனுமதிக்காதீர்கள். உங்களிடம் உள்ளதை வைத்து உருவாக்குங்கள்.',
  'What is a key ingredient of creativity?': 'படைப்பாற்றலின் முக்கிய அம்சம் எது?',
  'Copying others': 'மற்றவர்களைப் பார்த்து நகலெடுப்பது',
  'Using your imagination': 'உங்கள் கற்பனையைப் பயன்படுத்துவது',
  'Doing nothing': 'எதுவும் செய்யாமல் இருப்பது',
  'Being bored': 'சலிப்படைவது',
  'Imagination allows you to form new ideas and build unique things.': 'கற்பனைத்திறன் புதிய யோசனைகளை உருவாக்கவும் தனித்துவமான பொருட்களை உருவாக்கவும் அனுமதிக்கிறது.',
  'How can you practice creativity daily?': 'தினமும் படைப்பாற்றலை எவ்வாறு பயிற்சி செய்யலாம்?',
  'By drawing, writing, or building': 'வரைதல், எழுதுதல் அல்லது உருவாக்குதல் மூலம்',
  'By sleeping': 'தூங்குவதன் மூலம்',
  'By watching the same video': 'ஒரே வீடியோவைப் பார்ப்பதன் மூலம்',
  'By staying quiet': 'அமைதியாக இருப்பதன் மூலம்',
  'Expressive activities challenge the brain to think differently.': 'படைப்பாற்றல் செயல்பாடுகள் மூளையை வித்தியாசமாக சிந்திக்க தூண்டுகின்றன.',

  // Confidence Building
  'Trying New Things': 'புதிய விஷயங்களை முயற்சி செய்தல்',
  'Overcoming Mistakes': 'தவறுகளைக் கடந்து வருதல்',
  'Ride bicycle without support': 'துணையின்றி சைக்கிள் ஓட்டுதல்',
  'Stand up after a fall': 'விழுந்த பின் எழுந்து நில்லுங்கள்',
  '{name} wants to learn cycling but is afraid of falling and getting hurt.': '{name} சைக்கிள் ஓட்டக் கற்றுக்கொள்ள விரும்புகிறார், ஆனால் விழுந்து அடிபட்டு விடுமோ என்று பயப்படுகிறார்.',
  'Every expert was once a beginner. Falling down is just a part of learning.': 'ஒவ்வொரு வெற்றியாளரும் ஒரு காலத்தில் தொடக்கநிலையாளராக இருந்தவரே. கீழே விழுவது கற்றலின் ஒரு பகுதியாகும்.',
  'How should {name} start learning?': '{name} எவ்வாறு கற்கத் தொடங்க வேண்டும்?',
  'Wear a helmet, start slowly with an adult holding the seat.': 'ஹெல்மெட் அணிந்து, பெரியவர் ஒருவரின் உதவியுடன் மெதுவாகத் தொடங்குங்கள்.',
  '{name} rides a short distance safely and feels super proud!': '{name} ஒரு குறுகிய தூரத்தைப் பாதுகாப்பாகக் கடந்து மிகவும் பெருமிதம் கொள்கிறார்!',
  'Confidence grows when we take safe steps to try new things.': 'புதிய விஷயங்களை முயற்சி செய்ய பாதுகாப்பான படிகளை எடுக்கும்போது தன்னம்பிக்கை வளர்கிறது.',
  'Refuse to touch the bicycle and stay inside.': 'சைக்கிளைத் தொட மறுத்துவிட்டு வீட்டிற்குள்ளேயே இருங்கள்.',
  '{name} watches friends ride around and feels left out.': '{name} நண்பர்கள் சைக்கிள் ஓட்டுவதைப் பார்த்து ஏமாற்றமடைகிறார்.',
  'Fear stops us from enjoying new adventures. Be brave and try!': 'பயம் புதிய சாகசங்களை அனுபவிப்பதைத் தடுக்கிறது. தைரியமாக முயற்சி செய்யுங்கள்!',
  'What builds self-confidence?': 'தன்னம்பிக்கையை வளர்ப்பது எது?',
  'Giving up': 'கைவிடுவது',
  'Believing in yourself and trying': 'உங்களை நம்பி முயற்சிப்பது',
  'Hiding away': 'ஒளிந்து கொள்வது',
  'Comparing with others': 'மற்றவர்களுடன் ஒப்பிடுவது',
  'Self-belief and practice are key pillars of personal confidence.': 'தன்னம்பிக்கையும் பயிற்சியும் தனிப்பட்ட நம்பிக்கையின் முக்கியத் தூண்களாகும்.',
  'Is it okay to make mistakes when learning?': 'கற்கும் போது தவறுகள் செய்வது சரியா?',
  'Yes, mistakes help us learn and improve': 'ஆம், தவறுகள் நாம் கற்றுக்கொள்ளவும் மேம்படவும் உதவுகின்றன',
  'Only if you win': 'வெற்றி பெற்றால் மட்டும்',
  'Only in art': 'கலையில் மட்டும்',
  'Mistakes show you what needs adjustment, helping you grow.': 'தவறுகள் எதை மாற்ற வேண்டும் என்பதைக் காட்டி, நீங்கள் வளர உதவுகின்றன.',

  // Leadership Missions
  'Class Monitor Helper': 'வகுப்புத் தலைவர் உதவி',
  'Leading the Clean-Up': 'சுத்தம் செய்வதை வழிநடத்துதல்',
  'Help organize the classroom': 'வகுப்பறையை ஒழுங்கமைக்க உதவுங்கள்',
  'Teamwork starts with you': 'கூட்டுப்பணி உங்களிடமிருந்தே தொடங்குகிறது',
  'The teacher asks {name} to hand out notebooks while the class is making noise.': 'வகுப்பு சத்தம் போட்டுக் கொண்டிருக்கும் போது, நோட்டுப் புத்தகங்களை வழங்குமாறு ஆசிரியர் {name}-இடம் கேட்கிறார்.',
  'A good leader communicates calmly and guides others by setting a good example.': 'ஒரு சிறந்த தலைவர் அமைதியாகப் பேசி, முன்மாதிரியாக இருந்து மற்றவர்களை வழிநடத்துவார்.',
  'How should {name} handle the noisy classroom?': '{name} சத்தமில்லாத வகுப்பறையை எவ்வாறு கையாள வேண்டும்?',
  'Speak in a polite voice and ask rows to collect books quietly.': 'பண்பான குரலில் பேசி, அமைதியாக புத்தகங்களை வாங்கிக் கொள்ளுமாறு வரிசையாகக் கேளுங்கள்.',
  'The class quiets down, and notebooks are distributed quickly.': 'வகுப்பு அமைதியாகிறது, நோட்டுப் புத்தகங்கள் விரைவாக வழங்கப்படுகின்றன.',
  'Polite and clear communication is the mark of a great leader.': 'பண்பான மற்றும் தெளிவான தகவல்தொடர்பு ஒரு சிறந்த தலைவரின் அடையாளமாகும்.',
  'Shout loudly at everyone to shut up.': 'அனைவரையும் வாயை மூடுமாறு சத்தமாகக் கத்துங்கள்.',
  'The students shout back, and the classroom becomes even noisier.': 'மாணவர்கள் திரும்பக் கத்துகிறார்கள், வகுப்பறை இன்னும் சத்தமாகிறது.',
  'Shouting causes conflict. Lead with calm actions and polite words.': 'கத்துவது மோதலை ஏற்படுத்துகிறது. அமைதியான செயல்களுடனும் பண்பான வார்த்தைகளுடனும் வழிநடத்துங்கள்.',
  'What is a quality of a good leader?': 'ஒரு சிறந்த தலைவரின் குணம் எது?',
  'Being bossy': 'அதிகாரம் செய்வது',
  'Listening and helping others': 'மற்றவர்களுக்குச் செவிசாய்த்து உதவுவது',
  'Taking all rewards': 'அனைத்து வெகுமதிகளையும் தானே எடுப்பது',
  'Running fast': 'வேகமாக ஓடுவது',
  'Leaders help and support their team members to succeed together.': 'தலைவர்கள் தங்கள் குழு உறுப்பினர்களுக்கு ஒன்றாக இணைந்து வெற்றி பெற உதவுகிறார்கள்.',
  'Who should a leader help?': 'ஒரு தலைவர் யாருக்கு உதவ வேண்டும்?',
  'Only themselves': 'தனக்கு மட்டுமே',
  'Only friends': 'நண்பர்களுக்கு மட்டுமே',
  'Everyone in the team': 'குழுவில் உள்ள அனைவருக்கும்',
  'Great leaders support their entire team, leaving no one behind.': 'சிறந்த தலைவர்கள் தங்கள் குழு முழுவதையும் ஆதரிக்கிறார்கள், யாரையும் கைவிடுவதில்லை.',

  // Focus & Discipline
  'Homework First': 'வீட்டுப்பாடம் முதலில்',
  'The Quiet Study Area': 'அமைதியான படிக்கும் இடம்',
  'Finish tasks before play': 'விளையாடுவதற்கு முன் வேலைகளை முடியுங்கள்',
  'Avoid study distractions': 'படிப்பு கவனச்சிதறல்களைத் தவிர்க்கவும்',
  '{name} wants to watch cartoon shows, but their homework is not finished yet.': '{name} கார்ட்டூன் நிகழ்ச்சிகளைப் பார்க்க விரும்புகிறார், ஆனால் வீட்டுப்பாடம் இன்னும் முடியவில்லை.',
  'Finishing important tasks first lets you enjoy play time without stress.': 'முக்கியமான பணிகளை முதலில் முடிப்பது எந்த கவலையுமின்றி விளையாட்டு நேரத்தை அனுபவிக்க உதவுகிறது.',
  'What choice should {name} make?': '{name} என்ன முடிவெடுக்க வேண்டும்?',
  'Complete the math homework first, then watch cartoons.': 'கணித வீட்டுப்பாடத்தை முதலில் முடித்துவிட்டு, பின் கார்ட்டூன்களைப் பாருங்கள்.',
  'Homework is neat and correct, and play time feels relaxing.': 'வீட்டுப்பாடம் சரியாகவும் சுத்தமாகவும் முடிகிறது, விளையாட்டு நேரமும் நிம்மதியாக இருக்கிறது.',
  'Discipline means doing what needs to be done first.': 'ஒழுக்கம் என்பது முதலில் செய்ய வேண்டியதைச் செய்வதாகும்.',
  'Watch cartoons first and delay the homework.': 'முதலில் கார்ட்டூன்களைப் பார்த்துவிட்டு வீட்டுப்பாடத்தைத் தள்ளிப்போடுங்கள்.',
  'It gets late, {name} is sleepy, and the homework has many mistakes.': 'நேரமாகிவிடுகிறது, {name}-க்கு தூக்கம் வருகிறது, வீட்டுப்பாடத்திலும் பல தவறுகள் ஏற்படுகின்றன.',
  'Delaying tasks causes rushed work and stress. Do homework first.': 'பணிகளைத் தள்ளிப்போடுவது அவசர வேலைக்கும் மன அழுத்தத்திற்கும் வழிவகுக்கும். வீட்டுப்பாடத்தை முதலில் செய்யுங்கள்.',
  'What is discipline?': 'ஒழுக்கம் என்றால் என்ன?',
  'Following good habits and schedules': 'நல்ல பழக்கங்களையும் கால அட்டவணைகளையும் பின்பற்றுவது',
  'Ignoring rules': 'விதிகளைப் புறக்கணிப்பது',
  'Being angry': 'கோபமாக இருப்பது',
  'Discipline is the practice of training yourself to follow rules and habits.': 'ஒழுக்கம் என்பது விதிகளையும் பழக்கவழக்கங்களையும் பின்பற்ற உங்களை பழக்கப்படுத்துவதாகும்.',
  'What helps you focus on studying?': 'படிப்பதில் கவனம் செலுத்த உங்களுக்கு எது உதவுகிறது?',
  'A loud TV': 'சத்தமான டிவி',
  'A quiet room with no toy distractions': 'விளையாட்டுப் பொருட்கள் இல்லாத அமைதியான அறை',
  'Eating candies': 'மிட்டாய் சாப்பிடுவது',
  'A clean, quiet environment allows the brain to focus deeply.': 'சுத்தமான, அமைதியான சூழல் மூளையை ஆழமாக கவனம் செலுத்த அனுமதிக்கிறது.',

  // Safety Awareness
  'Crossing the Road': 'சாலையைக் கடத்தல்',
  'Fire Drill Safety': 'தீயணைப்புப் பயிற்சி பாதுகாப்பு',
  'Look right, look left': 'வலப்பக்கம் பாருங்கள், இடப்பக்கம் பாருங்கள்',
  'Stay calm in emergency': 'அவசரக்காலத்தில் அமைதியாக இருங்கள்',
  '{name} needs to cross the street to reach the playground. Traffic is moving.': '{name} விளையாட்டு மைதானத்தை அடைய சாலையைக் கடக்க வேண்டும். வாகனங்கள் சென்று கொண்டிருக்கின்றன.',
  'Road safety rules protect us from fast cars and accidents.': 'சாலை பாதுகாப்பு விதிகள் வேகமான கார்கள் மற்றும் விபத்துகளில் இருந்து நம்மைக் காக்கின்றன.',
  'How should {name} cross the road safely?': '{name} சாலையை எவ்வாறு பாதுகாப்பாகக் கடக்க வேண்டும்?',
  'Use the pedestrian zebra crossing and look both ways.': 'பாதசாரிகளுக்கான நடைபாதையைப் (zebra crossing) பயன்படுத்தி இருபுறமும் பார்த்துச் செல்லுங்கள்.',
  '{name} crosses safely when the pedestrian light turns green.': 'பாதசாரிகளுக்கான விளக்கு பச்சையாக மாறும்போது {name} பாதுகாப்பாகக் கடக்கிறார்.',
  'Always cross at zebra crossings and check traffic.': 'எப்போதும் நடைபாதையிலேயே சாலையைக் கடந்து வாகனப் போக்குவரத்தைச் சரிபார்க்கவும்.',
  'Run across the middle of the road quickly.': 'சாலையின் நடுவில் வேகமாக ஓடிவட்டுக் கடந்து விடுங்கள்.',
  'A car honks loudly and stops suddenly. {name} is safe but very scared.': 'ஒரு கார் சத்தமாக ஒலி எழுப்பி திடீரென நிற்கிறது. {name} உயிர் தப்பினார், ஆனால் மிகவும் பயந்துவிட்டார்.',
  'Running blindly across the road is extremely dangerous. Be safe.': 'சாலையில் குறுக்கே கண்மூடித்தனமாக ஓடுவது மிகவும் ஆபத்தானது. பாதுகாப்பாக இருங்கள்.',
  'Where is the safest place to cross a road?': 'சாலையைக் கடக்க மிகவும் பாதுகாப்பான இடம் எது?',
  'At a pedestrian zebra crossing': 'பாதசாரிகளுக்கான நடைபாதையில் (Zebra crossing)',
  'Between parked cars': 'நிறுத்தப்பட்ட கார்களுக்கு இடையில்',
  'Anywhere': 'எங்கு வேண்டுமானாலும்',
  'Zebra crossings are painted markers where drivers expect pedestrians to cross.': 'நடைபாதைகள் என்பது ஓட்டுநர்கள் பாதசாரிகள் கடப்பார்கள் என்று எதிர்பார்க்கும் குறியீடாகும்.',
  'What color traffic light tells cars to stop?': 'எந்த வண்ண விளக்கு கார்களை நிறுத்தச் சொல்கிறது?',
  'Red': 'சிவப்பு',
  'Red light means stop, letting pedestrians cross safely.': 'சிவப்பு விளக்கு என்றால் நில் என்று பொருள், இது பாதசாரிகளைப் பாதுகாப்பாகக் கடக்க அனுமதிக்கிறது.',

  // Social Skills
  'Making a Friend': 'நண்பனை உருவாக்குதல்',
  'Apologizing Sincerely': 'மனப்பூர்வமாக மன்னிப்பு கேட்டல்',
  'Introduce yourself': 'உங்களை அறிமுகப்படுத்திக் கொள்ளுங்கள்',
  'Say sorry with meaning': 'அர்த்தத்துடன் மன்னிப்புக் கேளுங்கள்',
  'A new student joins the class and sits alone. {name} wants to talk to them.': 'ஒரு புதிய மாணவர் வகுப்பில் சேர்ந்து தனியாக அமர்ந்திருக்கிறார். {name} அவரிடம் பேச விரும்புகிறார்.',
  'Welcoming new classmates helps them feel comfortable and make friends.': 'புதிய வகுப்புத் தோழர்களை வரவேற்பது அவர்கள் சௌகரியமாக உணரவும் நண்பர்களை உருவாக்கவும் உதவுகிறது.',
  'How should {name} approach the new classmate?': '{name} புதிய வகுப்புத் தோழனை எவ்வாறு அணுக வேண்டும்?',
  'Sit next to them, smile, and say: "Hi! I am {name}. What is your name?"': 'அருகில் அமர்ந்து, புன்னகைத்து: "ஹாய்! நான் {name}. உன் பெயர் என்ன?" என்று கேளுங்கள்.',
  'The classmate smiles, introduces themselves, and they talk about games.': 'வகுப்புத் தோழர் புன்னகைத்து, தன்னை அறிமுகப்படுத்தி, அவர்கள் விளையாட்டுகளைப் பற்றிப் பேசுகிறார்கள்.',
  'A simple, friendly introduction is the start of a great friendship.': 'ஒரு எளிய, நட்பான அறிமுகம் ஒரு சிறந்த நட்பின் தொடக்கமாகும்.',
  'Stare at them from a distance and make comments.': 'தொலைவில் இருந்து கொண்டு அவர்களை உற்றுப் பார்த்து கருத்துச் சொல்லுங்கள்.',
  'The new student feels nervous and looks down at their desk.': 'புதிய மாணவர் பதற்றமடைந்து தனது மேசையைப் பார்க்கிறார்.',
  'Staring makes people feel uncomfortable. Be warm and welcoming instead.': 'உற்றுப் பார்ப்பது மக்களை அசௌகரியமாக உணரச் செய்யும். அதற்குப் பதிலாக அன்பாக வரவேற்கவும்.',
  'What is a good way to start a conversation with a new peer?': 'புதிய சக நண்பருடன் உரையாடலைத் தொடங்க ஒரு நல்ல வழி எது?',
  'Greet them, smile, and share your name': 'வாழ்த்தி, புன்னகைத்து, உங்கள் பெயரைப் பகிர்வது',
  'A friendly greeting and sharing your name is the polite start.': 'ஒரு நட்பான வாழ்த்தும் உங்கள் பெயரைப் பகிர்வதும் நாகரீகமான தொடக்கமாகும்.',
  'What makes a new student feel welcome?': 'புதிய மாணவர் வரவேற்பை உணரச் செய்வது எது?',
  'Sharing a game or lunch table': 'விளையாட்டு அல்லது மதிய உணவு மேசையைப் பகிர்ந்து கொள்வது',
  'Inclusion is the best way to help new people feel at home.': 'உடன் சேர்த்துக்கொள்வது புதியவர்கள் சௌகரியமாக உணர சிறந்த வழியாகும்.',

  // Habit Building
  'Brushing Your Teeth': 'பற்களைத் துலக்குதல்',
  'Morning Routine Setup': 'காலை நேர வழக்க அமைப்பு',
  'Protect your bright smile': 'உங்கள் பிரகாசமான புன்னகையைப் பாதுகாக்கவும்',
  'Start the day right': 'நாளைச் சரியாகத் தொடங்குங்கள்',
  '{name} is sleepy at night and wants to skip brushing their teeth before bed.': '{name}-க்கு இரவில் தூக்கம் வருகிறது, படுக்கைக்குச் செல்லும் முன் பற்களைத் துலக்குவதைத் தவிர்க்க விரும்புகிறார்.',
  'Food particles left overnight can cause painful cavities and bad breath.': 'இரவு முழுவதும் பற்களில் தங்கும் உணவுத் துகள்கள் சொத்தைப்பல் மற்றும் வாய்நாற்றத்தை ஏற்படுத்தலாம்.',
  'What should {name} do before sleeping?': '{name} தூங்குவதற்கு முன் என்ன செய்ய வேண்டும்?',
  'Spend 2 minutes brushing teeth thoroughly with paste.': 'பற்பசையைக் கொண்டு பற்களை 2 நிமிடங்கள் நன்றாகத் துலக்குங்கள்.',
  '{name}\'s teeth are clean, fresh, and cavity-free.': '{name}-இன் பற்கள் சுத்தமாகவும், புத்துணர்ச்சியுடனும், சொத்தையின்றியும் இருக்கின்றன.',
  'Brushing twice daily keeps your teeth and gums healthy.': 'தினமும் இருமுறை துலக்குவது உங்கள் பற்களையும் ஈறுகளையும் ஆரோக்கியமாக வைத்திருக்கும்.',
  'Go straight to sleep without brushing.': 'துலக்காமல் நேரடியாக தூங்கச் செல்லுங்கள்.',
  'Over time, {name} gets a painful toothache and has to visit the dentist.': 'நாட்கள் செல்லச் செல்ல, {name}-க்கு கடுமையான பல்வலி ஏற்பட்டு பல் மருத்துவரிடம் செல்ல வேண்டியதாகிறது.',
  'Skipping hygiene routines leads to bad health. Consistency is key.': 'சுயசுத்த வழக்கங்களைத் தவிர்ப்பது உடல்நலக் குறைவுக்கு வழிவகுக்கும். தொடர்முயற்சி முக்கியம்.',
  'How many times a day should we brush our teeth?': 'ஒரு நாளைக்கு எத்தனை முறை நாம் பற்களைத் துலக்க வேண்டும்?',
  'Twice a day (morning and night)': 'ஒரு நாளைக்கு இருமுறை (காலை மற்றும் இரவு)',
  'Dentists recommend brushing in the morning and before sleeping.': 'பல் மருத்துவர்கள் காலையிலும் படுக்கைக்குச் செல்லும் முன்னும் துலக்கப் பரிந்துரைக்கிறார்கள்.',
  'How long should a good brush session last?': 'ஒரு நல்ல துலக்கல் எவ்வளவு நேரம் நீடிக்க வேண்டும்?',
  '2 minutes': '2 நிமிடங்கள்',
  '2 minutes ensures all teeth surfaces are cleared of food particles.': '2 நிமிடங்கள் பற்களின் அனைத்துப் பகுதிகளும் உணவுத் துகள்களிலிருந்து சுத்தமாவதை உறுதி செய்கிறது.',

  // Emotional Control
  'Calming Big Anger': 'பெரிய கோபத்தைத் தணித்தல்',
  'Handling Disappointment': 'ஏமாற்றத்தைக் கையாளுதல்',
  'Take deep breaths': 'ஆழ்ந்த மூச்சு விடுங்கள்',
  'Keep calm when losing': 'தோற்கும்போது அமைதியாக இருங்கள்',
  '{name}\'s paper tower fell down. They feel like crying and kicking the blocks.': '{name} கட்டிய காகிதக் கோபுரம் கீழே விழுந்துவிட்டது. அவர் அழவும், கட்டைகளைக் காலால் உதைக்கவும் விரும்புகிறார்.',
  'Feeling angry is natural, but acting aggressively doesn\'t solve the problem.': 'கோபப்படுவது இயல்பு, ஆனால் ஆக்ரோஷமாகச் செயல்படுவது சிக்கலைத் தீர்க்காது.',
  'How should {name} handle this big feeling?': '{name} இந்த பெரிய உணர்வை எவ்வாறு கையாள வேண்டும்?',
  'Stop, close eyes, take 3 deep breaths, then rebuild.': 'நிறுத்தி, கண்களை மூடி, 3 முறை ஆழமாக மூச்சு விட்டு, பின் மீண்டும் கட்டுங்கள்.',
  '{name} feels calm, rebuilds a stronger tower, and has fun.': '{name} அமைதியாகி, வலுவான கோபுரத்தைக் கட்டி மகிழ்கிறார்.',
  'Taking deep breaths helps calm the brain down in angry moments.': 'ஆழ்ந்த மூச்சு எடுப்பது கோபமான தருணங்களில் மூளையை அமைதிப்படுத்த உதவுகிறது.',
  'Kick the blocks across the room and yell loudly.': 'கட்டைகளை அறையெங்கும் உதைத்துத் தள்ளிவிட்டு சத்தமாகக் கத்துங்கள்.',
  'The blocks hit a vase, it breaks, and {name}\'s mother is upset.': 'கட்டைகள் ஒரு பூச்சாடியைத் தாக்கி உடையச் செய்கிறது, இதனால் {name}-இன் அம்மா வருத்தமடைகிறார்.',
  'Yelling and kicking cause damage. Calm down first before reacting.': 'கத்துவதும் உதைப்பதும் சேதத்தை ஏற்படுத்தும். பதிலளிக்கும் முன் முதலில் அமைதி அடையுங்கள்.',
  'What is a healthy way to calm down when feeling angry?': 'கோபமாக இருக்கும்போது அமைதியடைய ஒரு ஆரோக்கியமான வழி எது?',
  'Taking slow, deep breaths': 'மெதுவாக, ஆழமாக மூச்சு விடுவது',
  'Is it okay to feel disappointed when things go wrong?': 'காரியங்கள் தவறாகப் போகும்போது ஏமாற்றமடைவது சரியா?',
  'Yes, but we should handle it calmly': 'ஆம், ஆனால் அதை நாம் அமைதியாகக் கையாள வேண்டும்',
  'All emotions are valid; it is our actions that we must control.': 'அனைத்து உணர்வுகளும் நியாயமானவை; நமது செயல்களைத் தான் நாம் கட்டுப்படுத்த வேண்டும்.',

  // Problem Solving
  'Finding the Lost Key': 'தொலைந்த சாவியைக் கண்டுபிடித்தல்',
  'Grouping Similar Shapes': 'ஒரே மாதிரியான வடிவங்களைச் சேர்த்தல்',
  'Search step by step': 'படிபடியாகத் தேடுங்கள்',
  'Sort by attributes': 'பண்புகளின்படி வகைப்படுத்துங்கள்',
  '{name} cannot find the house keys. The bag is messy, and they are in a rush.': '{name}-ஆல் வீட்டுச் சாவியைக் கண்டுபிடிக்க முடியவில்லை. பை கலைந்து கிடக்கிறது, அவர் அவசரத்தில் இருக்கிறார்.',
  'Searching randomly makes us panic. A systematic search is much faster.': 'விதிமுறையின்றி தேடுவது நம்மைப் பதற்றமடையச் செய்யும். ஒரு முறையான தேடல் மிகவும் வேகமானது.',
  'What is the best way for {name} to search?': '{name} தேடுவதற்கு எது சிறந்த வழி?',
  'Check the pockets, then the main bag compartment, one by one.': 'பைகளைச் சரிபார்த்து, பின்னர் பையின் முக்கியப் பகுதியை ஒவ்வொன்றாகச் சரிபாருங்கள்.',
  'The key is found in the side zipper pocket! {name} leaves on time.': 'சாவி பக்கவாட்டு ஜிப் பையில் கிடைக்கிறது! {name} சரியான நேரத்தில் புறப்படுகிறார்.',
  'Systematic searching saves time and prevents panic.': 'முறையான தேடல் நேரத்தை மிச்சப்படுத்துகிறது மற்றும் பதற்றத்தைத் தடுக்கிறது.',
  'Dump everything on the floor and shout in stress.': 'பொருட்கள் அனைத்தையும் தரையில் கொட்டிவிட்டு மன அழுத்தத்தில் கத்துங்கள்.',
  'The items get mixed up, and finding the key takes double the time.': 'பொருட்கள் கலந்துவிடுகின்றன, சாவியைக் கண்டுபிடிக்க இரு மடங்கு நேரமாகிறது.',
  'Panic blocks your thinking. Stay calm and search one spot at a time.': 'பதற்றம் உங்கள் சிந்தனையைத் தடுக்கும். அமைதியாக இருந்து ஒரு நேரத்தில் ஒரு இடத்தில் தேடுங்கள்.',
  'What is the first step in solving a problem?': 'ஒரு பிரச்சனையைத் தீர்ப்பதில் முதல் படி எது?',
  'Staying calm and identifying the problem': 'அமைதியாக இருந்து பிரச்சனையை அடையாளம் காண்பது',
  'If an item is lost, where should you start searching?': 'ஒரு பொருள் தொலைந்துவிட்டால், எங்கு தேடத் தொடங்க வேண்டும்?',
  'In the last place you used it': 'நீங்கள் கடைசியாகப் பயன்படுத்திய இடத்தில்',
  'Tracing back to the last known usage is the most efficient search method.': 'கடைசியாகப் பயன்படுத்திய இடத்திலிருந்து தேடுவது மிகவும் திறமையான தேடல் முறையாகும்.',

  // Public Speaking
  'Show and Tell Prep': 'காட்டி விளக்கும் தயாரிப்பு',
  'Speaking Loud & Clear': 'சத்தமாகவும் தெளிவாகவும் பேசுதல்',
  'Talk about your favorite toy': 'உங்களுக்குப் பிடித்த பொம்மையைப் பற்றிப் பேசுங்கள்',
  'Speak with confidence': 'நம்பிக்கையுடன் பேசுங்கள்',
  '{name} has to talk about their pet puppy in front of the class today.': '{name} இன்று வகுப்பிற்கு முன்னால் தனது செல்ல நாய் குட்டியைப் பற்றிப் பேச வேண்டும்.',
  'Stage fright is normal. Looking at smiling friends helps you feel safe.': 'மேடை பயம் என்பது இயல்பானது. புன்னகைக்கும் நண்பர்களைப் பார்ப்பது உங்களுக்குப் பாதுகாப்பான உணர்வைத் தரும்.',
  'What should {name} do on the stage?': '{name} மேடையில் என்ன செய்ய வேண்டும்?',
  'Stand tall, look at friends, and speak in a clear voice.': 'நிமிர்ந்து நின்று, நண்பர்களைப் பார்த்து, தெளிவான குரலில் பேசுங்கள்.',
  'The class claps, and {name} feels extremely happy and proud!': 'வகுப்பு கைதட்டுகிறது, {name} மிகவும் மகிழ்ச்சியாகவும் பெருமையாகவும் உணர்கிறார்!',
  'Speaking clearly and looking at your audience builds connection.': 'தெளிவாகப் பேசுவதும் பார்வையாளர்களைப் பார்ப்பதும் பிணைப்பை உருவாக்குகிறது.',
  'Look at the floor, whisper, and run back to the desk.': 'தரையைப் பார்த்து, முணுமுணுத்துவிட்டு, மீண்டும் மேசைக்கு ஓடிவிடுங்கள்.',
  'No one could hear the talk. {name} feels disappointed with themselves.': 'அவர் பேசியது யாருக்கும் கேட்கவில்லை. {name} தன் மீது ஏமாற்றமடைகிறார்.',
  'Whispering blocks your voice. Believe in yourself and speak up!': 'முணுமுணுப்பது உங்கள் குரலைத் தடுக்கும். உங்களை நம்பி சத்தமாகப் பேசுங்கள்!',
  'How can you overcome stage fear?': 'மேடை பயத்தை எவ்வாறு போக்கலாம்?',
  'By taking deep breaths and practicing': 'ஆழ்ந்த மூச்சு விட்டுப் பயிற்சி செய்வதன் மூலம்',
  'Why is eye contact important in speaking?': 'பேசும்போது கண் தொடர்பு (eye contact) ஏன் முக்கியம்?',
  'To connect with your listeners': 'கேட்பவர்களுடன் இணைப்பை ஏற்படுத்த',
  'Looking at people builds trust and keeps them engaged.': 'மக்களைப் பார்ப்பது நம்பிக்கையை உருவாக்குகிறது மற்றும் அவர்களைக் கவனிப்பில் வைத்திருக்கும்.',

  // General Skill (Fallback)
  'General Skill': 'பொதுத் திறன்',
  'A skill for daily life': 'தினசரி வாழ்க்கைக்கான ஒரு திறன்',
  '{name} faces a tricky situation. They need to choose the best path forward.': '{name} ஒரு தந்திரமான சூழ்நிலையை எதிர்கொள்கிறார். அவர் சிறந்த வழியைத் தேர்ந்தெடுக்க வேண்டும்.',
  'Our choices define our outcomes. Think before you act.': 'நமது தேர்வுகள் நமது விளைவுகளைத் தீர்மானிக்கின்றன. செயல்படும் முன் சிந்தியுங்கள்.',
  'What is the right step?': 'சரியான படி எது?',
  'Act with care and honesty.': 'கவனத்துடனும் நேர்மையுடனும் செயல்படுங்கள்.',
  'Everything turns out great, and people respect {name}.': 'எல்லாம் நன்றாக நடக்கும், மக்கள் {name}-ஐ மதிக்கிறார்கள்.',
  'Honesty is always the best choice.': 'நேர்மையே எப்போதும் சிறந்த தேர்வாகும்.',
  'Take the shortcut and lie.': 'குறுக்கு வழியைத் தேர்ந்தெடுத்து பொய் சொல்லுங்கள்.',
  'The shortcut leads to more trouble. {name} has to fix it later.': 'குறுக்கு வழி அதிக சிக்கலுக்கு வழிவகுக்கிறது. {name} பின்னர் அதைச் சரிசெய்ய வேண்டும்.',
  'Lying gets you in trouble. Choose honesty.': 'பொய் சொல்வது உங்களைச் சிக்கலில் மாட்டிவிடும். நேர்மையைத் தேர்ந்தெடுங்கள்.',
  'What should you do before making a decision?': 'முடிவெடுப்பதற்கு முன் நீங்கள் என்ன செய்ய வேண்டும்?',
  'Think about the consequences': 'விளைவுகளைப் பற்றி சிந்திக்க வேண்டும்',
  'Who can help you guide when you face a dilemma?': 'நீங்கள் ஒரு குழப்பத்தை எதிர்கொள்ளும்போது யார் உங்களுக்கு வழிகாட்ட முடியும்?',
  'Parents and teachers': 'பெற்றோர்கள் மற்றும் ஆசிரியர்கள்'
};

const translateText = (text: string, charName: string, isTamil: boolean): string => {
  if (!isTamil || !text) return text;
  
  let normalized = text;
  if (charName) {
    normalized = text.replace(new RegExp(charName, 'g'), '{name}');
  }
  
  // Clean up any extra whitespace or minor variation in double quotes
  normalized = normalized.trim();
  
  let translated = dictionary[normalized] || normalized;
  
  // If not found in dictionary, fallback to checking some substrings
  if (translated === normalized) {
    // If it is inside quotes like &ldquo;...&rdquo; or "..."
    if (normalized.startsWith('"') && normalized.endsWith('"')) {
      const inner = normalized.substring(1, normalized.length - 1);
      const innerTrans = dictionary[inner];
      if (innerTrans) {
        translated = `"${innerTrans}"`;
      }
    }
  }

  if (charName) {
    const translatedChar = namesMap[charName] || charName;
    translated = translated.replace(new RegExp('{name}', 'g'), translatedChar);
    // Also handle lowercased name replacements just in case
    translated = translated.replace(new RegExp('{name}\'s', 'g'), `${translatedChar}-இன்`);
    translated = translated.replace(new RegExp(charName + "'s", 'g'), `${translatedChar}-இன்`);
  }
  return translated;
};

export function translateSkillLesson(lesson: SkillLesson, isTamil: boolean): SkillLesson {
  if (!isTamil) return lesson;

  const charName = lesson.character;
  
  // Title mapping
  let title = lesson.title;
  if (title.startsWith('Intro ')) {
    const core = title.substring(6);
    title = `அறிமுகம்: ${dictionary[core] || core}`;
  } else if (title.startsWith('Upper ')) {
    const core = title.substring(6);
    title = `உயர்நிலை: ${dictionary[core] || core}`;
  } else {
    title = dictionary[title] || title;
  }

  const subtitle = dictionary[lesson.subtitle] || lesson.subtitle;
  const character = namesMap[charName] || charName;

  const valuesTaught = lesson.valuesTaught.map(v => valueTranslations[v] || v);

  const scenes = lesson.scenes.map(scene => ({
    ...scene,
    title: sceneTitleTranslations[scene.title] || scene.title,
    text: translateText(scene.text, charName, true),
    speaker: namesMap[scene.speaker] || scene.speaker,
    dialogue: translateText(scene.dialogue, charName, true)
  }));

  const decision = {
    question: translateText(lesson.decision.question, charName, true),
    options: lesson.decision.options.map(opt => ({
      ...opt,
      text: translateText(opt.text, charName, true),
      consequence: {
        ...opt.consequence,
        title: opt.consequence.title === 'Great Choice!' ? 'சிறந்த தேர்வு!' : (opt.consequence.title === 'Not Quite Right' ? 'முற்றிலும் சரியல்ல' : opt.consequence.title),
        text: translateText(opt.consequence.text, charName, true),
        dialogue: translateText(opt.consequence.dialogue, charName, true),
        lesson: translateText(opt.consequence.lesson, charName, true)
      }
    }))
  };

  const quiz = lesson.quiz.map(q => ({
    ...q,
    question: translateText(q.question, charName, true),
    options: q.options.map(o => translateText(o, charName, true)),
    explanation: translateText(q.explanation, charName, true)
  }));

  return {
    ...lesson,
    title,
    subtitle,
    character,
    valuesTaught,
    scenes,
    decision,
    quiz
  };
}
