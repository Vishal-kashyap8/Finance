-- ============================================================
-- Run this ONLY if SQL Server is in Windows Auth only mode
-- and you want to enable Mixed Mode (SQL + Windows Auth)
-- Requires sysadmin rights. Restart SQL Server service after.
-- ============================================================

USE master;
GO

-- Enable Mixed Authentication Mode
EXEC xp_instance_regwrite
    N'HKEY_LOCAL_MACHINE',
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode',
    REG_DWORD,
    2;   -- 1 = Windows only, 2 = Mixed mode
GO

PRINT 'Mixed mode enabled. You MUST restart the SQL Server service now.';
PRINT 'In SSMS: right-click server > Restart, OR run:';
PRINT '   net stop MSSQLSERVER && net start MSSQLSERVER';
GO
