/**
 * Verify Script: Full Chain Check for Student Login
 * This checks the complete chain: auth.users -> users -> students
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

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyChain(studentEmail: string) {
    console.log(`\n=== Verifying Chain for: ${studentEmail} ===\n`);

    // Step 1: Find in auth.users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users.find(u => u.email?.toLowerCase() === studentEmail.toLowerCase());

    if (!authUser) {
        console.log('❌ Step 1: Auth user NOT FOUND');
        return;
    }
    console.log(`✅ Step 1: Auth User Found`);
    console.log(`   auth.id: ${authUser.id}`);
    console.log(`   role: ${authUser.user_metadata?.role}`);

    // Step 2: Find in users table
    const { data: userEntry, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

    if (userErr || !userEntry) {
        console.log(`❌ Step 2: Users entry NOT FOUND for auth_id: ${authUser.id}`);
        console.log(`   Error: ${userErr?.message}`);
        return;
    }
    console.log(`✅ Step 2: Users Entry Found`);
    console.log(`   users.id: ${userEntry.id}`);
    console.log(`   role: ${userEntry.role}`);

    // Step 3: Find in students table
    const { data: studentEntry, error: studentErr } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userEntry.id)
        .single();

    if (studentErr || !studentEntry) {
        console.log(`❌ Step 3: Student entry NOT FOUND for user_id: ${userEntry.id}`);
        console.log(`   Error: ${studentErr?.message}`);
        return;
    }
    console.log(`✅ Step 3: Student Entry Found`);
    console.log(`   students.id: ${studentEntry.id}`);
    console.log(`   name: ${studentEntry.name}`);
    console.log(`   class: ${studentEntry.class}-${studentEntry.section}`);
    console.log(`   status: ${studentEntry.status}`);

    console.log('\n✅✅✅ Full chain verified! Student should be able to login. ✅✅✅');
}

// Check the specific student
verifyChain('balan21@gmail.com').catch(console.error);
verifyChain('balanperiyasamy21@gmail.com').catch(console.error);
verifyChain('nattu@gmail.com').catch(console.error);
