-- Run explicitly once after installing the original 28-table schema.
-- Additive migration; no database is selected or dropped, and no data is removed.
ALTER TABLE treatment_decisions
  ADD COLUMN follow_up_required BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT 'Doctor requires a saved follow-up request before encounter completion.';
