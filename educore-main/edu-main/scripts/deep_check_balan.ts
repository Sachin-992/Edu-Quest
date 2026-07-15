/**
 * Deep Chain Check for balan21@gmail.com
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

async function deepCheck() {
    console.log('=== Deep Chain Check for balan21@gmail.com ===\n');

    // Step 1: Auth user
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users.find(u => u.email === 'balan21@gmail.com');
    console.log('Auth User:', authUser?.id);

    // Step 2: Check users table for this auth_id
    const { data: userByAuth, error: err1 } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser?.id)
        .maybeSingle();

    console.log('\nUsers entry by auth_id:', userByAuth ? `Found: ${userByAuth.id}` : `NOT FOUND (${err1?.message})`);

    // Step 3: Check current student's user_id
    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('email', 'balan21@gmail.com')
        .single();

    console.log('\nStudent record:');
    console.log('  student.id:', student?.id);
    console.log('  student.user_id:', student?.user_id);

    // Step 4: Check users entry for student.user_id
    const { data: userEntry } = await supabase
        .from('users')
        .select('*')
        .eq('id', student?.user_id)
        .single();

    console.log('\nUsers entry by student.user_id:');
    console.log('  users.id:', userEntry?.id);
    console.log('  users.auth_id:', userEntry?.auth_id);
    console.log('  users.email:', userEntry?.email);

    // Check if they match
    console.log('\n=== COMPARISON ===');
    console.log('Auth ID from login:', authUser?.id);
    console.log('Auth ID in users table:', userEntry?.auth_id);
    console.log('MATCH:', authUser?.id === userEntry?.auth_id ? '✅ YES' : '❌ NO - THIS IS THE BUG');

    if (authUser && userEntry && authUser.id !== userEntry.auth_id) {
        console.log('\n📌 FIX NEEDED: Update users.auth_id to match the actual auth user');

        // Offer to fix
        console.log('\nApplying fix...');
        const { error: updateErr } = await supabase
            .from('users')
            .update({ auth_id: authUser.id, email: authUser.email })
            .eq('id', userEntry.id);

        if (updateErr) {
            console.log('❌ Fix failed:', updateErr.message);
        } else {
            console.log('✅ Fixed! users.auth_id updated to', authUser.id);
        }
    }
}

deepCheck().catch(console.error);
