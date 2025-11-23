import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { User } from '@/types';
import '../styles/AdminPage.css';

// ID админа (ваш Telegram ID)
const ADMIN_ID = '670170626';

interface AdminUser {
  id: string;
  nickname: string;
  country: string;
  city: string;
  listingsCount: number;
  joinedAt: string;
  status: 'active' | 'banned';
  isAdmin?: boolean;
}

interface Report {
  id: string;
  reporterNickname: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'rejected';
}

const MOCK_REPORTS: Report[] = [
  { id: '1', reporterNickname: 'ivan_petrov', listingId: 'L123', listingTitle: 'iPhone подозрительно дешевый', reason: 'Возможное мошенничество', createdAt: '2024-01-15T10:30:00', status: 'pending' },
  { id: '2', reporterNickname: 'maria_s', listingId: 'L456', listingTitle: 'Спам реклама', reason: 'Спам и реклама', createdAt: '2024-01-14T15:20:00', status: 'pending' },
  { id: '3', reporterNickname: 'alex_ua', listingId: 'L789', listingTitle: 'Запрещенный товар', reason: 'Нарушение правил', createdAt: '2024-01-13T09:10:00', status: 'resolved' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { allUsers, listings } = useStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'banned' | 'reports'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  // Загружаем пользователей с сервера
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Импортируем API
        const { userAPI } = await import('../services/api');
        const response = await userAPI.getAll();
        const serverUsers = response.data;

        console.log('🔄 AdminPage: Загружено пользователей с сервера:', serverUsers.length);

        const adminUsers: AdminUser[] = serverUsers.map((user: any) => ({
          id: user.id,
          nickname: user.nickname,
          country: user.country,
          city: user.city,
          listingsCount: listings.filter((l) => l.userId === user.id).length,
          joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно',
          status: user.banned ? 'banned' : 'active',
          isAdmin: user.id === ADMIN_ID,
        }));

        // Сортируем: админ первый, остальные по дате
        adminUsers.sort((a, b) => {
          if (a.isAdmin) return -1;
          if (b.isAdmin) return 1;
          return 0;
        });

        setUsers(adminUsers);
        console.log('✅ AdminPage: Список обновлён, всего пользователей:', adminUsers.length);
      } catch (error) {
        console.error('❌ Failed to load users from server:', error);
        // Fallback на локальные данные
        const adminUsers: AdminUser[] = allUsers.map((user: User) => ({
          id: user.id,
          nickname: user.nickname,
          country: user.country,
          city: user.city,
          listingsCount: listings.filter((l) => l.userId === user.id).length,
          joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно',
          status: 'active' as const,
          isAdmin: user.id === ADMIN_ID,
        }));
        setUsers(adminUsers);
      }
    };

    loadUsers();
    
    // Обновляем список каждые 10 секунд (вместо 3)
    const interval = setInterval(() => {
      console.log('🔄 AdminPage: Автообновление списка пользователей...');
      loadUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, [allUsers, listings]);

  // Проверка доступа (в реальном приложении это будет на бэкенде)
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '123456789';
  const isAdmin = currentUserId === ADMIN_ID;

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="access-denied">
            <div className="denied-icon">🚫</div>
            <h2>Доступ запрещен</h2>
            <p>У вас нет прав для просмотра этой страницы</p>
            <button className="btn btn-primary" onClick={() => navigate('/menu')}>
              Вернуться в меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBanUser = async (userId: string) => {
    if (window.confirm('Забанить этого пользователя? Он будет немедленно выкинут из приложения!')) {
      // Обновляем локально
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'banned' } : u
      ));

      // Сохраняем на сервер
      try {
        const { userAPI } = await import('../services/api');
        await userAPI.updateProfile(userId, { banned: true });
        console.log(`User ${userId} banned on server`);
      } catch (error) {
        console.error('Failed to ban user on server:', error);
      }

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    // Обновляем локально
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'active' } : u
    ));

    // Сохраняем на сервер
    try {
      const { userAPI } = await import('../services/api');
      await userAPI.updateProfile(userId, { banned: false });
      console.log(`User ${userId} unbanned on server`);
    } catch (error) {
      console.error('Failed to unban user on server:', error);
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleResolveReport = (reportId: string, status: 'resolved' | 'rejected') => {
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, status } : r
    ));
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    bannedUsers: users.filter(u => u.status === 'banned').length,
    totalListings: users.reduce((sum, u) => sum + u.listingsCount, 0),
    pendingReports: reports.filter(r => r.status === 'pending').length,
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← Назад
          </button>
          <h1 className="page-title">👑 Админ-панель</h1>
        </div>

        {/* Вкладки */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Статистика
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Активные ({stats.activeUsers})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'banned' ? 'active' : ''}`}
            onClick={() => setActiveTab('banned')}
          >
            🚫 Забаненные {stats.bannedUsers > 0 && <span className="badge">{stats.bannedUsers}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            🚨 Жалобы {stats.pendingReports > 0 && <span className="badge">{stats.pendingReports}</span>}
          </button>
        </div>

        {/* Статистика */}
        {activeTab === 'stats' && (
          <div className="stats-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Всего пользователей</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.activeUsers}</div>
                <div className="stat-label">Активных</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚫</div>
                <div className="stat-value">{stats.bannedUsers}</div>
                <div className="stat-label">Забанено</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-value">{stats.totalListings}</div>
                <div className="stat-label">Объявлений</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-value">{stats.pendingReports}</div>
                <div className="stat-label">Новых жалоб</div>
              </div>
            </div>
          </div>
        )}

        {/* Активные пользователи */}
        {activeTab === 'users' && (
          <div className="users-content">
            <div className="users-list">
              {users.filter(u => u.status === 'active').map(user => (
                <div key={user.id} className={`user-card ${user.isAdmin ? 'admin-card' : ''}`}>
                  <div className="user-info">
                    <div className="user-header">
                      <span className="user-nickname">
                        {user.isAdmin && '👑 '}
                        {user.nickname}
                      </span>
                      {user.isAdmin && <span className="admin-badge">АДМИНИСТРАТОР</span>}
                    </div>
                    <div className="user-details">
                      <span>ID: {user.id}</span>
                      <span>{user.country} • {user.city}</span>
                      <span>{user.listingsCount} объявлений</span>
                      <span>С {user.joinedAt}</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    {!user.isAdmin && user.status === 'active' ? (
                      <button 
                        className="action-btn ban-btn"
                        onClick={() => handleBanUser(user.id)}
                      >
                        🚫 Забанить
                      </button>
                    ) : !user.isAdmin && user.status === 'banned' ? (
                      <button 
                        className="action-btn unban-btn"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        ✅ Разбанить
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Забаненные пользователи */}
        {activeTab === 'banned' && (
          <div className="users-content">
            <div className="users-list">
              {users.filter(u => u.status === 'banned').length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>Нет забаненных пользователей</p>
                </div>
              ) : (
                users.filter(u => u.status === 'banned').map(user => (
                  <div key={user.id} className="user-card banned">
                    <div className="user-info">
                      <div className="user-header">
                        <span className="user-nickname">
                          {user.nickname}
                        </span>
                        <span className="banned-badge">🚫 ЗАБАНЕН</span>
                      </div>
                      <div className="user-details">
                        <span>ID: {user.id}</span>
                        <span>{user.country} • {user.city}</span>
                        <span>{user.listingsCount} объявлений</span>
                        <span>С {user.joinedAt}</span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button 
                        className="action-btn unban-btn"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        ✅ Разбанить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Жалобы */}
        {activeTab === 'reports' && (
          <div className="reports-content">
            <div className="reports-list">
              {reports.filter(r => r.status === 'pending').length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>Нет новых жалоб</p>
                </div>
              )}
              {reports.map(report => (
                <div key={report.id} className={`report-card ${report.status}`}>
                  <div className="report-header">
                    <span className="report-status">
                      {report.status === 'pending' && '🔴 Ожидает'}
                      {report.status === 'resolved' && '✅ Решено'}
                      {report.status === 'rejected' && '❌ Отклонено'}
                    </span>
                    <span className="report-date">
                      {new Date(report.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="report-info">
                    <p><strong>От:</strong> {report.reporterNickname}</p>
                    <p><strong>Объявление:</strong> {report.listingTitle} (ID: {report.listingId})</p>
                    <p><strong>Причина:</strong> {report.reason}</p>
                  </div>
                  {report.status === 'pending' && (
                    <div className="report-actions">
                      <button 
                        className="action-btn resolve-btn"
                        onClick={() => handleResolveReport(report.id, 'resolved')}
                      >
                        ✅ Решить
                      </button>
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => handleResolveReport(report.id, 'rejected')}
                      >
                        ❌ Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
