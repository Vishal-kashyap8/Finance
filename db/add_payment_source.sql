-- ============================================================
-- Run in SSMS: Adds PaymentSource tracking to Transactions
-- ============================================================
USE FinanceTracker;
GO

-- 1. Add PaymentSource column (Cash/Salary/Credit Card/Bank Account/Other)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Transactions') AND name='PaymentSource')
    ALTER TABLE dbo.Transactions
        ADD PaymentSource NVARCHAR(30) NULL
            CHECK (PaymentSource IN ('Cash','Salary','Bank Account','Credit Card','Other') OR PaymentSource IS NULL);
GO

-- 2. Add LinkedCardID so we can link directly to a credit card
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Transactions') AND name='LinkedCardID')
    ALTER TABLE dbo.Transactions
        ADD LinkedCardID INT NULL
            REFERENCES dbo.CreditCards(CardID);
GO

PRINT 'PaymentSource and LinkedCardID columns added to Transactions.';
GO
