
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

async function getInfo() {
    const { data: students, error } = await supabase
        .from('students')
        .select('email, date_of_birth')
        .ilike('email', 'Balanperiyasamy21@gmail.com');

    if (students && students.length > 0) {
        const s = students[0];
        console.log(`Email: ${s.email}`);
        console.log(`DOB: ${s.date_of_birth}`);
        // Assuming format YYYY-MM-DD, password is typically DDMMYYYY if that's the logic.
        // Let's print raw DOB to interpret.
    } else {
        console.log('Student not found');
    }
}

getInfo();
