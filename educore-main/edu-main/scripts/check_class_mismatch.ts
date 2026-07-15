
import { createClient } from '@supabase/supabase-js';

// Credentials from .env
const SUPABASE_URL = 'https://aszxjvvelshyuaipuwwn.supabase.co';
// Using SERVICE ROLE KEY to bypass RLS
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkData() {
    console.log('--- Checking Classes (Service Role) ---');
    const { data: classes } = await supabase.from('classes').select('id, grade_level, section');
    console.table(classes);

    console.log('\n--- Checking Students (Service Role) ---');
    const { data: students } = await supabase.from('students').select('id, name, class, section');
    console.table(students);

    if (students && students.length > 0 && classes) {
        const s = students[0];
        const match = classes.find(c => c.grade_level == s.class && c.section == s.section);
        console.log(`\nChecking match for student "${s.name}" (Class: ${s.class}, Section: ${s.section})`);
        if (match) console.log("✅ Match found in Classes table.");
        else console.log("❌ No exact match found in Classes table.");
    }
}

checkData();
