/**
 * Simple Debug: Check raw timetable data
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value.trim();
        }
    });
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('=== RAW TIMETABLE DATA ===\n');

    // 1. Check timetables
    const { data: timetables, count: ttCount } = await supabase
        .from('timetables')
        .select('*', { count: 'exact' });
    console.log(`Total Timetables: ${ttCount || 0}`);
    if (timetables && timetables.length > 0) {
        console.log('Sample:', timetables[0]);
    }

    // 2. Check timetable_periods
    const { data: periods, count: pCount } = await supabase
        .from('timetable_periods')
        .select('*', { count: 'exact' });
    console.log(`\nTotal Periods: ${pCount || 0}`);
    if (periods && periods.length > 0) {
        console.log('Sample:', periods[0]);
    }

    // 3. Check class_teacher_assignments
    const { data: assignments, count: aCount } = await supabase
        .from('class_teacher_assignments')
        .select('*', { count: 'exact' });
    console.log(`\nTotal Class Teacher Assignments: ${aCount || 0}`);
    if (assignments && assignments.length > 0) {
        console.log('Sample:', assignments[0]);
    }

    // 4. Check classes
    const { data: classes } = await supabase
        .from('classes')
        .select('id, grade_level, section');
    console.log(`\nClasses in DB:`);
    for (const c of classes || []) {
        console.log(`  - ${c.grade_level}-${c.section} (ID: ${c.id})`);
    }
}

check()
    .then(() => console.log('\n✅ Done'))
    .catch(err => console.error('Error:', err))
    .finally(() => process.exit(0));
