# Берлога Marketplace Backend

Backend API для маркетплейса Берлога на Express + PostgreSQL.

## 🚀 Деплой на Render.com

### Шаг 1: Подготовка
1. Закоммить все изменения в Git
2. Запушить на GitHub

### Шаг 2: Создание базы данных
1. Зайди на https://render.com
2. Нажми "New +" → "PostgreSQL"
3. Заполни:
   - Name: `berloga-db`
   - Database: `berloga`
   - User: `berloga_user`
   - Region: `Frankfurt (EU Central)`
4. Нажми "Create Database"
5. **СКОПИРУЙ** "External Database URL" - он понадобится!

### Шаг 3: Создание Web Service
1. На Render нажми "New +" → "Web Service"
2. Подключи свой GitHub репозиторий
3. Заполни:
   - Name: `berloga-api`
   - Region: `Frankfurt (EU Central)`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. В "Environment Variables" добавь:
   - Key: `DATABASE_URL`
   - Value: (вставь скопированный External Database URL)
   - Key: `NODE_ENV`
   - Value: `production`
5. Нажми "Create Web Service"

### Шаг 4: Получение URL
После деплоя ты получишь URL типа:
```
https://berloga-api.onrender.com
```

### Шаг 5: Обновить Frontend
Открой `frontend/.env` и замени:
```env
VITE_API_URL=https://berloga-api.onrender.com
```

## ⚡ Локальная разработка

```bash
cd backend
npm install
npm run dev
```

## 📡 API Endpoints

- `GET /` - Информация об API
- `GET /health` - Health check
- `GET /users` - Все пользователи
- `POST /users` - Регистрация
- `GET /listings` - Все объявления
- `POST /listings` - Создать объявление
- `PUT /users/:id` - Обновить пользователя (бан)

## 🔒 Безопасность

- CORS настроен для всех источников (для Telegram WebApp)
- PostgreSQL с SSL в продакшене
- Автоматические миграции при старте
