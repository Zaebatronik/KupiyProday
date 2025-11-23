import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { userAPI } from '../services/api';
import type { User } from '../types';

export default function NicknamePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser, addUserToRegistry, language } = useStore();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateNickname = (nick: string): boolean => {
    if (nick.length < 3 || nick.length > 20) {
      setError(t('registration.nicknameRules'));
      return false;
    }
    const regex = /^[a-zA-Zа-яА-ЯёЁ0-9_]+$/;
    if (!regex.test(nick)) {
      setError(t('registration.nicknameRules'));
      return false;
    }
    return true;
  };

  const handleFinish = async () => {
    if (!validateNickname(nickname)) return;

    setLoading(true);
    setError('');

    try {
      // Получаем данные из localStorage
      const country = JSON.parse(localStorage.getItem('registrationCountry') || '{}');
      const city = localStorage.getItem('registrationCity') || '';
      const radius = parseInt(localStorage.getItem('registrationRadius') || '0');

      // Получаем Telegram ID пользователя
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || `local_${Date.now()}`;
      
      console.log('=== РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Telegram ID:', telegramId);
      console.log('Telegram WebApp доступен:', !!window.Telegram?.WebApp);
      console.log('User data:', window.Telegram?.WebApp?.initDataUnsafe?.user);

      // Создаём данные пользователя
      const userData = {
        id: telegramId,
        nickname,
        country: country.code || 'RU',
        city,
        radius,
        language,
        contacts: {},
        createdAt: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
      };

      console.log('Отправляем на сервер:', userData);

      let user: User;

      // Пытаемся зарегистрировать через API
      try {
        // Проверка уникальности никнейма
        const checkResponse = await userAPI.checkNickname(nickname);
        if (!checkResponse.data.available) {
          setError(t('registration.nicknameTaken'));
          setLoading(false);
          return;
        }

        // Регистрация пользователя на сервере
        console.log('Отправка на http://192.168.0.235:3001/users...');
        const response = await userAPI.register(userData);
        console.log('Ответ от сервера:', response.data);
        
        user = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
        };
        console.log('✅ User registered on server:', user);
      } catch (apiError) {
        // Если API недоступен, создаём пользователя локально
        console.error('❌ ОШИБКА при регистрации на сервере:', apiError);
        console.error('Детали ошибки:', {
          message: (apiError as any)?.message,
          response: (apiError as any)?.response?.data,
          status: (apiError as any)?.response?.status,
        });
        user = {
          ...userData,
          createdAt: new Date(),
        };
        console.warn('⚠️ Создан локальный пользователь (сервер недоступен)');
      }

      // Сохраняем пользователя локально
      setUser(user);
      // Добавляем в общий реестр для админа (локально)
      addUserToRegistry(user);

      // Очищаем temporary data
      localStorage.removeItem('registrationCountry');
      localStorage.removeItem('registrationCity');
      localStorage.removeItem('registrationRadius');

      // Переход к главному меню
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
      <h1 className="page-title">{t('registration.enterNickname')}</h1>

      <div className="form-group">
        <input
          type="text"
          className="input"
          placeholder={t('registration.nicknamePlaceholder')}
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError('');
          }}
          maxLength={20}
        />
        <p className="hint-text">{t('registration.nicknameRules')}</p>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="fixed-bottom">
        <button
          className="btn btn-primary btn-large"
          disabled={!nickname || loading}
          onClick={handleFinish}
        >
          {loading ? t('common.loading') : t('registration.finish')}
        </button>
      </div>
    </div>
  );
}
