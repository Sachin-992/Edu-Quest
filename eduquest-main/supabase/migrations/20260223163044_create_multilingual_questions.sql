-- Core Question Table (Language Agnostic)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(50) NOT NULL, -- e.g., 'science', 'math', 'gk'
    grade_level INT NOT NULL,     -- e.g., 1, 2, 8
    difficulty VARCHAR(20) DEFAULT 'medium',
    correct_option_key VARCHAR(10) NOT NULL, -- Logical key e.g., 'option_c'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Translations Table (Language Specific)
CREATE TABLE IF NOT EXISTS question_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL, -- 'en', 'ta', 'hi'
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT,                     -- Nullable for True/False questions
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, language_code) -- Crucial: One translation per language per question
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_q_translations_lang ON question_translations(question_id, language_code);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public read access for authenticated or anon users, depending on your setup)
-- Here we assume anyone can read questions, but only admins can write.
CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON question_translations FOR SELECT USING (true);
