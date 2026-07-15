/**
 * Simulate Teacher Dashboard Query
 * Tests the exact query that getTodayPeriods uses
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseServiceKey = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = value.trim();
        }
    });
}

async function testTeacherQuery() {
    const DEVI_TEACHER_ID = '71dd9742-caa7-4a34-8bd2-d45503ee983a';
    const DEVI_USER_ID = '2e00e578-81d2-4033-8045-30011e6b961f';

    console.log('=== TESTING getTodayPeriods QUERY ===\n');
    console.log(`Teacher ID: ${DEVI_TEACHER_ID}`);
    console.log(`User ID: ${DEVI_USER_ID}\n`);

    // 1. Test with SERVICE ROLE key (bypasses RLS)
    console.log('--- TEST 1: Service Role Key (Bypasses RLS) ---');
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: serviceData, error: serviceError } = await serviceClient
        .from('timetable_periods')
        .select(`
            id, period_number, start_time, end_time, subject, day_of_week,
            timetable:timetables!inner(class, section)
        `)
        .eq('teacher_id', DEVI_TEACHER_ID);

    if (serviceError) {
        console.log(`ERROR: ${serviceError.message}`);
    } else {
        console.log(`Found ${serviceData?.length || 0} periods`);
        if (serviceData && serviceData.length > 0) {
            for (const p of serviceData) {
                console.log(`  ${p.day_of_week} P${p.period_number}: ${p.subject}`);
            }
        }
    }

    // 2. Test with ANON key (uses RLS - simulates frontend)
    console.log('\n--- TEST 2: Anon Key (Uses RLS) ---');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: anonData, error: anonError } = await anonClient
        .from('timetable_periods')
        .select(`
            id, period_number, start_time, end_time, subject, day_of_week,
            timetable:timetables!inner(class, section)
        `)
        .eq('teacher_id', DEVI_TEACHER_ID);

    if (anonError) {
        console.log(`ERROR: ${anonError.message}`);
        console.log(`\n⚠️  This is likely the problem!`);
        console.log(`   The anon client can't see the periods due to RLS.`);
    } else {
        console.log(`Found ${anonData?.length || 0} periods`);
        if (anonData && anonData.length > 0) {
            for (const p of anonData) {
                console.log(`  ${p.day_of_week} P${p.period_number}: ${p.subject}`);
            }
        } else {
            console.log(`\n⚠️  Zero periods returned with anon key!`);
            console.log(`   This suggests RLS is blocking the query.`);
        }
    }

    // 3. Test simpler query without join
    console.log('\n--- TEST 3: Simple query (no join) with Anon Key ---');
    const { data: simpleData, error: simpleError } = await anonClient
        .from('timetable_periods')
        .select('*')
        .eq('teacher_id', DEVI_TEACHER_ID);

    if (simpleError) {
        console.log(`ERROR: ${simpleError.message}`);
    } else {
        console.log(`Found ${simpleData?.length || 0} periods`);
    }

    // 4. Check timetables visibility
    console.log('\n--- TEST 4: Check timetables visibility ---');
    const { data: ttData, count } = await anonClient
        .from('timetables')
        .select('*', { count: 'exact' });
    console.log(`Timetables visible to anon: ${count || 0}`);
}

testTeacherQuery()
    .then(() => console.log('\n✅ Test complete'))
    .catch(err => console.error('Error:', err))
    .finally(() => process.exit(0));
