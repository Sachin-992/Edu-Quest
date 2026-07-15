/**
 * Complete Student Fix Script
 * 1. Sets student status to 'active'
 * 2. Verifies all linkages are correct
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

async function fixAllStudents() {
    console.log('=== Complete Student Fix ===\n');

    // Get all students
    const { data: students, error: studentsErr } = await supabase
        .from('students')
        .select('id, name, email, user_id, class, section, status');

    if (studentsErr) {
        console.error('Error:', studentsErr.message);
        return;
    }

    // Get auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    // Get users table
    const { data: usersTable } = await supabase.from('users').select('id, auth_id, email, role, status');

    console.log(`Found ${students.length} students\n`);

    for (const student of students) {
        console.log(`\n--- ${student.name} (${student.email || 'no email'}) ---`);
        console.log(`Class: ${student.class}-${student.section}`);
        console.log(`Student Status: ${student.status}`);

        // Fix 1: Activate inactive students
        if (student.status === 'inactive') {
            console.log('📌 Fixing: Setting status to active...');
            const { error: updateErr } = await supabase
                .from('students')
                .update({ status: 'active' })
                .eq('id', student.id);

            if (updateErr) {
                console.log(`   ❌ Failed: ${updateErr.message}`);
            } else {
                console.log(`   ✅ Status set to active`);
            }
        }

        // Check linkage for students with email
        if (student.email) {
            const authUser = authUsers.find(u => u.email?.toLowerCase() === student.email.toLowerCase());

            if (!authUser) {
                console.log(`   ⚠️ No auth user for this email`);
                continue;
            }

            // Check users table entry
            let userEntry = usersTable?.find(u => u.auth_id === authUser.id);

            if (!userEntry) {
                console.log(`   📌 Creating users entry for auth ${authUser.id}...`);
                const { data: newUser, error: createErr } = await supabase
                    .from('users')
                    .insert({
                        auth_id: authUser.id,
                        email: authUser.email,
                        name: student.name,
                        role: 'student',
                        status: 'active'
                    })
                    .select()
                    .single();

                if (createErr) {
                    console.log(`   ❌ Failed: ${createErr.message}`);
                    continue;
                }
                userEntry = newUser;
                console.log(`   ✅ Created users entry: ${userEntry.id}`);
            } else {
                // Ensure users entry is active and correct
                if (userEntry.status !== 'active' || userEntry.role !== 'student') {
                    console.log(`   📌 Fixing users entry status/role...`);
                    await supabase
                        .from('users')
                        .update({ status: 'active', role: 'student' })
                        .eq('id', userEntry.id);
                }
            }

            // Ensure student.user_id points to correct users entry
            if (student.user_id !== userEntry.id) {
                console.log(`   📌 Fixing student.user_id: ${student.user_id} -> ${userEntry.id}`);
                const { error: linkErr } = await supabase
                    .from('students')
                    .update({ user_id: userEntry.id })
                    .eq('id', student.id);

                if (linkErr) {
                    console.log(`   ❌ Failed: ${linkErr.message}`);
                } else {
                    console.log(`   ✅ Linked!`);
                }
            } else {
                console.log(`   ✅ user_id correctly linked`);
            }
        }
    }

    console.log('\n\n=== Fix Complete ===');
}

fixAllStudents().catch(console.error);
