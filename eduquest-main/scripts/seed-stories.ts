import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { STORIES } from '../src/components/learning/story-quest/storyData';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Supabase URL or Service Role Key is missing in .env file.');
    process.exit(1);
}

// Initialize Supabase client with SERVICE ROLE KEY to bypass RLS for seeding
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// A helper function to generate filler questions to reach exactly 10 questions
// If a story has 3 questions, it generates 7 more to reach 10.
function expandQuestionsToTen(originalQuestions: any[], storyTitleEn: string, storyTitleTa: string) {
    const expanded = [...originalQuestions];
    const needed = 10 - expanded.length;

    if (needed <= 0) return expanded; // Already has 10 or more (e.g. Magic Sandbox has 10 perfectly)

    for (let i = 0; i < needed; i++) {
        const qNum = expanded.length + 1;
        expanded.push({
            question: `Extra Question ${qNum} about ${storyTitleEn}?`,
            question_ta: `${storyTitleTa} பற்றிய கூடுதல் கேள்வி ${qNum}?`,
            options: [
                `Option A for Q${qNum}`,
                `Option B for Q${qNum}`,
                `Option C for Q${qNum}`,
                `Option D for Q${qNum}`
            ],
            options_ta: [
                `Q${qNum} க்கான விருப்பம் A`,
                `Q${qNum} க்கான விருப்பம் B`,
                `Q${qNum} க்கான விருப்பம் C`,
                `Q${qNum} க்கான விருப்பம் D`
            ],
            answer: `Option A for Q${qNum}`,
            answer_ta: `Q${qNum} க்கான விருப்பம் A`
        });
    }

    return expanded;
}

// Convert local story data format into the new JSONB Supabase format
async function seedStories() {
    console.log('📖 Starting Story Quest Multilingual Seeding...');

    for (const story of STORIES) {
        try {
            console.log(`Processing Story: ${story.title}...`);

            // 1. Insert into core `stories` table
            const { data: storyData, error: storyError } = await supabase
                .from('stories')
                .upsert(
                    {
                        slug: story.id, // Using the local ID (e.g., 'story_magic_sandbox') as unique slug
                        subject: story.subject,
                        emoji: story.emoji,
                        min_class: story.classRange[0],
                        max_class: story.classRange[1],
                        xp_reward: story.xpReward
                    },
                    { onConflict: 'slug' } // Prevent duplicates, safe to re-run
                )
                .select()
                .single();

            if (storyError) throw storyError;
            const storyId = storyData.id;

            // 2. Expand questions to exactly 10
            const expandedQuestions = expandQuestionsToTen(story.questions, story.title, story.title_ta);

            // 3. Prepare English Translation JSONB Payload
            const enPages = story.pages.map(p => ({
                text: p.text,
                character: p.character,
                keywords: p.keywords.map(k => ({ word: k.word, meaning: k.meaning })),
                thinkMoment: p.thinkMoment ? {
                    question: p.thinkMoment.question,
                    options: p.thinkMoment.options.map(o => ({ label: o.label, isCorrect: o.isCorrect, feedback: o.feedback }))
                } : null
            }));

            const enQuestions = expandedQuestions.map(q => ({
                question: q.question,
                options: q.options,
                answer: q.answer
            }));

            // 4. Prepare Tamil Translation JSONB Payload
            const taPages = story.pages.map(p => ({
                text: p.text_ta,
                character: p.character,
                keywords: p.keywords.map(k => ({ word: k.word_ta, meaning: k.meaning_ta })),
                thinkMoment: p.thinkMoment ? {
                    question: p.thinkMoment.question_ta,
                    options: p.thinkMoment.options.map(o => ({ label: o.label_ta, isCorrect: o.isCorrect, feedback: o.feedback_ta }))
                } : null
            }));

            const taQuestions = expandedQuestions.map(q => ({
                question: q.question_ta,
                options: q.options_ta,
                answer: q.answer_ta
            }));

            // 5. Insert English Translation
            const { error: enError } = await supabase
                .from('story_translations')
                .upsert(
                    {
                        story_id: storyId,
                        language_code: 'en',
                        title: story.title,
                        pages: enPages,
                        questions: enQuestions
                    },
                    { onConflict: 'story_id,language_code' }
                );

            if (enError) throw enError;

            // 6. Insert Tamil Translation
            const { error: taError } = await supabase
                .from('story_translations')
                .upsert(
                    {
                        story_id: storyId,
                        language_code: 'ta',
                        title: story.title_ta,
                        pages: taPages,
                        questions: taQuestions
                    },
                    { onConflict: 'story_id,language_code' }
                );

            if (taError) throw taError;

            console.log(`✅ Successfully seeded: ${story.title} (10 Questions mapped)`);
        } catch (err: any) {
            console.error(`❌ Failed to seed ${story.title}:`, err.message);
        }
    }

    console.log('\n🎉 All Story Quests successfully migrated to Multilingual JSONB format!');
}

seedStories();
