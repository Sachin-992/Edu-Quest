import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

async function checkTable() {
    console.log('Checking if user_preferences table exists...');
    const { data, error } = await supabase.from('user_preferences').select('*').limit(1);
    if (error) {
        console.log('❌ Error: Table probably does not exist:', error);
    } else {
        console.log('✅ Success! Table exists. Data:', data);
    }
}

checkTable();
