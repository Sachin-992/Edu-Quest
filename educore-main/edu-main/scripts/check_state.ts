
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
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    console.log('--- Checking Classes ---');
    const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, grade_level, section');

    if (classError) {
        console.error('Error fetching classes:', classError);
        return;
    }

    const class1 = classes.find(c => c.grade_level === '1' && (c.section === '' || c.section === null));
    const class1A = classes.find(c => c.grade_level === '1' && c.section === 'A');

    console.log('Generic Class 1:', class1 || 'Not Found');
    console.log('Class 1-A:', class1A || 'Not Found');

    console.log('\n--- Checking Timetable Periods ---');
    if (class1) {
        const { count: count1 } = await supabase
            .from('timetable_periods')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', class1.id);
        console.log(`Timetable entries for Generic Class 1 (${class1.id}): ${count1}`);
    }

    if (class1A) {
        const { count: count1A } = await supabase
            .from('timetable_periods')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', class1A.id);
        console.log(`Timetable entries for Class 1-A (${class1A.id}): ${count1A}`);
    } else {
        console.log('Class 1-A not found in DB, so no timetable entries check for it.');
    }

    console.log('\n--- Checking Student Balan ---');
    const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, class, section, dob')
        .ilike('email', 'Balanperiyasamy21@gmail.com');

    if (studentError) console.error('Error fetching student:', studentError);
    else {
        students.forEach(s => {
            console.log(`Found Student: ${s.name}, Class: ${s.class}-${s.section}, DOB: ${s.dob}`);
        });
    }
}

checkState();
