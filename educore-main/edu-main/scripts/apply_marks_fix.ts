import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
    console.log('🔧 Applying marks_entered_by foreign key fix...');

    const sqlPath = join(process.cwd(), 'sql', 'fix_marks_entered_by.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
        console.error('❌ Error applying fix:', error);
        process.exit(1);
    }

    console.log('✅ Fix applied successfully!');
    console.log('You can now try submitting marks again.');
}

applyFix();
