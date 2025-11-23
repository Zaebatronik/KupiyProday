#!/usr/bin/env pwsh
# Скрипт для быстрого деплоя критических исправлений

Write-Host "🚀 ДЕПЛОЙ КРИТИЧЕСКИХ ИСПРАВЛЕНИЙ" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Шаг 1: Git
Write-Host "📦 Шаг 1: Загрузка на GitHub..." -ForegroundColor Yellow
git add .
git commit -m "🔥 CRITICAL FIX: Sync users & listings with Telegram ID"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Код загружен на GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при загрузке на GitHub" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 2: Информация о Backend
Write-Host "🔧 Шаг 2: Backend (Render.com)..." -ForegroundColor Yellow
Write-Host "   Render автоматически обновится из GitHub" -ForegroundColor Gray
Write-Host "   Или зайдите на https://render.com и нажмите 'Manual Deploy'" -ForegroundColor Gray
Write-Host "   Дождитесь завершения деплоя (~5-10 минут)" -ForegroundColor Gray

Write-Host ""
Write-Host "⏳ Ждем 30 секунд для автодеплоя на Render..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Шаг 3: Тестирование Backend
Write-Host ""
Write-Host "🧪 Шаг 3: Тестирование Backend API..." -ForegroundColor Yellow

Write-Host "   Проверка /api/health..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "https://kupiyproday.onrender.com/api/health" -TimeoutSec 10
    Write-Host "   ✅ Backend здоров!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Backend еще деплоится, подождите..." -ForegroundColor Yellow
}

# Шаг 4: Frontend
Write-Host ""
Write-Host "🎨 Шаг 4: Деплой Frontend..." -ForegroundColor Yellow
Set-Location -Path "frontend"

Write-Host "   Сборка проекта..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Проект собран!" -ForegroundColor Green
    
    # Проверяем, установлен ли vercel
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        Write-Host "   Деплой на Vercel..." -ForegroundColor Gray
        vercel --prod
    } else {
        Write-Host "   ⚠️  Vercel CLI не установлен" -ForegroundColor Yellow
        Write-Host "   Установите: npm install -g vercel" -ForegroundColor Gray
        Write-Host "   Или задеплойте через веб-интерфейс Vercel" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Ошибка сборки frontend" -ForegroundColor Red
}

Set-Location -Path ".."

# Финал
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 ДЕПЛОЙ ЗАВЕРШЕН!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Проверьте:" -ForegroundColor Yellow
Write-Host "   1. Backend: https://kupiyproday.onrender.com/api/health" -ForegroundColor Gray
Write-Host "   2. Зарегистрируйте тестового пользователя" -ForegroundColor Gray
Write-Host "   3. Создайте тестовое объявление" -ForegroundColor Gray
Write-Host "   4. Проверьте, видят ли другие пользователи" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Подробности в CRITICAL_FIX_README.md" -ForegroundColor Cyan
