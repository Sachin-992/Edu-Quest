/**
 * CLEANUP DATABASE - Based on actual Supabase Auth state
 * 
 * Actual auth users (from screenshot):
 * 1. balanp212121@gmail.com (admin)
 * 2. balanperiyasamy21@gmail.com (bala - student)
 * 3. devi02@gmail.com (devi - teacher)
 * 4. devi11@gmail.com (devi - teacher)
 * 5. madhu03@gmail.com (madhu - teacher)
 * 6. ragu21@gmail.com (Ragu - teacher)
 * 
 * Students that DON'T have auth accounts should be deactivated or deleted.
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

const supabaseUrl = env['VITE_SUPABASE_URL']!;
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY']!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanup() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           DATABASE CLEANUP - BASED ON ACTUAL AUTH STATE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get actual auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    console.log('📋 Actual Auth Users:\n');
    authUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (${u.user_metadata?.role || 'unknown'}) - ${u.id}`);
    });

    // Get all students
    const { data: students } = await supabase.from('students').select('*');

    console.log('\n📋 Current Students:\n');
    students?.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (${s.email || 'no email'}) - Class ${s.class}-${s.section}`);
        console.log(`      user_id: ${s.user_id || 'NULL'}, status: ${s.status}`);
    });

    // ==== CLEANUP ACTIONS ====
    console.log('\n🔧 CLEANUP ACTIONS:\n');

    // 1. Delete students without email AND without user_id (orphaned test data)
    const orphanedStudents = students?.filter(s => !s.email && !s.user_id) || [];
    for (const s of orphanedStudents) {
        console.log(`   🗑️ Deleting orphaned student: "${s.name}" (no email, no user_id)`);
        await supabase.from('students').delete().eq('id', s.id);
    }

    // 2. Delete students with email but no matching auth user
    for (const s of students || []) {
        if (!s.email) continue;
        const hasAuth = authUsers.some(a => a.email?.toLowerCase() === s.email?.toLowerCase());
        if (!hasAuth) {
            console.log(`   🗑️ Deleting student "${s.name}" - email ${s.email} has NO auth account`);
            await supabase.from('students').delete().eq('id', s.id);
        }
    }

    // 3. Remove old users table entries that don't have matching auth
    const { data: usersTable } = await supabase.from('users').select('*');
    for (const u of usersTable || []) {
        const hasAuth = authUsers.some(a => a.id === u.auth_id);
        if (!hasAuth && u.auth_id) {
            console.log(`   🗑️ Removing stale users entry: ${u.email} (auth_id not found)`);
            await supabase.from('users').delete().eq('id', u.id);
        }
    }

    // 4. Ensure valid students have correct linkage
    console.log('\n🔗 ENSURING CORRECT LINKAGES:\n');

    const { data: remainingStudents } = await supabase.from('students').select('*');

    for (const student of remainingStudents || []) {
        if (!student.email) continue;

        const authUser = authUsers.find(a => a.email?.toLowerCase() === student.email?.toLowerCase());
        if (!authUser) continue;

        // Find or create users entry
        let { data: userEntry } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .maybeSingle();

        if (!userEntry) {
            console.log(`   📌 Creating users entry for ${student.email}...`);
            const { data: newUser } = await supabase
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
            userEntry = newUser;
        }

        // Update student.user_id if needed
        if (userEntry && student.user_id !== userEntry.id) {
            console.log(`   🔧 Fixing student "${student.name}" user_id: ${student.user_id?.slice(0, 8) || 'NULL'} -> ${userEntry.id.slice(0, 8)}`);
            await supabase.from('students').update({ user_id: userEntry.id }).eq('id', student.id);
        }

        // Ensure student is active
        if (student.status !== 'active') {
            console.log(`   ✅ Activating student "${student.name}"`);
            await supabase.from('students').update({ status: 'active' }).eq('id', student.id);
        }
    }

    // 5. Final state
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      FINAL STATE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const { data: finalStudents } = await supabase.from('students').select('*');
    const { data: finalUsers } = await supabase.from('users').select('*');

    console.log('📋 Students (cleaned):\n');
    if (!finalStudents || finalStudents.length === 0) {
        console.log('   ⚠️ No students remain!');
    } else {
        finalStudents.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s.name} (${s.email})`);
            console.log(`      Class: ${s.class}-${s.section} | user_id: ${s.user_id?.slice(0, 8)}... | Status: ${s.status}`);
        });
    }

    console.log('\n📋 Users Table:\n');
    finalUsers?.filter(u => u.role === 'student').forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} -> auth_id: ${u.auth_id?.slice(0, 8)}...`);
    });

    console.log('\n✅ CLEANUP COMPLETE!');
}

cleanup().catch(console.error);
