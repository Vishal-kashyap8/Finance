@echo off
echo =======================================
echo   Personal Finance Tracker - Starting
echo =======================================
echo.

REM Start Node.js server in a minimised background window
start /min "FinanceServer" cmd /c "cd /d "%~dp0backend" && node server.js"

REM Wait until server responds (up to 15 seconds)
echo Waiting for server to start...
set attempts=0
:wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1
curl -s -o nul -w "%%{http_code}" http://localhost:3001 2>nul | findstr /r "^[23]" >nul
if %errorlevel% equ 0 goto server_ready
if %attempts% geq 15 goto timeout_error
goto wait_loop

:server_ready
echo Server is ready!
echo Opening Personal Finance Tracker...
start "" "http://localhost:3001"
echo.
echo [Server is running in the background]
echo [Close the minimised "FinanceServer" window to stop it]
exit /b 0

:timeout_error
echo.
echo [ERROR] Server did not start in time.
echo Check that Node.js is installed and backend\.env is configured.
pause
exit /b 1
