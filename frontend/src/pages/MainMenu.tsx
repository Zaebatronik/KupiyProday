import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { getTelegramId } from '../utils/telegram';
import { chatsAPI } from '../services/api';
import '../styles/MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // ID админа
  const ADMIN_ID = '670170626';
  
  // Безопасное получение ID (с fallback на user из store)
  let currentUserId = '';
  try {
    currentUserId = getTelegramId();
  } catch {
    currentUserId = user?.telegramId || user?.id || '';
  }
  
  const userStoreId = user?.telegramId || user?.id || '';
  const isAdmin = currentUserId === ADMIN_ID || userStoreId === ADMIN_ID;

  // Загрузка и подсчёт непрочитанных сообщений
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const userId = user.telegramId || user.id;
        const response = await chatsAPI.getByUser(userId);
        const chats = response.data || [];

        let totalUnread = 0;

        chats.forEach((chat: any) => {
          const myId = user.telegramId || user.id;
          
          // Получаем метку последнего прочитанного
          const lastReadKey = `chat_last_read_${chat._id}`;
          const lastReadTimestamp = localStorage.getItem(lastReadKey);

          if (!chat.messages || chat.messages.length === 0) return;

          if (!lastReadTimestamp) {
            // Если ещё не читали - считаем все сообщения от других
            totalUnread += chat.messages.filter((m: any) => 
              m.senderId !== myId && m.senderId !== 'system'
            ).length;
          } else {
            // Считаем только новые после последнего прочтения
            const lastRead = parseInt(lastReadTimestamp);
            totalUnread += chat.messages.filter((m: any) => {
              const messageTime = m.createdAt ? new Date(m.createdAt).getTime() : m.timestamp || 0;
              return m.senderId !== myId && m.senderId !== 'system' && messageTime > lastRead;
            }).length;
          }
        });

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Ошибка загрузки непрочитанных:', error);
      }
    };

    loadUnreadCount();

    // Обновляем каждые 30 секунд
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const menuItems = [
    { icon: '📁', label: t('menu.catalog'), path: '/catalog' },
    { icon: '➕', label: t('menu.addListing'), path: '/add' },
    { icon: '📋', label: t('menu.myListings'), path: '/my-listings' },
    { icon: '💬', label: t('menu.chats'), path: '/chats', badge: unreadCount },
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
            style={{ position: 'relative' }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: '700',
                minWidth: '18px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
              }}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
