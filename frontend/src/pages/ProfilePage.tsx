import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, listings } = useStore();

  // ID админа
  const ADMIN_ID = '670170626';
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
  const isAdmin = currentUserId === ADMIN_ID;
  
  // Временная отладка - показываем ID в консоли
  console.log('🔍 DEBUG: Current User ID:', currentUserId);
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
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user?.nickname?.charAt(0).toUpperCase() || '👤'}
          </div>
          {isAdmin && <div className="admin-crown">👑</div>}
        </div>

        <div className="profile-info">
          <h2 className="profile-nickname">
            {user?.nickname || 'Аноним'}
            {isAdmin && <span className="admin-badge-small">ADMIN</span>}
          </h2>
          <div className="profile-location">
            📍 {user?.city || 'Не указан'}, {user?.country || 'RU'}
          </div>
          <div className="profile-radius">
            🔍 Радиус поиска: {user?.radius || 10} км
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

      {/* Быстрые действия */}
      <div className="profile-actions">
        <button className="action-button" onClick={() => navigate('/my-listings')}>
          <span className="action-icon">📦</span>
          <span className="action-text">Мои объявления</span>
          <span className="action-arrow">→</span>
        </button>

        <button className="action-button" onClick={() => navigate('/favorites')}>
          <span className="action-icon">⭐</span>
          <span className="action-text">Избранное</span>
          <span className="action-arrow">→</span>
        </button>

        {isAdmin && (
          <button className="action-button admin-action" onClick={() => navigate('/admin')}>
            <span className="action-icon">👑</span>
            <span className="action-text">Админ-панель</span>
            <span className="action-arrow">→</span>
          </button>
        )}
      </div>

      {/* Настройки */}
      <div className="profile-settings">
        <h3 className="settings-title">⚙️ Настройки</h3>
        
        <div className="setting-item">
          <div className="setting-label">
            <span>🌍 Язык</span>
          </div>
          <div className="setting-value">
            {user?.language === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
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
          <p className="footer-version">Версия 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
