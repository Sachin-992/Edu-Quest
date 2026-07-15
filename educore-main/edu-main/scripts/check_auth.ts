
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPaths = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
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

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserAuth() {
    console.log('--- CHECKING AUTH LINKAGE ---');

    // 1. Get Devi
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, auth_id')
        .eq('email', 'devi11@gmail.com');

    if (error || !users?.length) {
        console.error('User Devi not found in "users" table!');
        return;
    }

    const user = users[0];
    console.log(`User: ${user.email}`);
    console.log(`- App ID: ${user.id}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Auth ID (Supabase): ${user.auth_id}`);

    if (!user.auth_id) {
        console.error('❌ CRITICAL: auth_id is NULL! RLS will fail.');
    } else {
        console.log('✅ auth_id is present.');
    }

    // Check if this auth_id actually exists in auth.users (can't do via ID select easily with admin API sometimes, but let's try listed RPC or just assume if it looks like UUID it's ok)
    // Actually with Service Role we can access auth.users via admin.

    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authUsers) {
        const authUser = authUsers.find(u => u.email === 'devi11@gmail.com');
        if (authUser) {
            console.log(`Auth System ID: ${authUser.id}`);
            if (authUser.id === user.auth_id) {
                console.log('✅ IDs Match!');
            } else {
                console.error(`❌ MISMATCH: users.auth_id (${user.auth_id}) != auth.users.id (${authUser.id})`);
            }
        } else {
            console.error('❌ User not found in Supabase Auth system (maybe not signed up?)');
        }
    }
}

checkUserAuth();
