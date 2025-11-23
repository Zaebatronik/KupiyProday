@echo off
chcp 65001 >nul
cls

echo ========================================
echo    🚀 Запуск KupyProdai
echo ========================================
echo.

echo Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден!
    echo.
    echo Пожалуйста:
    echo   1. Закройте CMD
    echo   2. Откройте новое окно CMD
    echo   3. Запустите этот файл снова
    echo.
    pause
    exit /b
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js установлен: %NODE_VERSION%
echo.

echo ========================================
echo    📦 Установка зависимостей
echo ========================================
echo.

echo Установка Frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки Frontend
        pause
        exit /b
    )
)
echo ✅ Frontend готов
echo.

echo Установка Backend...
cd /d "%~dp0backend"
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки Backend
        pause
        exit /b
    )
)
echo ✅ Backend готов
echo.

if not exist "uploads" (
    mkdir uploads
    echo ✅ Создана папка uploads
    echo.
)

echo ========================================
echo    ⚠️  ВАЖНО: MongoDB
echo ========================================
echo.
echo Backend требует MongoDB для работы.
echo.
echo Выберите вариант:
echo   1 - У меня установлен MongoDB локально
echo   2 - Я использую MongoDB Atlas (облачная версия)
echo   3 - Запустить только Frontend (без Backend)
echo.

set /p choice="Ваш выбор (1/2/3): "
echo.

if "%choice%"=="3" (
    echo ========================================
    echo    🚀 Запуск Frontend
    echo ========================================
    echo.
    echo 📱 Frontend: http://localhost:3000
    echo.
    echo ⚠️  Backend функции работать не будут
    echo.
    echo Для остановки нажмите Ctrl+C
    echo.
    cd /d "%~dp0frontend"
    call npm run dev
    goto :end
)

if "%choice%"=="1" (
    echo Убедитесь, что MongoDB запущен (mongod)
    echo.
    pause
)

if "%choice%"=="2" (
    echo Обновите MONGODB_URI в файле backend\.env
    echo Пример: mongodb+srv://user:password@cluster.mongodb.net/kupyprodai
    echo.
    pause
)

echo ========================================
echo    🚀 Запуск приложения
echo ========================================
echo.
echo 📡 Backend: http://localhost:5000
echo 📱 Frontend: http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
echo.

start "KupyProdai Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul

cd /d "%~dp0frontend"
call npm run dev

:end
