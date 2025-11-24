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
  const [activeTab, setActiveTab] = useState<'stats' | 'all' | 'users' | 'banned' | 'reports' | 'logs' | 'listings' | 'broadcast'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [liveUpdating, setLiveUpdating] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [selectedUserListings, setSelectedUserListings] = useState<{userId: string, nickname: string} | null>(null);

  // Проверка доступа: только админ может видеть эту страницу
  useEffect(() => {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    console.log('🔐 Проверка доступа к админ-панели:', { telegramId, ADMIN_ID });
    
    if (!telegramId || telegramId !== ADMIN_ID) {
      console.log('❌ Доступ запрещён - не админ');
      navigate('/');
      return;
    }
  }, [navigate]);

  // Загрузка локальных пользователей
  const loadLocalUsers = () => {
    console.log('💾 Загрузка локальных пользователей из store:', allUsers);
    const adminUsers: AdminUser[] = allUsers.map((user: User) => ({
      id: user.telegramId || user.id,
      nickname: user.nickname,
      country: user.country,
      city: user.city,
      listingsCount: listings.filter((l) => l.userId === (user.telegramId || user.id)).length,
      joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно',
      status: 'active' as const,
      isAdmin: (user.telegramId || user.id) === ADMIN_ID,
    }));
    adminUsers.sort((a, b) => {
      if (a.isAdmin) return -1;
      if (b.isAdmin) return 1;
      return 0;
    });
    setUsers(adminUsers);
    setLogs(lgs => [
      `💾 Загружено ${adminUsers.length} пользователей из локального хранилища`,
      ...lgs
    ]);
  };

  // Умная загрузка пользователей с инкрементальными обновлениями
  useEffect(() => {
    let isSubscribed = true;
    
    // Сначала загружаем локальные данные
    loadLocalUsers();
    
    const loadUsers = async (isInitial = false) => {
      if (!isSubscribed) return;
      try {
        const { userAPI, listingsAPI } = await import('../services/api');
        console.log('🔍 AdminPage: Загрузка пользователей и объявлений с сервера...');
        
        if (isInitial) {
          setLogs(lgs => [
            '⏳ Подключение к серверу... (может занять 10-30 сек если сервер "спал")',
            ...lgs
          ]);
        }
        
        // Загружаем и пользователей, и объявления параллельно
        const [usersResponse, listingsResponse] = await Promise.all([
          userAPI.getAll(),
          listingsAPI.getAllForAdmin()
        ]);
        
        console.log('📦 AdminPage: Получен ответ от сервера:', usersResponse.data);
        const serverUsers = usersResponse.data;
        const serverListings = listingsResponse.data;
        
        if (!isSubscribed) return;
        console.log(`👥 AdminPage: Обрабатываю ${serverUsers.length} пользователей и ${serverListings.length} объявлений`);
        
        const newAdminUsers: AdminUser[] = serverUsers.map((user: any) => {
          // Используем telegramId как основной ID (если есть), иначе _id из MongoDB
          const userId = user.telegramId || user._id || user.id;
          
          // Считаем объявления по userId из сервера
          const userListingsCount = serverListings.filter((l: any) => l.userId === userId).length;
          
          console.log('🔍 Маппинг пользователя:', {
            telegramId: user.telegramId,
            _id: user._id,
            nickname: user.nickname,
            finalId: userId,
            listingsCount: userListingsCount
          });
          
          return {
            id: userId,
            nickname: user.nickname,
            country: user.country,
            city: user.city,
            listingsCount: userListingsCount,
            joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 
                      user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно',
            status: user.banned ? 'banned' : 'active',
            isAdmin: userId === ADMIN_ID,
          };
        });
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
        console.error('Полный объект ошибки:', {
          message: error.message,
          response: error.response,
          request: error.request,
          config: error.config
        });
        
        const errorMessage = error.response?.data?.message || error.message || String(error);
        const errorDetails = JSON.stringify(error.response?.data || {});
        
        setLogs(lgs => [
          `❌ ОШИБКА загрузки: ${errorMessage}`,
          `🔗 URL: ${error.config?.url || 'неизвестно'}`,
          `📡 Статус: ${error.response?.status || 'нет ответа'}`,
          `📋 Детали: ${errorDetails}`,
          ...lgs
        ]);
        
        // Показываем alert с ошибкой
        if (isInitial) {
          alert(`❌ Ошибка загрузки пользователей:\n\n${errorMessage}\n\nСтатус: ${error.response?.status || 'нет связи'}\n\nПроверьте консоль для деталей.`);
        }
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
      
      // Новый пользователь зарегистрировался
      socketRef.current.on('user-registered', (newUser) => {
        setLogs(lgs => [`🎉 Новый пользователь зарегистрирован: ${newUser.nickname}`, ...lgs]);
        setLiveUpdating(true);
        loadUsers(false);
        setTimeout(() => setLiveUpdating(false), 2000);
      });
      
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
          <button 
            className={`refresh-btn ${liveUpdating ? 'refreshing' : ''}`}
            onClick={() => window.location.reload()}
          >
            <span className="refresh-icon">🔄</span>
            Обновить
          </button>
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
          <button 
            className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            📦 Объявления ({stats.totalListings})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            📢 Рассылка
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
            <div className="export-buttons">
              <button 
                className="export-btn export-csv"
                onClick={exportToCSV}
              >
                📥 Экспорт в CSV
              </button>
              <button 
                className="export-btn export-json"
                onClick={exportToJSON}
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
                <div 
                  key={user.id} 
                  className={`user-card ${user.isAdmin ? 'admin-card' : ''} ${user.status === 'banned' ? 'banned' : ''}`}
                  onClick={() => navigate(`/admin/user/${user.id}`)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
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
                      <span>
                        📦 {user.listingsCount > 0 ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserListings({ userId: user.id, nickname: user.nickname });
                            }}
                            style={{
                              color: '#667eea',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            {user.listingsCount} объявлений
                          </span>
                        ) : (
                          `${user.listingsCount} объявлений`
                        )}
                      </span>
                      <span>С {user.joinedAt}</span>
                    </div>
                  </div>
                  <div className="user-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/user/${user.id}`);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        marginBottom: '8px'
                      }}
                    >
                      👤 Управление
                    </button>
                    {!user.isAdmin && (
                      user.status === 'active' ? (
                        <button 
                          className="action-btn ban-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBanUser(user.id);
                          }}
                        >
                          🚫 Забанить
                        </button>
                      ) : (
                        <button 
                          className="action-btn unban-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnbanUser(user.id);
                          }}
                        >
                          ✅ Разбанить
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                <div 
                  key={user.id} 
                  className={`user-card ${user.isAdmin ? 'admin-card' : ''}`}
                  onClick={() => navigate(`/admin/user/${user.id}`)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
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
                      <span>
                        {user.listingsCount > 0 ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserListings({ userId: user.id, nickname: user.nickname });
                            }}
                            style={{
                              color: '#667eea',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            {user.listingsCount} объявлений
                          </span>
                        ) : (
                          `${user.listingsCount} объявлений`
                        )}
                      </span>
                      <span>С {user.joinedAt}</span>
                    </div>
                  </div>
                  <div className="user-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/user/${user.id}`);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        marginBottom: '8px'
                      }}
                    >
                      ⚙️ Управление
                    </button>
                    {!user.isAdmin && user.status === 'active' ? (
                      <button 
                        className="action-btn ban-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBanUser(user.id);
                        }}
                      >
                        🚫 Забанить
                      </button>
                    ) : !user.isAdmin && user.status === 'banned' ? (
                      <button 
                        className="action-btn unban-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnbanUser(user.id);
                        }}
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
                  <div 
                    key={user.id} 
                    className="user-card banned"
                    onClick={() => navigate(`/admin/user/${user.id}`)}
                    style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
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
                        <span>
                          {user.listingsCount > 0 ? (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserListings({ userId: user.id, nickname: user.nickname });
                              }}
                              style={{
                                color: '#667eea',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              {user.listingsCount} объявлений
                            </span>
                          ) : (
                            `${user.listingsCount} объявлений`
                          )}
                        </span>
                        <span>С {user.joinedAt}</span>
                      </div>
                    </div>
                    <div className="user-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/user/${user.id}`);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          marginBottom: '8px'
                        }}
                      >
                        ⚙️ Управление
                      </button>
                      <button 
                        className="action-btn unban-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnbanUser(user.id);
                        }}
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

        {/* Управление объявлениями */}
        {activeTab === 'listings' && (
          <div className="listings-content">
            <div className="content-header">
              <h3>📦 Управление объявлениями</h3>
              <div className="header-actions">
                <input
                  type="text"
                  placeholder="🔍 Поиск по названию..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
                {selectedListings.length > 0 && (
                  <button 
                    className="bulk-action-btn"
                    onClick={() => {
                      if (confirm(`Удалить ${selectedListings.length} выбранных объявлений?`)) {
                        setLogs(lgs => [`🗑️ Удалено ${selectedListings.length} объявлений`, ...lgs]);
                        setSelectedListings([]);
                      }
                    }}
                  >
                    🗑️ Удалить выбранные ({selectedListings.length})
                  </button>
                )}
              </div>
            </div>

            <div className="listings-stats">
              <div className="mini-stat">
                <span className="mini-stat-icon">📦</span>
                <span className="mini-stat-value">{listings.length}</span>
                <span className="mini-stat-label">Всего</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-icon">✅</span>
                <span className="mini-stat-value">{listings.filter(l => l.status === 'active').length}</span>
                <span className="mini-stat-label">Активных</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-icon">👁️</span>
                <span className="mini-stat-value">{listings.reduce((sum, l) => sum + (l.views || 0), 0)}</span>
                <span className="mini-stat-label">Просмотров</span>
              </div>
            </div>

            <div className="listings-list">
              {listings
                .filter(listing => 
                  listing.title.toLowerCase().includes(search.toLowerCase()) ||
                  listing.description?.toLowerCase().includes(search.toLowerCase())
                )
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .map((listing) => (
                  <div key={listing.id} className="listing-card-admin">
                    <input
                      type="checkbox"
                      checked={selectedListings.includes(listing.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedListings([...selectedListings, listing.id]);
                        } else {
                          setSelectedListings(selectedListings.filter(id => id !== listing.id));
                        }
                      }}
                      className="listing-checkbox"
                    />
                    
                    {listing.photos && listing.photos.length > 0 && (
                      <img src={listing.photos[0]} alt={listing.title} className="listing-image-admin" />
                    )}
                    
                    <div className="listing-info-admin">
                      <h4 className="listing-title-admin">{listing.title}</h4>
                      <p className="listing-price-admin">{listing.price ? `${listing.price} €` : 'Договорная'}</p>
                      <p className="listing-user-admin">👤 {listing.userNickname || 'Аноним'}</p>
                      <p className="listing-location-admin">📍 {listing.city}, {listing.country}</p>
                      <p className="listing-date-admin">📅 {new Date(listing.createdAt || '').toLocaleDateString('ru-RU')}</p>
                      <p className="listing-views-admin">👁️ {listing.views || 0} просмотров</p>
                    </div>

                    <div className="listing-actions-admin">
                      <button 
                        className="action-btn-admin view-btn"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      >
                        👁️ Просмотр
                      </button>
                      <button 
                        className="action-btn-admin delete-btn"
                        onClick={() => {
                          if (confirm(`Удалить объявление "${listing.title}"?`)) {
                            setLogs(lgs => [`🗑️ Удалено объявление: ${listing.title}`, ...lgs]);
                          }
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Рассылка сообщений */}
        {activeTab === 'broadcast' && (
          <div className="broadcast-content">
            <div className="content-header">
              <h3>📢 Рассылка сообщений всем пользователям</h3>
              <p className="broadcast-subtitle">
                Отправьте важное уведомление всем {stats.activeUsers} активным пользователям
              </p>
            </div>

            <div className="broadcast-form">
              <div className="form-group">
                <label className="form-label">
                  ✉️ Сообщение для рассылки
                </label>
                <textarea
                  className="broadcast-textarea"
                  placeholder="Введите текст сообщения для рассылки всем пользователям...

Примеры:
• Уважаемые пользователи! Проводятся технические работы...
• 🎉 Новая функция: теперь вы можете...
• ⚠️ Важное уведомление о безопасности..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={10}
                />
                <div className="char-counter">
                  {broadcastMessage.length} / 1000 символов
                </div>
              </div>

              <div className="broadcast-preview">
                <h4>📱 Предпросмотр сообщения:</h4>
                <div className="message-preview">
                  <div className="preview-header">
                    <span className="preview-bot">🐻 Берлога Bot</span>
                    <span className="preview-time">Только что</span>
                  </div>
                  <div className="preview-text">
                    {broadcastMessage || 'Введите текст сообщения...'}
                  </div>
                </div>
              </div>

              <div className="broadcast-actions">
                <button 
                  className="broadcast-btn send-btn"
                  disabled={!broadcastMessage.trim() || broadcastMessage.length > 1000}
                  onClick={() => {
                    if (confirm(`Отправить сообщение всем ${stats.activeUsers} пользователям?`)) {
                      setLogs(lgs => [`📢 Рассылка отправлена ${stats.activeUsers} пользователям`, ...lgs]);
                      setBroadcastMessage('');
                      if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                      }
                    }
                  }}
                >
                  📤 Отправить всем ({stats.activeUsers})
                </button>
                <button 
                  className="broadcast-btn test-btn"
                  disabled={!broadcastMessage.trim()}
                  onClick={() => {
                    setLogs(lgs => [`🧪 Тестовое сообщение отправлено вам`, ...lgs]);
                    alert(`Тест сообщения:\n\n${broadcastMessage}`);
                  }}
                >
                  🧪 Тест (отправить себе)
                </button>
                <button 
                  className="broadcast-btn clear-btn"
                  onClick={() => setBroadcastMessage('')}
                >
                  🗑️ Очистить
                </button>
              </div>

              <div className="broadcast-tips">
                <h4>💡 Советы по рассылке:</h4>
                <ul>
                  <li>✅ Пишите кратко и по делу</li>
                  <li>✅ Используйте эмодзи для привлечения внимания</li>
                  <li>✅ Указывайте срок действия акций</li>
                  <li>❌ Не злоупотребляйте рассылкой (макс 1-2 раза в неделю)</li>
                  <li>❌ Не отправляйте рекламу сторонних сервисов</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно с объявлениями пользователя */}
      {selectedUserListings && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedUserListings(null)}
        >
          <div 
            className="modal-content-listings"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📦 Объявления пользователя: {selectedUserListings.nickname}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedUserListings(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {listings
                .filter(l => l.userId === selectedUserListings.userId)
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .map(listing => (
                  <div key={listing.id} className="modal-listing-card">
                    {listing.photos && listing.photos.length > 0 && (
                      <img 
                        src={listing.photos[0]} 
                        alt={listing.title} 
                        className="modal-listing-image"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      />
                    )}
                    
                    <div className="modal-listing-info">
                      <h4 
                        className="modal-listing-title"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      >
                        {listing.title}
                      </h4>
                      <p className="modal-listing-price">
                        {listing.price ? `${listing.price} €` : 'Договорная'}
                      </p>
                      <p className="modal-listing-details">
                        📍 {listing.city}, {listing.country}
                      </p>
                      <p className="modal-listing-details">
                        📅 {new Date(listing.createdAt || '').toLocaleDateString('ru-RU')}
                      </p>
                      <p className="modal-listing-details">
                        👁️ {listing.views || 0} просмотров
                      </p>
                      <div className="modal-listing-status">
                        {listing.status === 'active' ? (
                          <span className="status-badge active">✅ Активно</span>
                        ) : (
                          <span className="status-badge inactive">❌ Неактивно</span>
                        )}
                      </div>
                    </div>

                    <div className="modal-listing-actions">
                      <button 
                        className="modal-btn view"
                        onClick={() => {
                          setSelectedUserListings(null);
                          navigate(`/listing/${listing.id}`);
                        }}
                      >
                        👁️ Открыть
                      </button>
                      <button 
                        className="modal-btn delete"
                        onClick={() => {
                          if (confirm(`Удалить объявление "${listing.title}"?`)) {
                            setLogs(lgs => [`🗑️ Удалено объявление: ${listing.title}`, ...lgs]);
                          }
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                ))}
              
              {listings.filter(l => l.userId === selectedUserListings.userId).length === 0 && (
                <div className="modal-empty">
                  <div className="empty-icon">📭</div>
                  <p>У пользователя нет объявлений</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
