import { useState, useRef, useEffect } from 'react';
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
  const [checking, setChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean|null>(null);
  const debounceRef = useRef<NodeJS.Timeout|null>(null);

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
    if (nicknameAvailable === false) {
      setError(t('registration.nicknameTaken'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Получаем данные из localStorage
      const country = JSON.parse(localStorage.getItem('registrationCountry') || '{}');
      const city = localStorage.getItem('registrationCity') || '';
      const radius = parseInt(localStorage.getItem('registrationRadius') || '0');
      // Получаем Telegram ID пользователя
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || `local_${Date.now()}`;
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
      let user: User;
      try {
        const response = await userAPI.register(userData);
        user = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
        };
      } catch (apiError) {
        user = {
          ...userData,
          createdAt: new Date(),
        };
      }
      setUser(user);
      addUserToRegistry(user);
      localStorage.removeItem('registrationCountry');
      localStorage.removeItem('registrationCity');
      localStorage.removeItem('registrationRadius');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Debounce-проверка никнейма
  useEffect(() => {
    if (!nickname || !validateNickname(nickname)) {
      setNicknameAvailable(null);
      return;
    }
    setChecking(true);
    setNicknameAvailable(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const checkResponse = await userAPI.checkNickname(nickname);
        setNicknameAvailable(checkResponse.data.available);
        setError(checkResponse.data.available ? '' : t('registration.nicknameTaken'));
      } catch (e) {
        setNicknameAvailable(null);
        setError(t('common.error'));
      } finally {
        setChecking(false);
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname]);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
      <h1 className="page-title">{t('registration.enterNickname')}</h1>

      <div className="form-group">
        <div style={{position:'relative'}}>
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
            autoComplete="off"
          />
          {checking && (
            <span style={{position:'absolute',right:10,top:10}} title="Проверка...">⏳</span>
          )}
          {nickname && !checking && nicknameAvailable === true && (
            <span style={{position:'absolute',right:10,top:10}} title="Доступно">✅</span>
          )}
          {nickname && !checking && nicknameAvailable === false && (
            <span style={{position:'absolute',right:10,top:10}} title="Занято">❌</span>
          )}
        </div>
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
