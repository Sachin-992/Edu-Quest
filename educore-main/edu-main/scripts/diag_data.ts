
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env loading
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SE_ROLE_KEY') supabaseKey = value.trim(); // TRYE SERVICE_ROLE KEY IF AVAILABLE for more access
            if (!supabaseKey && key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
}

// Prefer Service Role Key if I can find it in .env, otherwise Anon.
// Usually VITE_SUPABASE_SERVICE_ROLE_KEY might not be in .env client side, but let's check.
// If not, Anon key is fine but might have RLS limits.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    console.log('--- Checking Class 1 ---');
    // Specific ID found in last run
    const targetId = '7ace5445-5618-4eef-834c-128967de9103';

    const { data: cls, error: clsErr } = await supabase
        .from('classes')
        .select('*')
        .eq('id', targetId)
        .single();

    console.log('Class Record:', cls || clsErr);

    console.log('\n--- Checking Timetable Periods for this Class ---');
    const { data: periods, error: periodsErr } = await supabase
        .from('timetable_periods')
        .select('id, day_of_week, period_name, subject_id')
        .eq('class_id', targetId);

    console.log('Timetable Periods Count:', periods?.length);
    if (periodsErr) console.log('Timetable Fetch Error:', periodsErr);
    if (periods && periods.length > 0) console.log('Sample Period:', periods[0]);

    console.log('\n--- Checking Student Balan ---');
    const { data: students, error: studentError } = await supabase
        .from('students')
        .select('name, class, section, date_of_birth')
        .ilike('email', 'Balanperiyasamy21@gmail.com');

    console.log('Balan:', students || studentError);

    console.log('\n--- Checking All Students in Class 1 ---');
    const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class', '1');

    console.log('Total Students in Class 1:', studentCount);

    // Check distribution of sections in Class 1
    const { data: studentsSec, error: secErr } = await supabase
        .from('students')
        .select('section')
        .eq('class', '1');

    if (studentsSec) {
        const counts: Record<string, number> = {};
        studentsSec.forEach(s => {
            const sec = s.section || 'NULL';
            counts[sec] = (counts[sec] || 0) + 1;
        });
        console.log('Section Distribution in Class 1:', counts);
    }
}

checkState();
