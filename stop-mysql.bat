@echo off
:: Self-elevate to Administrator privileges if not already elevated
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo        Stopping MySQL80 Service (Instagram Clone)
echo ========================================================
echo.
net stop MySQL80
echo.
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] MySQL80 service is now STOPPED!
) else (
    echo [INFO] MySQL80 was already stopped or encountered an issue.
)
echo.
echo Press any key to exit...
pause >nul

