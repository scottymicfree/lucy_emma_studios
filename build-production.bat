@echo off
echo ==============================================
echo Building Lucy ^& Emma Control Studio
echo ==============================================

echo [1/3] Installing NPM dependencies...
call npm install

echo [2/3] Building frontend assets (Vite + TypeScript)...
call npm run build

echo [3/3] Please use your preferred Electron packager (e.g., electron-builder)
echo Configuration should target the compiled 'dist' folder.
echo For example: call npx electron-builder
echo Done!
pause
