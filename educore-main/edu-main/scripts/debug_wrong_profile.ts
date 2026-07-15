/**
 * Debug: Check what profile balanperiyasamy21@gmail.com sees
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

async function debugProfile(email: string) {
    console.log(`\n=== Debugging Profile for: ${email} ===\n`);

    // Step 1: Find auth user
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!authUser) {
        console.log('❌ Auth user not found');
        return;
    }
    console.log('Auth User ID:', authUser.id);

    // Step 2: Find users entry
    const { data: userEntry } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

    if (!userEntry) {
        console.log('❌ Users table entry not found for auth_id:', authUser.id);
        return;
    }
    console.log('Users Entry:', userEntry.id, '-', userEntry.name, '-', userEntry.role);

    // Step 3: Find ALL students linked to this user_id
    const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userEntry.id);

    console.log('\nStudents linked to this user_id:');
    if (error) {
        console.log('Error:', error.message);
    } else if (!students || students.length === 0) {
        console.log('❌ No students found!');
    } else {
        students.forEach((s, i) => {
            console.log(`\n  ${i + 1}. ${s.name}`);
            console.log(`     ID: ${s.id}`);
            console.log(`     Email: ${s.email}`);
            console.log(`     Class: ${s.class}-${s.section}`);
            console.log(`     Roll: ${s.roll_no}`);
            console.log(`     Status: ${s.status}`);
        });
    }

    // Step 4: Check for students with this email but different user_id
    console.log('\n--- Students with email matching directly ---');
    const { data: emailStudents } = await supabase
        .from('students')
        .select('*')
        .eq('email', email);

    if (emailStudents && emailStudents.length > 0) {
        emailStudents.forEach((s, i) => {
            console.log(`\n  ${i + 1}. ${s.name}`);
            console.log(`     ID: ${s.id}`);
            console.log(`     user_id: ${s.user_id}`);
            console.log(`     Class: ${s.class}-${s.section}`);
        });
    } else {
        console.log('No students with this email directly');
    }
}

debugProfile('balanperiyasamy21@gmail.com').catch(console.error);
