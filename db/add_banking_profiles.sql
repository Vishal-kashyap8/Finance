-- ============================================================
-- Banking Profiles — credential vault per bank
-- Run once against FinanceTracker database.
-- Sensitive columns (AccountNumber, CustomerID,
-- NetBankingLoginID, NetBankingPassword) are stored as
-- VARBINARY(500) and encrypted/decrypted server-side using
-- ENCRYPTBYPASSPHRASE / DECRYPTBYPASSPHRASE with the key
-- stored in the backend .env file (DB_ENCRYPT_KEY).
-- ============================================================

USE FinanceTracker;
GO

IF OBJECT_ID('dbo.BankingProfiles', 'U') IS NULL
CREATE TABLE dbo.BankingProfiles (
    ProfileID           INT IDENTITY(1,1)   PRIMARY KEY,

    -- Identity / display
    BankName            NVARCHAR(100)       NOT NULL,
    Nickname            NVARCHAR(100)       NOT NULL,
    AccountType         NVARCHAR(20)        NOT NULL DEFAULT 'Savings'
                            CHECK (AccountType IN ('Savings','Current','NRE','NRO','Other')),

    -- Branch details (non-sensitive)
    IFSCCode            NVARCHAR(20)        NULL,
    MICRCode            NVARCHAR(20)        NULL,
    BranchName          NVARCHAR(200)       NULL,
    BranchCity          NVARCHAR(100)       NULL,

    -- Contact (non-sensitive)
    RegisteredMobile    NVARCHAR(50)        NULL,
    RegisteredEmail     NVARCHAR(200)       NULL,

    -- Debit card (non-sensitive — last 4 + expiry only)
    DebitCardLast4      NVARCHAR(10)        NULL,
    DebitCardExpiry     NVARCHAR(10)        NULL,   -- MM/YY

    -- UPI / misc (non-sensitive)
    UPIIds              NVARCHAR(500)       NULL,   -- comma-separated
    Notes               NVARCHAR(1000)      NULL,

    -- ── SENSITIVE — stored encrypted ──────────────────────
    -- Values are written as CONVERT(NVARCHAR(500), ENCRYPTBYPASSPHRASE(...), 1)
    -- and read back as CONVERT(NVARCHAR(500), DECRYPTBYPASSPHRASE(..., CONVERT(VARBINARY(500), col, 1)))
    AccountNumber       NVARCHAR(500)       NULL,
    CustomerID          NVARCHAR(500)       NULL,
    NetBankingLoginID   NVARCHAR(500)       NULL,
    NetBankingPassword  NVARCHAR(500)       NULL,
    -- ──────────────────────────────────────────────────────

    CreatedAt           DATETIME            NOT NULL DEFAULT GETDATE(),
    LastUpdated         DATETIME            NOT NULL DEFAULT GETDATE()
);
GO

PRINT 'dbo.BankingProfiles created (or already exists).';
GO
