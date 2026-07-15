
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Manually load .env without 'dotenv' package
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^["']|["']$/g, ''); // strip quotes
            process.env[key.trim()] = val;
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAttendance() {
    console.log('--- SEEDING ATTENDANCE FOR BALAN (v2) ---');

    // 1. Get Balan
    const { data: balan, error: balanError } = await supabase
        .from('students')
        .select('id, name, class, section')
        .ilike('name', '%balan%')
        .limit(1)
        .single();

    if (balanError || !balan) {
        console.error('Balan not found:', balanError);
        return;
    }
    console.log(`Found Student: ${balan.name} (${balan.id}) Class ${balan.class}-${balan.section}`);

    // 2. Find a valid period for his class
    const { data: cls } = await supabase
        .from('classes')
        .select('id')
        .eq('grade_level', balan.class)
        .eq('section', balan.section)
        .single();

    if (!cls) {
        console.error('Class ID not found for student');
        return;
    }

    const { data: timetable } = await supabase
        .from('timetables')
        .select('id')
        .eq('class_id', cls.id)
        .limit(1)
        .single();

    let periodId;

    if (timetable) {
        const { data: periods } = await supabase
            .from('timetable_periods')
            .select('id')
            .eq('timetable_id', timetable.id)
            .limit(1);

        if (periods && periods.length > 0) {
            periodId = periods[0].id;
        }
    }

    if (!periodId) {
        // Create dummy period
        const { data: teacher } = await supabase.from('teachers').select('id').limit(1).single();
        if (teacher && timetable) {
            const { data: newPeriod } = await supabase.from('timetable_periods').insert({
                timetable_id: timetable.id,
                teacher_id: teacher.id,
                day_of_week: 'Wednesday',
                period_number: 1,
                subject: 'Math',
                start_time: '09:00',
                end_time: '10:00'
            }).select().single();
            periodId = newPeriod?.id;
            console.log('Created dummy period:', periodId);
        } else {
            console.error('Cannot create dummy period: missing teacher or timetable');
            return;
        }
    }

    // 3. Insert Attendance
    const today = new Date().toISOString().split('T')[0];
    const { error: insertError } = await supabase
        .from('attendance_periods')
        .upsert({
            student_id: balan.id,
            timetable_period_id: periodId,
            attendance_date: today,
            status: 'present',
            marked_at: new Date().toISOString()
        }, { onConflict: 'student_id, timetable_period_id, attendance_date' });

    if (insertError) {
        console.error('Failed to insert attendance:', insertError);
    } else {
        console.log('✅ Successfully marked Balan as PRESENT for today.');
    }

    // 4. Verify View Result
    const { data: summary, error: viewError } = await supabase
        .from('attendance_summary')
        .select('*')
        .eq('student_id', balan.id);

    if (viewError) {
        console.error('View Query Failed:', viewError);
    } else {
        console.log('--- VIEW DATA (Frontend should see this) ---');
        console.table(summary);
    }
}

seedAttendance();
