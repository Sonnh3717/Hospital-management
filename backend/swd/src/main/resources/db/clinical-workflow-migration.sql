-- Run explicitly once after installing the original 28-table schema.
-- Additive migration; no database is selected or dropped, and no data is removed.
ALTER TABLE treatment_decisions
  ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT 'Doctor requires a saved follow-up request before encounter completion.';

-- Allow online appointment pre-payment before an encounter invoice is generated.
ALTER TABLE payments MODIFY COLUMN invoice_id BIGINT UNSIGNED NULL;
