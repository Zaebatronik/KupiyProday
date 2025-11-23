@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════╗
echo ║   🔥 ДЕПЛОЙ КРИТИЧЕСКИХ ИСПРАВЛЕНИЙ   ║
echo ╚════════════════════════════════════════╝
echo.

echo 📦 Загрузка на GitHub...
git add .
git commit -m "🔥 CRITICAL FIX: Sync users & listings with Telegram ID"
git push origin main

if %errorlevel% neq 0 (
    echo ❌ Ошибка при загрузке на GitHub
    pause
    exit /b 1
)

echo ✅ Код загружен на GitHub!
echo.

echo 🔧 Backend автоматически обновится на Render...
echo ⏳ Ждем 30 секунд...
timeout /t 30 /nobreak >nul

echo.
echo 🎨 Деплой Frontend...
cd frontend
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки frontend
    cd ..
    pause
    exit /b 1
)

echo ✅ Frontend собран!

:: Проверяем Vercel
where vercel >nul 2>&1
if %errorlevel% equ 0 (
    echo Деплой на Vercel...
    call vercel --prod
) else (
    echo ⚠️  Vercel CLI не установлен
    echo Задеплойте через веб-интерфейс
)

cd ..

echo.
echo ╔════════════════════════════════════════╗
echo ║        🎉 ДЕПЛОЙ ЗАВЕРШЕН!            ║
echo ╚════════════════════════════════════════╝
echo.
echo 📋 Проверьте:
echo    1. https://kupiyproday.onrender.com/api/health
echo    2. Регистрацию пользователя
echo    3. Создание объявления
echo.
echo 📖 Подробности в CRITICAL_FIX_README.md
echo.
pause
