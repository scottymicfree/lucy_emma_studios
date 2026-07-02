@echo off
echo ==============================================
echo Installing Prerequisites for Lucy ^& Emma Studio
echo ==============================================

echo [1/3] Checking Node.js environment...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js is not installed or not in PATH!
    echo Please install Node.js v18+ and try again.
    pause
    exit /b 1
)

echo [2/3] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python is not installed or not in PATH!
    echo Please install Python 3.10+ and try again.
    pause
    exit /b 1
)

echo [3/3] Installing NPM packages...
call npm install

echo Prerequisites installation complete!
pause
