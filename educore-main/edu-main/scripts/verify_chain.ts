
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env loading
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseServiceKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
        }
    });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFullChain() {
    console.log('--- Verifying Full Timetable Chain ---');
    // 1. Get Class 1-A ID
    const { data: cls } = await supabase
        .from('classes')
        .select('id, name')
        .eq('grade_level', '1')
        .eq('section', 'A')
        .single();

    if (!cls) {
        console.error('Class 1-A not found!');
        return;
    }
    console.log(`Class: ${cls.name} (${cls.id})`);

    // 2. Get Timetable for this Class ID
    const { data: timetable } = await supabase
        .from('timetables')
        .select('id, status')
        .eq('class_id', cls.id)
        .single();

    if (!timetable) {
        console.error('Timetable record NOT FOUND for this class.');
        return;
    }
    console.log(`Timetable Found: ID ${timetable.id}, Status: ${timetable.status}`);

    // 3. Get Periods for this Timetable ID
    const { count, data } = await supabase
        .from('timetable_periods')
        .select('*', { count: 'exact' })
        .eq('timetable_id', timetable.id);

    console.log(`Periods Found: ${count}`);
    if (data && data.length > 0) {
        console.log(`Sample Period: Day ${data[0].day_of_week}, P${data[0].period_number}`);
    }
}

verifyFullChain();
