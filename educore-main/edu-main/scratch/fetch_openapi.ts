import fetch from 'node-fetch';
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
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
    if (!supabaseUrl || !anonKey) {
        console.error('Missing env vars');
        return;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
    const data = await response.json();
    
    console.log('Exposed RPCs:');
    const paths = Object.keys((data as any).paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    rpcs.forEach(r => console.log(r));
}

run();
