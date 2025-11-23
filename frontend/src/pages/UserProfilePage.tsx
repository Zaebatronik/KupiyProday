import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { currencyService } from '../services/currency';
import { useStore } from '../store';
import '../styles/ProfilePage.css';

interface UserListing {
  id: string;
  title: string;
  price: number;
  category: string;
  photos: string[];
  createdAt: string;
  status: 'active' | 'sold' | 'archived';
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { allUsers, user: currentUser } = useStore();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'all'>('active');
  const [dualPrices, setDualPrices] = useState<Map<string, string>>(new Map());

  // Проверка: только админ может просматривать чужие профили
  const ADMIN_ID = '670170626';
  const isAdmin = currentUser?.telegramId === ADMIN_ID || currentUser?.id === ADMIN_ID;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    loadUserData();
  }, [userId, isAdmin]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('🔍 UserProfilePage: Загружаю данные для userId:', userId);
      console.log('🔍 UserProfilePage: Пользователи в store:', allUsers.length);
      
      // Сначала пробуем найти в store
      let foundUser = allUsers.find((u: any) => 
        u.id === userId || u.telegramId === userId || u._id === userId
      );

      // Если не нашли в store, загружаем всех пользователей с сервера
      if (!foundUser) {
        console.log('⚠️ UserProfilePage: Пользователь не найден в store, загружаю с сервера...');
        try {
          const usersResponse = await fetch(`${API_URL}/api/users`);
          if (usersResponse.ok) {
            const serverUsers = await usersResponse.json();
            console.log('📥 UserProfilePage: Загружено пользователей с сервера:', serverUsers.length);
            foundUser = serverUsers.find((u: any) => 
              u.id === userId || u.telegramId === userId || u._id === userId
            );
          }
        } catch (err) {
          console.error('❌ Ошибка загрузки пользователей:', err);
        }
      }

      if (!foundUser) {
        console.error('❌ Пользователь не найден ни в store, ни на сервере:', userId);
        alert(`Пользователь с ID ${userId} не найден`);
        navigate('/admin');
        return;
      }

      console.log('✅ UserProfilePage: Пользователь найден:', foundUser.nickname);
      setUser(foundUser);

      // Загружаем объявления пользователя с сервера
      console.log('📦 UserProfilePage: Загружаю объявления...');
      const response = await fetch(`${API_URL}/api/listings/admin/all`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить объявления');
      }

      const allListings = await response.json();
      console.log('📦 UserProfilePage: Всего объявлений на сервере:', allListings.length);
      
      const userTelegramId = foundUser.telegramId || foundUser.id || (foundUser as any)._id;
      const userListings = allListings.filter((listing: any) => {
        const matches = listing.userId === userId || 
                       listing.userId === userTelegramId ||
                       listing.userId === (foundUser as any)._id;
        return matches;
      });

      console.log('📦 UserProfilePage: Объявлений пользователя:', userListings.length);
      console.log('📦 UserProfilePage: Объявления:', userListings);
      
      setListings(userListings);
      
      // Форматируем цены
      await formatPrices(userListings);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      alert('Ошибка загрузки данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const formatPrices = async (listingsToFormat: UserListing[]) => {
    const priceMap = new Map<string, string>();
    const adminCountry = currentUser?.country || 'UA';

    for (const listing of listingsToFormat) {
      const formatted = await currencyService.formatDualPrice(listing.price, adminCountry);
      priceMap.set(listing.id, formatted);
    }

    setDualPrices(priceMap);
  };

  const filteredListings = listings.filter(listing => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return listing.status === 'active';
    if (activeTab === 'sold') return listing.status === 'sold';
    return true;
  });

  const getCategoryEmoji = (category: string) => {
    const categories: Record<string, string> = {
      transport: '🚗',
      realestate: '🏠',
      electronics: '📱',
      services: '🛠️',
      clothes: '👕',
      hobby: '🎨',
      food: '🍕',
      other: '📦',
    };
    return categories[category] || '📦';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { text: 'Активно', color: '#10b981', emoji: '✅' },
      sold: { text: 'Продано', color: '#6b7280', emoji: '✔️' },
      archived: { text: 'В архиве', color: '#f59e0b', emoji: '📦' },
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        background: badge.color,
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {badge.emoji} {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ 
          fontSize: '48px',
          animation: 'spin 1s linear infinite'
        }}>⏳</div>
        <p style={{ color: '#64748b' }}>Загрузка профиля...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Пользователь не найден</h2>
        <button onClick={() => navigate('/admin')} style={{
          marginTop: '20px',
          padding: '12px 24px',
          borderRadius: '12px',
          border: 'none',
          background: '#667eea',
          color: 'white',
          cursor: 'pointer'
        }}>
          ← Вернуться в админ-панель
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        {/* Кнопка назад */}
        <button 
          onClick={() => navigate('/admin')}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          ← Назад в админ-панель
        </button>

        {/* Карточка профиля */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              border: '4px solid rgba(255,255,255,0.3)',
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                color: 'white', 
                fontSize: '32px', 
                fontWeight: '700',
                marginBottom: '8px',
              }}>
                {user.nickname}
              </h1>
              <div style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}>
                <div>📍 {user.city}, {user.country}</div>
                <div>📅 Зарегистрирован: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}</div>
                <div>🆔 ID: {user.telegramId || user.id}</div>
                {user.telegramUsername && <div>✈️ @{user.telegramUsername}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              {listings.length}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Всего объявлений</div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
              {listings.filter(l => l.status === 'active').length}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Активных</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✔️</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>
              {listings.filter(l => l.status === 'sold').length}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Проданных</div>
          </div>
        </div>

        {/* Табы */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '4px',
        }}>
          {[
            { id: 'active', label: 'Активные', emoji: '✅' },
            { id: 'sold', label: 'Проданные', emoji: '✔️' },
            { id: 'all', label: 'Все', emoji: '📋' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px 12px 0 0',
                border: 'none',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#667eea' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '600',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.3s',
                boxShadow: activeTab === tab.id ? '0 -4px 12px rgba(102, 126, 234, 0.15)' : 'none',
              }}
            >
              {tab.emoji} {tab.label} ({
                tab.id === 'all' ? listings.length :
                tab.id === 'active' ? listings.filter(l => l.status === 'active').length :
                listings.filter(l => l.status === 'sold').length
              })
            </button>
          ))}
        </div>

        {/* Список объявлений */}
        {filteredListings.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Нет объявлений</h3>
            <p style={{ color: '#64748b' }}>
              {activeTab === 'active' ? 'Нет активных объявлений' :
               activeTab === 'sold' ? 'Нет проданных товаров' :
               'Пользователь еще не создал объявлений'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {filteredListings.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Фото */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: listing.photos?.[0] 
                    ? `url(${listing.photos[0]})` 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}>
                  {/* Статус */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                  }}>
                    {getStatusBadge(listing.status)}
                  </div>
                  
                  {/* Категория */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {getCategoryEmoji(listing.category)} {listing.category}
                  </div>
                </div>

                {/* Контент */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {listing.title}
                  </h3>

                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#667eea',
                    marginBottom: '12px',
                  }}>
                    {dualPrices.get(listing.id) || `$${listing.price}`}
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>🆔 {listing.id}</span>
                    <span>📅 {new Date(listing.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
