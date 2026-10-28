@echo off
title EduHunters - Auto Setup & Launch
color 0b

echo ========================================================
echo         EduHunters - New Device Auto Setup
echo ========================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is NOT installed on this computer!
    echo Please download and install Node.js (LTS version) from:
    echo https://nodejs.org/
    echo.
    echo After installing Node.js, run this file again.
    pause
    exit /b
)

echo [OK] Node.js is installed.
node -v
echo.

:: 2. Check .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy .env.example .env >nul
    ) else (
        echo [WARNING] .env file not found!
    )
) else (
    echo [OK] .env configuration file exists.
)

:: 3. Check and Install Node Modules
if not exist "node_modules" (
    echo [INFO] Installing required dependencies (npm install)...
    echo This may take 1-2 minutes depending on internet connection...
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo [ERROR] npm install encountered an error.
        pause
        exit /b
    )
) else (
    echo [OK] Dependencies (node_modules) already present.
)

echo.
echo ========================================================
echo         Starting EduHunters Local Server...
echo ========================================================
echo App will be running at: http://localhost:5173
echo.

:: Open default browser after a brief delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: Run Vite Dev Server
npm run dev

pause
