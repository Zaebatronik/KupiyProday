#!/usr/bin/env pwsh

Write-Host ""
Write-Host "🔍 ПРОВЕРКА СТАТУСА ДЕПЛОЕВ" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Backend (Render)
Write-Host "📦 Backend (Render):" -ForegroundColor Yellow
Write-Host "   URL: https://kupiyproday.onrender.com/api/health" -ForegroundColor Gray
Write-Host "   Проверяю..." -ForegroundColor Gray

try {
    $backend = Invoke-RestMethod -Uri "https://kupiyproday.onrender.com/api/health" -TimeoutSec 10
    Write-Host "   ✅ Backend работает!" -ForegroundColor Green
    Write-Host "   Status: $($backend.status)" -ForegroundColor Gray
    Write-Host "   Time: $($backend.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ⏳ Backend еще обновляется или спит (Render засыпает при неактивности)" -ForegroundColor Yellow
    Write-Host "   Подождите 1-2 минуты и попробуйте снова" -ForegroundColor Gray
}

Write-Host ""

# Frontend (Netlify)  
Write-Host "🎨 Frontend (Netlify):" -ForegroundColor Yellow
Write-Host "   URL: https://magical-druid-de73dd.netlify.app" -ForegroundColor Gray
Write-Host "   Проверяю..." -ForegroundColor Gray

try {
    $frontend = Invoke-WebRequest -Uri "https://magical-druid-de73dd.netlify.app" -TimeoutSec 10 -UseBasicParsing
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend работает!" -ForegroundColor Green
        Write-Host "   Status Code: $($frontend.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⏳ Frontend еще обновляется" -ForegroundColor Yellow
    Write-Host "   Подождите 1-2 минуты и попробуйте снова" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Статус деплоев:" -ForegroundColor Cyan
Write-Host "   Backend:  https://dashboard.render.com/web/srv-d4hh0b4hg0os738ebfvg/deploys" -ForegroundColor Gray
Write-Host "   Frontend: https://app.netlify.com/projects/magical-druid-de73dd/deploys" -ForegroundColor Gray
Write-Host ""
Write-Host "⏰ Время обновления:" -ForegroundColor Cyan
Write-Host "   Backend (Render):  5-10 минут" -ForegroundColor Gray
Write-Host "   Frontend (Netlify): 2-3 минуты" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Если не работает через 10 минут:" -ForegroundColor Yellow
Write-Host "   1. Откройте ссылки выше и проверьте логи" -ForegroundColor Gray
Write-Host "   2. Убедитесь, что деплой завершен" -ForegroundColor Gray
Write-Host "   3. Проверьте наличие ошибок в логах" -ForegroundColor Gray
Write-Host ""
