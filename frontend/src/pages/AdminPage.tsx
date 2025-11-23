import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
  const [activeTab, setActiveTab] = useState<'stats' | 'all' | 'users' | 'banned' | 'reports' | 'logs'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState('');
  const [showListings, setShowListings] = useState<string | null>(null); // userId
  const [logs, setLogs] = useState<string[]>([]);
  const [liveUpdating, setLiveUpdating] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Умная загрузка пользователей с инкрементальными обновлениями
  useEffect(() => {
    let isSubscribed = true;
    const loadUsers = async (isInitial = false) => {
      if (!isSubscribed) return;
      try {
        const { userAPI } = await import('../services/api');
        console.log('🔍 AdminPage: Загрузка пользователей с сервера...');
        const response = await userAPI.getAll();
        console.log('📦 AdminPage: Получен ответ от сервера:', response.data);
        const serverUsers = response.data;
        if (!isSubscribed) return;
        console.log(`👥 AdminPage: Обрабатываю ${serverUsers.length} пользователей`);
        const newAdminUsers: AdminUser[] = serverUsers.map((user: any) => ({
          id: user.id,
          nickname: user.nickname,
          country: user.country,
          city: user.city,
          listingsCount: listings.filter((l) => l.userId === user.id).length,
          joinedAt: user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно',
          status: user.banned ? 'banned' : 'active',
          isAdmin: user.id === ADMIN_ID,
        }));
        newAdminUsers.sort((a, b) => {
          if (a.isAdmin) return -1;
          if (b.isAdmin) return 1;
          return 0;
        });
        setUsers(prev => {
          const hasChanges = prev.length !== newAdminUsers.length || 
            prev.some((p, i) => 
              p.id !== newAdminUsers[i]?.id || 
              p.status !== newAdminUsers[i]?.status ||
              p.nickname !== newAdminUsers[i]?.nickname
            );
          if (hasChanges || isInitial) {
            if (!isInitial) {
              setLogs(lgs => [
                `🔄 Обнаружены изменения пользователей: было ${prev.length}, стало ${newAdminUsers.length}`,
                ...lgs
              ]);
              if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
              }
            }
            return newAdminUsers;
          }
          return prev;
        });
        if (isInitial) {
          setLogs(lgs => [
            `✅ Загружено пользователей: ${newAdminUsers.length} (активных: ${newAdminUsers.filter(u => u.status === 'active').length}, забаненных: ${newAdminUsers.filter(u => u.status === 'banned').length})`,
            ...lgs
          ]);
        }
      } catch (error: any) {
        console.error('❌ AdminPage: Ошибка загрузки пользователей:', error);
        console.error('Детали:', error.response?.data, error.message);
        setLogs(lgs => [
          `❌ Ошибка загрузки пользователей: ${error.message || error}`,
          `🔗 URL: ${error.config?.url || 'неизвестно'}`,
          `📡 Статус: ${error.response?.status || 'нет ответа'}`,
          ...lgs
        ]);
        if (isInitial) {
          console.log('⚠️ AdminPage: Используем fallback на локальные данные:', allUsers);
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
      }
    };
    loadUsers(true);
    // Подключение к Socket.IO для live-обновления
    if (!socketRef.current) {
      const backendUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
      socketRef.current = io(backendUrl, { transports: ['websocket'] });
      socketRef.current.on('connect', () => setLogs(lgs => ['🟢 Socket.IO connected (AdminPage)', ...lgs]));
      socketRef.current.on('user-updated', () => {
        setLogs(lgs => ['🔔 Получено событие user-updated, обновляю пользователей...', ...lgs]);
        setLiveUpdating(true);
        loadUsers(false);
        setTimeout(() => setLiveUpdating(false), 2000);
      });
      socketRef.current.on('user-banned', () => {
        setLogs(lgs => ['🔔 Получено событие user-banned, обновляю пользователей...', ...lgs]);
        setLiveUpdating(true);
        loadUsers(false);
        setTimeout(() => setLiveUpdating(false), 2000);
      });
      socketRef.current.on('user-unbanned', () => {
        setLogs(lgs => ['🔔 Получено событие user-unbanned, обновляю пользователей...', ...lgs]);
        setLiveUpdating(true);
        loadUsers(false);
        setTimeout(() => setLiveUpdating(false), 2000);
      });
      socketRef.current.on('disconnect', () => setLogs(lgs => ['🔴 Socket.IO disconnected (AdminPage)', ...lgs]));
    }
    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [allUsers, listings]);
  // Массовый бан/разбан
  const handleMassBan = async (ids: string[], ban: boolean) => {
    for (const id of ids) {
      if (ban) await handleBanUser(id);
      else await handleUnbanUser(id);
    }
    setLogs(lgs => [`${ban ? '🚫' : '✅'} Массовое действие: ${ban ? 'бан' : 'разбан'} пользователей (${ids.length})`, ...lgs]);
  };

  // Вычисляем статистику
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    bannedUsers: users.filter(u => u.status === 'banned').length,
    totalListings: listings.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
  };

  // Быстрый фильтр пользователей
  const filteredUsers = users.filter(u =>
    (!search || u.nickname.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search))
  );

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
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    if (window.confirm(`Забанить "${targetUser.nickname}"? Пользователь будет немедленно выкинут из приложения!`)) {
      // Оптимистичное обновление UI
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'banned' as const } : u
      ));

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }

      // Сохраняем на сервер
      try {
        const { userAPI } = await import('../services/api');
        await userAPI.updateProfile(userId, { banned: true });
        console.log(`✅ Пользователь ${targetUser.nickname} (${userId}) забанен`);
      } catch (error) {
        console.error('❌ Ошибка бана на сервере:', error);
        
        // Откатываем изменения при ошибке
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: 'active' as const } : u
        ));
        
        alert('Ошибка! Не удалось забанить пользователя. Проверьте соединение.');
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    // Оптимистичное обновление UI
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'active' as const } : u
    ));

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    // Сохраняем на сервер
    try {
      const { userAPI } = await import('../services/api');
      await userAPI.updateProfile(userId, { banned: false });
      console.log(`✅ Пользователь ${targetUser.nickname} (${userId}) разбанен`);
    } catch (error) {
      console.error('❌ Ошибка разбана на сервере:', error);
      
      // Откатываем изменения при ошибке
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'banned' as const } : u
      ));
      
      alert('Ошибка! Не удалось разбанить пользователя. Проверьте соединение.');
    }
  };

  // Обработчик клика по статистике
  const handleStatClick = (tab: 'all' | 'users' | 'banned') => {
    setActiveTab(tab);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
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

  // Экспорт данных в CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Nickname', 'Country', 'City', 'Listings', 'Joined', 'Status'];
    const rows = filteredUsers.map(u => [
      u.id,
      u.nickname,
      u.country,
      u.city,
      u.listingsCount,
      u.joinedAt,
      u.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setLogs(lgs => [`📥 Экспортировано ${filteredUsers.length} пользователей в CSV`, ...lgs]);
  };

  // Экспорт данных в JSON
  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalUsers: filteredUsers.length,
      users: filteredUsers,
      statistics: stats
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setLogs(lgs => [`📥 Экспортировано ${filteredUsers.length} пользователей в JSON`, ...lgs]);
  };

  // Статистика по городам
  const cityStats = users.reduce((acc, user) => {
    const city = user.city;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCities = Object.entries(cityStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Статистика по странам
  const countryStats = users.reduce((acc, user) => {
    const country = user.country;
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← Назад
          </button>
          <h1 className="page-title">🐻 Берлога - Админ-панель</h1>
          {liveUpdating && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              animation: 'pulse 1s ease-in-out infinite',
              marginLeft: '8px'
            }}>
              <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
              Live
            </div>
          )}
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
          <button 
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Логи {logs.length > 0 && <span className="badge">{logs.length}</span>}
          </button>
        </div>

        {/* Статистика */}
        {activeTab === 'stats' && (
          <div className="stats-content">
            <div className="stats-grid">
              <div className="stat-card clickable" onClick={() => handleStatClick('all')}>
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Всего пользователей</div>
                <div className="stat-hint">👆 Нажми чтобы посмотреть</div>
              </div>
              <div className="stat-card clickable" onClick={() => handleStatClick('users')}>
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.activeUsers}</div>
                <div className="stat-label">Активных</div>
                <div className="stat-hint">👆 Нажми чтобы посмотреть</div>
              </div>
              <div className="stat-card clickable" onClick={() => handleStatClick('banned')}>
                <div className="stat-icon">🚫</div>
                <div className="stat-value">{stats.bannedUsers}</div>
                <div className="stat-label">Забанено</div>
                <div className="stat-hint">👆 Нажми чтобы посмотреть</div>
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

            {/* Экспорт данных */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="export-btn"
                onClick={exportToCSV}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s'
                }}
              >
                📥 Экспорт в CSV
              </button>
              <button 
                className="export-btn"
                onClick={exportToJSON}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s'
                }}
              >
                📥 Экспорт в JSON
              </button>
            </div>

            {/* Топ городов */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ marginBottom: 16, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>🏙️ Топ-5 городов</h3>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: 20 }}>
                {topCities.map(([city, count], index) => (
                  <div key={city} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    marginBottom: 8,
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'white' }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{city}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: `${(count / topCities[0][1]) * 150}px`, 
                        height: 8, 
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: 4,
                        transition: 'width 0.5s'
                      }} />
                      <span style={{ fontSize: 18, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Топ стран */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 16, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>🌍 Топ-5 стран</h3>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: 20 }}>
                {topCountries.map(([country, count], index) => (
                  <div key={country} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    marginBottom: 8,
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'white' }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{country}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: `${(count / topCountries[0][1]) * 150}px`, 
                        height: 8, 
                        background: 'linear-gradient(90deg, #f093fb, #4facfe)',
                        borderRadius: 4,
                        transition: 'width 0.5s'
                      }} />
                      <span style={{ fontSize: 18, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Все пользователи */}
        {activeTab === 'all' && (
          <div className="users-content">
            <div className="section-header">
              <h3>👨‍👩‍👧‍👦 Все пользователи ({filteredUsers.length})</h3>
              <input
                type="text"
                placeholder="Поиск по нику или ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ margin: '8px 0', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', width: 220 }}
              />
              <button onClick={() => handleMassBan(filteredUsers.filter(u => !u.isAdmin && u.status === 'active').map(u => u.id), true)} style={{marginLeft:8}}>🚫 Массовый бан</button>
              <button onClick={() => handleMassBan(filteredUsers.filter(u => !u.isAdmin && u.status === 'banned').map(u => u.id), false)} style={{marginLeft:8}}>✅ Массовый разбан</button>
            </div>
            <div className="users-list">
              {filteredUsers.map(user => (
                <div key={user.id} className={`user-card ${user.isAdmin ? 'admin-card' : ''} ${user.status === 'banned' ? 'banned' : ''}`}>
                  <div className="user-info">
                    <div className="user-header">
                      <span className="user-nickname">
                        {user.isAdmin && '👑 '}
                        {user.status === 'banned' && '🚫 '}
                        {user.nickname}
                      </span>
                      {user.isAdmin && <span className="admin-badge">АДМИНИСТРАТОР</span>}
                      {user.status === 'banned' && <span className="banned-badge">ЗАБАНЕН</span>}
                    </div>
                    <div className="user-details">
                      <span>ID: {user.id}</span>
                      <span>{user.country} • {user.city}</span>
                      <span>{user.listingsCount} объявлений <button style={{marginLeft:4}} onClick={() => setShowListings(user.id)}>👁️</button></span>
                      <span>С {user.joinedAt}</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    {!user.isAdmin && (
                      user.status === 'active' ? (
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
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Просмотр объявлений пользователя */}
            {showListings && (
              <div style={{background:'#fff',border:'1px solid #ccc',borderRadius:12,padding:16,marginTop:16}}>
                <h4>Объявления пользователя {filteredUsers.find(u=>u.id===showListings)?.nickname}:</h4>
                <ul>
                  {listings.filter(l=>l.userId===showListings).map(l=>(
                    <li key={l.id}>{l.title} ({l.category}, {l.price}₽)</li>
                  ))}
                </ul>
                <button onClick={()=>setShowListings(null)}>Закрыть</button>
              </div>
            )}
          </div>
        )}
        {/* Логи действий */}
        {activeTab === 'logs' && (
          <div className="logs-content" style={{maxHeight:300,overflowY:'auto',background:'#f8f9fa',padding:12,borderRadius:12}}>
            <h3>Логи действий</h3>
            <ul style={{fontSize:13}}>
              {logs.map((log,i)=>(<li key={i}>{log}</li>))}
            </ul>
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
