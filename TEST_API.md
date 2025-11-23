# Тестирование API
# Используйте эти команды для проверки работы backend

# 1. Проверка здоровья сервера
curl https://kupiyproday.onrender.com/api/health

# 2. Получить всех пользователей
curl https://kupiyproday.onrender.com/api/users

# 3. Получить все объявления
curl https://kupiyproday.onrender.com/api/listings

# 4. Создать тестового пользователя
curl -X POST https://kupiyproday.onrender.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test123",
    "nickname": "TestUser",
    "country": "RU",
    "city": "Moscow",
    "radius": 50,
    "language": "ru"
  }'

# 5. Проверить никнейм
curl https://kupiyproday.onrender.com/api/users/check-nickname/TestUser

# 6. Получить профиль пользователя
curl https://kupiyproday.onrender.com/api/users/test123
