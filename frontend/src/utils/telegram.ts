/**
 * Утилита для работы с Telegram WebApp
 */

// ID админа для разработки
const ADMIN_ID = '670170626';

/**
 * Получает Telegram ID пользователя
 * ТОЛЬКО для залогиненных пользователей!
 */
export function getTelegramId(): string {
  // 1. Проверяем Telegram WebApp (основной способ)
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
  
  if (telegramId) {
    return telegramId;
  }
  
  // 2. Проверяем есть ли уже залогиненный пользователь
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      const userId = user.telegramId || user.id;
      if (userId && userId !== 'undefined' && !userId.startsWith('temp_') && !userId.startsWith('local_')) {
        console.log('🔑 Используется ID из currentUser:', userId);
        return userId;
      }
    } catch (e) {
      console.error('❌ Ошибка парсинга currentUser:', e);
    }
  }
  
  // 3. РЕЖИМ РАЗРАБОТКИ: Проверяем специальный флаг для админа
  const devMode = localStorage.getItem('dev_admin_mode');
  if (devMode === 'true') {
    console.warn('⚠️ РЕЖИМ РАЗРАБОТКИ АДМИНА: Используется ID', ADMIN_ID);
    return ADMIN_ID;
  }
  
  // 4. Если нет ни Telegram, ни currentUser - выбрасываем ошибку
  throw new Error('NOT_AUTHENTICATED');
}

/**
 * Включить режим разработки админа (ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ!)
 */
export function enableAdminDevMode() {
  localStorage.setItem('dev_admin_mode', 'true');
  console.log('✅ Режим разработки админа включён. ID:', ADMIN_ID);
}

/**
 * Выключить режим разработки админа
 */
export function disableAdminDevMode() {
  localStorage.removeItem('dev_admin_mode');
  console.log('✅ Режим разработки админа выключен');
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
