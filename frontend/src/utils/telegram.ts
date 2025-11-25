/**
 * Утилита для работы с Telegram WebApp
 */

/**
 * Получает Telegram ID пользователя
 * В режиме разработки (браузер) использует сохранённый ID из currentUser
 */
export function getTelegramId(): string {
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
  
  if (telegramId) {
    return telegramId;
  }
  
  // РЕЖИМ РАЗРАБОТКИ: Проверяем есть ли уже залогиненный пользователь
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      const userId = user.telegramId || user.id;
      if (userId) {
        console.log('🔑 Используется ID из currentUser:', userId);
        return userId;
      }
    } catch (e) {
      console.error('❌ Ошибка парсинга currentUser:', e);
    }
  }
  
  // Если нет currentUser - значит пользователь не залогинен
  // Возвращаем временный ID который будет заменён при регистрации
  console.warn('⚠️ РЕЖИМ РАЗРАБОТКИ: Пользователь не залогинен, используется временный ID');
  return 'temp_' + Date.now(); // Временный ID до регистрации
}

/**
 * Получает username пользователя из Telegram
 */
export function getTelegramUsername(): string {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';
}

/**
 * Проверяет, запущено ли приложение внутри Telegram
 */
export function isRunningInTelegram(): boolean {
  return !!window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
}

/**
 * Получает полную информацию о пользователе Telegram
 */
export function getTelegramUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}
