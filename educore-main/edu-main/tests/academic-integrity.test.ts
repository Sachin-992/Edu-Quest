
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase client (Available in Test Env)
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Academic Integrity Constraints', () => {
    const TEST_GRADE = 'TEST_GRADE_' + Date.now();
    const TEST_SECTION = 'Z';
    let classId: string;

    // Cleanup before and after
    const cleanup = async () => {
        if (classId) {
            await supabase.from('subjects').delete().eq('class_id', classId);
            await supabase.from('classes').delete().eq('id', classId);
        }
    };

    beforeAll(async () => {
        // Ensure clean state
    });

    afterAll(async () => {
        await cleanup();
    });

    it('should create a valid Class', async () => {
        const { data, error } = await supabase.from('classes').insert({
            grade_level: TEST_GRADE,
            section: TEST_SECTION,
            status: 'active'
        }).select().single();

        expect(error).toBeNull();
        expect(data).toHaveProperty('id');
        classId = data.id;
    });

    it('should PREVENT duplicate Classes (Same Grade+Section)', async () => {
        const { error } = await supabase.from('classes').insert({
            grade_level: TEST_GRADE,
            section: TEST_SECTION,
            status: 'active'
        });

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23505'); // Unique Violation
    });

    it('should create a valid Subject in the Class', async () => {
        const { data, error } = await supabase.from('subjects').insert({
            class_id: classId,
            name: 'Quantum Physics',
            code: 'QP-101',
            status: 'active'
        }).select().single();

        expect(error).toBeNull();
        expect(data).toHaveProperty('id');
    });

    it('should PREVENT duplicate Subjects in the SAME Class', async () => {
        const { error } = await supabase.from('subjects').insert({
            class_id: classId,
            name: 'Quantum Physics', // Same name
            code: 'QP-102', // Different code shouldn't matter if name is unique constraint
            status: 'active'
        });

        expect(error).not.toBeNull();
        // Expect unique violation on (class_id, name)
        expect(error?.code).toBe('23505');
    });

    it('should ALLOW same Subject name in DIFFERENT Class', async () => {
        // Create Class 2
        const { data: class2 } = await supabase.from('classes').insert({
            grade_level: TEST_GRADE + '_2',
            section: TEST_SECTION,
            status: 'active'
        }).select().single();

        expect(class2).toBeDefined();

        // Create same subject name
        const { data: subject2, error: subError } = await supabase.from('subjects').insert({
            class_id: class2.id,
            name: 'Quantum Physics',
            code: 'QP-101',
            status: 'active'
        }).select();

        expect(subError).toBeNull();
        expect(subject2).toBeDefined();

        // Cleanup Class 2
        await supabase.from('subjects').delete().eq('class_id', class2.id);
        await supabase.from('classes').delete().eq('id', class2.id);
    });
});
