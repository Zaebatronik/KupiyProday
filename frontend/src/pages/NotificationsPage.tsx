import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import '../styles/NotificationsPage.css';

interface Notification {
  _id: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: string;
}

function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const unreadParam = filter === 'unread' ? '&unreadOnly=true' : '';
      const response = await fetch(`${API_URL}/notifications/${user.id}?limit=100${unreadParam}`);
      const data = await response.json();
      
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await fetch(`${API_URL}/notifications/user/${user.id}/read-all`, {
        method: 'PATCH',
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearReadNotifications = async () => {
    if (!user?.id) return;

    try {
      await fetch(`${API_URL}/notifications/user/${user.id}/clear-read`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Навигация в зависимости от типа
    if (notification.relatedType === 'chat' && notification.relatedId) {
      navigate(`/chat/${notification.relatedId}`);
    } else if (notification.relatedType === 'listing' && notification.relatedId) {
      navigate(`/listing/${notification.relatedId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return '💬';
      case 'new_response':
        return '👤';
      case 'listing_sold':
        return '✅';
      case 'listing_approved':
        return '✅';
      case 'listing_rejected':
        return '❌';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          ←
        </button>
        <h1>
          {t('notifications.title')}
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </h1>
      </div>

      <div className="notifications-controls">
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            {t('notifications.all')}
          </button>
          <button
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            {t('notifications.unread')} {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="action-buttons">
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                {t('notifications.markAllRead')}
              </button>
            )}
            {notifications.some(n => n.read) && (
              <button className="clear-btn" onClick={clearReadNotifications}>
                {t('notifications.clearRead')}
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔔</span>
          <p>{filter === 'unread' ? t('notifications.noUnread') : t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{formatDate(notification.createdAt)}</div>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
