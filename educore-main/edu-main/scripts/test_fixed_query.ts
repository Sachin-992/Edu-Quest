/**
 * Test the FIXED getTodayPeriods Query (Two-step approach)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = value.trim();
        }
    });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixedQuery() {
    const DEVI_TEACHER_ID = '71dd9742-caa7-4a34-8bd2-d45503ee983a';

    console.log('=== TESTING FIXED getTodayPeriods QUERY (Two-step) ===\n');
    console.log(`Teacher ID: ${DEVI_TEACHER_ID}\n`);

    // Step 1: Get periods with timetable info
    const { data: periods, error } = await supabase
        .from('timetable_periods')
        .select(`
            id, period_number, start_time, end_time, subject, day_of_week,
            timetable:timetables!inner(id, status, class_id)
        `)
        .eq('teacher_id', DEVI_TEACHER_ID);

    if (error) {
        console.log(`❌ ERROR: ${error.message}`);
        return;
    }

    console.log(`✅ Step 1: Found ${periods?.length || 0} periods!\n`);

    if (!periods || periods.length === 0) {
        console.log('No periods found.');
        return;
    }

    // Step 2: Get unique class IDs and fetch class info
    const classIds = [...new Set(periods.map((p: any) => p.timetable?.class_id).filter(Boolean))];
    console.log(`Step 2: Fetching classes: ${classIds.join(', ')}\n`);

    const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, grade_level, section')
        .in('id', classIds);

    if (classError) {
        console.log(`❌ Class fetch ERROR: ${classError.message}`);
        return;
    }

    console.log(`✅ Step 2: Found ${classes?.length || 0} classes!\n`);

    const classMap = new Map((classes || []).map((c: any) => [c.id, c]));

    // Step 3: Transform and display
    const transformed = periods.map((p: any) => {
        const timetable = p.timetable;
        const classInfo = classMap.get(timetable?.class_id);
        return {
            ...p,
            timetable: {
                ...timetable,
                class: classInfo?.grade_level || '',
                section: classInfo?.section || ''
            }
        };
    });

    console.log('=== RESULT ===\n');
    for (const p of transformed) {
        console.log(`📚 ${p.day_of_week} Period ${p.period_number}`);
        console.log(`   Subject: ${p.subject}`);
        console.log(`   Class: ${p.timetable.class}-${p.timetable.section}`);
        console.log(`   Time: ${p.start_time} - ${p.end_time}`);
        console.log('');
    }
}

testFixedQuery()
    .then(() => console.log('✅ Test complete'))
    .catch(err => console.error('Error:', err))
    .finally(() => process.exit(0));
