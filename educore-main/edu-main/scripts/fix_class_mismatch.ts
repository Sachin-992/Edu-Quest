
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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Service Credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixClass() {
    console.log('--- Starting Class Fix ---');

    // 1. Find the Generic Class 1
    const { data: genericClass, error: findError } = await supabase
        .from('classes')
        .select('*')
        .eq('grade_level', '1')
        .is('section', null) // Check for null section
        .single();

    if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding Generic Class:', findError);
        return;
    }

    if (!genericClass) {
        console.log('Generic Class 1 (Section NULL) not found. Checking if Class 1-A already exists...');
        const { data: class1A } = await supabase
            .from('classes')
            .select('*')
            .eq('grade_level', '1')
            .eq('section', 'A')
            .single();

        if (class1A) {
            console.log('Class 1-A ALREADY EXISTS due to previous fix. ID:', class1A.id);
            return;
        } else {
            console.log('Neither Generic Class 1 nor Class 1-A found. Something is wrong.');
            return;
        }
    }

    console.log('Found Generic Class 1:', genericClass.id);
    console.log('Updating to Section A...');

    const { data: updated, error: updateError } = await supabase
        .from('classes')
        .update({ section: 'A', name: 'Class 1-A' }) // Update Name too for clarity
        .eq('id', genericClass.id)
        .select();

    if (updateError) {
        console.error('Update Failed:', updateError);
    } else {
        console.log('Update Successful:', updated);
    }
}

fixClass();
