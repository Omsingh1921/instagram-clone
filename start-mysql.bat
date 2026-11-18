
@echo off
setlocal EnableExtensions

title MySQL + Apache Kafka Launcher

:: ========================================================
:: SELF-ELEVATE TO ADMINISTRATOR
:: ========================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: ========================================================
:: CONFIGURATION
:: ========================================================

set "KAFKA_HOME=C:\kafka_2.13-4.3.1"
set "CONFIG=%KAFKA_HOME%\config\server.properties"
set "STORAGE=C:\kafka-data\kraft-combined-logs"
set "CLUSTER_FILE=%KAFKA_HOME%\cluster-id.txt"

echo ========================================================
echo       MYSQL + APACHE KAFKA ONE-CLICK LAUNCHER
echo ========================================================
echo.

:: ========================================================
:: START MYSQL
:: ========================================================

echo [INFO] Starting MySQL80 Service...

net start MySQL80

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] MySQL80 started successfully.
) else (
    echo [INFO] MySQL80 may already be running.
)

echo.

:: ========================================================
:: CHECK KAFKA INSTALLATION
:: ========================================================

if not exist "%KAFKA_HOME%\bin\windows\kafka-server-start.bat" (
    echo [ERROR] Kafka installation not found!
    pause
    exit /b 1
)

if not exist "%CONFIG%" (
    echo [ERROR] Kafka server.properties not found!
    pause
    exit /b 1
)

:: ========================================================
:: INITIALIZE KRAFT STORAGE ONLY ON FIRST RUN
:: ========================================================

if not exist "%STORAGE%\meta.properties" (

    echo [INFO] First-time Kafka initialization...

    if exist "%CLUSTER_FILE%" (
        set /p CLUSTER_ID=<"%CLUSTER_FILE%"
    ) else (
        for /f "delims=" %%i in ('"%KAFKA_HOME%\bin\windows\kafka-storage.bat" random-uuid') do (
            set "CLUSTER_ID=%%i"
        )
    )

    if not defined CLUSTER_ID (
        echo [ERROR] Cluster ID generation failed.
        pause
        exit /b 1
    )

    echo %CLUSTER_ID%>"%CLUSTER_FILE%"

    echo [INFO] Formatting Kafka KRaft storage...

    call "%KAFKA_HOME%\bin\windows\kafka-storage.bat" format --standalone --cluster-id "%CLUSTER_ID%" --config "%CONFIG%"

    if errorlevel 1 (
        echo [ERROR] Kafka storage formatting failed!
        pause
        exit /b 1
    )

    echo [SUCCESS] Kafka storage formatted.
) else (
    echo [INFO] Existing Kafka storage detected.
)

:: ========================================================
:: START KAFKA IN SEPARATE WINDOW
:: ========================================================

echo.
echo [INFO] Starting Apache Kafka...

start "Apache Kafka Server" cmd /k "cd /d "%KAFKA_HOME%" && bin\windows\kafka-server-start.bat config\server.properties"

echo.
echo ========================================================
echo              ALL SERVICES LAUNCHED
echo ========================================================
echo.
echo MySQL     : localhost:3306
echo Kafka     : localhost:9092
echo Controller: localhost:9093
echo.
echo [SUCCESS] Launcher completed.
echo.

pause
