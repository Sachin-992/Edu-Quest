
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
// Load env
const envPaths = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        console.log(`Loading .env from ${envPath}`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');
        for (const line of envLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;
            const eqIdx = trimmedLine.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmedLine.substring(0, eqIdx).trim();
                let value = trimmedLine.substring(eqIdx + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        }
        break;
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPeriods() {
    console.log('--- DEBUGGING PERIODS FOR DEVI ---');

    // 1. Get Devi's Teacher Profile
    const { data: teachers, error: tErr } = await supabase
        .from('teachers')
        .select('*')
        .ilike('name', '%Devi%'); // Assuming name Devi based on email

    if (tErr || !teachers?.length) {
        console.error('Teacher not found or error:', tErr);
        // Try getting by email
        const { data: tByEmail } = await supabase.from('teachers').select('*').eq('email', 'devi11@gmail.com');
        if (!tByEmail?.length) return;
        console.log('Found teacher by email:', tByEmail[0].id, tByEmail[0].name);
        await checkPeriods(tByEmail[0].id);
        return;
    }

    const teacherId = teachers[0].id;
    console.log(`Found Teacher: ${teachers[0].name} (ID: ${teacherId})`);

    await checkPeriods(teacherId);
}

async function checkPeriods(teacherId: string) {
    // 2. Run the exact query from academicService (without filters first)
    console.log('\n--- Checking Raw Periods ---');
    const { data: periods, error } = await supabase
        .from('timetable_periods')
        .select(`
            id, period_number, start_time, end_time, subject, day_of_week, teacher_id,
            timetable:timetables(id, status, class_id)
        `)
        .eq('teacher_id', teacherId);

    if (error) {
        console.error('Error fetching periods:', error);
        return;
    }

    console.log(`Found ${periods?.length || 0} periods.`);
    if (periods && periods.length > 0) {
        periods.forEach(p => {
            console.log(`- [${p.day_of_week}] P${p.period_number}: ${p.subject} (Status: ${p.timetable?.status})`);
        });
    } else {
        console.log('Checking all periods to see if any exist for anyone...');
        const { count } = await supabase.from('timetable_periods').select('*', { count: 'exact', head: true });
        console.log(`Total periods in DB: ${count}`);
    }
}

debugPeriods();
