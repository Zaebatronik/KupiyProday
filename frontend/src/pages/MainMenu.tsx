import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import i18n from '../i18n';
import '../styles/MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clearUser } = useStore();

  // ID админа
  const ADMIN_ID = '670170626';
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
  const isAdmin = currentUserId === ADMIN_ID;

  const handleLogout = () => {
    if (window.confirm(t('common.logoutConfirm'))) {
      // Очищаем данные пользователя и состояние регистрации
      clearUser();
      localStorage.clear();
      // Переходим на страницу прощания
      navigate('/goodbye', { replace: true });
    }
  };

  const menuItems = [
    { icon: '📁', label: t('menu.catalog'), path: '/catalog' },
    { icon: '➕', label: t('menu.addListing'), path: '/add' },
    { icon: '📋', label: t('menu.myListings'), path: '/my-listings' },
    { icon: '👤', label: t('menu.profile'), path: '/profile' },
    { icon: '⭐', label: t('menu.favorites'), path: '/favorites' },
    { icon: '❓', label: t('menu.support'), path: '/support' },
    ...(isAdmin ? [{ icon: '👑', label: 'Админ-панель', path: '/admin' }] : []),
    { icon: '🚪', label: t('menu.logout'), onClick: handleLogout },
  ];

  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1>🐻 Берлога</h1>
        <p className="menu-description">Покупай и продавай что угодно рядом с домом</p>
        
        {/* ТЕСТОВЫЙ БАННЕР */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔍 DEBUG INFO:</div>
          <div>Current language: {i18n.language}</div>
          <div>Loaded languages: {Object.keys(i18n.store.data).join(', ')}</div>
          <div>Test key 'menu.catalog': {t('menu.catalog')}</div>
          <div>i18n exists: {i18n.exists('menu.catalog') ? '✅' : '❌'}</div>
        </div>
      </div>
      <div className="menu-grid">
        {menuItems.map((item, index) => (
          <button
            key={item.path || `action-${index}`}
            className="menu-item"
            onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
