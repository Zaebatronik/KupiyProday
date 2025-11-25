import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import '../styles/MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useStore();

  // ID админа
  const ADMIN_ID = '670170626';
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
  const userStoreId = user?.telegramId || user?.id || '';
  const isAdmin = currentUserId === ADMIN_ID || userStoreId === ADMIN_ID;

  const menuItems = [
    { icon: '📁', label: t('menu.catalog'), path: '/catalog' },
    { icon: '➕', label: t('menu.addListing'), path: '/add' },
    { icon: '📋', label: t('menu.myListings'), path: '/my-listings' },
    { icon: '💬', label: t('menu.chats'), path: '/chats' },
    { icon: '👤', label: t('menu.profile'), path: '/profile' },
    { icon: '⭐', label: t('menu.favorites'), path: '/favorites' },
    { icon: '❓', label: t('menu.support'), path: '/support' },
    ...(isAdmin ? [{ icon: '👑', label: 'Админ-панель', path: '/admin' }] : []),
  ];

  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1>🐻 Берлога</h1>
        <p className="menu-description">Покупай и продавай что угодно рядом с домом</p>
      </div>
      <div className="menu-grid">
        {menuItems.map((item, index) => (
          <button
            key={item.path || `action-${index}`}
            className="menu-item"
            onClick={() => navigate(item.path)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
