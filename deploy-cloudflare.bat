@echo off
echo ========================================
echo    🚀 Автоматический деплой на Cloudflare
echo ========================================
echo.

cd frontend

echo 📦 Шаг 1/3: Сборка проекта...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)
echo ✅ Сборка завершена!
echo.

echo 📤 Шаг 2/3: Деплой на Cloudflare Pages...
cd dist
call wrangler pages deploy . --project-name=kupyprodai
if %errorlevel% neq 0 (
    echo ❌ Ошибка деплоя!
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Деплой завершён!
echo 🌐 Приложение обновлено на Cloudflare Pages
echo.
pause
