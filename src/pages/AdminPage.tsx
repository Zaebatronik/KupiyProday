import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AdminPage.css';

// ID админа (ваш Telegram ID)
const ADMIN_ID = '670170626';

interface User {
  id: string;
  nickname: string;
  country: string;
  city: string;
  listingsCount: number;
  joinedAt: string;
  status: 'active' | 'banned';
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

// Моковые данные
const MOCK_USERS: User[] = [
  { id: '1', nickname: 'ivan_petrov', country: '🇷🇺 Россия', city: 'Москва', listingsCount: 5, joinedAt: '2024-01-10', status: 'active' },
  { id: '2', nickname: 'maria_s', country: '🇷🇺 Россия', city: 'Санкт-Петербург', listingsCount: 3, joinedAt: '2024-01-12', status: 'active' },
  { id: '3', nickname: 'alex_ua', country: '🇺🇦 Україна', city: 'Київ', listingsCount: 8, joinedAt: '2024-01-08', status: 'active' },
  { id: '4', nickname: 'scammer123', country: '🇷🇺 Россия', city: 'Казань', listingsCount: 15, joinedAt: '2024-01-15', status: 'banned' },
];

const MOCK_REPORTS: Report[] = [
  { id: '1', reporterNickname: 'ivan_petrov', listingId: 'L123', listingTitle: 'iPhone подозрительно дешевый', reason: 'Возможное мошенничество', createdAt: '2024-01-15T10:30:00', status: 'pending' },
  { id: '2', reporterNickname: 'maria_s', listingId: 'L456', listingTitle: 'Спам реклама', reason: 'Спам и реклама', createdAt: '2024-01-14T15:20:00', status: 'pending' },
  { id: '3', reporterNickname: 'alex_ua', listingId: 'L789', listingTitle: 'Запрещенный товар', reason: 'Нарушение правил', createdAt: '2024-01-13T09:10:00', status: 'resolved' },
];

export default function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'reports'>('stats');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

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

  const handleBanUser = (userId: string) => {
    if (window.confirm('Забанить этого пользователя?')) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'banned' } : u
      ));
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    }
  };

  const handleUnbanUser = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'active' } : u
    ));
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
            👥 Пользователи
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

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="users-content">
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className={`user-card ${user.status === 'banned' ? 'banned' : ''}`}>
                  <div className="user-info">
                    <div className="user-header">
                      <span className="user-nickname">{user.nickname}</span>
                      {user.status === 'banned' && <span className="banned-badge">🚫 Забанен</span>}
                    </div>
                    <div className="user-details">
                      <span>{user.country} • {user.city}</span>
                      <span>{user.listingsCount} объявлений</span>
                      <span>С {new Date(user.joinedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    {user.status === 'active' ? (
                      <button 
                        className="action-btn ban-btn"
                        onClick={() => handleBanUser(user.id)}
                      >
                        🚫 Забанить
                      </button>
                    ) : (
                      <button 
                        className="action-btn unban-btn"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        ✅ Разбанить
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
