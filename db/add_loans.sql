-- ============================================================
-- Run in SSMS: Creates the Loans table
-- Tracks money borrowed from others AND money lent to others
-- ============================================================
USE FinanceTracker;
GO

IF OBJECT_ID('dbo.Loans', 'U') IS NULL
CREATE TABLE dbo.Loans (
    LoanID              INT IDENTITY(1,1) PRIMARY KEY,
    LoanType            NVARCHAR(10)    NOT NULL
                            CHECK (LoanType IN ('Borrowed','Lent')),
                            -- Borrowed = you owe someone | Lent = someone owes you
    PersonName          NVARCHAR(150)   NOT NULL,   -- who you borrowed from / lent to
    Description         NVARCHAR(500)   NULL,        -- purpose / notes
    PrincipalAmount     DECIMAL(18,2)   NOT NULL,    -- original loan amount
    OutstandingAmount   DECIMAL(18,2)   NOT NULL,    -- remaining to pay/receive
    InterestRate        DECIMAL(5,2)    NULL,         -- annual % (optional)
    LoanDate            DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    DueDate             DATE            NULL,
    Status              NVARCHAR(10)    NOT NULL DEFAULT 'Active'
                            CHECK (Status IN ('Active','Settled','Partial')),
    LinkedAccountID     INT             NULL REFERENCES dbo.BankAccounts(AccountID),
    Notes               NVARCHAR(500)   NULL,
    CreatedAt           DATETIME        NOT NULL DEFAULT GETDATE(),
    LastUpdated         DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

PRINT 'Loans table created successfully.';
GO
