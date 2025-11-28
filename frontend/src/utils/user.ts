/**
 * Утилита для работы с текущим пользователем во всем приложении
 * Обеспечивает единый источник правды о пользователе
 */

import { useStore } from '../store';
import { getTelegramId } from './telegram';

/**
 * Получить текущего пользователя из store
 * БЕЗОПАСНО: Всегда возвращает актуальные данные из Zustand
 */
export function getCurrentUser() {
  return useStore.getState().user;
}

/**
 * Получить Telegram ID текущего пользователя
 * Приоритет: 
 * 1. Telegram WebApp (самый надежный)
 * 2. Store user.telegramId
 * 3. Store user.id
 */
export function getCurrentUserId(): string {
  try {
    // Приоритет 1: Telegram WebApp
    return getTelegramId();
  } catch {
    // Приоритет 2-3: Из store
    const user = getCurrentUser();
    return user?.telegramId || user?.id || '';
  }
}

/**
 * Проверить является ли текущий пользователь владельцем объявления
 */
export function isOwner(listing: { userId: string }): boolean {
  const currentId = getCurrentUserId();
  return listing.userId === currentId;
}

/**
 * Проверить является ли текущий пользователь участником чата
 */
export function isChatParticipant(chat: { participant1: string; participant2: string }): boolean {
  const currentId = getCurrentUserId();
  return chat.participant1 === currentId || chat.participant2 === currentId;
}

/**
 * Проверить является ли текущий пользователь администратором
 */
export function isAdmin(): boolean {
  const ADMIN_ID = '670170626';
  const currentId = getCurrentUserId();
  return currentId === ADMIN_ID;
}

/**
 * Получить никнейм текущего пользователя
 */
export function getCurrentUserNickname(): string {
  const user = getCurrentUser();
  return user?.nickname || 'Аноним';
}

/**
 * Проверить зарегистрирован ли пользователь
 */
export function isUserRegistered(): boolean {
  return useStore.getState().isRegistered;
}

/**
 * Получить язык текущего пользователя
 */
export function getCurrentUserLanguage(): string {
  const user = getCurrentUser();
  return user?.language || useStore.getState().language || 'ru';
}
