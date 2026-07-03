-- Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(50) NOT NULL,
    emoji VARCHAR(10),
    min_class INT NOT NULL,
    max_class INT NOT NULL,
    xp_reward INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Translations Table (for deeply nested multilingual content)
CREATE TABLE IF NOT EXISTS story_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL, -- 'en', 'ta'
    title TEXT NOT NULL,
    pages JSONB NOT NULL DEFAULT '[]',     -- Array of {text, character, keywords, thinkMoment}
    questions JSONB NOT NULL DEFAULT '[]', -- Array of 10 {question, options, answer}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, language_code) 
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_s_translations_lang ON story_translations(story_id, language_code);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_translations ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable read access for all users" ON stories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON story_translations FOR SELECT USING (true);
