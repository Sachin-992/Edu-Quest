/**
 * Fix Script: Correct Student-Auth Linkage
 * Creates missing users entries and correctly links students.
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

async function fixLinkage() {
    console.log('=== Correcting Student-Auth Linkage ===\n');

    // Get all students with emails
    const { data: students, error: studentsErr } = await supabase
        .from('students')
        .select('id, name, email, user_id, class, section');

    if (studentsErr) {
        console.error('Error:', studentsErr.message);
        return;
    }

    // Get all auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    // Get all users table entries
    const { data: usersTable } = await supabase.from('users').select('id, auth_id, email');

    for (const student of students) {
        if (!student.email) {
            console.log(`⏭️ ${student.name}: No email, skipping`);
            continue;
        }

        const email = student.email.toLowerCase();
        const matchingAuth = authUsers.find(u => u.email?.toLowerCase() === email);

        if (!matchingAuth) {
            console.log(`❌ ${student.name} (${email}): No matching auth user`);
            continue;
        }

        // Check if there's a users entry for this auth user
        let userEntry = usersTable?.find(u => u.auth_id === matchingAuth.id);

        if (!userEntry) {
            // Create the users table entry
            console.log(`📌 ${student.name}: Creating missing users entry for auth ${matchingAuth.id}`);
            const { data: newUser, error: createErr } = await supabase
                .from('users')
                .insert({
                    auth_id: matchingAuth.id,
                    email: matchingAuth.email,
                    name: student.name,
                    role: 'student',
                    status: 'active'
                })
                .select()
                .single();

            if (createErr) {
                console.log(`   ⚠️ Failed to create: ${createErr.message}`);
                continue;
            }
            userEntry = newUser;
            console.log(`   ✅ Created users entry with ID: ${userEntry.id}`);
        }

        // Now update student.user_id to point to the correct users.id
        if (student.user_id !== userEntry.id) {
            console.log(`🔧 ${student.name}: Linking user_id ${student.user_id} -> ${userEntry.id}`);
            const { error: updateErr } = await supabase
                .from('students')
                .update({ user_id: userEntry.id })
                .eq('id', student.id);

            if (updateErr) {
                console.log(`   ⚠️ Failed: ${updateErr.message}`);
            } else {
                console.log(`   ✅ Linked!`);
            }
        } else {
            console.log(`✅ ${student.name}: Already correctly linked`);
        }
    }

    console.log('\n=== Linkage Fixed ===');
}

fixLinkage().catch(console.error);
