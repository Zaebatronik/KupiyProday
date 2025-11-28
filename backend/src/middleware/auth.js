const crypto = require('crypto');

/**
 * Middleware для проверки аутентификации через Telegram WebApp
 * Проверяет подлинность initData используя hash от Telegram
 */
function verifyTelegramAuth(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // ❌ УБРАЛИ FALLBACK: Теперь ТОЛЬКО криптографическая проверка
    if (!initData) {
      console.error('❌ Отсутствует x-telegram-init-data');
      return res.status(401).json({ error: 'Unauthorized: Missing initData' });
    }

    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN не установлен в .env!');
      return res.status(500).json({ error: 'Server configuration error: BOT_TOKEN missing' });
    }

    // Парсим initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      return res.status(401).json({ error: 'Unauthorized: Missing hash' });
    }

    params.delete('hash');

    // Создаём data-check-string (сортированные пары key=value)
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Вычисляем secret_key = HMAC-SHA-256(BOT_TOKEN, "WebAppData")
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Вычисляем hash = HMAC-SHA-256(data_check_string, secret_key)
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Проверяем hash
    if (computedHash !== hash) {
      console.error('❌ Invalid Telegram hash:', {
        received: hash,
        computed: computedHash,
        dataCheckString
      });
      return res.status(401).json({ error: 'Unauthorized: Invalid hash' });
    }

    // Проверяем auth_date (не старше 24 часов)
    const authDate = parseInt(params.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 часа

    if (currentTime - authDate > maxAge) {
      return res.status(401).json({ error: 'Unauthorized: Auth data expired' });
    }

    // Извлекаем данные пользователя
    const userJson = params.get('user');
    if (!userJson) {
      return res.status(401).json({ error: 'Unauthorized: No user data' });
    }

    const user = JSON.parse(userJson);
    
    // Сохраняем в req для использования в роутах
    req.telegramUser = user;
    req.userId = user.id.toString();

    console.log('✅ Telegram auth verified:', {
      userId: req.userId,
      username: user.username,
      firstName: user.first_name
    });

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized: Auth verification failed' });
  }
}

/**
 * Middleware для проверки прав администратора
 */
function requireAdmin(req, res, next) {
  const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '670170626';
  
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.userId !== ADMIN_ID) {
    console.warn(`⚠️ Попытка доступа к админ-функции от пользователя ${req.userId}`);
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  console.log('✅ Admin access granted:', req.userId);
  next();
}

/**
 * Middleware для проверки что пользователь не забанен
 */
async function checkNotBanned(req, res, next) {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ telegramId: req.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.banned) {
      return res.status(403).json({ 
        error: 'Your account is banned',
        bannedAt: user.bannedAt,
        reason: user.banReason || 'Violation of terms of service'
      });
    }

    req.user = user; // Сохраняем полные данные пользователя
    next();
  } catch (error) {
    console.error('❌ Error checking ban status:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * КРИТИЧНО: Middleware для проверки что пользователь зарегистрирован в базе
 * Блокирует ЛЮБОЙ доступ к API для незарегистрированных пользователей
 */
async function requireRegistered(req, res, next) {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ telegramId: req.userId });
    
    if (!user) {
      console.warn(`🚫 Незарегистрированный пользователь пытается получить доступ: ${req.userId}`);
      return res.status(403).json({ 
        error: 'Not registered',
        message: 'Вы не зарегистрированы в системе. Пожалуйста, пройдите регистрацию.'
      });
    }

    req.user = user; // Сохраняем полные данные пользователя
    next();
  } catch (error) {
    console.error('❌ Error checking registration:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  verifyTelegramAuth,
  requireAdmin,
  checkNotBanned,
  requireRegistered
};
