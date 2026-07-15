import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    try {
        const pathsToCheck = [
            path.join(process.cwd(), '.env'),
            path.join(__dirname, '../.env')
        ];

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
                        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }
                        process.env[key] = value;
                    }
                }
                break;
            }
        }
    } catch (e) {
        console.warn('Could not load .env file manually', e);
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyExamSchema() {
    console.log('🔧 Applying Exam & Marks Publishing schema...');

    const sqlPath = path.join(__dirname, '../sql/106_exam_marks_management.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error(`SQL file not found at ${sqlPath}`);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    let { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

    if (error) {
        console.log('Error with sql_query parameter, trying sql parameter...');
        const res = await supabase.rpc('exec_sql', { sql: sqlContent });
        error = res.error;
        data = res.data;
    }

    if (error) {
        console.error('❌ Error executing SQL:', error);
        console.log("👉 Please run the content of '106_exam_marks_management.sql' in the Supabase SQL Editor manually.");
        process.exit(1);
    }

    console.log('✅ Exam & Marks Publishing schema applied successfully!');
}

applyExamSchema();
