@echo off
title Auto Deploy - Berloga Bot
cls
echo.
echo ========================================
echo    Auto Deploy - Berloga Bot
echo ========================================
echo.
echo Uploading changes to GitHub...
echo.

"C:\Program Files\nodejs\node.exe" "%~dp0auto-deploy.js"

echo.
echo ========================================
echo    Done! Check bot in 2-3 minutes
echo ========================================
echo.
pause
