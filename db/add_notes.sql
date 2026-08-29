-- ============================================================
-- add_notes.sql  — Payment Reminders & Notes
-- Safe to re-run (idempotent)
-- ============================================================
USE FinanceTracker;
GO

IF OBJECT_ID('dbo.Notes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notes (
    NoteID       INT            IDENTITY(1,1) PRIMARY KEY,
    Title        NVARCHAR(200)  NOT NULL,
    NoteType     NVARCHAR(20)   NOT NULL DEFAULT 'Note',   -- 'Payment','Note','Reminder','Todo'
    Priority     NVARCHAR(10)   NOT NULL DEFAULT 'Medium', -- 'High','Medium','Low'
    Status       NVARCHAR(20)   NOT NULL DEFAULT 'Pending',-- 'Pending','Done','Snoozed'
    Amount       DECIMAL(18,2)  NULL,
    DueDate      DATE           NULL,
    Tags         NVARCHAR(300)  NULL,
    Body         NVARCHAR(2000) NULL,
    CreatedAt    DATETIME       NOT NULL DEFAULT GETDATE(),
    LastUpdated  DATETIME       NOT NULL DEFAULT GETDATE()
  );
  PRINT 'Notes table created.';
END
ELSE
  PRINT 'Notes table already exists — skipped.';
GO
