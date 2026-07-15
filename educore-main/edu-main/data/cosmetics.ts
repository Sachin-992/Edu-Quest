// ═══════════════════════════════════════════════════
// EDUSPARK COSMETICS DATABASE
// ═══════════════════════════════════════════════════

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'limited' | 'event' | 'seasonal';
export type CosmeticCategory = 'outfit' | 'anime' | 'superhero' | 'fantasy' | 'adventure' | 'school' | 'funny' | 'accessory' | 'hairstyle' | 'aura' | 'pet' | 'background' | 'emote' | 'jacket' | 'hat' | 'glasses' | 'prop' | 'backpack' | 'beard' | 'frame' | 'pose';
export type CosmeticSlot = 'outfit' | 'jacket' | 'hat' | 'glasses' | 'prop' | 'backpack' | 'hairstyle' | 'beard' | 'aura' | 'pet' | 'background' | 'emote' | 'frame' | 'pose';

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  category: CosmeticCategory;
  equipSlot?: CosmeticSlot; // If undefined, category is used as slot
  price: number;
  icon: string;
  collection?: string;
  gender: 'unisex' | 'male' | 'female';
  unlockRequirement?: string;
  isLimited?: boolean;
  limitedUntil?: string;
}

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; border: string; glow: string; gradient: string }> = {
  common:    { label: 'Common',    color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-400/30',  glow: '',                              gradient: 'from-slate-400 to-slate-500' },
  rare:      { label: 'Rare',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-400/40',   glow: 'shadow-blue-500/20',            gradient: 'from-blue-400 to-blue-600' },
  epic:      { label: 'Epic',      color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-400/40', glow: 'shadow-purple-500/25',          gradient: 'from-purple-400 to-purple-600' },
  legendary: { label: 'Legendary', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-400/50',  glow: 'shadow-amber-500/40',           gradient: 'from-amber-400 to-orange-500' },
  mythic:    { label: 'Mythic',    color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-400/50',   glow: 'shadow-rose-500/50 animate-pulse', gradient: 'from-rose-400 to-pink-600' },
  limited:   { label: 'Limited',   color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-400/50',glow: 'shadow-emerald-500/40 animate-pulse', gradient: 'from-emerald-400 to-teal-500' },
  event:     { label: 'Event',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-400/50',   glow: 'shadow-cyan-500/30',            gradient: 'from-cyan-400 to-blue-500' },
  seasonal:  { label: 'Seasonal',  color: 'text-fuchsia-400',bg: 'bg-fuchsia-500/10',border: 'border-fuchsia-400/50',glow: 'shadow-fuchsia-500/30',        gradient: 'from-fuchsia-400 to-purple-500' },
};

export const CATEGORIES: { key: CosmeticCategory; label: string; icon: string }[] = [
  { key: 'outfit',     label: 'Outfits',     icon: '👕' },
  { key: 'jacket',     label: 'Jackets',     icon: '🧥' },
  { key: 'hat',        label: 'Headgear',    icon: '🎩' },
  { key: 'glasses',    label: 'Eyewear',     icon: '🕶️' },
  { key: 'prop',       label: 'Props',       icon: '🗡️' },
  { key: 'backpack',   label: 'Backpacks',   icon: '🎒' },
  { key: 'anime',      label: 'Anime',       icon: '⚔️' },
  { key: 'superhero',  label: 'Heroes',      icon: '🦸' },
  { key: 'fantasy',    label: 'Fantasy',     icon: '🧙' },
  { key: 'adventure',  label: 'Adventure',   icon: '🗺️' },
  { key: 'school',     label: 'School',      icon: '🎒' },
  { key: 'accessory',  label: 'Accessories', icon: '✨' },
  { key: 'hairstyle',  label: 'Hairstyles',  icon: '💇' },
  { key: 'beard',      label: 'Beards',      icon: '🧔' },
  { key: 'aura',       label: 'Auras',       icon: '🌟' },
  { key: 'pet',        label: 'Pets',        icon: '🐾' },
  { key: 'background', label: 'Lobby',       icon: '🖼️' },
  { key: 'emote',      label: 'Emotes',      icon: '💃' },
  { key: 'frame',      label: 'Frames',      icon: '🖼️' },
  { key: 'pose',       label: 'Poses',       icon: '🧍' },
];

export const ALL_COSMETICS: Cosmetic[] = [
  // ── SCHOOL ──
  { id: 'school-uniform', name: 'School Uniform', description: 'Classic school look', rarity: 'common', category: 'school', price: 0, icon: '👔', gender: 'unisex' },
  { id: 'sports-jersey', name: 'Sports Jersey', description: 'Athletic champion look', rarity: 'common', category: 'school', price: 10, icon: '🏃', gender: 'unisex' },
  { id: 'lab-coat', name: 'Science Lab Coat', description: 'Ready for experiments', rarity: 'rare', category: 'school', price: 25, icon: '🥼', gender: 'unisex' },
  { id: 'art-smock', name: 'Artist Smock', description: 'Creative genius vibes', rarity: 'common', category: 'school', price: 15, icon: '🎨', gender: 'unisex' },
  { id: 'head-prefect', name: 'Head Prefect Badge', description: 'Leader of the school', rarity: 'epic', category: 'school', price: 60, icon: '🎖️', gender: 'unisex' },
  { id: 'graduation-gown', name: 'Graduation Gown', description: 'Top of the class!', rarity: 'legendary', category: 'school', price: 100, icon: '🎓', gender: 'unisex' },

  // ── ANIME INSPIRED ──
  { id: 'orange-ninja', name: 'Orange Ninja Set', description: 'Believe in yourself! Hidden leaf style.', rarity: 'legendary', category: 'anime', price: 120, icon: '🍥', collection: 'Ninja Academy', gender: 'unisex' },
  { id: 'ninja-headband', name: 'Ninja Headband', description: 'Symbol of the hidden village', rarity: 'rare', category: 'anime', price: 30, icon: '🥷', collection: 'Ninja Academy', gender: 'unisex' },
  { id: 'pirate-captain', name: 'Pirate King Captain', description: 'King of the seven seas!', rarity: 'mythic', category: 'anime', price: 200, icon: '🏴‍☠️', collection: 'Grand Voyage', gender: 'unisex' },
  { id: 'straw-hat', name: 'Straw Adventure Hat', description: 'The hat that started it all', rarity: 'epic', category: 'anime', price: 80, icon: '👒', collection: 'Grand Voyage', gender: 'unisex' },
  { id: 'caped-hero', name: 'Caped Hero Outfit', description: 'One punch is all it takes', rarity: 'legendary', category: 'anime', price: 150, icon: '🦲', collection: 'Hero League', gender: 'male' },
  { id: 'dragon-warrior', name: 'Dragon Warrior Armor', description: 'Power level over 9000!', rarity: 'legendary', category: 'anime', price: 140, icon: '🐉', collection: 'Warrior Saga', gender: 'male' },
  { id: 'shadow-slayer', name: 'Shadow Slayer Cloak', description: 'Slay the darkness within', rarity: 'epic', category: 'anime', price: 90, icon: '⚔️', collection: 'Demon Edge', gender: 'unisex' },
  { id: 'titan-scout', name: 'Titan Scout Uniform', description: 'Survey Corps reporting!', rarity: 'epic', category: 'anime', price: 85, icon: '🛡️', collection: 'Wall Guard', gender: 'unisex' },
  { id: 'spirit-samurai', name: 'Spirit Samurai Set', description: 'Honor and the spirit blade', rarity: 'mythic', category: 'anime', price: 180, icon: '🗡️', collection: 'Bushido Path', gender: 'unisex' },
  { id: 'moon-sailor', name: 'Moon Guardian Outfit', description: 'In the name of the moon!', rarity: 'legendary', category: 'anime', price: 130, icon: '🌙', collection: 'Celestial Guard', gender: 'female' },
  { id: 'crystal-mage', name: 'Crystal Mage Robe', description: 'Master of elemental magic', rarity: 'epic', category: 'anime', price: 75, icon: '🔮', collection: 'Mage Guild', gender: 'unisex' },

  // ── SUPERHERO ──
  { id: 'spider-hero', name: 'Spider Hero Suit', description: 'With great power comes great fun!', rarity: 'legendary', category: 'superhero', price: 130, icon: '🕷️', collection: 'Web Slingers', gender: 'unisex' },
  { id: 'dark-bat', name: 'Dark Bat Armor', description: 'I am the night!', rarity: 'legendary', category: 'superhero', price: 140, icon: '🦇', collection: 'Night Watchers', gender: 'male' },
  { id: 'thunder-god', name: 'Thunder God Cape', description: 'Worthy of the lightning!', rarity: 'mythic', category: 'superhero', price: 180, icon: '⚡', collection: 'Asgard Heroes', gender: 'male' },
  { id: 'iron-tech', name: 'Iron Tech Armor', description: 'Genius inventor in a suit', rarity: 'legendary', category: 'superhero', price: 160, icon: '🤖', collection: 'Tech Knights', gender: 'unisex' },
  { id: 'shield-captain', name: 'Shield Captain Suit', description: 'Stand for justice!', rarity: 'epic', category: 'superhero', price: 95, icon: '🛡️', collection: 'Liberty Force', gender: 'male' },
  { id: 'wonder-warrior', name: 'Wonder Warrior Armor', description: 'Amazonian strength!', rarity: 'legendary', category: 'superhero', price: 130, icon: '👸', collection: 'Divine Warriors', gender: 'female' },
  { id: 'speed-flash', name: 'Speed Flash Suit', description: 'Faster than lightning!', rarity: 'epic', category: 'superhero', price: 85, icon: '💨', collection: 'Speedsters', gender: 'unisex' },
  { id: 'green-archer', name: 'Forest Archer Hood', description: 'Never miss a target', rarity: 'rare', category: 'superhero', price: 50, icon: '🏹', collection: 'Emerald Archers', gender: 'unisex' },

  // ── FANTASY ──
  { id: 'wizard-school', name: 'Wizard School Outfit', description: 'Classes at the magic academy!', rarity: 'legendary', category: 'fantasy', price: 120, icon: '🧙', collection: 'Magic Academy', gender: 'unisex' },
  { id: 'wizard-hat', name: 'Sorting Wizard Hat', description: 'Which house are you?', rarity: 'epic', category: 'fantasy', price: 70, icon: '🎩', collection: 'Magic Academy', gender: 'unisex' },
  { id: 'elf-ranger', name: 'Elf Ranger Cloak', description: 'One with the forest', rarity: 'epic', category: 'fantasy', price: 80, icon: '🧝', collection: 'Enchanted Forest', gender: 'unisex' },
  { id: 'dragon-rider', name: 'Dragon Rider Armor', description: 'Soar the skies!', rarity: 'mythic', category: 'fantasy', price: 200, icon: '🐲', collection: 'Sky Riders', gender: 'unisex' },
  { id: 'fairy-wings', name: 'Sparkle Fairy Wings', description: 'Magical flight!', rarity: 'legendary', category: 'fantasy', price: 110, icon: '🧚', collection: 'Pixie Hollow', gender: 'female' },
  { id: 'knight-armor', name: 'Royal Knight Armor', description: 'Defend the realm!', rarity: 'epic', category: 'fantasy', price: 90, icon: '⚔️', collection: 'Kingdom Guard', gender: 'male' },
  { id: 'ice-queen', name: 'Ice Queen Gown', description: 'Let it snow!', rarity: 'legendary', category: 'fantasy', price: 130, icon: '❄️', collection: 'Frozen Realm', gender: 'female' },
  { id: 'dark-mage', name: 'Dark Mage Robes', description: 'Master of shadows', rarity: 'epic', category: 'fantasy', price: 75, icon: '🌑', collection: 'Shadow Order', gender: 'unisex' },

  // ── ADVENTURE ──
  { id: 'explorer-hat', name: 'Explorer Archaeologist', description: 'Ancient treasures await!', rarity: 'epic', category: 'adventure', price: 70, icon: '🤠', collection: 'Lost Relics', gender: 'unisex' },
  { id: 'secret-agent', name: 'Secret Agent Tuxedo', description: 'Shaken not stirred', rarity: 'legendary', category: 'adventure', price: 110, icon: '🕶️', collection: 'Spy Files', gender: 'unisex' },
  { id: 'kung-fu', name: 'Kung Fu Master Outfit', description: 'Inner peace, outer power', rarity: 'epic', category: 'adventure', price: 80, icon: '🥋', collection: 'Martial Arts', gender: 'unisex' },
  { id: 'masked-heist', name: 'Masked Heist Suit', description: 'The perfect plan!', rarity: 'legendary', category: 'adventure', price: 120, icon: '🎭', collection: 'Master Plan', gender: 'unisex' },
  { id: 'space-explorer', name: 'Space Explorer Suit', description: 'To infinity and beyond!', rarity: 'epic', category: 'adventure', price: 85, icon: '🚀', collection: 'Star Voyage', gender: 'unisex' },
  { id: 'jungle-safari', name: 'Jungle Safari Outfit', description: 'Wild adventure awaits', rarity: 'rare', category: 'adventure', price: 40, icon: '🌿', collection: 'Wild Explorer', gender: 'unisex' },
  { id: 'deep-sea-diver', name: 'Deep Sea Diver', description: 'Explore the ocean depths', rarity: 'epic', category: 'adventure', price: 75, icon: '🤿', collection: 'Ocean Quest', gender: 'unisex' },

  // ── FUNNY ──
  { id: 'dino-costume', name: 'Dino Costume', description: 'RAWR means I love learning!', rarity: 'rare', category: 'funny', price: 35, icon: '🦕', gender: 'unisex' },
  { id: 'robot-suit', name: 'Robot Explorer', description: 'Beep boop! Learning mode!', rarity: 'rare', category: 'funny', price: 40, icon: '🤖', gender: 'unisex' },
  { id: 'banana-suit', name: 'Banana Suit', description: 'Going bananas for quizzes!', rarity: 'common', category: 'funny', price: 20, icon: '🍌', gender: 'unisex' },
  { id: 'pizza-hat', name: 'Pizza Party Hat', description: 'Every quiz is a party!', rarity: 'common', category: 'funny', price: 15, icon: '🍕', gender: 'unisex' },
  { id: 'penguin-suit', name: 'Penguin Tuxedo', description: 'Waddle waddle study!', rarity: 'rare', category: 'funny', price: 30, icon: '🐧', gender: 'unisex' },
  { id: 'ufo-alien', name: 'UFO Alien Suit', description: 'Take me to your teacher!', rarity: 'epic', category: 'funny', price: 65, icon: '👽', gender: 'unisex' },
  { id: 'cat-onesie', name: 'Cat Onesie', description: 'Purrfect for studying!', rarity: 'rare', category: 'funny', price: 35, icon: '🐱', gender: 'unisex' },
  { id: 'panda-hoodie', name: 'Panda Hoodie', description: 'Cuddly and smart!', rarity: 'rare', category: 'funny', price: 30, icon: '🐼', gender: 'unisex' },

  // ── OUTFITS ──
  { id: 'casual-cool', name: 'Casual Cool', description: 'Effortlessly stylish', rarity: 'common', category: 'outfit', price: 10, icon: '😎', gender: 'unisex' },
  { id: 'royal-prince', name: 'Royal Prince', description: 'Born to rule!', rarity: 'epic', category: 'outfit', price: 80, icon: '🤴', gender: 'male' },
  { id: 'royal-princess', name: 'Royal Princess', description: 'Grace and power!', rarity: 'epic', category: 'outfit', price: 80, icon: '👸', gender: 'female' },
  { id: 'rock-star', name: 'Rock Star Outfit', description: 'Ready to rock!', rarity: 'rare', category: 'outfit', price: 45, icon: '🎸', gender: 'unisex' },
  { id: 'hip-hop', name: 'Hip Hop Style', description: 'Drop the beat!', rarity: 'rare', category: 'outfit', price: 40, icon: '🎤', gender: 'unisex' },
  { id: 'beach-vibes', name: 'Beach Vibes', description: 'Summer forever!', rarity: 'common', category: 'outfit', price: 20, icon: '🏖️', gender: 'unisex' },
  { id: 'winter-cozy', name: 'Winter Cozy', description: 'Warm and snug!', rarity: 'common', category: 'outfit', price: 15, icon: '🧥', gender: 'unisex' },

  // ── ACCESSORIES ──
  { id: 'reading-glasses', name: 'Reading Glasses', description: 'Smart look!', rarity: 'common', category: 'accessory', price: 10, icon: '🤓', gender: 'unisex' },
  { id: 'cool-shades', name: 'Cool Shades', description: 'Too cool for school', rarity: 'common', category: 'accessory', price: 15, icon: '😎', gender: 'unisex' },
  { id: 'magic-wand', name: 'Magic Wand', description: 'Expelliarmus!', rarity: 'rare', category: 'accessory', price: 35, icon: '🪄', gender: 'unisex' },
  { id: 'accessory-dragon', name: 'Pet Dragon', description: 'Your loyal companion', rarity: 'legendary', category: 'accessory', price: 100, icon: '🐉', gender: 'unisex' },
  { id: 'golden-trophy', name: 'Golden Trophy', description: 'Champion of champions', rarity: 'epic', category: 'accessory', price: 75, icon: '🏆', gender: 'unisex' },
  { id: 'angel-wings', name: 'Angel Wings', description: 'Heavenly student!', rarity: 'legendary', category: 'accessory', price: 120, icon: '👼', gender: 'unisex' },
  { id: 'katana-blade', name: 'Katana Blade', description: 'Way of the sword', rarity: 'epic', category: 'accessory', price: 70, icon: '⚔️', gender: 'unisex' },
  { id: 'shield-guard', name: 'Guardian Shield', description: 'Defend your grades!', rarity: 'rare', category: 'accessory', price: 45, icon: '🛡️', gender: 'unisex' },
  { id: 'treasure-map', name: 'Treasure Map', description: 'X marks the spot', rarity: 'rare', category: 'accessory', price: 30, icon: '🗺️', gender: 'unisex' },
  { id: 'boombox', name: 'Boombox', description: 'Study with music!', rarity: 'rare', category: 'accessory', price: 40, icon: '📻', gender: 'unisex' },

  // ── HAIRSTYLES ──
  { id: 'classic-hair', name: 'Classic', description: 'Clean and simple', rarity: 'common', category: 'hairstyle', price: 0, icon: '💇', gender: 'unisex' },
  { id: 'spiky-hair', name: 'Spiky Power', description: 'Powered up!', rarity: 'rare', category: 'hairstyle', price: 20, icon: '⚡', gender: 'male' },
  { id: 'rainbow-hair', name: 'Rainbow Burst', description: 'All colors shine!', rarity: 'epic', category: 'hairstyle', price: 50, icon: '🌈', gender: 'unisex' },
  { id: 'crown-braid', name: 'Crown Braid', description: 'Royalty vibes', rarity: 'rare', category: 'hairstyle', price: 30, icon: '👸', gender: 'female' },
  { id: 'flame-hair', name: 'Flame Hair', description: 'On fire with knowledge!', rarity: 'legendary', category: 'hairstyle', price: 90, icon: '🔥', gender: 'unisex' },
  { id: 'galaxy-hair', name: 'Galaxy Waves', description: 'Stars in your hair!', rarity: 'epic', category: 'hairstyle', price: 60, icon: '🌌', gender: 'unisex' },
  { id: 'ninja-hair', name: 'Ninja Spikes', description: 'Hidden leaf style!', rarity: 'rare', category: 'hairstyle', price: 35, icon: '🍃', gender: 'unisex' },
  { id: 'afro-power', name: 'Afro Power', description: 'Big hair, big brain!', rarity: 'rare', category: 'hairstyle', price: 25, icon: '✊', gender: 'unisex' },

  // ── AURAS / EFFECTS ──
  { id: 'sparkle-aura', name: 'Sparkle Aura', description: 'Shine bright!', rarity: 'rare', category: 'aura', price: 40, icon: '✨', gender: 'unisex' },
  { id: 'flame-aura', name: 'Flame Aura', description: 'Burning passion!', rarity: 'epic', category: 'aura', price: 70, icon: '🔥', gender: 'unisex' },
  { id: 'lightning-aura', name: 'Lightning Aura', description: 'Electric energy!', rarity: 'epic', category: 'aura', price: 75, icon: '⚡', gender: 'unisex' },
  { id: 'galaxy-aura', name: 'Galaxy Aura', description: 'Cosmic power!', rarity: 'legendary', category: 'aura', price: 120, icon: '🌌', gender: 'unisex' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', description: 'Petals of peace', rarity: 'epic', category: 'aura', price: 65, icon: '🌸', gender: 'unisex' },
  { id: 'shadow-mist', name: 'Shadow Mist', description: 'Mysterious presence', rarity: 'legendary', category: 'aura', price: 100, icon: '🌑', gender: 'unisex' },
  { id: 'rainbow-glow', name: 'Rainbow Glow', description: 'All colors unite!', rarity: 'mythic', category: 'aura', price: 180, icon: '🌈', gender: 'unisex' },
  { id: 'diamond-shine', name: 'Diamond Shine', description: 'Unbreakable brilliance', rarity: 'mythic', category: 'aura', price: 200, icon: '💎', gender: 'unisex' },

  // ── PETS (COMPANIONS) ──
  { id: 'pet-dog', name: 'Loyal Puppy', description: 'A student\'s best friend!', rarity: 'common', category: 'pet', price: 50, icon: '🐶', gender: 'unisex' },
  { id: 'pet-cat', name: 'Study Cat', description: 'Purr-fect study buddy!', rarity: 'common', category: 'pet', price: 50, icon: '🐱', gender: 'unisex' },
  { id: 'pet-owl', name: 'Scholar Owl', description: 'Wise and knowledgeable', rarity: 'rare', category: 'pet', price: 80, icon: '🦉', gender: 'unisex' },
  { id: 'pet-dragon', name: 'Baby Dragon', description: 'Breathes tiny fire!', rarity: 'epic', category: 'pet', price: 150, icon: '🐲', gender: 'unisex' },
  { id: 'pet-ghost', name: 'Friendly Ghost', description: 'Spooky but sweet', rarity: 'epic', category: 'pet', price: 120, icon: '👻', gender: 'unisex' },
  { id: 'pet-robot', name: 'Bot-Buddy', description: 'Computes your success', rarity: 'legendary', category: 'pet', price: 180, icon: '🤖', gender: 'unisex' },
  { id: 'pet-phoenix', name: 'Mythic Phoenix', description: 'Reborn in glory!', rarity: 'mythic', category: 'pet', price: 300, icon: '🦅', gender: 'unisex' },
  { id: 'pet-alien', name: 'Cosmic Alien', description: 'From another galaxy', rarity: 'mythic', category: 'pet', price: 280, icon: '👽', gender: 'unisex' },

  // ── BACKGROUNDS (LOBBY THEMES) ──
  { id: 'bg-school', name: 'EduSpark Campus', description: 'The classic school grounds', rarity: 'common', category: 'background', price: 0, icon: '🏫', gender: 'unisex' },
  { id: 'bg-library', name: 'Grand Library', description: 'Smells like old books', rarity: 'rare', category: 'background', price: 60, icon: '📚', gender: 'unisex' },
  { id: 'bg-space', name: 'Deep Space', description: 'Floating in the cosmos', rarity: 'epic', category: 'background', price: 150, icon: '🌌', gender: 'unisex' },
  { id: 'bg-jungle', name: 'Mystic Jungle', description: 'Wild and untamed', rarity: 'epic', category: 'background', price: 120, icon: '🌴', gender: 'unisex' },
  { id: 'bg-cyberpunk', name: 'Neon City', description: 'Future cyberpunk vibes', rarity: 'legendary', category: 'background', price: 200, icon: '🏙️', gender: 'unisex' },
  { id: 'bg-castle', name: 'Fantasy Castle', description: 'Rule your kingdom', rarity: 'mythic', category: 'background', price: 250, icon: '🏰', gender: 'unisex' },

  // ── EMOTES ──
  { id: 'emote-wave', name: 'Friendly Wave', description: 'Say hello!', rarity: 'common', category: 'emote', price: 10, icon: '👋', gender: 'unisex' },
  { id: 'emote-dance', name: 'Victory Dance', description: 'Celebrate your win!', rarity: 'rare', category: 'emote', price: 40, icon: '💃', gender: 'unisex' },
  { id: 'emote-flex', name: 'Muscle Flex', description: 'Show your strength', rarity: 'epic', category: 'emote', price: 80, icon: '💪', gender: 'unisex' },
  { id: 'emote-magic', name: 'Magic Spell', description: 'Cast an illusion', rarity: 'legendary', category: 'emote', price: 120, icon: '✨', gender: 'unisex' },
  { id: 'emote-ninja', name: 'Ninja Vanish', description: 'Disappear in smoke!', rarity: 'mythic', category: 'emote', price: 180, icon: '💨', gender: 'unisex' },

  // ── LIMITED EDITION ──
  { id: 'lunar-festival', name: 'Lunar Festival Outfit', description: 'Celebrate under the moon!', rarity: 'limited', category: 'outfit', equipSlot: 'outfit', price: 150, icon: '🏮', gender: 'unisex', isLimited: true },
  { id: 'summer-champion', name: 'Summer Champion', description: 'Sun-kissed victory!', rarity: 'limited', category: 'outfit', equipSlot: 'outfit', price: 160, icon: '☀️', gender: 'unisex', isLimited: true },
  { id: 'golden-hero', name: 'Golden Hero Armor', description: 'The ultimate champion!', rarity: 'limited', category: 'superhero', equipSlot: 'outfit', price: 250, icon: '👑', gender: 'unisex', isLimited: true },
  { id: 'cosmic-galaxy', name: 'Cosmic Galaxy Set', description: 'Born from the stars!', rarity: 'limited', category: 'aura', equipSlot: 'aura', price: 300, icon: '🪐', gender: 'unisex', isLimited: true },
  { id: 'phoenix-rebirth', name: 'Phoenix Rebirth', description: 'Rise from the ashes!', rarity: 'limited', category: 'aura', equipSlot: 'aura', price: 280, icon: '🔥', gender: 'unisex', isLimited: true },

  // ── NEW PROPS ──
  { id: 'prop-shuriken', name: 'Hidden Leaf Shuriken', description: 'Safe rubber training star', rarity: 'epic', category: 'anime', equipSlot: 'prop', price: 60, icon: '⭐', collection: 'Ninja Academy', gender: 'unisex' },
  { id: 'prop-cutlass', name: 'Grand Voyage Cutlass', description: 'Wooden training sword', rarity: 'legendary', category: 'anime', equipSlot: 'prop', price: 100, icon: '🗡️', collection: 'Grand Voyage', gender: 'unisex' },
  { id: 'prop-wand', name: 'Elder Magic Wand', description: 'Cast your learning spells', rarity: 'epic', category: 'fantasy', equipSlot: 'prop', price: 80, icon: '🪄', collection: 'Magic Academy', gender: 'unisex' },
  { id: 'prop-saber', name: 'Cyber Saber', description: 'Laser glowing toy sword', rarity: 'mythic', category: 'adventure', equipSlot: 'prop', price: 150, icon: '⚔️', collection: 'Neon City', gender: 'unisex' },
  { id: 'prop-flute', name: 'Peacock Flute', description: 'Traditional musical instrument', rarity: 'epic', category: 'accessory', equipSlot: 'prop', price: 75, icon: '🪈', collection: 'Cultural Heritage', gender: 'unisex' },
  
  // ── NEW JACKETS & HOODIES ──
  { id: 'jacket-ninja', name: 'Jonin Vest', description: 'Green tactical vest', rarity: 'epic', category: 'anime', equipSlot: 'jacket', price: 90, icon: '🦺', collection: 'Ninja Academy', gender: 'unisex' },
  { id: 'jacket-cyber', name: 'Neon Hacker Coat', description: 'Glowing collar jacket', rarity: 'legendary', category: 'adventure', equipSlot: 'jacket', price: 120, icon: '🧥', collection: 'Neon City', gender: 'unisex' },
  { id: 'jacket-pirate', name: 'Captain Overcoat', description: 'Rule the seven seas', rarity: 'mythic', category: 'anime', equipSlot: 'jacket', price: 180, icon: '🧥', collection: 'Grand Voyage', gender: 'unisex' },
  
  // ── NEW HATS & HEADGEAR ──
  { id: 'hat-straw', name: 'Straw Hat', description: 'The dream begins here', rarity: 'legendary', category: 'anime', equipSlot: 'hat', price: 110, icon: '👒', collection: 'Grand Voyage', gender: 'unisex' },
  { id: 'hat-ninja', name: 'Leaf Headband', description: 'Symbol of your village', rarity: 'epic', category: 'anime', equipSlot: 'hat', price: 70, icon: '🤕', collection: 'Ninja Academy', gender: 'unisex' },
  { id: 'hat-wizard', name: 'Sorting Hat', description: 'It knows your house', rarity: 'epic', category: 'fantasy', equipSlot: 'hat', price: 80, icon: '🧙‍♂️', collection: 'Magic Academy', gender: 'unisex' },
  { id: 'hat-crown', name: 'Tamil King Crown', description: 'Royal golden heritage', rarity: 'mythic', category: 'accessory', equipSlot: 'hat', price: 200, icon: '👑', collection: 'Cultural Heritage', gender: 'unisex' },

  // ── NEW GLASSES & MASKS ──
  { id: 'mask-ninja', name: 'Shadow Mask', description: 'Hide your identity', rarity: 'rare', category: 'anime', equipSlot: 'glasses', price: 40, icon: '🥷', collection: 'Ninja Academy', gender: 'unisex' },
  { id: 'glasses-cyber', name: 'Tech Visor', description: 'Scan power levels', rarity: 'epic', category: 'adventure', equipSlot: 'glasses', price: 85, icon: '🥽', collection: 'Neon City', gender: 'unisex' },
  
  // ── NEW CULTURAL OUTFITS ──
  { id: 'outfit-veshti', name: 'Royal Veshti', description: 'Traditional Tamil attire', rarity: 'legendary', category: 'outfit', equipSlot: 'outfit', price: 140, icon: '👔', collection: 'Cultural Heritage', gender: 'male' },
  { id: 'outfit-saree', name: 'Royal Saree', description: 'Elegant traditional wear', rarity: 'legendary', category: 'outfit', equipSlot: 'outfit', price: 140, icon: '👗', collection: 'Cultural Heritage', gender: 'female' },
  
  // ── NEW BEARDS ──
  { id: 'beard-stubble', name: 'Cool Stubble', description: 'A little scruffy', rarity: 'common', category: 'beard', equipSlot: 'beard', price: 20, icon: '🧔', gender: 'unisex' },
  { id: 'beard-wizard', name: 'Grand Wizard Beard', description: 'Long and wise', rarity: 'epic', category: 'beard', equipSlot: 'beard', price: 80, icon: '🧔‍♂️', gender: 'male' },
  { id: 'beard-pirate', name: 'Captain Beard', description: 'Braided pirate beard', rarity: 'epic', category: 'beard', equipSlot: 'beard', price: 90, icon: '🧔', gender: 'male' },
];

const COSMETIC_TRANSLATIONS: Record<string, { name_ta: string; description_ta: string }> = {
  'school-uniform': { name_ta: 'பள்ளி சீருடை', description_ta: 'கிளாசிக் பள்ளித் தோற்றம்' },
  'sports-jersey': { name_ta: 'விளையாட்டு சீருடை', description_ta: 'விளையாட்டு வீரர் தோற்றம்' },
  'lab-coat': { name_ta: 'அறிவியல் ஆய்வு கோட்', description_ta: 'சோதனைகளுக்குத் தயார்' },
  'art-smock': { name_ta: 'ஓவியர் சட்டை', description_ta: 'கலைஞரின் படைப்புத் திறன்' },
  'head-prefect': { name_ta: 'தலைமைப் பள்ளி லீடர் பேட்ஜ்', description_ta: 'பள்ளியின் தலைவர்' },
  'graduation-gown': { name_ta: 'பட்டமளிப்பு அங்கி', description_ta: 'வகுப்பின் முதன்மையானவர்!' },
  'orange-ninja': { name_ta: 'ஆரஞ்சு நிஞ்ஜா செட்', description_ta: 'உன்னை நீயே நம்பு! நிஞ்ஜா அகாடமி பாணி.' },
  'ninja-headband': { name_ta: 'நிஞ்ஜா நெற்றிப் பட்டி', description_ta: 'நிஞ்ஜா கிராமத்தின் அடையாளம்' },
  'pirate-captain': { name_ta: 'கடற்கொள்ளையர் அரசன்', description_ta: 'ஏழு கடல்களின் அரசன்!' },
  'straw-hat': { name_ta: 'வைக்கோல் சாகசத் தொப்பி', description_ta: 'பயணத்தின் தொடக்கம்' },
  'caped-hero': { name_ta: 'ஹீரோ ஆடை', description_ta: 'ஒரே ஒரு குத்து போதும்' },
  'dragon-warrior': { name_ta: 'டிராகன் வாரியர் கவசம்', description_ta: 'ஆற்றல் நிலை 9000-க்கும் மேல்!' },
  'shadow-slayer': { name_ta: 'நிழல் கொல்பவர் அங்கி', description_ta: 'இருளை வெல்லுங்கள்' },
  'titan-scout': { name_ta: 'டைட்டன் ஸ்கவுட் சீருடை', description_ta: 'நாங்கள் தயார்!' },
  'spirit-samurai': { name_ta: 'சாமுராய் வாள்வீரன் செட்', description_ta: 'வீரம் மற்றும் ஆன்ம வாள்' },
  'moon-sailor': { name_ta: 'சந்திர காவலாளி ஆடை', description_ta: 'நிலவின் பெயரால்!' },
  'crystal-mage': { name_ta: 'படிக மந்திரவாதி அங்கி', description_ta: 'இயற்கை சக்திகளின் மாஸ்டர்' },
  'spider-hero': { name_ta: 'ஸ்பைடர் ஹீரோ சூட்', description_ta: 'அதிகாரத்துடன் அதிக பொறுப்பும் வரும்!' },
  'dark-bat': { name_ta: 'டார்க் பேட் கவசம்', description_ta: 'நான் தான் இருள்!' },
  'thunder-god': { name_ta: 'இடி கடவுள் அங்கி', description_ta: 'மின்னலுக்கு தகுதியானவர்!' },
  'iron-tech': { name_ta: 'அயன் டெக் கவசம்', description_ta: 'கவச உடை அணிந்த புத்திசாலி விஞ்ஞானி' },
  'shield-captain': { name_ta: 'கேப்டன் சீருடை', description_ta: 'நீதிக்காக நில்லுங்கள்!' },
  'wonder-warrior': { name_ta: 'வொண்டர் வாரியர் கவசம்', description_ta: 'அமேசான் வலிமை!' },
  'speed-flash': { name_ta: 'ஸ்பீட் ஃப்ளாஷ் சூட்', description_ta: 'மின்னலை விட வேகமாக!' },
  'green-archer': { name_ta: 'பச்சை வில்லாளன் முகமூடி', description_ta: 'இலக்கை ஒருபோதும் தவறவிடாதீர்கள்' },
  'wizard-school': { name_ta: 'மந்திரவாதி பள்ளி ஆடை', description_ta: 'மந்திர அகாமியின் வகுப்புகள்!' },
  'wizard-hat': { name_ta: 'மந்திரவாதி தொப்பி', description_ta: 'நீங்கள் எந்த வீடு?' },
  'elf-ranger': { name_ta: 'எல்ஃப் ரேஞ்சர் அங்கி', description_ta: 'காட்டோடு ஒன்றிணைந்தவர்' },
  'dragon-rider': { name_ta: 'டிராகன் ரைடர் கவசம்', description_ta: 'வானத்தில் பறந்திடுங்கள்!' },
  'fairy-wings': { name_ta: 'பளபளக்கும் தேவதை இறக்கைகள்', description_ta: 'மாயாஜாலப் பறப்பு!' },
  'knight-armor': { name_ta: 'அரச நைட் கவசம்', description_ta: 'நாட்டைப் பாதுகாத்திடுங்கள்!' },
  'ice-queen': { name_ta: 'பனி ராணி கவுன்', description_ta: 'பனி பொழியட்டும்!' },
  'dark-mage': { name_ta: 'டார்க் மேஜ் அங்கி', description_ta: 'நிழல்களின் மாஸ்டர்' },
  'explorer-hat': { name_ta: 'தொல்பொருள் ஆராய்ச்சியாளர்', description_ta: 'பண்டைய புதையல்கள் காத்திருக்கின்றன!' },
  'secret-agent': { name_ta: 'ரகசிய ஏஜென்ட் சூட்', description_ta: 'ரகசிய உளவுத் துறை' },
  'kung-fu': { name_ta: 'குங் ஃபூ மாஸ்டர் ஆடை', description_ta: 'உள் அமைதி, வெளி வலிமை' },
  'masked-heist': { name_ta: 'முகமூடி கொள்ளையர் சூட்', description_ta: 'சரியான திட்டம்!' },
  'space-explorer': { name_ta: 'விண்வெளி ஆராய்ச்சியாளர் சூட்', description_ta: 'முடிவில்லா விண்வெளிக்கு!' },
  'jungle-safari': { name_ta: 'காட்டு சவாரி ஆடை', description_ta: 'காட்டு சாகசம் காத்திருக்கிறது' },
  'deep-sea-diver': { name_ta: 'ஆழ்கடல் டைவர்', description_ta: 'கடல் ஆழத்தை ஆராயுங்கள்' },
  'dino-costume': { name_ta: 'டைனோசர் ஆடை', description_ta: 'கற்றலை நேசிப்பவர்!' },
  'robot-suit': { name_ta: 'ரோபோ ஆராய்ச்சியாளர்', description_ta: 'பீப் பூப்! கற்றல் முறை!' },
  'banana-suit': { name_ta: 'வாழைப்பழ ஆடை', description_ta: 'விளையாட்டிற்கு தயார்!' },
  'pizza-hat': { name_ta: 'பிஸ்ஸா தொப்பி', description_ta: 'ஒவ்வொரு வினாடி வினாவும் ஒரு கொண்டாட்டம்!' },
  'penguin-suit': { name_ta: 'பெங்குவின் சூட்', description_ta: 'மெதுவாக நடந்து படிக்கலாம்!' },
  'ufo-alien': { name_ta: 'ஏலியன் சூட்', description_ta: 'அறிவியல் உலகம்!' },
  'cat-onesie': { name_ta: 'பூனை உடையலங்காரம்', description_ta: 'படிக்க ஏற்றது!' },
  'panda-hoodie': { name_ta: 'பாண்டா ஹூடி', description_ta: 'அழகான மற்றும் புத்திசாலி!' },
  'casual-cool': { name_ta: 'கேஷுவல் கூல்', description_ta: 'எளிமையான ஸ்டைல்' },
  'royal-prince': { name_ta: 'இளவரசன்', description_ta: 'ஆளப் பிறந்தவர்!' },
  'royal-princess': { name_ta: 'இளவரசி', description_ta: 'அழகும் அதிகாரமும்!' },
  'rock-star': { name_ta: 'ராக் ஸ்டார் ஆடை', description_ta: 'பாட்டுப் பாடத் தயார்!' },
  'hip-hop': { name_ta: 'ஹிப் ஹாப் ஸ்டைல்', description_ta: 'இசையோடு விளையாடு!' },
  'beach-vibes': { name_ta: 'கடற்கரைத் தோற்றம்', description_ta: 'கோடைகாலம் என்றும்!' },
  'winter-cozy': { name_ta: 'குளிர்கால ஆடை', description_ta: 'வெதுவெதுப்பான ஆடை!' },
  'reading-glasses': { name_ta: 'படிக்கும் கண்ணாடி', description_ta: 'புத்திசாலித் தோற்றம்!' },
  'cool-shades': { name_ta: 'கூல் ஷேட்ஸ்', description_ta: 'மிகவும் ஸ்டைலானவர்' },
  'magic-wand': { name_ta: 'மாயாஜாலக் கோல்', description_ta: 'மந்திரம் செய்யத் தயார்!' },
  'accessory-dragon': { name_ta: 'செல்லப் பிராணி டிராகன்', description_ta: 'உங்களின் விசுவாசமான துணையாக' },
  'golden-trophy': { name_ta: 'தங்கக் கோப்பை', description_ta: 'வெற்றியாளர்களின் வெற்றியாளர்' },
  'angel-wings': { name_ta: 'தேவதை இறக்கைகள்', description_ta: 'சிறந்த மாணவர்!' },
  'katana-blade': { name_ta: 'கதானா வாள்', description_ta: 'வாளின் பாதை' },
  'shield-guard': { name_ta: 'பாதுகாப்புக் கேடயம்', description_ta: 'மதிப்பெண்களைக் காத்திடுங்கள்!' },
  'treasure-map': { name_ta: 'புதையல் வரைபடம்', description_ta: 'இலக்கைக் குறிக்கிறது' },
  'boombox': { name_ta: 'பூம்பாக்ஸ்', description_ta: 'இசையோடு படியுங்கள்!' },
  'classic-hair': { name_ta: 'கிளாசிக் முடி', description_ta: 'எளிமையானது' },
  'spiky-hair': { name_ta: 'கூர்மையான முடி', description_ta: 'சக்தி வாய்ந்தது!' },
  'rainbow-hair': { name_ta: 'வானவில் முடி', description_ta: 'அனைத்து வண்ணங்களும் ஜொலிக்கின்றன!' },
  'crown-braid': { name_ta: 'கிரீட சடை', description_ta: 'அரச தோற்றம்' },
  'flame-hair': { name_ta: 'நெருப்பு முடி', description_ta: 'அறிவின் சுடர்!' },
  'galaxy-hair': { name_ta: 'விண்மீன் முடி', description_ta: 'தலையில் நட்சத்திரங்கள்!' },
  'ninja-hair': { name_ta: 'நிஞ்ஜா கூர்முடி', description_ta: 'நிஞ்ஜா பாணி!' },
  'afro-power': { name_ta: 'அஃப்ரோ முடி', description_ta: 'பெரிய முடி, பெரிய மூளை!' },
  'prop-cutlass': { name_ta: 'சாகச வாள்', description_ta: 'மரப் பயிற்சி வாள்' },
  'prop-wand': { name_ta: 'பண்டைய மந்திரக்கோல்', description_ta: 'கற்றல் மந்திரங்களைச் செலுத்துங்கள்' },
  'prop-saber': { name_ta: 'சைபர் சேபர்', description_ta: 'ஒளிரும் லேசர் வாள் பொம்மை' },
  'prop-flute': { name_ta: 'மயில் புல்லாங்குழல்', description_ta: 'பாரம்பரிய இசைக்கருவி' },
  'jacket-ninja': { name_ta: 'ஜோனின் வெஸ்ட்', description_ta: 'பச்சை நிற உத்தி ஜாக்கெட்' },
  'jacket-cyber': { name_ta: 'நியான் ஹேக்கர் கோட்', description_ta: 'ஒளிரும் ஜாக்கெட்' },
  'jacket-pirate': { name_ta: 'கேப்டன் ஓவர்கோட்', description_ta: 'ஏழு கடல்களையும் ஆளுங்கள்' },
  'hat-straw': { name_ta: 'வைக்கோல் தொப்பி', description_ta: 'கனவு இங்கே தொடங்குகிறது' },
  'hat-ninja': { name_ta: 'இலை நெற்றிப்பட்டி', description_ta: 'கிராமத்தின் அடையாளம்' },
  'hat-wizard': { name_ta: 'வகைப்படுத்தும் தொப்பி', description_ta: 'உங்கள் வீட்டை அது அறியும்' },
  'hat-crown': { name_ta: 'தமிழ் மன்னர் கிரீடம்', description_ta: 'அரச பொன்னிற பாரம்பரியம்' },
  'mask-ninja': { name_ta: 'நிழல் முகமூடி', description_ta: 'அடையாளத்தை மறைக்கவும்' },
  'glasses-cyber': { name_ta: 'டெக் வைசர்', description_ta: 'ஆற்றல் நிலைகளை ஸ்கேன் செய்க' },
  'outfit-veshti': { name_ta: 'அரச வேஷ்டி', description_ta: 'பாரம்பரிய தமிழ் உடை' },
  'outfit-saree': { name_ta: 'அரச சேலை', description_ta: 'நேர்த்தியான பாரம்பரிய உடை' },
  'beard-stubble': { name_ta: 'ஸ்டபில் தாடி', description_ta: 'சற்றே கரடுமுரடான தாடி' },
  'beard-wizard': { name_ta: 'பெருமுனிவர் தாடி', description_ta: 'நீண்ட மற்றும் புத்திசாலித்தனமான தாடி' },
  'beard-pirate': { name_ta: 'கேப்டன் தாடி', description_ta: 'பின்னப்பட்ட கடற்கொள்ளையர் தாடி' },
};

export const getCosmeticName = (item: Cosmetic, isTamil: boolean): string => {
  if (isTamil && COSMETIC_TRANSLATIONS[item.id]) {
    return COSMETIC_TRANSLATIONS[item.id].name_ta;
  }
  return item.name;
};

export const getCosmeticDescription = (item: Cosmetic, isTamil: boolean): string => {
  if (isTamil && COSMETIC_TRANSLATIONS[item.id]) {
    return COSMETIC_TRANSLATIONS[item.id].description_ta;
  }
  return item.description;
};
