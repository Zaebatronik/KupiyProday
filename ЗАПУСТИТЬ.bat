@echo off
chcp 65001 >nul
cls
title KupyProdai - Запуск

SET PATH=%PATH%;C:\Program Files\nodejs\

echo ========================================
echo    🚀 KupyProdai - Тестовый запуск
echo ========================================
echo.

cd /d "%~dp0frontend"

echo 📱 Запуск приложения...
echo.
echo Приложение откроется в браузере на:
echo http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
echo.

npm run dev

pause
