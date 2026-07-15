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

async function testExec() {
    const queries = [
        { name: 'exec_sql sql_query', func: 'exec_sql', args: { sql_query: 'SELECT 1;' } },
        { name: 'exec_sql sql', func: 'exec_sql', args: { sql: 'SELECT 1;' } },
        { name: 'exec_sql query', func: 'exec_sql', args: { query: 'SELECT 1;' } },
        { name: 'execute_sql query', func: 'execute_sql', args: { query: 'SELECT 1;' } },
        { name: 'execute_sql sql', func: 'execute_sql', args: { sql: 'SELECT 1;' } },
        { name: 'run_sql sql', func: 'run_sql', args: { sql: 'SELECT 1;' } },
    ];

    for (const q of queries) {
        console.log(`Testing ${q.name}...`);
        const { data, error } = await supabase.rpc(q.func, q.args);
        if (error) {
            console.log(`  ❌ Failed: ${error.code} - ${error.message}`);
        } else {
            console.log(`  ✅ Success! Data:`, data);
        }
    }
}

testExec();
