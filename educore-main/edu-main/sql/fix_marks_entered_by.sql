-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Marks Entry Foreign Key Constraint
-- ISSUE: marks_entered_by_fkey constraint is blocking marks entry
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Drop the existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'marks_entered_by_fkey'
        AND table_name = 'marks'
    ) THEN
        ALTER TABLE marks DROP CONSTRAINT marks_entered_by_fkey;
        RAISE NOTICE 'Dropped existing marks_entered_by_fkey constraint';
    END IF;
END$$;

-- Step 2: Ensure the entered_by column allows NULL values
ALTER TABLE marks ALTER COLUMN entered_by DROP NOT NULL;

-- Step 3: Add a proper foreign key constraint to teachers table
-- This ensures that if entered_by is provided, it must be a valid teacher ID
ALTER TABLE marks 
    ADD CONSTRAINT marks_entered_by_fkey 
    FOREIGN KEY (entered_by) 
    REFERENCES teachers(id) 
    ON DELETE SET NULL;

-- Optional: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_marks_entered_by ON marks(entered_by);

-- Verification: Show the current constraints on marks table
SELECT 
    constraint_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'marks';
