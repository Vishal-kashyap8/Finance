-- ============================================================
-- Run in SSMS: fixes the ?? emoji issue by clearing the Icon
-- column (emoji will now come from the frontend icon map)
-- ============================================================
USE FinanceTracker;
GO

-- Clear all emoji icons (they corrupt in NVARCHAR on many collations)
UPDATE dbo.TransactionCategories SET Icon = NULL;
GO

PRINT 'Icons cleared. Frontend will render icons from its own map.';
GO
