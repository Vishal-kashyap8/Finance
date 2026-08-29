-- ============================================================
-- Add EPFO (Employee Provident Fund) Accounts table
-- Run this script once against your FinanceTracker database
-- ============================================================

USE FinanceTracker;
GO

IF OBJECT_ID('dbo.EPFOAccounts', 'U') IS NULL
CREATE TABLE dbo.EPFOAccounts (
    EPFOID          INT IDENTITY(1,1) PRIMARY KEY,
    MemberName      NVARCHAR(100)   NOT NULL,
    UAN             NVARCHAR(20)    NULL,          -- Universal Account Number (12 digits)
    EmployerName    NVARCHAR(200)   NULL,
    Balance         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    Notes           NVARCHAR(500)   NULL,
    LastUpdated     DATETIME        NOT NULL DEFAULT GETDATE(),
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

PRINT 'EPFOAccounts table created (or already exists).';
GO
