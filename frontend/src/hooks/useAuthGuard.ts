import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { userAPI } from '../services/api';
import { getTelegramId } from '../utils/telegram';

/**
 * Hook для защиты страниц от незарегистрированных пользователей
 * Проверяет существование пользователя в базе данных
 */
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { isRegistered, user, logout } = useStore();

  useEffect(() => {
    const verifyUser = async () => {
      // Если не зарегистрирован - редирект на регистрацию
      if (!isRegistered) {
        console.log('🚫 AuthGuard: Пользователь не зарегистрирован');
        navigate('/', { replace: true });
        return;
      }

      // Если зарегистрирован - проверяем в базе данных
      try {
        const telegramId = getTelegramId();
        const response = await userAPI.getUserByTelegramId(telegramId);
        
        if (!response.data) {
          console.log('🚫 AuthGuard: Пользователь не найден в базе - выход');
          logout();
          navigate('/', { replace: true });
        }
      } catch (error: any) {
        // 🔒 403 = Not registered, 404 = Not found
        if (error.response?.status === 404 || error.response?.status === 403) {
          console.log('🚫 AuthGuard: Пользователь не найден в базе - выход');
          logout();
          navigate('/', { replace: true });
        } else if (error.message === 'NOT_AUTHENTICATED') {
          console.log('🚫 AuthGuard: Нет Telegram ID - выход');
          logout();
          navigate('/', { replace: true });
        }
      }
    };

    verifyUser();
  }, [isRegistered, user, navigate, logout]);
};
