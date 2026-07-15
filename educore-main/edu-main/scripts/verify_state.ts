/**
 * Verify: Check Class 1-A exists and has timetable
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL']!, env['SUPABASE_SERVICE_ROLE_KEY']!);

async function verify() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    VERIFICATION CHECK');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Check Class 1-A
    const { data: class1A } = await supabase
        .from('classes')
        .select('*')
        .eq('grade_level', '1')
        .eq('section', 'A')
        .single();

    console.log('📚 Class 1-A:', class1A ? `EXISTS (ID: ${class1A.id})` : '❌ NOT FOUND');

    // 2. Check timetable for Class 1-A
    if (class1A) {
        const { data: timetable } = await supabase
            .from('timetables')
            .select('*')
            .eq('class_id', class1A.id)
            .single();

        console.log('📅 Timetable for 1-A:', timetable ? `EXISTS (Status: ${timetable.status})` : '❌ NOT FOUND');

        if (timetable) {
            const { data: periods } = await supabase
                .from('timetable_periods')
                .select('*')
                .eq('timetable_id', timetable.id);

            console.log(`📝 Periods: ${periods?.length || 0} periods defined`);
        }
    }

    // 3. List all available classes
    console.log('\n📋 All Available Classes:\n');
    const { data: allClasses } = await supabase.from('classes').select('id, grade_level, section, name');
    allClasses?.sort((a, b) => parseInt(a.grade_level) - parseInt(b.grade_level) || a.section.localeCompare(b.section));
    allClasses?.forEach(c => {
        console.log(`   Class ${c.grade_level}-${c.section} (${c.name || 'unnamed'}) - ID: ${c.id.slice(0, 8)}...`);
    });

    // 4. The student "balan" in Class 1-A
    console.log('\n📋 Student Chain Verification:\n');

    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('email', 'balanperiyasamy21@gmail.com')
        .single();

    if (student) {
        console.log(`   Student: ${student.name} (${student.email})`);
        console.log(`   Class: ${student.class}-${student.section}`);
        console.log(`   user_id: ${student.user_id}`);
        console.log(`   Status: ${student.status}`);

        // Check users entry
        const { data: userEntry } = await supabase
            .from('users')
            .select('*')
            .eq('id', student.user_id)
            .single();

        if (userEntry) {
            console.log(`\n   Users Entry: ${userEntry.email} (role: ${userEntry.role})`);
            console.log(`   auth_id: ${userEntry.auth_id}`);

            // Verify auth user
            const { data: authData } = await supabase.auth.admin.listUsers();
            const authUser = authData?.users.find(u => u.id === userEntry.auth_id);

            if (authUser) {
                console.log(`\n   Auth User: ✅ VERIFIED`);
                console.log(`   Email: ${authUser.email}`);
                console.log(`   Role in metadata: ${authUser.user_metadata?.role}`);
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🎯 NEXT STEP FOR USER:');
    console.log('   1. Open an INCOGNITO/PRIVATE browser window');
    console.log('   2. Go to http://localhost:5173');
    console.log('   3. Login with: balanperiyasamy21@gmail.com');
    console.log('   4. You should see: balan, Class 1-A');
}

verify().catch(console.error);
