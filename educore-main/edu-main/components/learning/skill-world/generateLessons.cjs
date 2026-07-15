const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  { id: 'english-communication', name: 'English Buddy', emoji: '📘' },
  { id: 'tamil-learning', name: 'Tamil Learning', emoji: '🐯' },
  { id: 'life-skills', name: 'Real Life Skills', emoji: '🌍' },
  { id: 'money-management', name: 'Money Management', emoji: '💰' },
  { id: 'kindness-empathy', name: 'Kindness & Empathy', emoji: '❤️' },
  { id: 'learn-say-no', name: 'Learn to Say NO', emoji: '🛡️' },
  { id: 'negotiation', name: 'Negotiation Skills', emoji: '🤝' },
  { id: 'communication', name: 'Communication Skills', emoji: '🗣️' },
  { id: 'internet-tech', name: 'Internet & Technology', emoji: '🌐' },
  { id: 'ai-chatbots', name: 'AI & Chatbots', emoji: '🤖' },
  { id: 'creativity', name: 'Creativity & Imagination', emoji: '🎨' },
  { id: 'confidence', name: 'Confidence Building', emoji: '💪' },
  { id: 'leadership', name: 'Leadership Missions', emoji: '👑' },
  { id: 'focus-discipline', name: 'Focus & Discipline', emoji: '🎯' },
  { id: 'safety', name: 'Safety Awareness', emoji: '🔒' },
  { id: 'social-skills', name: 'Social Skills', emoji: '👥' },
  { id: 'habit-building', name: 'Habit Building', emoji: '📅' },
  { id: 'emotional-control', name: 'Emotional Control', emoji: '🧘' },
  { id: 'problem-solving', name: 'Problem Solving', emoji: '🧩' },
  { id: 'public-speaking', name: 'Public Speaking', emoji: '🎤' }
];

const NAMES = ['Arun', 'Maya', 'Priya', 'Ravi', 'Kavitha', 'Vijay', 'Deepak', 'Anjali', 'Sai', 'Diya'];
const EMOJIS = ['🦁', '🦊', '🦉', '🐱', '🐶', '🐼', '🐨', '🐸', '🐵', '🐰'];

function getPrimaryLessons() {
  const lessons = [];
  for (const cat of CATEGORIES) {
    lessons.push(createLesson(cat, 1, 2, 1, 'beginner'));
    lessons.push(createLesson(cat, 1, 2, 2, 'intermediate'));
    lessons.push(createLesson(cat, 3, 4, 1, 'beginner'));
    lessons.push(createLesson(cat, 3, 4, 2, 'intermediate'));
  }
  return lessons;
}

function getSecondaryLessons() {
  const lessons = [];
  for (const cat of CATEGORIES) {
    lessons.push(createLesson(cat, 5, 6, 1, 'advanced'));
    lessons.push(createLesson(cat, 5, 6, 2, 'master'));
    lessons.push(createLesson(cat, 7, 8, 1, 'advanced'));
    lessons.push(createLesson(cat, 7, 8, 2, 'master'));
  }
  return lessons;
}

function createLesson(cat, gMin, gMax, order, diff) {
  const id = `${cat.id.substring(0, 5)}-g${gMin}${gMax}-${order}`;
  const char = NAMES[(cat.id.charCodeAt(0) + gMin + order) % NAMES.length];
  const charEmoji = EMOJIS[(cat.id.charCodeAt(1) + gMax + order) % EMOJIS.length];
  
  const isUpper = gMin >= 5;
  const wordLevel = isUpper ? 'advanced vocabulary' : 'simple words';
  
  let title = '';
  let subtitle = '';
  let val1 = '';
  let val2 = '';
  let s1Text = '';
  let s2Text = '';
  let decQ = '';
  let optRight = '';
  let optRightCon = '';
  let optRightLesson = '';
  let optWrong = '';
  let optWrongCon = '';
  let optWrongLesson = '';
  let q1Q = '';
  let q1Opts = [];
  let q1Correct = 0;
  let q1Exp = '';
  let q2Q = '';
  let q2Opts = [];
  let q2Correct = 0;
  let q2Exp = '';

  switch (cat.id) {
    case 'english-communication':
      title = order === 1 ? `Polite Greetings` : `Expressing Thanks`;
      subtitle = order === 1 ? `Learn how to say hello!` : `The power of thank you`;
      val1 = 'Politeness';
      val2 = 'Communication';
      s1Text = `${char} wants to greet their teacher in the morning. They are not sure which words to use.`;
      s2Text = `Greeting others politely makes them feel happy. It also shows respect and good manners.`;
      decQ = `How should ${char} greet the teacher?`;
      optRight = `Say "Good Morning, Teacher!" with a smile.`;
      optRightCon = `The teacher smiles back and says "Good Morning! Have a great day!"`;
      optRightLesson = `Saying Good Morning with a smile is polite and friendly.`;
      optWrong = `Wave hand and shout "Hey there!"`;
      optWrongCon = `The teacher is surprised and gently explains that we should greet elders with respect.`;
      optWrongLesson = `Shouting "Hey there" to a teacher is too casual. Polite greetings are better.`;
      q1Q = `What is a polite way to greet a teacher in the morning?`;
      q1Opts = [`Hey you`, `Good Morning, Teacher!`, `Hello buddy`, `Nothing`];
      q1Correct = 1;
      q1Exp = `Good Morning is the standard polite morning greeting for teachers.`;
      q2Q = `What should you add to your greeting to make it warm?`;
      q2Opts = [`A big frown`, `A loud shout`, `A friendly smile`, `A jump`];
      q2Correct = 2;
      q2Exp = `A smile makes any greeting feel warm and friendly.`;
      break;

    case 'tamil-learning':
      title = order === 1 ? `Vanakkam & Culture` : `Tamil Festivals`;
      subtitle = order === 1 ? `Say hello in Tamil` : `Celebrate Pongal`;
      val1 = 'Culture';
      val2 = 'Respect';
      s1Text = `${char} is visiting their grandparents in the village. They want to greet them respectfully.`;
      s2Text = `Grandparents love it when we speak in Tamil. Greet them with a warm gesture.`;
      decQ = `How should ${char} greet their grandparents?`;
      optRight = `Fold hands and say "Vanakkam!"`;
      optRightCon = `Grandparents hug ${char} and feel extremely proud.`;
      optRightLesson = `Vanakkam is the traditional respectful Tamil greeting.`;
      optWrong = `Just wave and say "Hi guys!"`;
      optWrongCon = `Grandparents smile but feel a bit sad that ${char} did not greet them traditionally.`;
      optWrongLesson = `Greeting grandparents traditionally shows deep respect for elders.`;
      q1Q = `What does "Vanakkam" mean in Tamil?`;
      q1Opts = [`Goodbye`, `Thank you`, `Welcome / Greetings`, `Please`];
      q1Correct = 2;
      q1Exp = `Vanakkam is the traditional Tamil greeting of respect.`;
      q2Q = `How do we traditionally gesture when saying Vanakkam?`;
      q2Opts = [`Folds hands together`, `High five`, `Salute`, `Wave one hand`];
      q2Correct = 0;
      q2Exp = `Folding hands together in front of the chest is the gesture of respect.`;
      break;

    case 'life-skills':
      title = order === 1 ? `Tying Your Shoes` : `Packing School Bag`;
      subtitle = order === 1 ? `Step by step coordination` : `Organize for school`;
      val1 = 'Independence';
      val2 = 'Discipline';
      s1Text = `${char} is getting ready for school. The shoe laces are untied and loose.`;
      s2Text = `Walking with untied laces can cause you to trip and fall down.`;
      decQ = `What should ${char} do about the loose laces?`;
      optRight = `Sit down and tie the double loop bunny ears.`;
      optRightCon = `${char} walks confidently and safely to the school bus.`;
      optRightLesson = `Tying laces keeps you safe from tripping.`;
      optWrong = `Tuck the laces inside the shoes and run.`;
      optWrongCon = `The laces slip out and ${char} trips on the stairs.`;
      optWrongLesson = `Tucking laces is unsafe. It is always better to tie them securely.`;
      q1Q = `Why should we keep our shoe laces tied?`;
      q1Opts = [`To run slower`, `To prevent tripping and falling`, `To look cool`, `To save time`];
      q1Correct = 1;
      q1Exp = `Tied laces ensure safety and stability when walking or running.`;
      q2Q = `Which loop method is commonly used for tying laces?`;
      q2Opts = [`Double knot`, `Bunny Ears`, `Single line`, `Tape`];
      q2Correct = 1;
      q2Exp = `Bunny Ears is a popular, easy-to-learn method for kids.`;
      break;

    case 'money-management':
      title = order === 1 ? `Smart Piggy Bank` : `Needs vs Wants`;
      subtitle = order === 1 ? `Start saving coins` : `Spend money wisely`;
      val1 = 'Saving';
      val2 = 'Patience';
      s1Text = `${char} got some pocket money from their uncle. They want to buy a toy now.`;
      s2Text = `Saving today helps you buy bigger, more useful things in the future.`;
      decQ = `What should ${char} do with the pocket money?`;
      optRight = `Save half in the piggy bank, spend the rest.`;
      optRightCon = `Later, ${char} has enough money to buy an amazing storybook.`;
      optRightLesson = `Saving regularly builds a strong financial habit.`;
      optWrong = `Spend all of it immediately on candies.`;
      optWrongCon = `The candies are finished quickly, and ${char} has no savings left.`;
      optWrongLesson = `Spending all money on temporary wants leaves you with nothing for needs.`;
      q1Q = `What is a piggy bank used for?`;
      q1Opts = [`Playing games`, `Storing trash`, `Saving money`, `Feeding animals`];
      q1Correct = 2;
      q1Exp = `A piggy bank helps kids save coins and small bills safely.`;
      q2Q = `If you save 10 coins every week, how many coins will you have in 5 weeks?`;
      q2Opts = [`10 coins`, `50 coins`, `25 coins`, `100 coins`];
      q2Correct = 1;
      q2Exp = `10 multiplied by 5 is 50. Saving builds up quickly!`;
      break;

    case 'kindness-empathy':
      title = order === 1 ? `Sharing is Caring` : `Helping a Friend`;
      subtitle = order === 1 ? `Share lunch with others` : `Be a support system`;
      val1 = 'Generosity';
      val2 = 'Friendship';
      s1Text = `${char} notices that their classmate forgot their lunch box today.`;
      s2Text = `A hungry friend cannot study well. Sharing makes both of you happy.`;
      decQ = `What should ${char} do to help their classmate?`;
      optRight = `Offer to share half of their sandwich.`;
      optRightCon = `Both friends eat together happily and become closer friends.`;
      optRightLesson = `Sharing food builds strong bonds and helps those in need.`;
      optWrong = `Eat alone quickly so no one asks.`;
      optWrongCon = `The classmate sits sadly, and ${char} feels guilty inside.`;
      optWrongLesson = `Eating alone when a friend is hungry is not kind. Sharing is caring.`;
      q1Q = `What does empathy mean?`;
      q1Opts = [`Ignoring others`, `Understanding how others feel`, `Winning a race`, `Shouting loudly`];
      q1Correct = 1;
      q1Exp = `Empathy is placing yourself in someone else's shoes to feel what they feel.`;
      q2Q = `What is a simple act of kindness you can do at school?`;
      q2Opts = [`Taking a toy without asking`, `Sharing a pencil with a friend`, `Running in the corridor`, `Laughing at mistakes`];
      q2Correct = 1;
      q2Exp = `Sharing stationery is a very common and simple way to show kindness.`;
      break;

    case 'learn-say-no':
      title = order === 1 ? `Safe Boundaries` : `Saying No to Bullying`;
      subtitle = order === 1 ? `Your body, your rules` : `Stand up for yourself`;
      val1 = 'Safety';
      val2 = 'Courage';
      s1Text = `A stranger near the school gate offers ${char} a delicious chocolate bar.`;
      s2Text = `We should never take food or gifts from people we do not know.`;
      decQ = `How should ${char} respond to the stranger?`;
      optRight = `Say "No, thank you" and walk to a teacher immediately.`;
      optRightCon = `The teacher praises ${char} for making a safe choice.`;
      optRightLesson = `Saying no to strangers keeps you safe from danger.`;
      optWrong = `Take the chocolate and eat it.`;
      optWrongCon = `The stranger tries to talk more. ${char} feels scared and runs away.`;
      optWrongLesson = `Taking gifts from strangers is unsafe. Always refuse and tell an adult.`;
      q1Q = `Should you take candy from a stranger?`;
      q1Opts = [`Yes, if it is sweet`, `No, never`, `Only if you are hungry`, `If they look nice`];
      q1Correct = 1;
      q1Exp = `Never take food or gifts from strangers for your personal safety.`;
      q2Q = `Who is a safe adult you can tell if a stranger makes you uncomfortable?`;
      q2Opts = [`Another stranger`, `A teacher or parent`, `Nobody`, `A pet animal`];
      q2Correct = 1;
      q2Exp = `Parents and teachers are trusted adults who can protect you.`;
      break;

    case 'negotiation':
      title = order === 1 ? `Sharing the Swing` : `Taking Turns`;
      subtitle = order === 1 ? `Resolve play conflicts` : `Cooperate on the playground`;
      val1 = 'Fairness';
      val2 = 'Patience';
      s1Text = `Both ${char} and their friend want to ride the only swing in the park.`;
      s2Text = `Fighting over the swing will waste time and ruin the fun for both.`;
      decQ = `How can they resolve this playground conflict?`;
      optRight = `Suggest 5 minutes on the swing for each, taking turns.`;
      optRightCon = `Both get to swing and they have a great time playing together.`;
      optRightLesson = `Taking turns is the fairest way to share a single toy.`;
      optWrong = `Push the friend away and claim the swing.`;
      optWrongCon = `The friend starts crying, and the parents stop the play session.`;
      optWrongLesson = `Selfishness spoils the game. Sharing and negotiation ensure everyone plays.`;
      q1Q = `What is a win-win solution?`;
      q1Opts = [`Only I win`, `Only you win`, `A solution where both are happy`, `Nobody wins`];
      q1Correct = 2;
      q1Exp = `A win-win solution is the goal of fair negotiations.`;
      q2Q = `How do you decide who goes first when sharing?`;
      q2Opts = [`By fighting`, `Rock-Paper-Scissors or flipping a coin`, `Running away`, `Crying loudly`];
      q2Correct = 1;
      q2Exp = `A simple game of chance is a friendly and fair way to decide order.`;
      break;

    case 'communication':
      title = order === 1 ? `Active Listening` : `Asking for Help`;
      subtitle = order === 1 ? `Listen with your ears and eyes` : `Speak up when stuck`;
      val1 = 'Attention';
      val2 = 'Clarity';
      s1Text = `${char}'s mother is explaining the homework instructions, but ${char} is watching TV.`;
      s2Text = `Not listening carefully leads to mistakes and incomplete work later.`;
      decQ = `What should ${char} do while their mother is speaking?`;
      optRight = `Turn off the TV, look at mother, and listen.`;
      optRightCon = `${char} understands the homework perfectly and finishes it on time.`;
      optRightLesson = `Active listening helps you learn and shows respect.`;
      optWrong = `Keep watching TV and nod without listening.`;
      optWrongCon = `${char} makes many mistakes and has to redo the entire homework.`;
      optWrongLesson = `Distractions prevent active listening. Always focus when someone speaks to you.`;
      q1Q = `What is active listening?`;
      q1Opts = [`Looking away`, `Listening and showing you understand`, `Interrupting others`, `Singing a song`];
      q1Correct = 1;
      q1Exp = `Active listening involves paying full attention and responding appropriately.`;
      q2Q = `What should you do if you don't understand the instructions?`;
      q2Opts = [`Ignore it`, `Cry`, `Ask the speaker to repeat or clarify`, `Guess blindly`];
      q2Correct = 2;
      q2Exp = `Asking clarifying questions is a sign of good communication.`;
      break;

    case 'internet-tech':
      title = order === 1 ? `Screen Time Balance` : `Safe Web Surfing`;
      subtitle = order === 1 ? `Limit your digital world` : `Click links carefully`;
      val1 = 'Moderation';
      val2 = 'Digital Safety';
      s1Text = `${char} has been playing mobile games for two hours and eyes are hurting.`;
      s2Text = `Too much screen time can strain eyes and prevent healthy outdoor play.`;
      decQ = `What should ${char} do next?`;
      optRight = `Put down the phone and go play in the garden.`;
      optRightCon = `${char}'s eyes feel rested, and they have fun playing catch.`;
      optRightLesson = `Balancing screen time with physical activity keeps you healthy.`;
      optWrong = `Ignore the eye strain and keep playing games.`;
      optWrongCon = `${char} gets a bad headache and cannot sleep well tonight.`;
      optWrongLesson = `Listen to your body. Take regular breaks from digital screens.`;
      break;

    case 'ai-chatbots':
      title = order === 1 ? `What is AI?` : `AI Voice Assistants`;
      subtitle = order === 1 ? `Meet the smart machines` : `Talk to smart speakers`;
      val1 = 'Curiosity';
      val2 = 'Tech Literacy';
      s1Text = `${char} hears about artificial intelligence and wonders if it is a real human.`;
      s2Text = `AI is a computer program trained on a lot of information to help answer questions.`;
      decQ = `How should ${char} think about AI?`;
      optRight = `As a smart tool that can help me search and learn.`;
      optRightCon = `${char} uses AI to find cool facts about planets for school.`;
      optRightLesson = `AI is a supportive learning assistant, not a human friend.`;
      optWrong = `As a magical magic box that knows everything perfectly.`;
      optWrongCon = `${char} copies an AI mistake and gets a wrong answer on the test.`;
      optWrongLesson = `AI can make mistakes. Always verify facts with books or teachers.`;
      break;

    case 'creativity':
      title = order === 1 ? `Building Block Castle` : `Making Story Plots`;
      subtitle = order === 1 ? `Imagine and construct` : `Create a hero adventure`;
      val1 = 'Imagination';
      val2 = 'Focus';
      s1Text = `${char} wants to build a giant toy castle but doesn't have enough red blocks.`;
      s2Text = `Creative thinkers use alternative items when their first choice is missing.`;
      decQ = `What should ${char} do to build the castle?`;
      optRight = `Use blue and green blocks to make a multi-color castle.`;
      optRightCon = `The castle looks unique, and friends love the colorful design!`;
      optRightLesson = `Creativity means adapting and using your imagination.`;
      optWrong = `Stop building and feel sad about the red blocks.`;
      optWrongCon = `No castle is built, and the blocks lie unused on the floor.`;
      optWrongLesson = `Do not let small limits stop you. Use what you have to create.`;
      break;

    case 'confidence':
      title = order === 1 ? `Trying New Things` : `Overcoming Mistakes`;
      subtitle = order === 1 ? `Ride bicycle without support` : `Stand up after a fall`;
      val1 = 'Self-Belief';
      val2 = 'Courage';
      s1Text = `${char} wants to learn cycling but is afraid of falling and getting hurt.`;
      s2Text = `Every expert was once a beginner. Falling down is just a part of learning.`;
      decQ = `How should ${char} start learning?`;
      optRight = `Wear a helmet, start slowly with an adult holding the seat.`;
      optRightCon = `${char} rides a short distance safely and feels super proud!`;
      optRightLesson = `Confidence grows when we take safe steps to try new things.`;
      optWrong = `Refuse to touch the bicycle and stay inside.`;
      optWrongCon = `${char} watches friends ride around and feels left out.`;
      optWrongLesson = `Fear stops us from enjoying new adventures. Be brave and try!`;
      break;

    case 'leadership':
      title = order === 1 ? `Class Monitor Helper` : `Leading the Clean-Up`;
      subtitle = order === 1 ? `Help organize the classroom` : `Teamwork starts with you`;
      val1 = 'Responsibility';
      val2 = 'Teamwork';
      s1Text = `The teacher asks ${char} to hand out notebooks while the class is making noise.`;
      s2Text = `A good leader communicates calmly and guides others by setting a good example.`;
      decQ = `How should ${char} handle the noisy classroom?`;
      optRight = `Speak in a polite voice and ask rows to collect books quietly.`;
      optRightCon = `The class quiets down, and notebooks are distributed quickly.`;
      optRightLesson = `Polite and clear communication is the mark of a great leader.`;
      optWrong = `Shout loudly at everyone to shut up.`;
      optWrongCon = `The students shout back, and the classroom becomes even noisier.`;
      optWrongLesson = `Shouting causes conflict. Lead with calm actions and polite words.`;
      break;

    case 'focus-discipline':
      title = order === 1 ? `Homework First` : `The Quiet Study Area`;
      subtitle = order === 1 ? `Finish tasks before play` : `Avoid study distractions`;
      val1 = 'Discipline';
      val2 = 'Focus';
      s1Text = `${char} wants to watch cartoon shows, but their homework is not finished yet.`;
      s2Text = `Finishing important tasks first lets you enjoy play time without stress.`;
      decQ = `What choice should ${char} make?`;
      optRight = `Complete the math homework first, then watch cartoons.`;
      optRightCon = `Homework is neat and correct, and play time feels relaxing.`;
      optRightLesson = `Discipline means doing what needs to be done first.`;
      optWrong = `Watch cartoons first and delay the homework.`;
      optWrongCon = `It gets late, ${char} is sleepy, and the homework has many mistakes.`;
      optWrongLesson = `Delaying tasks causes rushed work and stress. Do homework first.`;
      break;

    case 'safety':
      title = order === 1 ? `Crossing the Road` : `Fire Drill Safety`;
      subtitle = order === 1 ? `Look right, look left` : `Stay calm in emergency`;
      val1 = 'Safety';
      val2 = 'Awareness';
      s1Text = `${char} needs to cross the street to reach the playground. Traffic is moving.`;
      s2Text = `Road safety rules protect us from fast cars and accidents.`;
      decQ = `How should ${char} cross the road safely?`;
      optRight = `Use the pedestrian zebra crossing and look both ways.`;
      optRightCon = `${char} crosses safely when the pedestrian light turns green.`;
      optRightLesson = `Always cross at zebra crossings and check traffic.`;
      optWrong = `Run across the middle of the road quickly.`;
      optWrongCon = `A car honks loudly and stops suddenly. ${char} is safe but very scared.`;
      optWrongLesson = `Running blindly across the road is extremely dangerous. Be safe.`;
      break;

    case 'social-skills':
      title = order === 1 ? `Making a Friend` : `Apologizing Sincerely`;
      subtitle = order === 1 ? `Introduce yourself` : `Say sorry with meaning`;
      val1 = 'Social Bond';
      val2 = 'Communication';
      s1Text = `A new student joins the class and sits alone. ${char} wants to talk to them.`;
      s2Text = `Welcoming new classmates helps them feel comfortable and make friends.`;
      decQ = `How should ${char} approach the new classmate?`;
      optRight = `Sit next to them, smile, and say: "Hi! I am ${char}. What is your name?"`;
      optRightCon = `The classmate smiles, introduces themselves, and they talk about games.`;
      optRightLesson = `A simple, friendly introduction is the start of a great friendship.`;
      optWrong = `Stare at them from a distance and make comments.`;
      optWrongCon = `The new student feels nervous and looks down at their desk.`;
      optWrongLesson = `Staring makes people feel uncomfortable. Be warm and welcoming instead.`;
      break;

    case 'habit-building':
      title = order === 1 ? `Brushing Your Teeth` : `Morning Routine Setup`;
      subtitle = order === 1 ? `Protect your bright smile` : `Start the day right`;
      val1 = 'Hygiene';
      val2 = 'consistency';
      s1Text = `${char} is sleepy at night and wants to skip brushing their teeth before bed.`;
      s2Text = `Food particles left overnight can cause painful cavities and bad breath.`;
      decQ = `What should ${char} do before sleeping?`;
      optRight = `Spend 2 minutes brushing teeth thoroughly with paste.`;
      optRightCon = `${char}'s teeth are clean, fresh, and cavity-free.`;
      optRightLesson = `Brushing twice daily keeps your teeth and gums healthy.`;
      optWrong = `Go straight to sleep without brushing.`;
      optWrongCon = `Over time, ${char} gets a painful toothache and has to visit the dentist.`;
      optWrongLesson = `Skipping hygiene routines leads to bad health. Consistency is key.`;
      break;

    case 'emotional-control':
      title = order === 1 ? `Calming Big Anger` : `Handling Disappointment`;
      subtitle = order === 1 ? `Take deep breaths` : `Keep calm when losing`;
      val1 = 'Self-Control';
      val2 = 'Mindfulness';
      s1Text = `${char}'s paper tower fell down. They feel like crying and kicking the blocks.`;
      s2Text = `Feeling angry is natural, but acting aggressively doesn't solve the problem.`;
      decQ = `How should ${char} handle this big feeling?`;
      optRight = `Stop, close eyes, take 3 deep breaths, then rebuild.`;
      optRightCon = `${char} feels calm, rebuilds a stronger tower, and has fun.`;
      optRightLesson = `Taking deep breaths helps calm the brain down in angry moments.`;
      optWrong = `Kick the blocks across the room and yell loudly.`;
      optWrongCon = `The blocks hit a vase, it breaks, and ${char}'s mother is upset.`;
      optWrongLesson = `Yelling and kicking cause damage. Calm down first before reacting.`;
      break;

    case 'problem-solving':
      title = order === 1 ? `Finding the Lost Key` : `Grouping Similar Shapes`;
      subtitle = order === 1 ? `Search step by step` : `Sort by attributes`;
      val1 = 'Logic';
      val2 = 'Focus';
      s1Text = `${char} cannot find the house keys. The bag is messy, and they are in a rush.`;
      s2Text = `Searching randomly makes us panic. A systematic search is much faster.`;
      decQ = `What is the best way for ${char} to search?`;
      optRight = `Check the pockets, then the main bag compartment, one by one.`;
      optRightCon = `The key is found in the side zipper pocket! ${char} leaves on time.`;
      optRightLesson = `Systematic searching saves time and prevents panic.`;
      optWrong = `Dump everything on the floor and shout in stress.`;
      optWrongCon = `The items get mixed up, and finding the key takes double the time.`;
      optWrongLesson = `Panic blocks your thinking. Stay calm and search one spot at a time.`;
      break;

    case 'public-speaking':
      title = order === 1 ? `Show and Tell Prep` : `Speaking Loud & Clear`;
      subtitle = order === 1 ? `Talk about your favorite toy` : `Speak with confidence`;
      val1 = 'Expression';
      val2 = 'Confidence';
      s1Text = `${char} has to talk about their pet puppy in front of the class today.`;
      s2Text = `Stage fright is normal. Looking at smiling friends helps you feel safe.`;
      decQ = `What should ${char} do on the stage?`;
      optRight = `Stand tall, look at friends, and speak in a clear voice.`;
      optRightCon = `The class claps, and ${char} feels incredibly happy and proud!`;
      optRightLesson = `Speaking clearly and looking at your audience builds connection.`;
      optWrong = `Look at the floor, whisper, and run back to the desk.`;
      optWrongCon = `No one could hear the talk. ${char} feels disappointed with themselves.`;
      optWrongLesson = `Whispering blocks your voice. Believe in yourself and speak up!`;
      break;

    default:
      title = `General Skill`;
      subtitle = `A skill for daily life`;
      val1 = 'Wisdom';
      val2 = 'Action';
      s1Text = `${char} faces a tricky situation. They need to choose the best path forward.`;
      s2Text = `Our choices define our outcomes. Think before you act.`;
      decQ = `What is the right step?`;
      optRight = `Act with care and honesty.`;
      optRightCon = `Everything turns out great, and people respect ${char}.`;
      optRightLesson = `Honesty is always the best choice.`;
      optWrong = `Take the shortcut and lie.`;
      optWrongCon = `The shortcut leads to more trouble. ${char} has to fix it later.`;
      optWrongLesson = `Lying gets you in trouble. Choose honesty.`;
  }

  // Set default values if not defined by the switch case
  if (!q1Q) {
    q1Q = `What is the correct action here?`;
    q1Opts = [`Option A`, optRight || `Select option B`, `Option C`, `Option D`];
    q1Correct = 1;
    q1Exp = `Making the correct, ethical choice teaches accountability.`;
  }
  if (!q2Q) {
    q2Q = `What did ${char} learn from this lesson?`;
    q2Opts = [`To act impulsively`, `To seek help and choose wisely`, `To ignore others`, `Nothing`];
    q2Correct = 1;
    q2Exp = `Thinking before acting leads to better decisions and builds confidence.`;
  }

  if (isUpper) {
    s1Text = s1Text.replace(/messy/g, 'unorganized').replace(/noisy/g, 'disorderly');
    s2Text = s2Text.replace(/happy/g, 'appreciative').replace(/safe/g, 'secure');
  }

  const xpReward = isUpper ? (gMin === 5 ? 45 : 55) : (gMin === 1 ? 25 : 35);
  const coinReward = isUpper ? 20 : 15;

  return {
    id,
    categoryId: cat.id,
    gradeMin: gMin,
    gradeMax: gMax,
    difficulty: diff,
    order,
    title: `${isUpper ? 'Upper' : 'Intro'} ${title}`,
    subtitle,
    character: char,
    characterEmoji: charEmoji,
    valuesTaught: [val1, val2],
    scenes: [
      {
        title: `Scene 1: The Dilemma`,
        text: s1Text,
        illustration: charEmoji,
        speaker: char,
        dialogue: `"Oh, what should I do here? I want to make the right choice!"`
      },
      {
        title: `Scene 2: Core Concept`,
        text: s2Text,
        illustration: `💡`,
        speaker: `Narrator`,
        dialogue: `"Making thoughtful choices builds your character and helps those around you."`
      }
    ],
    decision: {
      question: decQ || `What should ${char} do next?`,
      options: [
        {
          id: `${id}-opt-right`,
          text: optRight || `Choose the honest and kind action.`,
          emoji: `✅`,
          consequence: {
            title: `Great Choice!`,
            text: optRightCon || `${char} solved the issue and gained respect.`,
            illustration: `🎉`,
            dialogue: `"Awesome! This worked out so well!"`,
            isCorrect: true,
            lesson: optRightLesson || `Making a positive choice yields positive outcomes.`
          }
        },
        {
          id: `${id}-opt-wrong`,
          text: optWrong || `Take the shortcut or ignore it.`,
          emoji: `❌`,
          consequence: {
            title: `Not Quite Right`,
            text: optWrongCon || `The issue remained unresolved or got a bit worse.`,
            illustration: `🧐`,
            dialogue: `"Let's think about this... Maybe there's a better way."`,
            isCorrect: false,
            lesson: optWrongLesson || `Shortcuts can lead to unneeded complications.`
          }
        }
      ]
    },
    quiz: [
      {
        question: q1Q,
        options: q1Opts,
        correctIndex: q1Correct,
        explanation: q1Exp
      },
      {
        question: q2Q,
        options: q2Opts,
        correctIndex: q2Correct,
        explanation: q2Exp
      }
    ],
    xpReward,
    coinReward
  };
}

const primaryLessons = getPrimaryLessons();
const secondaryLessons = getSecondaryLessons();

const primaryFileContent = `import type { SkillLesson } from './types';

const PRIMARY_LESSONS: SkillLesson[] = ${JSON.stringify(primaryLessons, null, 2)};

export default PRIMARY_LESSONS;
`;

const secondaryFileContent = `import type { SkillLesson } from './types';

const SECONDARY_LESSONS: SkillLesson[] = ${JSON.stringify(secondaryLessons, null, 2)};

export default SECONDARY_LESSONS;
`;

fs.writeFileSync(path.join(__dirname, 'lessonDataPrimary.ts'), primaryFileContent);
fs.writeFileSync(path.join(__dirname, 'lessonDataSecondary.ts'), secondaryFileContent);

console.log('Successfully generated lesson data files!');
