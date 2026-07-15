
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env loading
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseServiceKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
        }
    });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyLogic() {
    console.log('--- Verifying Student Dashboard Logic ---');

    // 1. Fetch Student 'Balan' (Simulating auth check or getStudents)
    const { data: students } = await supabase
        .from('students')
        .select('*')
        .ilike('email', 'Balanperiyasamy21@gmail.com');

    const myProfile = students && students.length > 0 ? students[0] : null;
    if (!myProfile) {
        console.error('Student Balan not found');
        return;
    }
    console.log(`Student Found: ${myProfile.name}, Class: ${myProfile.class}-${myProfile.section}`);

    // 2. Fetch All Classes (Simulating schoolService.getClasses)
    const { data: allClasses } = await supabase
        .from('classes')
        .select('*');

    if (!allClasses) {
        console.error('No classes found');
        return;
    }

    // 3. Run Matching Logic
    const matchingClass = allClasses.find(c =>
        c.grade_level === myProfile.class &&
        c.section === myProfile.section
    );

    if (matchingClass) {
        console.log(`SUCCESS: Found Matching Class!`);
        console.log(`Class Name: ${matchingClass.name}`);
        console.log(`Class ID: ${matchingClass.id}`);

        // 4. Verify Timetable Data
        const { count } = await supabase
            .from('timetable_periods')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', matchingClass.id);

        console.log(`Timetable Periods for this Class: ${count}`);
        if (count && count > 0) {
            console.log('VERIFICATION PASSED: Timetable should be visible.');
        } else {
            console.warn('VERIFICATION WARNING: Class matched, but no timetable periods found.');
        }
    } else {
        console.error(`FAILURE: matchingClass is undefined. The logic failed to find a class for Grade ${myProfile.class} Section ${myProfile.section}.`);
    }
}

verifyLogic();
