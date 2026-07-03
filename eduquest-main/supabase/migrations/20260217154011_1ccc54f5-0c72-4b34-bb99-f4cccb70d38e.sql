
-- Avatar items shop
CREATE TABLE public.avatar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'outfit', -- outfit, hairstyle, accessory
  name text NOT NULL,
  icon text NOT NULL DEFAULT '👕',
  cost integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view avatar items"
  ON public.avatar_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage avatar items"
  ON public.avatar_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Student owned items
CREATE TABLE public.student_avatar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.student_avatar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar items"
  ON public.student_avatar_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar items"
  ON public.student_avatar_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar items"
  ON public.student_avatar_items FOR UPDATE USING (auth.uid() = user_id);

-- Student coins balance (derived from XP: 1 XP = 1 coin, minus spent)
-- We'll track spent coins
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL, -- negative for purchases
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions tracking
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Seed default avatar items
INSERT INTO public.avatar_items (category, name, icon, cost, sort_order) VALUES
  ('outfit', 'School Uniform', '👔', 0, 1),
  ('outfit', 'Superhero Cape', '🦸', 20, 2),
  ('outfit', 'Space Suit', '🧑‍🚀', 30, 3),
  ('outfit', 'Royal Robe', '👑', 50, 4),
  ('outfit', 'Ninja Outfit', '🥷', 40, 5),
  ('hairstyle', 'Classic', '💇', 0, 1),
  ('hairstyle', 'Spiky', '⚡', 15, 2),
  ('hairstyle', 'Rainbow', '🌈', 25, 3),
  ('hairstyle', 'Crown Braid', '👸', 35, 4),
  ('accessory', 'Reading Glasses', '🤓', 10, 1),
  ('accessory', 'Cool Shades', '😎', 20, 2),
  ('accessory', 'Magic Wand', '🪄', 30, 3),
  ('accessory', 'Pet Dragon', '🐉', 50, 4),
  ('accessory', 'Golden Trophy', '🏆', 45, 5);
