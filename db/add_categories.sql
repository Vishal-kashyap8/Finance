-- ============================================================
-- Run in SSMS: Adds additional Income & Expense categories
-- ============================================================
USE FinanceTracker;
GO

-- ── INCOME categories ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Income' AND Name='Freelance')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Income', 'Freelance', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Income' AND Name='Rental Income')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Income', 'Rental Income', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Income' AND Name='Dividends')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Income', 'Dividends', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Income' AND Name='Cashback & Rewards')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Income', 'Cashback & Rewards', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Income' AND Name='Gifts Received')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Income', 'Gifts Received', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Income' AND Name='Refund')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Income', 'Refund', NULL);

-- ── EXPENSE categories ───────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Electricity')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Electricity', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Mobile Recharge')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Mobile Recharge', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Internet')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Internet', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Gas / LPG')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Gas / LPG', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Water Bill')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Water Bill', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Groceries')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Groceries', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Healthcare')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Healthcare', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Education')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Education', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Subscriptions')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Subscriptions', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Fuel')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Fuel', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Dining Out')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Dining Out', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Entertainment')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Entertainment', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Home Maintenance')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Home Maintenance', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Personal Care')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Personal Care', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Gifts & Donations')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Gifts & Donations', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='Taxes & Fees')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'Taxes & Fees', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories WHERE Type='Expense' AND Name='EMI')
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES ('Expense', 'EMI', NULL);

GO

PRINT 'Additional Income & Expense categories added successfully.';
GO
