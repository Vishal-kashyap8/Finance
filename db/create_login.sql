-- ============================================================
-- Run this in SSMS connected to your SQL Server instance
-- This creates the SQL login + database user for the app
-- ============================================================

USE master;
GO

-- 1. Create the SQL Server login (server-level)
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'FinanceTracker')
BEGIN
    CREATE LOGIN [FinanceTracker] WITH PASSWORD = 'Krishna@84742582',
        DEFAULT_DATABASE = [FinanceTracker],
        CHECK_EXPIRATION = OFF,
        CHECK_POLICY = OFF;
    PRINT 'Login FinanceTracker created.';
END
ELSE
    PRINT 'Login FinanceTracker already exists.';
GO

-- 2. Switch to the FinanceTracker database
USE FinanceTracker;
GO

-- 3. Create the database user mapped to the login
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'FinanceTracker')
BEGIN
    CREATE USER [FinanceTracker] FOR LOGIN [FinanceTracker];
    PRINT 'Database user FinanceTracker created.';
END
ELSE
    PRINT 'Database user FinanceTracker already exists.';
GO

-- 4. Grant db_owner (full access to all tables/views)
ALTER ROLE db_owner ADD MEMBER [FinanceTracker];
PRINT 'Role granted.';
GO

-- 5. Verify
SELECT 
    sp.name         AS LoginName,
    sp.type_desc    AS LoginType,
    dp.name         AS DBUser,
    dp.type_desc    AS UserType
FROM sys.server_principals sp
JOIN sys.database_principals dp ON sp.sid = dp.sid
WHERE sp.name = 'FinanceTracker';
GO
