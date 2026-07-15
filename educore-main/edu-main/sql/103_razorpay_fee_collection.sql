-- Migration Script: Razorpay Fee Collection Ecosystem
-- Adds fee_invoices, payment_receipts, and extends payments table.

-- Create Invoices Table
CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    fee_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter payments table to support invoices and Razorpay integration
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES fee_invoices(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES parents(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_status TEXT DEFAULT 'successful' CHECK (transaction_status IN ('pending', 'successful', 'failed', 'refunded'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NOW();

-- Create Receipts Table
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Configurations
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "invoices_parent_read" ON fee_invoices;
DROP POLICY IF EXISTS "invoices_admin_all" ON fee_invoices;
DROP POLICY IF EXISTS "receipts_parent_read" ON payment_receipts;
DROP POLICY IF EXISTS "receipts_admin_all" ON payment_receipts;
DROP POLICY IF EXISTS "payments_parent_read_new" ON payments;
DROP POLICY IF EXISTS "payments_parent_insert" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;

-- Invoices policies
CREATE POLICY "invoices_parent_read" ON fee_invoices FOR SELECT 
USING (student_id IN (SELECT get_my_student_ids()));

CREATE POLICY "invoices_admin_all" ON fee_invoices FOR ALL 
USING (is_admin());

-- Receipts policies
CREATE POLICY "receipts_parent_read" ON payment_receipts FOR SELECT 
USING (payment_id IN (
    SELECT id FROM payments WHERE student_id IN (SELECT get_my_student_ids())
));

CREATE POLICY "receipts_admin_all" ON payment_receipts FOR ALL 
USING (is_admin());

-- Payments policies
CREATE POLICY "payments_parent_read_new" ON payments FOR SELECT 
USING (student_id IN (SELECT get_my_student_ids()));

CREATE POLICY "payments_parent_insert" ON payments FOR INSERT 
WITH CHECK (student_id IN (SELECT get_my_student_ids()));

CREATE POLICY "payments_admin_all" ON payments FOR ALL 
USING (is_admin());

-- Sync trigger to create invoices from fee_records automatically
CREATE OR REPLACE FUNCTION sync_fee_records_to_invoices()
RETURNS TRIGGER AS $$
DECLARE
    target_parent_id UUID;
BEGIN
    -- Try to resolve parent_id linked to the student
    SELECT parent_id INTO target_parent_id FROM parent_student_links WHERE student_id = NEW.student_id LIMIT 1;

    INSERT INTO fee_invoices (id, student_id, parent_id, invoice_number, fee_type, amount, due_date, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.student_id,
        target_parent_id,
        'INV-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8),
        NEW.fee_type,
        NEW.amount,
        NEW.due_date,
        NEW.status::text,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE
    SET status = NEW.status::text,
        amount = NEW.amount,
        due_date = NEW.due_date,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_fee_records_to_invoices ON fee_records;
CREATE TRIGGER trigger_sync_fee_records_to_invoices
AFTER INSERT OR UPDATE ON fee_records
FOR EACH ROW
EXECUTE FUNCTION sync_fee_records_to_invoices();

-- Populate existing fee_records to fee_invoices
INSERT INTO fee_invoices (id, student_id, parent_id, invoice_number, fee_type, amount, due_date, status, created_at, updated_at)
SELECT 
    id,
    student_id,
    (SELECT parent_id FROM parent_student_links WHERE student_id = fee_records.student_id LIMIT 1),
    'INV-' || to_char(created_at, 'YYYYMMDD') || '-' || substring(id::text, 1, 8),
    fee_type,
    amount,
    due_date,
    status::text,
    created_at,
    updated_at
FROM fee_records
ON CONFLICT (id) DO NOTHING;
