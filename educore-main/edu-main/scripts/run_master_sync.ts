
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env parser
function loadEnv() {
    try {
        // Try both relative to script and CWD
        const pathsToCheck = [
            path.join(process.cwd(), '.env'),
            path.join(__dirname, '../.env')
        ];

        let found = false;

        for (const envPath of pathsToCheck) {
            if (fs.existsSync(envPath)) {
                console.log(`Loading .env from: ${envPath}`);
                const content = fs.readFileSync(envPath, 'utf8');
                const lines = content.split('\n');

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

                    const eqIdx = trimmedLine.indexOf('=');
                    if (eqIdx > 0) {
                        const key = trimmedLine.substring(0, eqIdx).trim();
                        let value = trimmedLine.substring(eqIdx + 1).trim();
                        // Remove quotes
                        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }
                        process.env[key] = value;
                        console.log(`   -> Set ${key}=${value.substring(0, 3)}...`);
                    } else {
                        console.log(`   -> Ignored: [${trimmedLine}]`);
                    }
                }
                found = true;
                break; // Stop after first valid .env found
            } else {
                console.log('Env file not found at:', envPath);
            }
        }

        if (!found) {
            console.warn('⚠️ No .env file found in checked locations.');
        }
    } catch (e) {
        console.warn('Could not load .env file manually', e);
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// We need SERVICE ROLE KEY to bypass RLS
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('Current Keys:', {
        URL: !!supabaseUrl,
        SERVICE_KEY: !!serviceKey
    });
    process.exit(1);
}

// Use Service Role Key to bypass RLS for administrative tasks
const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runSqlFile(filePath: string) {
    console.log(`\nExecuting SQL file: ${path.basename(filePath)}...`);

    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Try to execute via RPC if available, otherwise just warn user
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

        if (error) {
            if (error.message.includes('function "exec_sql" does not exist') || error.code === 'PGRST202') {
                console.log("⚠️  'exec_sql' RPC function not found.");
                console.log("👉 Please copy the content of '" + path.basename(filePath) + "' and run it in the Supabase SQL Editor.");
                return;
            }
            console.error('Error executing SQL:', error);
        } else {
            console.log('✅ SQL executed successfully.');
        }

    } catch (err: any) {
        console.error('File read error:', err.message);
    }
}

async function main() {
    console.log('Starting Master Data Sync...');

    // Check connection first
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
        console.error('Connection Check Failed:', error.message);
        if (error.message.includes('JWT')) {
            console.error('Invalid Service Role Key used.');
        }
        return;
    } else {
        console.log('✅ Database connected.');
    }

    const syncScriptPath = path.join(__dirname, '../sql/master_data_sync.sql');
    await runSqlFile(syncScriptPath);

    console.log('\nStarting Verification...');
    const verifyScriptPath = path.join(__dirname, '../sql/verify_data_sync.sql');
    await runSqlFile(verifyScriptPath);
}

main();
