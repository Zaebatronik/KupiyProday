# Скрипт запуска KupyProdai

Write-Host "🚀 Запуск KupyProdai..." -ForegroundColor Green
Write-Host ""

# Проверка Node.js
Write-Host "Проверка Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js установлен: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден. Пожалуйста:" -ForegroundColor Red
    Write-Host "  1. Закройте PowerShell" -ForegroundColor Yellow
    Write-Host "  2. Откройте новое окно PowerShell" -ForegroundColor Yellow
    Write-Host "  3. Запустите этот скрипт снова" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "📦 Установка зависимостей Frontend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"

if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка установки зависимостей Frontend" -ForegroundColor Red
        pause
        exit
    }
}

Write-Host "✅ Frontend зависимости установлены" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Установка зависимостей Backend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"

if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка установки зависимостей Backend" -ForegroundColor Red
        pause
        exit
    }
}

Write-Host "✅ Backend зависимости установлены" -ForegroundColor Green
Write-Host ""

# Создание папки uploads
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "✅ Создана папка uploads" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  ВАЖНО: MongoDB" -ForegroundColor Yellow
Write-Host "Backend требует MongoDB для работы." -ForegroundColor White
Write-Host ""
Write-Host "Выберите вариант:" -ForegroundColor Cyan
Write-Host "1. У меня установлен MongoDB локально (запущу сам)" -ForegroundColor White
Write-Host "2. Я использую MongoDB Atlas (облачная версия)" -ForegroundColor White
Write-Host "3. Запустить только Frontend (без Backend)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Ваш выбор (1/2/3)"

Write-Host ""

if ($choice -eq "3") {
    Write-Host "🚀 Запуск только Frontend..." -ForegroundColor Green
    Set-Location -Path "$PSScriptRoot\frontend"
    Write-Host ""
    Write-Host "📱 Frontend запускается на http://localhost:3000" -ForegroundColor Cyan
    Write-Host "⚠️  Backend функции работать не будут" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
} else {
    if ($choice -eq "1") {
        Write-Host "Убедитесь, что MongoDB запущен (mongod)" -ForegroundColor Yellow
        Write-Host "Нажмите Enter когда MongoDB будет запущен..." -ForegroundColor Cyan
        pause
    } elseif ($choice -eq "2") {
        Write-Host "Обновите MONGODB_URI в файле backend\.env" -ForegroundColor Yellow
        Write-Host "Нажмите Enter когда будет готово..." -ForegroundColor Cyan
        pause
    }

    Write-Host ""
    Write-Host "🚀 Запуск Backend и Frontend..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📡 Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Yellow
    Write-Host ""

    # Запуск Backend в фоне
    Set-Location -Path "$PSScriptRoot\backend"
    $backendJob = Start-Job -ScriptBlock {
        Set-Location -Path $using:PSScriptRoot\backend
        npm run dev
    }

    Start-Sleep -Seconds 3

    # Запуск Frontend
    Set-Location -Path "$PSScriptRoot\frontend"
    npm run dev

    # Очистка при выходе
    Stop-Job -Job $backendJob
    Remove-Job -Job $backendJob
}
