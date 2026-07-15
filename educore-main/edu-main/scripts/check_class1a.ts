/**
 * Check Class 1-A Setup
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
    const CLASS_1A_ID = '7ace5445-5618-4eef-834c-128967de9103';
    const DEVI_ID = '71dd9742-caa7-4a34-8bd2-d45503ee983a';

    console.log('=== CLASS 1-A SETUP CHECK ===\n');
    console.log(`Class 1-A ID: ${CLASS_1A_ID}`);
    console.log(`Devi's Teacher ID: ${DEVI_ID}\n`);

    // 1. Check timetable for Class 1-A
    const { data: timetable } = await supabase
        .from('timetables')
        .select('*')
        .eq('class_id', CLASS_1A_ID)
        .single();

    if (timetable) {
        console.log(`✅ Timetable found: ${timetable.id} (Status: ${timetable.status})`);

        // 2. Get periods for this timetable
        const { data: periods } = await supabase
            .from('timetable_periods')
            .select('*, teacher:teachers(name)')
            .eq('timetable_id', timetable.id);

        console.log(`\nPeriods for Class 1-A:`);
        if (periods && periods.length > 0) {
            for (const p of periods) {
                const teacherName = (p.teacher as any)?.name || 'Unknown';
                console.log(`  ${p.day_of_week} P${p.period_number}: ${p.subject || p.activity_label} by ${teacherName} (teacher_id: ${p.teacher_id})`);
                if (p.teacher_id === DEVI_ID) {
                    console.log(`    ^^^ THIS IS DEVI`);
                }
            }
        } else {
            console.log(`  ❌ No periods assigned yet!`);
        }
    } else {
        console.log(`❌ No timetable found for Class 1-A!`);
    }

    // 3. Check class teacher assignment for devi
    console.log('\nClass Teacher Assignments for Devi:');
    const { data: assignments } = await supabase
        .from('class_teacher_assignments')
        .select('*, class:classes(grade_level, section)')
        .eq('teacher_id', DEVI_ID);

    if (assignments && assignments.length > 0) {
        for (const a of assignments) {
            const cls = a.class as any;
            console.log(`  ${a.assignment_type || 'assignment'}: Class ${cls?.grade_level}-${cls?.section}`);
        }
    } else {
        console.log(`  ❌ No class teacher assignments for devi!`);
    }

    // 4. Check ALL periods assigned to Devi
    console.log('\nALL Timetable Periods assigned to Devi:');
    const { data: allDeviPeriods } = await supabase
        .from('timetable_periods')
        .select('*, timetable:timetables(class_id)')
        .eq('teacher_id', DEVI_ID);

    if (allDeviPeriods && allDeviPeriods.length > 0) {
        console.log(`  Found ${allDeviPeriods.length} periods`);
        for (const p of allDeviPeriods) {
            console.log(`  ${p.day_of_week} P${p.period_number}: ${p.subject || p.activity_label}`);
        }
    } else {
        console.log(`  ❌ No timetable periods assigned to devi!`);
        console.log(`     This is why the period dropdown is EMPTY.`);
    }
}

check()
    .then(() => console.log('\n✅ Done'))
    .catch(err => console.error('Error:', err))
    .finally(() => process.exit(0));
