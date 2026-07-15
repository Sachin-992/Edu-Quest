/**
 * Debug Script: Trace Teacher → Periods Chain
 * 
 * Usage: npx ts-node scripts/debug_teacher_periods.ts
 */

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
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value.trim();
        }
    });
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTeacherPeriods() {
    console.log('=== TEACHER → PERIODS DEBUG ===\n');

    // 1. Get all teachers
    const { data: teachers, error: teachersErr } = await supabase
        .from('teachers')
        .select('id, user_id, name, email');

    if (teachersErr) {
        console.error('Error fetching teachers:', teachersErr);
        return;
    }

    console.log(`Found ${teachers?.length || 0} teachers:\n`);

    for (const teacher of teachers || []) {
        console.log(`📋 Teacher: ${teacher.name}`);
        console.log(`   ID: ${teacher.id}`);
        console.log(`   User ID: ${teacher.user_id || 'NOT LINKED'}`);
        console.log(`   Email: ${teacher.email}`);

        // Check class teacher assignments
        const { data: classAssignments } = await supabase
            .from('class_teacher_assignments')
            .select(`
                id, assignment_type,
                class:classes(id, grade_level, section)
            `)
            .eq('teacher_id', teacher.id);

        if (classAssignments && classAssignments.length > 0) {
            console.log(`   Class Assignments:`);
            for (const ca of classAssignments) {
                const cls = ca.class as any;
                console.log(`      → ${ca.assignment_type}: Class ${cls?.grade_level || '?'}-${cls?.section || '?'}`);
            }
        } else {
            console.log(`   Class Assignments: NONE`);
        }

        // Check timetable periods
        const { data: periods, error: periodsErr } = await supabase
            .from('timetable_periods')
            .select(`
                id, day_of_week, period_number, subject,
                timetable:timetables(id, class_id, status, class:classes(grade_level, section))
            `)
            .eq('teacher_id', teacher.id);

        if (periodsErr) {
            console.log(`   Periods: ERROR - ${periodsErr.message}`);
        } else if (periods && periods.length > 0) {
            console.log(`   Timetable Periods (${periods.length}):`);
            for (const p of periods) {
                const tt = p.timetable as any;
                const cls = tt?.class as any;
                console.log(`      → ${p.day_of_week} P${p.period_number}: ${p.subject} (Class ${cls?.grade_level || '?'}-${cls?.section || '?'}, Status: ${tt?.status || '?'})`);
            }
        } else {
            console.log(`   Timetable Periods: NONE`);
        }

        console.log('');
    }

    // 2. Check timetables status
    console.log('\n=== TIMETABLES STATUS ===\n');
    const { data: timetables } = await supabase
        .from('timetables')
        .select(`
            id, status, academic_year,
            class:classes(grade_level, section)
        `);

    for (const tt of timetables || []) {
        const cls = tt.class as any;
        console.log(`📅 Timetable: Class ${cls?.grade_level || '?'}-${cls?.section || '?'}`);
        console.log(`   Status: ${tt.status}`);
        console.log(`   ID: ${tt.id}`);

        // Count periods
        const { count } = await supabase
            .from('timetable_periods')
            .select('id', { count: 'exact', head: true })
            .eq('timetable_id', tt.id);
        console.log(`   Periods: ${count || 0}`);
        console.log('');
    }
}

debugTeacherPeriods()
    .then(() => console.log('\n✅ Debug complete'))
    .catch(err => console.error('Script error:', err))
    .finally(() => process.exit(0));
