#!/usr/bin/env pwsh
# Скрипт для тестирования API после деплоя

$API_URL = "https://kupiyproday.onrender.com/api"

Write-Host ""
Write-Host "🧪 ТЕСТИРОВАНИЕ API" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Тест 1: Health Check
Write-Host "1️⃣  Проверка здоровья сервера..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -TimeoutSec 10
    Write-Host "   ✅ Сервер работает!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Time: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Сервер не отвечает!" -ForegroundColor Red
    Write-Host "   Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Тест 2: Получение пользователей
Write-Host "2️⃣  Получение списка пользователей..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$API_URL/users" -TimeoutSec 10
    Write-Host "   ✅ Получено пользователей: $($users.Count)" -ForegroundColor Green
    if ($users.Count -gt 0) {
        Write-Host "   Первый пользователь: $($users[0].nickname) (ID: $($users[0].telegramId))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Ошибка получения пользователей" -ForegroundColor Yellow
    Write-Host "   Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Тест 3: Получение объявлений
Write-Host "3️⃣  Получение списка объявлений..." -ForegroundColor Yellow
try {
    $listings = Invoke-RestMethod -Uri "$API_URL/listings" -TimeoutSec 10
    Write-Host "   ✅ Получено объявлений: $($listings.Count)" -ForegroundColor Green
    if ($listings.Count -gt 0) {
        Write-Host "   Первое объявление: $($listings[0].title) (User: $($listings[0].userNickname))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Ошибка получения объявлений" -ForegroundColor Yellow
    Write-Host "   Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Тест 4: Проверка уникальности никнейма
Write-Host "4️⃣  Проверка доступности никнейма..." -ForegroundColor Yellow
try {
    $check = Invoke-RestMethod -Uri "$API_URL/users/check-nickname/TestUser123" -TimeoutSec 10
    if ($check.available) {
        Write-Host "   ✅ Никнейм 'TestUser123' свободен" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Никнейм 'TestUser123' занят" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Ошибка проверки никнейма" -ForegroundColor Yellow
    Write-Host "   Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Тест 5: Создание тестового пользователя
Write-Host "5️⃣  Создание тестового пользователя..." -ForegroundColor Yellow
$testUser = @{
    id = "test_" + (Get-Date -Format "yyyyMMddHHmmss")
    nickname = "TestUser_" + (Get-Random -Maximum 9999)
    country = "RU"
    city = "Moscow"
    radius = 50
    language = "ru"
} | ConvertTo-Json

try {
    $newUser = Invoke-RestMethod -Uri "$API_URL/users/register" `
        -Method Post `
        -Body $testUser `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    Write-Host "   ✅ Пользователь создан!" -ForegroundColor Green
    Write-Host "   ID: $($newUser.telegramId)" -ForegroundColor Gray
    Write-Host "   Nickname: $($newUser.nickname)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Ошибка создания пользователя" -ForegroundColor Yellow
    Write-Host "   Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "===================" -ForegroundColor Cyan
Write-Host "✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Теперь проверьте в Telegram:" -ForegroundColor Cyan
Write-Host "   1. Откройте бота" -ForegroundColor Gray
Write-Host "   2. Зарегистрируйтесь" -ForegroundColor Gray
Write-Host "   3. Создайте объявление" -ForegroundColor Gray
Write-Host "   4. Проверьте видимость для других" -ForegroundColor Gray
Write-Host ""
