@echo off
title LUCY AI CORE ^& EMMA KERNEL - SOVEREIGN BOOTLOADER
color 0B
cls

echo =====================================================================
echo                 LUCY AI CORE ^& EMMA COGNITIVE ENGINE
echo                     Sovereign System Bootloader
echo =====================================================================
echo.

:: 1. Check Python installation
echo [*] Auditing Python3 Environment...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] WARNING: 'python' command not found in PATH. Trying 'python3'...
    where python3 >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python 3 is required to run the cognitive daemon but is not installed or not in PATH.
        echo Please install Python 3.10+ and add it to your environment variables.
        pause
        exit /b 1
    ) else (
        set PY_CMD=python3
    )
) else (
    set PY_CMD=python
)
echo [OK] Python Environment found.

:: 2. Install Python dependencies
echo [*] Installing required Python packages (requests, pydantic)...
%PY_CMD% -m pip install requests pydantic
if %errorlevel% neq 0 (
    echo [!] WARNING: Failed to install packages via pip. Proceeding assuming they are already installed.
) else (
    echo [OK] Python dependencies verified.
)
echo.

:: 3. Check Node.js installation
echo [*] Auditing Node.js Environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run the server but is not installed or not in PATH.
    echo Please install Node.js 18+ and try again.
    pause
    exit /b 1
)
echo [OK] Node.js Environment found.
echo.

:: 4. Install Node.js dependencies
echo [*] Installing Node.js packages from package.json...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run 'npm install'. Please resolve network issues and try again.
    pause
    exit /b 1
)
echo [OK] Node.js packages installed successfully.
echo.

:: 5. Compile and Build
echo [*] Bundling and building application for high-performance execution...
call npm run build
if %errorlevel% neq 0 (
    echo [!] WARNING: Build failed. Attempting to run in dev mode directly anyway.
) else (
    echo [OK] Client and Server successfully bundled.
)
echo.

:: 6. Launch App
echo =====================================================================
echo                SUCCESS: Bootstrapping complete!
echo            Launching Lucy ^& Emma sovereign simulation...
echo =====================================================================
echo.
call npm run dev

pause
