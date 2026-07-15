/**
 * Diagnostic Script: Check Student Data Structure
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env manually
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

async function diagnose() {
    console.log('=== Student Data Diagnostics ===\n');

    // 1. Get all columns of students table
    console.log('--- Students Table Sample ---');
    const { data: students, error: studentsErr } = await supabase
        .from('students')
        .select('*')
        .limit(3);

    if (studentsErr) {
        console.error('Error:', studentsErr.message);
        return;
    }

    if (students && students.length > 0) {
        console.log('Sample student columns:', Object.keys(students[0]));
        console.log('\nSample data:');
        students.forEach((s: any, i: number) => {
            console.log(`\n${i + 1}. ${s.name} (${s.email})`);
            console.log(`   ID: ${s.id}`);
            console.log(`   Class: ${s.class}-${s.section}`);
            console.log(`   All fields:`, JSON.stringify(s, null, 2));
        });
    }

    // 2. Check users table (if exists)
    console.log('\n--- Users Table Sample ---');
    const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .limit(3);

    if (usersErr) {
        console.log('Users table error or not exists:', usersErr.message);
    } else if (users && users.length > 0) {
        console.log('Sample user columns:', Object.keys(users[0]));
        users.forEach((u: any, i: number) => {
            console.log(`\n${i + 1}. ${u.email || u.full_name}`);
            console.log(`   All fields:`, JSON.stringify(u, null, 2));
        });
    }

    // 3. Check auth.users
    console.log('\n--- Auth Users ---');
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
        console.log('Auth error:', authErr.message);
    } else {
        const authUsers = authData.users;
        console.log(`Found ${authUsers.length} auth users:`);
        authUsers.slice(0, 5).forEach((u: any, i: number) => {
            console.log(`\n${i + 1}. Email: ${u.email}`);
            console.log(`   ID: ${u.id}`);
            console.log(`   Metadata:`, JSON.stringify(u.user_metadata, null, 2));
        });
    }

    console.log('\n=== Done ===');
}

diagnose().catch(console.error);
