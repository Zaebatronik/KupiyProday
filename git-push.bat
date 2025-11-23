@echo off
echo ========================================
echo    📤 Git Push - Автоматический деплой
echo ========================================
echo.

git add .
git commit -m "Update: %date% %time%"
git push origin main

echo.
echo ✅ Изменения отправлены в GitHub!
echo ⏳ Cloudflare начнёт деплой через 10-20 секунд...
echo 🌐 Проверь: https://morning-shape-e5ac.danya-solodov-1999.workers.dev
echo.
pause
