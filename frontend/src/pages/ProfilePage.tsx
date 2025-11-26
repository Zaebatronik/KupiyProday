import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { getTelegramId } from '../utils/telegram';
import { usersAPI } from '../services/api';
import '../styles/ProfilePage.css';

// Доступные страны (по языкам)
const AVAILABLE_COUNTRIES = [
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'US', name: 'США', flag: '🇺🇸' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸' },
  { code: 'PL', name: 'Польша', flag: '🇵🇱' },
];

// Доступные языки
const AVAILABLE_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, listings, setUser } = useStore();
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [tempRadius, setTempRadius] = useState(user?.radius || 10);

  // ID админа
  const ADMIN_ID = '670170626';
  
  // Безопасное получение ID
  let currentUserId = '';
  try {
    currentUserId = getTelegramId();
  } catch {
    currentUserId = user?.telegramId || user?.id || '';
  }
  
  const userStoreId = user?.telegramId || user?.id || '';
  const isAdmin = currentUserId === ADMIN_ID || userStoreId === ADMIN_ID;
  
  // Временная отладка - показываем ID в консоли
  console.log('🔍 DEBUG: Telegram WebApp ID:', currentUserId);
  console.log('🔍 DEBUG: User Store ID:', userStoreId);
  console.log('🔍 DEBUG: User from store:', user);
  console.log('🔍 DEBUG: Is Admin?', isAdmin);

  // Статистика пользователя
  const myListings = listings.filter(l => l.userId === user?.id);
  const activeListings = myListings.filter(l => l.status === 'active').length;
  const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);

  // Рейтинг (пока фиксированный, можно добавить позже)
  const rating = 5.0;
  const reviewsCount = 0;

  // Дата регистрации
  const registrationDate = user?.registrationDate 
    ? new Date(user.registrationDate).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Недавно';

  // Обработчики изменения данных
  const handleCountryChange = async (countryCode: string) => {
    try {
      if (user) {
        const updatedUser = { ...user, country: countryCode };
        await usersAPI.updateUser(user.id, { country: countryCode });
        setUser(updatedUser);
        setShowCountryModal(false);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (error) {
      console.error('Error updating country:', error);
    }
  };

  const handleRadiusChange = async () => {
    try {
      if (user) {
        const updatedUser = { ...user, radius: tempRadius };
        await usersAPI.updateUser(user.id, { radius: tempRadius });
        setUser(updatedUser);
        setShowRadiusModal(false);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (error) {
      console.error('Error updating radius:', error);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLanguageModal(false);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  return (
    <div className="profile-page">
      {/* Шапка профиля */}
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          ← Назад
        </button>
        <h1>Профиль</h1>
      </div>

      {/* Аватар и основная информация */}
      <div className="profile-card">
        <div 
          className="profile-avatar" 
          onClick={() => setShowAvatarMenu(true)}
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar-circle">
            {user?.nickname?.charAt(0).toUpperCase() || '👤'}
          </div>
          {isAdmin && <div className="admin-crown">👑</div>}
          <div className="avatar-edit-hint">📷</div>
        </div>

        <div className="profile-info">
          <h2 className="profile-nickname">
            {user?.nickname || 'Аноним'}
            {isAdmin && <span className="admin-badge-small">ADMIN</span>}
          </h2>
          <div 
            className="profile-location clickable-field" 
            onClick={() => setShowCountryModal(true)}
          >
            📍 {user?.city || 'Не указан'}, {AVAILABLE_COUNTRIES.find(c => c.code === user?.country)?.flag || '🌍'} {AVAILABLE_COUNTRIES.find(c => c.code === user?.country)?.name || user?.country || 'RU'}
            <span className="edit-icon">✏️</span>
          </div>
          <div 
            className="profile-radius clickable-field" 
            onClick={() => setShowRadiusModal(true)}
          >
            🔍 Радиус поиска: {user?.radius || 10} км
            <span className="edit-icon">✏️</span>
          </div>
          <div className="profile-date">
            📅 На платформе с {registrationDate}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="profile-stats">
        <div className="stat-item">
          <div className="stat-value">{myListings.length}</div>
          <div className="stat-label">Объявлений</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{activeListings}</div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{totalViews}</div>
          <div className="stat-label">Просмотров</div>
        </div>
      </div>

      {/* Рейтинг */}
      <div className="profile-rating">
        <div className="rating-stars">
          {'⭐'.repeat(5)}
        </div>
        <div className="rating-text">
          {rating.toFixed(1)} · {reviewsCount} отзывов
        </div>
        <div className="rating-hint">Пока нет отзывов</div>
      </div>

      {/* Быстрые действия - Основные */}
      <div className="profile-section">
        <h3 className="section-title">🚀 Основные действия</h3>
        <div className="profile-actions">
          <button className="action-button" onClick={() => navigate('/catalog')}>
            <span className="action-icon">🏪</span>
            <div className="action-content">
              <span className="action-text">Каталог товаров</span>
              <span className="action-subtitle">Смотреть все объявления</span>
            </div>
            <span className="action-arrow">→</span>
          </button>

          <button className="action-button" onClick={() => navigate('/add')}>
            <span className="action-icon">➕</span>
            <div className="action-content">
              <span className="action-text">Добавить объявление</span>
              <span className="action-subtitle">Продать товар</span>
            </div>
            <span className="action-arrow">→</span>
          </button>

          <button className="action-button" onClick={() => navigate('/chats')}>
            <span className="action-icon">💬</span>
            <div className="action-content">
              <span className="action-text">Мои сообщения</span>
              <span className="action-subtitle">Все чаты с покупателями</span>
            </div>
            <span className="action-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Мои данные */}
      <div className="profile-section">
        <h3 className="section-title">📋 Мои данные</h3>
        <div className="profile-actions">
          <button className="action-button" onClick={() => navigate('/my-listings')}>
            <span className="action-icon">📦</span>
            <div className="action-content">
              <span className="action-text">Мои объявления</span>
              <span className="action-subtitle">{myListings.length} активных</span>
            </div>
            <span className="action-arrow">→</span>
          </button>

          <button className="action-button" onClick={() => navigate('/favorites')}>
            <span className="action-icon">⭐</span>
            <div className="action-content">
              <span className="action-text">Избранное</span>
              <span className="action-subtitle">Сохраненные объявления</span>
            </div>
            <span className="action-arrow">→</span>
          </button>

          {isAdmin && (
            <button className="action-button admin-action" onClick={() => navigate('/admin')}>
              <span className="action-icon">👑</span>
              <div className="action-content">
                <span className="action-text">Админ-панель</span>
                <span className="action-subtitle">Управление платформой</span>
              </div>
              <span className="action-arrow">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Помощь и настройки */}
      <div className="profile-section">
        <h3 className="section-title">⚙️ Настройки и помощь</h3>
        <div className="profile-actions">
          <button 
            className="action-button" 
            onClick={() => {
              const newNickname = prompt('Введите новый никнейм (3-20 символов):', user?.nickname || '');
              
              if (newNickname && newNickname.trim().length >= 3 && newNickname.trim().length <= 20) {
                const updateNickname = async () => {
                  try {
                    const { userAPI } = await import('../services/api');
                    const { updateUser } = useStore.getState();
                    
                    await userAPI.updateProfile(user?.id || '', { nickname: newNickname.trim() });
                    updateUser({ nickname: newNickname.trim() });
                    
                    alert('✅ Никнейм успешно изменен!');
                    window.location.reload();
                  } catch (error) {
                    alert('❌ Ошибка при изменении никнейма. Возможно, он уже занят.');
                  }
                };
                updateNickname();
              } else if (newNickname !== null) {
                alert('❗ Никнейм должен быть от 3 до 20 символов');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <span className="action-icon">✏️</span>
            <div className="action-content">
              <span className="action-text">Изменить никнейм</span>
              <span className="action-subtitle">Текущий: {user?.nickname}</span>
            </div>
            <span className="action-arrow">→</span>
          </button>

          <button className="action-button" onClick={() => navigate('/support')}>
            <span className="action-icon">💡</span>
            <div className="action-content">
              <span className="action-text">Поддержка</span>
              <span className="action-subtitle">Связаться с администратором</span>
            </div>
            <span className="action-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Настройки */}
      <div className="profile-settings">
        <h3 className="settings-title">⚙️ Настройки</h3>
        
        <div className="setting-item clickable-field" onClick={() => setShowLanguageModal(true)}>
          <div className="setting-label">
            <span>🌍 Язык</span>
          </div>
          <div className="setting-value">
            {AVAILABLE_LANGUAGES.find(l => l.code === i18n.language)?.flag || '🇷🇺'} {AVAILABLE_LANGUAGES.find(l => l.code === i18n.language)?.name || 'Русский'}
            <span className="edit-icon">✏️</span>
          </div>
        </div>

        <div className="setting-item clickable-field" onClick={() => setShowCountryModal(true)}>
          <div className="setting-label">
            <span>📍 Изменить местоположение</span>
          </div>
          <div className="setting-value">
            {AVAILABLE_COUNTRIES.find(c => c.code === user?.country)?.flag || '🌍'}
            <span className="edit-icon">✏️</span>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>📱 Telegram ID</span>
          </div>
          <div className="setting-value">
            {currentUserId || 'Не определён'}
          </div>
        </div>
      </div>

      {/* Информация о боте */}
      <div className="profile-footer">
        <div className="footer-info">
          <p>🐻 Берлога Marketplace</p>
          <p className="footer-version">Версия 1.0.1</p>
        </div>
      </div>

      {/* Модальное окно выбора страны */}
      {showCountryModal && (
        <div className="modal-overlay" onClick={() => setShowCountryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Выберите страну</h3>
            <div className="country-list">
              {AVAILABLE_COUNTRIES.map((country) => (
                <div
                  key={country.code}
                  className="country-item"
                  onClick={() => handleCountryChange(country.code)}
                >
                  <span className="country-flag">{country.flag}</span>
                  <span className="country-name">{country.name}</span>
                </div>
              ))}
            </div>
            <button className="modal-close" onClick={() => setShowCountryModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно изменения радиуса */}
      {showRadiusModal && (
        <div className="modal-overlay" onClick={() => setShowRadiusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Радиус поиска</h3>
            <div className="radius-selector">
              <p className="radius-value">{tempRadius} км</p>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={tempRadius}
                onChange={(e) => setTempRadius(Number(e.target.value))}
                className="radius-slider"
              />
              <div className="radius-labels">
                <span>10 км</span>
                <span>100 км</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowRadiusModal(false)}>
                Отмена
              </button>
              <button className="modal-save" onClick={handleRadiusChange}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора языка */}
      {showLanguageModal && (
        <div className="modal-overlay" onClick={() => setShowLanguageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Выберите язык</h3>
            <div className="language-list">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="language-item"
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                </div>
              ))}
            </div>
            <button className="modal-close" onClick={() => setShowLanguageModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Меню аватара */}
      {showAvatarMenu && (
        <div className="modal-overlay" onClick={() => setShowAvatarMenu(false)}>
          <div className="modal-content avatar-menu" onClick={(e) => e.stopPropagation()}>
            <h3>Фото профиля</h3>
            <div className="avatar-actions">
              <label className="avatar-action-item">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // TODO: Implement avatar upload
                      console.log('Upload avatar:', file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <span>📷 Загрузить фото</span>
              </label>
              <div className="avatar-action-item" onClick={() => {
                // TODO: Implement avatar removal
                console.log('Remove avatar');
              }}>
                <span>🗑️ Удалить фото</span>
              </div>
            </div>
            <button className="modal-close" onClick={() => setShowAvatarMenu(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
