
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

async function debugTimetable() {
    const targetId = '7ace5445-5618-4eef-834c-128967de9103';
    console.log(`Checking Timetable for Class ID: ${targetId}`);

    // Try fetching actual rows
    const { data, error, count } = await supabase
        .from('timetable_periods')
        .select('*', { count: 'exact' })
        .eq('class_id', targetId);

    if (error) {
        console.error('Error fetching timetable:', error);
    } else {
        console.log(`Found ${data?.length} periods.`);
        console.log(`Count: ${count}`);
        if (data && data.length > 0) {
            console.log('Sample:', data[0]);
        } else {
            // Check if ANY periods exist in DB
            const { count: total } = await supabase.from('timetable_periods').select('*', { count: 'exact', head: true });
            console.log(`Total Timetable Periods in DB: ${total}`);
        }
    }
}

debugTimetable();
