/**
 * Утилита для работы с Telegram WebApp
 */

/**
 * Получает Telegram ID пользователя
 * В режиме разработки (браузер) возвращает тестовый ID
 */
export function getTelegramId(): string {
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
  
  if (telegramId) {
    return telegramId;
  }
  
  // РЕЖИМ РАЗРАБОТКИ: Для тестирования в браузере
  console.warn('⚠️ РЕЖИМ РАЗРАБОТКИ: Используется тестовый Telegram ID');
  return '999999999'; // Фиксированный ID для разработки
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
