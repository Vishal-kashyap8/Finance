-- ============================================================
-- Add Income Tax table
-- Run this script once against your FinanceTracker database
-- ============================================================

USE FinanceTracker;
GO

IF OBJECT_ID('dbo.IncomeTax', 'U') IS NULL
CREATE TABLE dbo.IncomeTax (
    TaxID           INT IDENTITY(1,1) PRIMARY KEY,
    AssessmentYear  NVARCHAR(10)    NOT NULL,   -- e.g. '2024-25'
    FinancialYear   NVARCHAR(10)    NOT NULL,   -- e.g. '2023-24'
    GrossIncome     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    TaxableIncome   DECIMAL(18,2)   NOT NULL DEFAULT 0,
    TaxPaid         DECIMAL(18,2)   NOT NULL DEFAULT 0,  -- Total tax actually paid
    TDSDeducted     DECIMAL(18,2)   NOT NULL DEFAULT 0,  -- Tax deducted at source
    AdvanceTax      DECIMAL(18,2)   NOT NULL DEFAULT 0,  -- Advance tax paid
    SelfAssessTax   DECIMAL(18,2)   NOT NULL DEFAULT 0,  -- Self-assessment tax
    Refund          DECIMAL(18,2)   NOT NULL DEFAULT 0,  -- Refund received (if any)
    TaxRegime       NVARCHAR(20)    NOT NULL DEFAULT 'New', -- 'Old' or 'New'
    FilingStatus    NVARCHAR(20)    NOT NULL DEFAULT 'Filed', -- 'Filed','Pending','Not Applicable'
    FilingDate      DATE            NULL,
    AcknowledgmentNo NVARCHAR(50)   NULL,
    Notes           NVARCHAR(500)   NULL,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

PRINT 'IncomeTax table created (or already exists).';
GO
