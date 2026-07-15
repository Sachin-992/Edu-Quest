/**
 * Find and fix the "Test Student" issue and duplicate students
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl!, serviceRoleKey!);

async function investigate() {
    console.log('=== Full Student Investigation ===\n');

    // Get ALL students
    const { data: allStudents } = await supabase
        .from('students')
        .select('id, name, email, user_id, class, section, roll_no, status')
        .order('class');

    console.log('All students in database:\n');
    allStudents?.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} (${s.email || 'no email'})`);
        console.log(`   ID: ${s.id}`);
        console.log(`   user_id: ${s.user_id || 'NULL'}`);
        console.log(`   Class: ${s.class}-${s.section}, Roll: ${s.roll_no}`);
        console.log(`   Status: ${s.status}`);
        console.log('');
    });

    // Check for "Test Student" with Class 6-A specifically
    console.log('\n--- Checking "Test Student" in Class 6-A ---');
    const testStudent = allStudents?.find(s => s.name === 'Test Student' && s.class === '6' && s.section === 'A');
    if (testStudent) {
        console.log('Found:', testStudent);
        console.log('This student has user_id:', testStudent.user_id);

        // What users entry does this link to?
        const { data: userEntry } = await supabase
            .from('users')
            .select('*')
            .eq('id', testStudent.user_id)
            .single();

        console.log('Linked users entry:', userEntry);

        if (userEntry) {
            // What auth user is this?
            const { data: authData } = await supabase.auth.admin.listUsers();
            const authUser = authData?.users.find(u => u.id === userEntry.auth_id);
            console.log('Auth user email:', authUser?.email);
        }
    }

    // Find duplicates (multiple students with same user_id)
    console.log('\n--- Duplicate user_id check ---');
    const userIdCounts: Record<string, number> = {};
    allStudents?.forEach(s => {
        if (s.user_id) {
            userIdCounts[s.user_id] = (userIdCounts[s.user_id] || 0) + 1;
        }
    });

    for (const [uid, count] of Object.entries(userIdCounts)) {
        if (count > 1) {
            console.log(`\n⚠️ user_id ${uid} has ${count} students linked!`);
            const dupes = allStudents?.filter(s => s.user_id === uid);
            dupes?.forEach(s => console.log(`   - ${s.name} (${s.email}) Class ${s.class}-${s.section}`));
        }
    }
}

investigate().catch(console.error);
