/**
 * COMPLETE DATABASE AUDIT AND FIX
 * This script will:
 * 1. Check all students and their linkages
 * 2. Check all users and their auth linkages
 * 3. Find and fix any orphaned/duplicate records
 * 4. Ensure consistent data across all tables
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

interface Issue {
    type: 'critical' | 'warning' | 'info';
    entity: string;
    message: string;
    fix?: () => Promise<void>;
}

const issues: Issue[] = [];

async function audit() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       COMPLETE DATABASE AUDIT - EDUCORE-OMEGA                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // ===== 1. GET ALL DATA =====
    console.log('📊 Fetching all data...\n');

    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];
    console.log(`   Auth Users: ${authUsers.length}`);

    const { data: usersTable } = await supabase.from('users').select('*');
    console.log(`   Users Table: ${usersTable?.length || 0}`);

    const { data: students } = await supabase.from('students').select('*');
    console.log(`   Students: ${students?.length || 0}`);

    const { data: teachers } = await supabase.from('teachers').select('*');
    console.log(`   Teachers: ${teachers?.length || 0}`);

    const { data: classes } = await supabase.from('classes').select('*');
    console.log(`   Classes: ${classes?.length || 0}`);

    const { data: timetables } = await supabase.from('timetables').select('*');
    console.log(`   Timetables: ${timetables?.length || 0}`);

    console.log('\n' + '═'.repeat(70) + '\n');

    // ===== 2. CHECK USERS TABLE COMPLETENESS =====
    console.log('🔍 AUDIT 1: Users Table Completeness\n');

    for (const authUser of authUsers) {
        const userEntry = usersTable?.find(u => u.auth_id === authUser.id);
        const role = authUser.user_metadata?.role || 'unknown';

        if (!userEntry) {
            console.log(`   ❌ Auth user ${authUser.email} has NO users table entry`);
            issues.push({
                type: 'critical',
                entity: `auth:${authUser.email}`,
                message: `Auth user "${authUser.email}" has no users table entry`,
                fix: async () => {
                    console.log(`      📌 Creating users entry for ${authUser.email}...`);
                    await supabase.from('users').insert({
                        auth_id: authUser.id,
                        email: authUser.email,
                        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Unknown',
                        role: role === 'unknown' ? 'student' : role,
                        status: 'active'
                    });
                }
            });
        } else if (userEntry.email !== authUser.email) {
            console.log(`   ⚠️ Email mismatch for ${authUser.email}: users.email = ${userEntry.email}`);
            issues.push({
                type: 'warning',
                entity: `users:${userEntry.id}`,
                message: `Email mismatch: auth=${authUser.email}, users=${userEntry.email}`,
                fix: async () => {
                    await supabase.from('users').update({ email: authUser.email }).eq('id', userEntry.id);
                }
            });
        } else {
            console.log(`   ✅ ${authUser.email} -> users.id: ${userEntry.id.slice(0, 8)}... (${userEntry.role})`);
        }
    }

    console.log('\n' + '═'.repeat(70) + '\n');

    // ===== 3. CHECK STUDENTS TABLE COMPLETENESS =====
    console.log('🔍 AUDIT 2: Students Table Integrity\n');

    // Check for duplicate user_id
    const userIdCount: Record<string, number> = {};
    students?.forEach(s => {
        if (s.user_id) {
            userIdCount[s.user_id] = (userIdCount[s.user_id] || 0) + 1;
        }
    });

    for (const [uid, count] of Object.entries(userIdCount)) {
        if (count > 1) {
            const dupeStudents = students?.filter(s => s.user_id === uid);
            console.log(`   ❌ DUPLICATE: user_id ${uid.slice(0, 8)}... has ${count} students!`);
            dupeStudents?.forEach(s => console.log(`      - ${s.name} (${s.email}) Class ${s.class}-${s.section}`));

            // Keep first, mark rest for deletion
            const toDelete = dupeStudents?.slice(1) || [];
            issues.push({
                type: 'critical',
                entity: `students:${uid}`,
                message: `Duplicate students for user_id ${uid}`,
                fix: async () => {
                    for (const dup of toDelete) {
                        console.log(`      📌 Deleting duplicate: ${dup.name} (${dup.id})`);
                        await supabase.from('students').delete().eq('id', dup.id);
                    }
                }
            });
        }
    }

    // Check for students without user_id
    const orphanedStudents = students?.filter(s => !s.user_id) || [];
    for (const s of orphanedStudents) {
        console.log(`   ⚠️ Student "${s.name}" has no user_id linkage`);
        issues.push({
            type: 'warning',
            entity: `students:${s.id}`,
            message: `Student "${s.name}" has no user_id`
        });
    }

    // Check for students with wrong user_id (email mismatch)
    for (const student of students || []) {
        if (!student.email) continue;

        const authUser = authUsers.find(a => a.email?.toLowerCase() === student.email?.toLowerCase());
        if (!authUser) {
            console.log(`   ⚠️ Student "${student.name}" email ${student.email} has no auth user`);
            continue;
        }

        const userEntry = usersTable?.find(u => u.auth_id === authUser.id);
        if (!userEntry) continue;

        if (student.user_id !== userEntry.id) {
            console.log(`   ❌ Linkage error: ${student.name} points to wrong user_id`);
            console.log(`      Expected: ${userEntry.id} (from auth ${authUser.id})`);
            console.log(`      Actual: ${student.user_id}`);
            issues.push({
                type: 'critical',
                entity: `students:${student.id}`,
                message: `Student "${student.name}" has wrong user_id`,
                fix: async () => {
                    console.log(`      📌 Fixing user_id for ${student.name}...`);
                    await supabase.from('students').update({ user_id: userEntry.id }).eq('id', student.id);
                }
            });
        }
    }

    console.log('\n' + '═'.repeat(70) + '\n');

    // ===== 4. CHECK CLASS EXISTENCE =====
    console.log('🔍 AUDIT 3: Class-Student Consistency\n');

    for (const student of students || []) {
        const matchingClass = classes?.find(c =>
            c.grade_level === student.class && c.section === student.section
        );

        if (!matchingClass) {
            console.log(`   ⚠️ Student "${student.name}" in Class ${student.class}-${student.section} - CLASS DOESN'T EXIST`);
            issues.push({
                type: 'warning',
                entity: `students:${student.id}`,
                message: `Class ${student.class}-${student.section} doesn't exist for "${student.name}"`
            });
        } else {
            console.log(`   ✅ ${student.name}: Class ${student.class}-${student.section} exists (${matchingClass.id.slice(0, 8)}...)`);
        }
    }

    console.log('\n' + '═'.repeat(70) + '\n');

    // ===== 5. SUMMARY =====
    console.log('📋 AUDIT SUMMARY\n');

    const criticals = issues.filter(i => i.type === 'critical');
    const warnings = issues.filter(i => i.type === 'warning');

    console.log(`   🔴 Critical Issues: ${criticals.length}`);
    console.log(`   🟡 Warnings: ${warnings.length}`);
    console.log(`   🟢 Total Checked: ${authUsers.length} auth, ${students?.length || 0} students, ${classes?.length || 0} classes`);

    console.log('\n' + '═'.repeat(70) + '\n');

    // ===== 6. AUTO-FIX =====
    if (issues.filter(i => i.fix).length > 0) {
        console.log('🔧 APPLYING FIXES...\n');

        for (const issue of issues) {
            if (issue.fix) {
                try {
                    await issue.fix();
                    console.log(`   ✅ Fixed: ${issue.message}`);
                } catch (err: any) {
                    console.log(`   ❌ Failed to fix: ${issue.message} - ${err.message}`);
                }
            }
        }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    AUDIT COMPLETE                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // ===== 7. FINAL STATE =====
    console.log('📊 FINAL DATABASE STATE:\n');

    const { data: finalStudents } = await supabase.from('students').select('id, name, email, class, section, user_id, status');
    console.log('Students:');
    finalStudents?.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (${s.email || 'no email'})`);
        console.log(`      Class: ${s.class}-${s.section} | user_id: ${s.user_id?.slice(0, 8) || 'NULL'}... | Status: ${s.status}`);
    });
}

audit().catch(console.error);
