-- ============================================================
-- Add InterestAndFee column to IncomeTax table
-- Run this script once against your FinanceTracker database
-- ============================================================

USE FinanceTracker;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.IncomeTax') AND name = 'InterestAndFee'
)
BEGIN
    ALTER TABLE dbo.IncomeTax
    ADD InterestAndFee DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Column InterestAndFee added to IncomeTax.';
END
ELSE
    PRINT 'Column InterestAndFee already exists — skipped.';
GO
