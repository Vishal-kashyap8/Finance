-- ============================================================
-- Run in SSMS: Adds the Credit Cards table
-- ============================================================
USE FinanceTracker;
GO

IF OBJECT_ID('dbo.CreditCards', 'U') IS NULL
CREATE TABLE dbo.CreditCards (
    CardID          INT IDENTITY(1,1) PRIMARY KEY,
    Nickname        NVARCHAR(100)   NOT NULL,           -- e.g. "HDFC Regalia"
    BankName        NVARCHAR(100)   NOT NULL,           -- e.g. "HDFC Bank"
    CardNetwork     NVARCHAR(20)    NOT NULL DEFAULT 'Visa'
                        CHECK (CardNetwork IN ('Visa','Mastercard','Rupay','Amex','Diners')),
    LastFourDigits  CHAR(4)         NULL,               -- last 4 digits only
    CreditLimit     DECIMAL(18,2)   NOT NULL,           -- total sanctioned limit
    OutstandingAmt  DECIMAL(18,2)   NOT NULL DEFAULT 0, -- current amount due
    MinimumDue      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    BillingDate     INT             NULL                -- day of month, e.g. 15
                        CHECK (BillingDate BETWEEN 1 AND 31),
    DueDate         INT             NULL                -- day of month, e.g. 5
                        CHECK (DueDate BETWEEN 1 AND 31),
    AnnualFee       DECIMAL(18,2)   NOT NULL DEFAULT 0,
    RewardPoints    INT             NOT NULL DEFAULT 0,
    InterestRate    DECIMAL(5,2)    NULL,               -- APR %
    IsActive        BIT             NOT NULL DEFAULT 1,
    Notes           NVARCHAR(500)   NULL,
    LastUpdated     DATETIME        NOT NULL DEFAULT GETDATE(),
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- View: utilisation % per card + dashboard summary
CREATE OR ALTER VIEW dbo.vw_CreditCardSummary AS
SELECT
    CardID,
    Nickname,
    BankName,
    CardNetwork,
    LastFourDigits,
    CreditLimit,
    OutstandingAmt,
    MinimumDue,
    BillingDate,
    DueDate,
    AnnualFee,
    RewardPoints,
    InterestRate,
    IsActive,
    Notes,
    LastUpdated,
    CASE WHEN CreditLimit > 0
         THEN CAST(OutstandingAmt / CreditLimit * 100 AS DECIMAL(5,1))
         ELSE 0
    END AS UtilisationPct,
    CreditLimit - OutstandingAmt AS AvailableLimit
FROM dbo.CreditCards
WHERE IsActive = 1;
GO

PRINT 'CreditCards table and view created.';
GO
