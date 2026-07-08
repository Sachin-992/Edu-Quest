import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { NMMS_STATIC_QUESTIONS } from '../src/components/nmms/questionsData';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase URL or Service Role Key is missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedNMMSQuestions() {
  console.log('🏆 Starting NMMS Questions Seeding...');

  for (const q of NMMS_STATIC_QUESTIONS) {
    try {
      console.log(`Processing Question: ${q.id} - ${q.question_text.slice(0, 30)}...`);

      const { error } = await supabase
        .from('nmms_questions')
        .upsert({
          id: q.id,
          paper_type: q.paper_type,
          subject: q.subject || null,
          chapter: q.chapter,
          topic: q.topic,
          question_text: q.question_text,
          question_text_ta: q.question_text_ta || null,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_a_ta: q.option_a_ta || null,
          option_b_ta: q.option_b_ta || null,
          option_c_ta: q.option_c_ta || null,
          option_d_ta: q.option_d_ta || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          explanation_ta: q.explanation_ta || null,
          hint: q.hint || null,
          hint_ta: q.hint_ta || null,
          difficulty: q.difficulty,
          question_type: q.question_type,
          class_level: 8
        });

      if (error) {
        console.error(`❌ Error inserting question ${q.id}:`, error.message);
      } else {
        console.log(`✅ Seeded question ${q.id} successfully.`);
      }
    } catch (e: any) {
      console.error(`❌ Exception seeding question ${q.id}:`, e.message || e);
    }
  }

  console.log('🎉 NMMS Questions Seeding Complete!');
}

seedNMMSQuestions();
