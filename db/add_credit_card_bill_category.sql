-- ============================================================
-- Run in SSMS: Adds Credit Card Bill to expense categories
-- ============================================================
USE FinanceTracker;
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.TransactionCategories
    WHERE Type = 'Expense'
      AND Name = 'Credit Card Bill'
)
BEGIN
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon)
    VALUES ('Expense', 'Credit Card Bill', NULL);
END
GO

PRINT 'Credit Card Bill expense category added.';
GO
