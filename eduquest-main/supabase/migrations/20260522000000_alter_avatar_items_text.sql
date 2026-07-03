-- Migration: Alter student_avatar_items to support text (string) IDs from the frontend
-- This resolves the UUID casting and foreign key mismatch errors

-- 1. Drop the foreign key constraint that references avatar_items(id)
ALTER TABLE public.student_avatar_items DROP CONSTRAINT IF EXISTS student_avatar_items_item_id_fkey;

-- 2. Alter the column type of item_id in student_avatar_items to text
ALTER TABLE public.student_avatar_items ALTER COLUMN item_id TYPE text;

-- 3. Also alter avatar_items.id to text just in case, and update its primary key type
-- Note: We drop the constraint on avatar_items first if any exists, but none does except primary key.
-- To change a primary key column type, we drop the PK constraint, change column type, and recreate PK.
ALTER TABLE public.avatar_items DROP CONSTRAINT IF EXISTS avatar_items_pkey CASCADE;
ALTER TABLE public.avatar_items ALTER COLUMN id TYPE text;
ALTER TABLE public.avatar_items ADD CONSTRAINT avatar_items_pkey PRIMARY KEY (id);

-- 4. Re-add the foreign key constraint as text-based constraint
ALTER TABLE public.student_avatar_items 
  ADD CONSTRAINT student_avatar_items_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES public.avatar_items(id) ON DELETE CASCADE;

-- 5. Seed the avatar_items table with text IDs that match src/data/cosmetics.ts
-- This ensures that the foreign key constraint remains satisfied if it is checked, and makes
-- it easy to manage items in the future.
INSERT INTO public.avatar_items (id, category, name, icon, cost, sort_order)
VALUES
  ('school-uniform', 'school', 'School Uniform', '👔', 0, 1),
  ('sports-jersey', 'school', 'Sports Jersey', '🏃', 10, 2),
  ('lab-coat', 'school', 'Science Lab Coat', '🥼', 25, 3),
  ('art-smock', 'school', 'Artist Smock', '🎨', 15, 4),
  ('head-prefect', 'school', 'Head Prefect Badge', '🎖', 60, 5),
  ('graduation-gown', 'school', 'Graduation Gown', '🎓', 100, 6),
  ('orange-ninja', 'anime', 'Orange Ninja Set', '🍥', 120, 7),
  ('ninja-headband', 'anime', 'Ninja Headband', '🥷', 30, 8),
  ('pirate-captain', 'anime', 'Pirate King Captain', '🏴‍☠️', 200, 9),
  ('straw-hat', 'anime', 'Straw Adventure Hat', '👒', 80, 10),
  ('caped-hero', 'anime', 'Caped Hero Outfit', '🦲', 150, 11),
  ('dragon-warrior', 'anime', 'Dragon Warrior Armor', '🐉', 140, 12),
  ('shadow-slayer', 'anime', 'Shadow Slayer Cloak', '⚔️', 90, 13),
  ('titan-scout', 'anime', 'Titan Scout Uniform', '🛡️', 85, 14),
  ('spirit-samurai', 'anime', 'Spirit Samurai Set', '🗡️', 180, 15),
  ('moon-sailor', 'anime', 'Moon Guardian Outfit', '🌙', 130, 16),
  ('crystal-mage', 'anime', 'Crystal Mage Robe', '🔮', 75, 17),
  ('spider-hero', 'superhero', 'Spider Hero Suit', '🕷️', 130, 18),
  ('dark-bat', 'superhero', 'Dark Bat Armor', '🦇', 140, 19),
  ('thunder-god', 'superhero', 'Thunder God Cape', '⚡', 180, 20),
  ('iron-tech', 'superhero', 'Iron Tech Armor', '🤖', 160, 21),
  ('shield-captain', 'superhero', 'Shield Captain Suit', '🛡️', 95, 22),
  ('wonder-warrior', 'superhero', 'Wonder Warrior Armor', '👸', 130, 23),
  ('speed-flash', 'superhero', 'Speed Flash Suit', '💨', 85, 24),
  ('green-archer', 'superhero', 'Forest Archer Hood', '🏹', 50, 25),
  ('wizard-school', 'fantasy', 'Wizard School Outfit', '🧙', 120, 26),
  ('wizard-hat', 'fantasy', 'Sorting Wizard Hat', '🎩', 70, 27),
  ('elf-ranger', 'fantasy', 'Elf Ranger Cloak', '🧝', 80, 28),
  ('dragon-rider', 'fantasy', 'Dragon Rider Armor', '🐲', 200, 29),
  ('fairy-wings', 'fantasy', 'Sparkle Fairy Wings', '🧚', 110, 30),
  ('knight-armor', 'fantasy', 'Royal Knight Armor', '⚔️', 90, 31),
  ('ice-queen', 'fantasy', 'Ice Queen Gown', '❄️', 130, 32),
  ('dark-mage', 'fantasy', 'Dark Mage Robes', '🌑', 75, 33),
  ('explorer-hat', 'adventure', 'Explorer Archaeologist', '🤠', 70, 34),
  ('secret-agent', 'adventure', 'Secret Agent Tuxedo', '🕶️', 110, 35),
  ('kung-fu', 'adventure', 'Kung Fu Master Outfit', '🥋', 80, 36),
  ('masked-heist', 'adventure', 'Masked Heist Suit', '🎭', 120, 37),
  ('space-explorer', 'adventure', 'Space Explorer Suit', '🚀', 85, 38),
  ('jungle-safari', 'adventure', 'Jungle Safari Outfit', '🌿', 40, 39),
  ('deep-sea-diver', 'adventure', 'Deep Sea Diver', '🤿', 75, 40),
  ('dino-costume', 'funny', 'Dino Costume', '🦕', 35, 41),
  ('robot-suit', 'funny', 'Robot Explorer', '🤖', 40, 42),
  ('banana-suit', 'funny', 'Banana Suit', '🍌', 20, 43),
  ('pizza-hat', 'funny', 'Pizza Party Hat', '🍕', 15, 44),
  ('penguin-suit', 'funny', 'Penguin Tuxedo', '🐧', 30, 45),
  ('ufo-alien', 'funny', 'UFO Alien Suit', '👽', 65, 46),
  ('cat-onesie', 'funny', 'Cat Onesie', '🐱', 35, 47),
  ('panda-hoodie', 'funny', 'Panda Hoodie', '🐼', 30, 48),
  ('casual-cool', 'outfit', 'Casual Cool', '😎', 10, 49),
  ('royal-prince', 'outfit', 'Royal Prince', '🤴', 80, 50),
  ('royal-princess', 'outfit', 'Royal Princess', '👸', 80, 51),
  ('rock-star', 'outfit', 'Rock Star Outfit', '🎸', 45, 52),
  ('hip-hop', 'outfit', 'Hip Hop Style', '🎤', 40, 53),
  ('beach-vibes', 'outfit', 'Beach Vibes', '🏖️', 20, 54),
  ('winter-cozy', 'outfit', 'Winter Cozy', '🧥', 15, 55),
  ('reading-glasses', 'accessory', 'Reading Glasses', '🤓', 10, 56),
  ('cool-shades', 'accessory', 'Cool Shades', '😎', 15, 57),
  ('magic-wand', 'accessory', 'Magic Wand', '🪄', 35, 58),
  ('pet-dragon', 'accessory', 'Pet Dragon', '🐉', 100, 59),
  ('golden-trophy', 'accessory', 'Golden Trophy', '🏆', 75, 60),
  ('angel-wings', 'accessory', 'Angel Wings', '👼', 120, 61),
  ('katana-blade', 'accessory', 'Katana Blade', '⚔️', 70, 62),
  ('shield-guard', 'accessory', 'Guardian Shield', '🛡️', 45, 63),
  ('treasure-map', 'accessory', 'Treasure Map', '🗺️', 30, 64),
  ('boombox', 'accessory', 'Boombox', '📻', 40, 65),
  ('classic-hair', 'hairstyle', 'Classic', '💇', 0, 66),
  ('spiky-hair', 'hairstyle', 'Spiky Power', '⚡', 20, 67),
  ('rainbow-hair', 'hairstyle', 'Rainbow Burst', '🌈', 50, 68),
  ('crown-braid', 'hairstyle', 'Crown Braid', '👸', 30, 69),
  ('flame-hair', 'hairstyle', 'Flame Hair', '🔥', 90, 70),
  ('galaxy-hair', 'hairstyle', 'Galaxy Waves', '🌌', 60, 71),
  ('ninja-hair', 'hairstyle', 'Ninja Spikes', '🍃', 35, 72),
  ('afro-power', 'hairstyle', 'Afro Power', '✊', 25, 73)
ON CONFLICT (id) DO UPDATE 
SET category = EXCLUDED.category,
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    cost = EXCLUDED.cost,
    sort_order = EXCLUDED.sort_order;
