import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock import.meta.env for Node.js environment
// @ts-ignore
global.import = global.import || {};
// @ts-ignore
if (typeof import.meta === 'undefined') {
    // @ts-ignore
    import.meta = {};
}
// @ts-ignore
import.meta.env = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://aszxjvvelshyuaipuwwn.supabase.co",
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg3NDUsImV4cCI6MjA4NDYyNDc0NX0.eYd0ZJmy3J9O4YQse8NMWvbC3QcN1bis9JneYtTdEZ8"
};

import { supabase } from '../services/supabaseClient';

async function test() {
    try {
        const { data, error } = await supabase!
            .from('timetable_periods')
            .select(`
                *,
                subject:subjects(name, code),
                teacher:teachers(name)
            `);
        
        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('Total periods:', data?.length);
        if (data && data.length > 0) {
            for (let i = 0; i < Math.min(data.length, 5); i++) {
                const item = data[i];
                console.log(`Period ${i}:`);
                console.log('  subject field value:', item.subject);
                console.log('  subject field type:', typeof item.subject);
                console.log('  subject.name:', item.subject?.name);
                console.log('  activity_label:', item.activity_label);
            }
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

test();
