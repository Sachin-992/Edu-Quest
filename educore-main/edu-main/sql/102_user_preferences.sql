-- migration-safe script to create user_preferences table and setup RLS and triggers
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    language_preference TEXT NOT NULL DEFAULT 'en' CHECK (language_preference IN ('en', 'ta')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "user_pref_self_all" ON public.user_preferences;
DROP POLICY IF EXISTS "user_pref_admin_all" ON public.user_preferences;

-- Create policy for user self-management
CREATE POLICY "user_pref_self_all" ON public.user_preferences
    FOR ALL
    USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Create policy for admin management
CREATE POLICY "user_pref_admin_all" ON public.user_preferences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to create user preferences automatically for new users
CREATE OR REPLACE FUNCTION public.handle_create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id, language_preference)
    VALUES (NEW.id, 'en')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_user_preferences ON public.users;
CREATE TRIGGER trg_create_user_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_create_user_preferences();

-- Insert preferences for existing users
INSERT INTO public.user_preferences (user_id, language_preference)
SELECT id, 'en' FROM public.users
ON CONFLICT (user_id) DO NOTHING;
