@echo off
echo ============================================
echo   Personal Finance Tracker - Setup Script
echo ============================================
echo.

REM Check Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Download from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

echo.
echo [STEP 1] Setting up database in SQL Server...
echo   Run db\schema.sql in SQL Server Management Studio (SSMS) or sqlcmd:
echo   sqlcmd -S localhost -E -i db\schema.sql
echo.

echo [STEP 2] Configuring backend...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo   Created backend\.env from template. Edit it if needed.
) else (
    echo   backend\.env already exists.
)

echo.
echo [STEP 3] Installing dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo   Setup complete!
echo   Start the server with:  start.bat
echo ============================================
pause
