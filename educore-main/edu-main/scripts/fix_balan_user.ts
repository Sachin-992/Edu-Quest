/**
 * Fix: Correct the user entry for balanperiyasamy21@gmail.com and remove duplicates
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

async function fixUser() {
    const email = 'balanperiyasamy21@gmail.com';
    console.log(`=== Fixing ${email} ===\n`);

    // Step 1: Get auth user
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users.find(u => u.email === email);

    if (!authUser) {
        console.log('❌ No auth user found');
        return;
    }
    console.log('Auth User ID:', authUser.id);

    // Step 2: Check users table
    const { data: allUserEntries } = await supabase
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authUser.id},email.eq.${email}`);

    console.log('\nUsers entries found:', allUserEntries?.length);
    allUserEntries?.forEach(u => {
        console.log(`  - ${u.id}: ${u.email}, auth_id=${u.auth_id}, name=${u.name}`);
    });

    // Step 3: Find the correct users entry (should have auth_id matching)
    let correctUserEntry = allUserEntries?.find(u => u.auth_id === authUser.id);

    if (!correctUserEntry) {
        console.log('\n📌 No users entry with correct auth_id. Creating one...');
        const { data: newUser, error: createErr } = await supabase
            .from('users')
            .insert({
                auth_id: authUser.id,
                email: email,
                name: authUser.user_metadata?.name || 'bala',
                role: 'student',
                status: 'active'
            })
            .select()
            .single();

        if (createErr) {
            console.log('❌ Create failed:', createErr.message);
            return;
        }
        correctUserEntry = newUser;
        console.log('✅ Created users entry:', correctUserEntry.id);
    } else {
        console.log('\n✅ Found correct users entry:', correctUserEntry.id);
    }

    // Step 4: Get all students with this email
    const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('email', email);

    console.log('\nStudents with this email:', students?.length);

    if (students && students.length > 1) {
        console.log('⚠️ Multiple students found. Which one to keep?');
        students.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.name} (ID: ${s.id})`);
        });

        // Keep the first one, delete the rest
        const toKeep = students[0];
        const toDelete = students.slice(1);

        console.log(`\n📌 Keeping: ${toKeep.name} (${toKeep.id})`);
        console.log('📌 Deleting duplicates...');

        for (const dup of toDelete) {
            const { error: delErr } = await supabase
                .from('students')
                .delete()
                .eq('id', dup.id);

            if (delErr) {
                console.log(`   ❌ Failed to delete ${dup.id}: ${delErr.message}`);
            } else {
                console.log(`   ✅ Deleted ${dup.name} (${dup.id})`);
            }
        }
    }

    // Step 5: Ensure the remaining student has correct user_id
    const { data: remainingStudent } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

    if (remainingStudent && remainingStudent.user_id !== correctUserEntry.id) {
        console.log(`\n📌 Fixing student user_id: ${remainingStudent.user_id} -> ${correctUserEntry.id}`);
        const { error: updateErr } = await supabase
            .from('students')
            .update({ user_id: correctUserEntry.id })
            .eq('id', remainingStudent.id);

        if (updateErr) {
            console.log('❌ Failed:', updateErr.message);
        } else {
            console.log('✅ Fixed!');
        }
    } else if (remainingStudent) {
        console.log('✅ Student user_id already correct');
    }

    console.log('\n=== Fix Complete ===');
    console.log('Please logout and login again with:', email);
}

fixUser().catch(console.error);
