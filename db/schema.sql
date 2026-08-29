-- ============================================================
-- Personal Finance Tracker - SQL Server Schema
-- Run this script once against your local SQL Server instance
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FinanceTracker')
BEGIN
    CREATE DATABASE FinanceTracker;
END
GO

USE FinanceTracker;
GO

-- ============================================================
-- 1. BANK ACCOUNTS (Savings / Current)
-- ============================================================
IF OBJECT_ID('dbo.BankAccounts', 'U') IS NULL
CREATE TABLE dbo.BankAccounts (
    AccountID       INT IDENTITY(1,1) PRIMARY KEY,
    Nickname        NVARCHAR(100)   NOT NULL,
    BankName        NVARCHAR(100)   NOT NULL,
    AccountNumber   NVARCHAR(50)    NULL,
    AccountType     NVARCHAR(20)    NOT NULL CHECK (AccountType IN ('Savings','Current')),
    Balance         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    InterestRate    DECIMAL(5,2)    NULL,          -- annual %
    LastUpdated     DATETIME        NOT NULL DEFAULT GETDATE(),
    Notes           NVARCHAR(500)   NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 2. CASH HOLDINGS
-- ============================================================
IF OBJECT_ID('dbo.CashHoldings', 'U') IS NULL
CREATE TABLE dbo.CashHoldings (
    CashID          INT IDENTITY(1,1) PRIMARY KEY,
    Category        NVARCHAR(50)    NOT NULL CHECK (Category IN ('Cash in Hand','Wallet','Emergency Cash','Other')),
    Amount          DECIMAL(18,2)   NOT NULL DEFAULT 0,
    LastUpdated     DATETIME        NOT NULL DEFAULT GETDATE(),
    Notes           NVARCHAR(500)   NULL
);
GO

-- ============================================================
-- 3. FIXED DEPOSITS
-- ============================================================
IF OBJECT_ID('dbo.FixedDeposits', 'U') IS NULL
CREATE TABLE dbo.FixedDeposits (
    FDID            INT IDENTITY(1,1) PRIMARY KEY,
    BankName        NVARCHAR(100)   NOT NULL,
    AccountRef      NVARCHAR(100)   NULL,          -- FD number / nickname
    Principal       DECIMAL(18,2)   NOT NULL,
    InterestRate    DECIMAL(5,2)    NOT NULL,       -- annual %
    StartDate       DATE            NOT NULL,
    MaturityDate    DATE            NOT NULL,
    MaturityAmount  DECIMAL(18,2)   NOT NULL,
    InterestEarned  AS (MaturityAmount - Principal) PERSISTED,
    Status          NVARCHAR(10)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Matured','Broken')),
    Notes           NVARCHAR(500)   NULL,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 4. RECURRING DEPOSITS
-- ============================================================
IF OBJECT_ID('dbo.RecurringDeposits', 'U') IS NULL
CREATE TABLE dbo.RecurringDeposits (
    RDID                    INT IDENTITY(1,1) PRIMARY KEY,
    BankName                NVARCHAR(100)   NOT NULL,
    AccountRef              NVARCHAR(100)   NULL,
    MonthlyInstallment      DECIMAL(18,2)   NOT NULL,
    InterestRate            DECIMAL(5,2)    NOT NULL,  -- annual %
    StartDate               DATE            NOT NULL,
    MaturityDate            DATE            NOT NULL,
    TotalInstallments       INT             NOT NULL,
    InstallmentsPaid        INT             NOT NULL DEFAULT 0,
    AmountDeposited         AS (MonthlyInstallment * InstallmentsPaid) PERSISTED,
    ExpectedMaturityAmount  DECIMAL(18,2)   NOT NULL,
    Status                  NVARCHAR(10)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Matured','Closed')),
    Notes                   NVARCHAR(500)   NULL,
    CreatedAt               DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 5. INVESTMENTS
-- ============================================================
IF OBJECT_ID('dbo.Investments', 'U') IS NULL
CREATE TABLE dbo.Investments (
    InvestmentID    INT IDENTITY(1,1) PRIMARY KEY,
    Category        NVARCHAR(50)    NOT NULL CHECK (Category IN ('Mutual Fund','Stocks','PPF','NPS','Gold','Bonds','ETF','Other')),
    Name            NVARCHAR(200)   NOT NULL,
    InvestedAmount  DECIMAL(18,2)   NOT NULL,
    CurrentValue    DECIMAL(18,2)   NOT NULL,
    Units           DECIMAL(18,4)   NULL,
    StartDate       DATE            NULL,
    Notes           NVARCHAR(500)   NULL,
    LastUpdated     DATETIME        NOT NULL DEFAULT GETDATE(),
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 6. INCOME & EXPENSE CATEGORIES
-- ============================================================
IF OBJECT_ID('dbo.TransactionCategories', 'U') IS NULL
CREATE TABLE dbo.TransactionCategories (
    CategoryID      INT IDENTITY(1,1) PRIMARY KEY,
    Type            NVARCHAR(10)    NOT NULL CHECK (Type IN ('Income','Expense')),
    Name            NVARCHAR(100)   NOT NULL,
    Icon            NVARCHAR(10)    NULL
);
GO

-- ============================================================
-- 7. TRANSACTIONS (Income & Expenses)
-- ============================================================
IF OBJECT_ID('dbo.Transactions', 'U') IS NULL
CREATE TABLE dbo.Transactions (
    TransactionID   INT IDENTITY(1,1) PRIMARY KEY,
    Type            NVARCHAR(10)    NOT NULL CHECK (Type IN ('Income','Expense')),
    CategoryID      INT             NOT NULL REFERENCES dbo.TransactionCategories(CategoryID),
    Amount          DECIMAL(18,2)   NOT NULL,
    TransactionDate DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Description     NVARCHAR(500)   NULL,
    LinkedAccountID INT             NULL REFERENCES dbo.BankAccounts(AccountID),
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- DEFAULT CATEGORIES SEED
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.TransactionCategories)
BEGIN
    INSERT INTO dbo.TransactionCategories (Type, Name, Icon) VALUES
    ('Income',  'Salary',       '💼'),
    ('Income',  'Bonus',        '🎯'),
    ('Income',  'Interest',     '📈'),
    ('Income',  'Other Income', '💰'),
    ('Expense', 'Rent',         '🏠'),
    ('Expense', 'Food',         '🍽️'),
    ('Expense', 'Utilities',    '⚡'),
    ('Expense', 'Travel',       '✈️'),
    ('Expense', 'Shopping',     '🛍️'),
    ('Expense', 'Insurance',    '🛡️'),
    ('Expense', 'Credit Card Bill', '💳'),
    ('Expense', 'Other',        '📌');
END
GO

-- ============================================================
-- VIEWS
-- ============================================================

-- Net Worth Summary
CREATE OR ALTER VIEW dbo.vw_NetWorthSummary AS
SELECT
    'Bank Accounts'      AS Category,
    SUM(Balance)         AS TotalValue
FROM dbo.BankAccounts WHERE IsActive = 1
UNION ALL
SELECT
    'Cash Holdings',
    SUM(Amount)
FROM dbo.CashHoldings
UNION ALL
SELECT
    'Fixed Deposits',
    SUM(CASE WHEN Status = 'Active' THEN Principal ELSE 0 END)
FROM dbo.FixedDeposits
UNION ALL
SELECT
    'Recurring Deposits',
    SUM(CASE WHEN Status = 'Active' THEN AmountDeposited ELSE 0 END)
FROM dbo.RecurringDeposits
UNION ALL
SELECT
    'Investments',
    SUM(CurrentValue)
FROM dbo.Investments;
GO

-- Monthly Income vs Expense
CREATE OR ALTER VIEW dbo.vw_MonthlyFlow AS
SELECT
    YEAR(TransactionDate)  AS Yr,
    MONTH(TransactionDate) AS Mo,
    SUM(CASE WHEN Type = 'Income'  THEN Amount ELSE 0 END) AS TotalIncome,
    SUM(CASE WHEN Type = 'Expense' THEN Amount ELSE 0 END) AS TotalExpense,
    SUM(CASE WHEN Type = 'Income'  THEN Amount ELSE 0 END)
  - SUM(CASE WHEN Type = 'Expense' THEN Amount ELSE 0 END) AS NetSavings
FROM dbo.Transactions
GROUP BY YEAR(TransactionDate), MONTH(TransactionDate);
GO

-- FD Maturity Alert (maturing within 90 days)
CREATE OR ALTER VIEW dbo.vw_FDMaturityAlert AS
SELECT
    FDID, BankName, AccountRef, Principal, InterestRate,
    MaturityDate, MaturityAmount,
    DATEDIFF(DAY, GETDATE(), MaturityDate) AS DaysToMaturity
FROM dbo.FixedDeposits
WHERE Status = 'Active'
  AND MaturityDate <= DATEADD(DAY, 90, GETDATE());
GO

-- Expense breakdown by category (current month)
CREATE OR ALTER VIEW dbo.vw_CurrentMonthExpenses AS
SELECT
    tc.Name         AS Category,
    tc.Icon,
    SUM(t.Amount)   AS TotalAmount
FROM dbo.Transactions t
JOIN dbo.TransactionCategories tc ON t.CategoryID = tc.CategoryID
WHERE t.Type = 'Expense'
  AND YEAR(t.TransactionDate)  = YEAR(GETDATE())
  AND MONTH(t.TransactionDate) = MONTH(GETDATE())
GROUP BY tc.Name, tc.Icon;
GO

PRINT 'FinanceTracker schema created successfully.';
GO
