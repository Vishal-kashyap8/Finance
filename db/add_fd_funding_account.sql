-- Migration for existing FinanceTracker databases.
-- Adds the bank account that funds each Fixed Deposit.
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.FixedDeposits')
      AND name = 'LinkedAccountID'
)
BEGIN
    ALTER TABLE dbo.FixedDeposits
        ADD LinkedAccountID INT NULL
            CONSTRAINT FK_FixedDeposits_BankAccounts
            FOREIGN KEY (LinkedAccountID) REFERENCES dbo.BankAccounts(AccountID);
END;
GO
