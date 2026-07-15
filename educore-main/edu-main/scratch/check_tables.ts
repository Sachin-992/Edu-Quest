import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
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
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, serviceKey!);

async function check() {
    console.log('Checking fee_invoices...');
    const { data: data1, error: err1 } = await supabase.from('fee_invoices').select('*').limit(1);
    console.log('fee_invoices select:', { data: data1, error: err1 });

    console.log('Checking payment_receipts...');
    const { data: data2, error: err2 } = await supabase.from('payment_receipts').select('*').limit(1);
    console.log('payment_receipts select:', { data: data2, error: err2 });
}

check();
