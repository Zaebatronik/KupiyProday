@echo off
echo ========================================
echo    KupyProdai - Deploy to Vercel
echo ========================================
echo.

REM Проверяем Node.js в стандартных местах
set NODE_PATH=
if exist "C:\Program Files\nodejs\node.exe" set NODE_PATH=C:\Program Files\nodejs
if exist "C:\Program Files (x86)\nodejs\node.exe" set NODE_PATH=C:\Program Files (x86)\nodejs
if exist "%APPDATA%\npm\node.exe" set NODE_PATH=%APPDATA%\npm
if exist "%ProgramFiles%\nodejs\node.exe" set NODE_PATH=%ProgramFiles%\nodejs

if "%NODE_PATH%"=="" (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: %NODE_PATH%
echo.

REM Добавляем в PATH для этой сессии
set PATH=%NODE_PATH%;%PATH%

REM Проверяем версии
echo Checking versions...
node --version
npm --version
echo.

REM Переходим в frontend
cd /d "%~dp0frontend"
echo Current directory: %CD%
echo.

REM Устанавливаем Vercel CLI
echo Installing Vercel CLI...
call npm install -g vercel
if errorlevel 1 (
    echo [ERROR] Failed to install Vercel CLI
    pause
    exit /b 1
)
echo.

REM Запускаем Vercel
echo Starting Vercel deployment...
echo.
echo Follow the instructions:
echo 1. Login to your account (browser will open)
echo 2. Answer questions about the project
echo 3. Wait for deployment
echo.
call vercel

echo.
echo ========================================
echo Deployment complete!
echo Copy the URL and paste it in @BotFather
echo ========================================
pause
