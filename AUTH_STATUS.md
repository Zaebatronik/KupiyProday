# 🔐 СТАТУС АУТЕНТИФИКАЦИИ В KUPYPRODAI

## ✅ ЧТО УЖЕ ЕСТЬ:

**Frontend отправляет данные Telegram:**
```typescript
// frontend/src/services/api.ts (строка 16-18)
api.interceptors.request.use((config) => {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    config.headers['X-Telegram-User'] = JSON.stringify(
      window.Telegram.WebApp.initDataUnsafe.user
    );
  }
});
```

## ❌ КРИТИЧЕСКАЯ ПРОБЛЕМА:

### Backend НЕ ПРОВЕРЯЕТ подлинность данных!

**Что происходит сейчас:**
1. Frontend отправляет header `X-Telegram-User: {"id":"123","first_name":"User"}`
2. Backend **просто принимает** эти данные БЕЗ ПРОВЕРКИ
3. ⚠️ Злоумышленник может подделать этот header и выдать себя за любого!

**Пример атаки:**
```bash
# Подделка заголовка - выдать себя за админа
curl -X POST https://kupiyproday.onrender.com/listings \
  -H "X-Telegram-User: {\"id\":\"670170626\",\"first_name\":\"Admin\"}" \
  -d '{"userId":"670170626","title":"Fake listing от админа"}'
# ✅ РАБОТАЕТ! Backend не проверяет подлинность
```

## 🔒 ПРАВИЛЬНОЕ РЕШЕНИЕ:

### 1. Frontend должен отправлять `initData` (С HASH):

```typescript
// frontend/src/services/api.ts
api.interceptors.request.use((config) => {
  // ✅ ПРАВИЛЬНО: initData содержит hash для проверки
  if (window.Telegram?.WebApp?.initData) {
    config.headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
  }
  return config;
});
```

**Что содержит `initData`:**
```
user=%7B%22id%22%3A670170626%7D&auth_date=1732633200&hash=abc123...
```
- `user` - данные пользователя (JSON encoded)
- `auth_date` - время авторизации
- `hash` - **криптографическая подпись от Telegram**

### 2. Backend ПРОВЕРЯЕТ hash по алгоритму Telegram:

**✅ УЖЕ СОЗДАН:** `backend/src/middleware/auth.js`

```javascript
const crypto = require('crypto');

const verifyTelegramAuth = (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  // Создаём data-check-string (сортированные пары key=value)
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  
  // Вычисляем secret_key = HMAC-SHA-256(BOT_TOKEN, "WebAppData")
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN).digest();
    
  // Вычисляем hash = HMAC-SHA-256(data_check_string, secret_key)
  const computedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString).digest('hex');
  
  // ✅ ПРОВЕРЯЕМ HASH!
  if (computedHash !== hash) {
    return res.status(401).json({ error: 'Invalid hash - data tampered!' });
  }
  
  // Проверяем срок (не старше 24 часов)
  const authDate = parseInt(params.get('auth_date') || '0');
  if (Date.now() / 1000 - authDate > 24 * 60 * 60) {
    return res.status(401).json({ error: 'Auth expired' });
  }
  
  const user = JSON.parse(params.get('user'));
  req.telegramUser = user;
  req.userId = user.id.toString();
  next();
};
```

### 3. Применение в роутах:

```javascript
const { verifyTelegramAuth, requireAdmin } = require('../middleware/auth');

// Защищённые эндпоинты
router.post('/listings', verifyTelegramAuth, async (req, res) => {
  const listing = new Listing({
    userId: req.userId, // ✅ Из ПРОВЕРЕННОГО hash!
    title: req.body.title
  });
  await listing.save();
});

// Только админ
router.post('/users/:id/ban', verifyTelegramAuth, requireAdmin, async (req, res) => {
  // Только админ может банить
});
```

## 📝 ЧТО НУЖНО СДЕЛАТЬ:

### ⚡ НЕМЕДЛЕННО:

1. **Обновить Frontend** (изменить `initDataUnsafe` → `initData`):
   - Файл: `frontend/src/services/api.ts`
   - Строка 16-20
   
2. **Добавить BOT_TOKEN в .env:**
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ADMIN_TELEGRAM_ID=670170626
   ```

3. **Применить middleware во всех роутах:**
   - `backend/src/routes/users.js`
   - `backend/src/routes/listings.js`
   - `backend/src/routes/chats.js`
   - `backend/src/routes/reports.js`

4. **Убрать `senderId` из req.body** (брать из `req.userId`):
   - `backend/src/routes/chats.js` - POST `/:id/messages`

### 🔥 КРИТИЧНО:

Без этих изменений:
- ❌ Любой может удалить базу данных
- ❌ Любой может отправлять сообщения от чужого имени
- ❌ Любой может банить пользователей
- ❌ Любой может удалять объявления

**Время на исправления:** ~2 часа

## ✅ ПОСЛЕ ВНЕДРЕНИЯ:

✅ Невозможно подделать данные пользователя  
✅ Hash проверяется криптографически  
✅ Данные подписаны Telegram сервером  
✅ Срок действия авторизации контролируется  
✅ Только владельцы могут редактировать свои данные  
✅ Только админ может банить пользователей

---

**Создано:** 26 ноября 2025  
**Статус:** 🔴 Middleware создан, требуется внедрение
