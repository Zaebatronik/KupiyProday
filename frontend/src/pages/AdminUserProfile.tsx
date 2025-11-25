import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import '../styles/AdminPage.css';

const ADMIN_ID = '670170626';

interface UserData {
  id: string;
  telegramId: string;
  nickname: string;
  country: string;
  city: string;
  createdAt: string;
  telegramUsername?: string;
  banned: boolean;
}

interface UserListing {
  _id: string;
  id: string;
  title: string;
  price: number;
  category: string;
  photos: string[];
  createdAt: string;
  status: 'active' | 'hidden' | 'deleted';
  views: number;
  userNickname: string;
}

export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, allUsers } = useStore();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'listings' | 'actions'>('info');
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserData>>({});

  // Проверка доступа
  useEffect(() => {
    const telegramId = currentUser?.telegramId || currentUser?.id;
    if (telegramId !== ADMIN_ID) {
      navigate('/');
      return;
    }
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('🔍 AdminUserProfile: Загружаю данные для userId:', userId);
      
      // Загружаем данные пользователя
      let foundUser = allUsers.find((u: any) => {
        const uId = u.id || u._id?.toString() || u.telegramId;
        return uId === userId || u.telegramId === userId || u._id?.toString() === userId;
      });

      if (!foundUser) {
        console.log('🔍 Пользователь не найден в store, загружаю с сервера...');
        
        // Сначала пробуем прямой запрос по ID
        try {
          const directResponse = await fetch(`${API_URL}/users/${userId}`);
          if (directResponse.ok) {
            foundUser = await directResponse.json();
            console.log('✅ Пользователь найден прямым запросом:', foundUser);
          }
        } catch (e) {
          console.log('⚠️ Прямой запрос не удался, пробуем загрузить всех пользователей');
        }
        
        // Если не нашли прямым запросом - загружаем всех
        if (!foundUser) {
          const usersResponse = await fetch(`${API_URL}/users`);
          if (usersResponse.ok) {
            const serverUsers = await usersResponse.json();
            console.log('📥 Получено пользователей с сервера:', serverUsers.length);
            foundUser = serverUsers.find((u: any) => {
              const uId = u.id || u._id?.toString() || u.telegramId;
              console.log('Проверка:', { uId, telegramId: u.telegramId, _id: u._id, userId });
              return uId === userId || u.telegramId === userId || u._id?.toString() === userId;
            });
          }
        }
      }

      if (!foundUser) {
        console.error('❌ Пользователь не найден!');
        console.error('Искали по userId:', userId);
        console.error('Доступные пользователи в store:', allUsers.map((u: any) => ({
          id: u.id,
          telegramId: u.telegramId,
          _id: u._id,
          nickname: u.nickname
        })));
        alert(`Пользователь не найден (ID: ${userId}). Проверьте консоль для деталей.`);
        navigate('/admin');
        return;
      }

      console.log('✅ Найден пользователь:', foundUser);

      const foundUserAny = foundUser as any;
      const userDataFormatted: UserData = {
        id: foundUserAny.telegramId || foundUserAny._id?.toString() || foundUserAny.id,
        telegramId: foundUserAny.telegramId || foundUserAny._id?.toString() || foundUserAny.id,
        nickname: foundUserAny.nickname,
        country: foundUserAny.country,
        city: foundUserAny.city,
        createdAt: foundUserAny.createdAt instanceof Date ? foundUserAny.createdAt.toISOString() : foundUserAny.createdAt,
        telegramUsername: foundUserAny.telegramUsername,
        banned: foundUserAny.banned || false,
      };
      
      setUserData(userDataFormatted);
      setEditedUser(userDataFormatted);

      // Загружаем объявления пользователя
      const listingsResponse = await fetch(`${API_URL}/api/listings/admin/all`);
      if (listingsResponse.ok) {
        const allListings = await listingsResponse.json();
        const userTelegramId = foundUser.telegramId || foundUser.id;
        const userListings = allListings.filter((listing: any) => 
          listing.userId === userId || 
          listing.userId === userTelegramId ||
          listing.userId === (foundUser as any)._id
        );
        setListings(userListings);
        console.log('✅ Загружено объявлений:', userListings.length);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      alert('Ошибка загрузки данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!window.confirm(`Забанить пользователя ${userData?.nickname}?`)) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users/${userId}/ban`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Пользователь забанен');
        loadUserData();
      }
    } catch (error) {
      console.error('Ошибка бана:', error);
      alert('Не удалось забанить пользователя');
    }
  };

  const handleUnbanUser = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users/${userId}/unban`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Пользователь разбанен');
        loadUserData();
      }
    } catch (error) {
      console.error('Ошибка разбана:', error);
      alert('Не удалось разбанить пользователя');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Удалить это объявление?')) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Объявление удалено');
        loadUserData();
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить объявление');
    }
  };

  const handleSaveUserData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUser),
      });

      if (response.ok) {
        alert('Данные пользователя обновлены');
        setEditMode(false);
        loadUserData();
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    }
  };

  const handleDeleteAllListings = async () => {
    if (!window.confirm(`Удалить ВСЕ ${listings.length} объявлений пользователя ${userData?.nickname}? Это действие необратимо!`)) return;
    
    for (const listing of listings) {
      await handleDeleteListing(listing._id || listing.id);
    }
    alert('Все объявления удалены');
    loadUserData();
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
        <div style={{ fontSize: '64px' }}>⏳</div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Пользователь не найден</h2>
        <button onClick={() => navigate('/admin')}>Вернуться в админ-панель</button>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Шапка */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button 
            onClick={() => navigate('/admin')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              marginBottom: '16px',
              fontWeight: '600'
            }}
          >
            ← Назад в админ-панель
          </button>
          
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
              border: '4px solid rgba(255,255,255,0.3)'
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: 'white', fontSize: '32px', margin: '0 0 8px 0' }}>
                {userData.nickname}
                {userData.banned && <span style={{ marginLeft: '12px', background: '#ef4444', padding: '4px 12px', borderRadius: '8px', fontSize: '14px' }}>🚫 ЗАБАНЕН</span>}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                ID: {userData.telegramId || userData.id} • {userData.country}, {userData.city}
              </p>
            </div>
            
            {/* Быстрые действия */}
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              {!userData.banned ? (
                <button 
                  onClick={handleBanUser}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🚫 Забанить
                </button>
              ) : (
                <button 
                  onClick={handleUnbanUser}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✅ Разбанить
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Табы */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
          {[
            { id: 'info', label: '📊 Информация', emoji: '📊' },
            { id: 'listings', label: `📦 Объявления (${listings.length})`, emoji: '📦' },
            { id: 'actions', label: '⚙️ Действия', emoji: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px 12px 0 0',
                border: 'none',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#667eea' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '600',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                boxShadow: activeTab === tab.id ? '0 -4px 12px rgba(102, 126, 234, 0.15)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Контент табов */}
        {activeTab === 'info' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Информация о пользователе</h2>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  ✏️ Редактировать
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveUserData} style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    💾 Сохранить
                  </button>
                  <button onClick={() => { setEditMode(false); setEditedUser(userData); }} style={{
                    padding: '10px 20px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    ❌ Отмена
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Никнейм</label>
                {editMode ? (
                  <input 
                    type="text"
                    value={editedUser.nickname}
                    onChange={(e) => setEditedUser({...editedUser, nickname: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{userData.nickname}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Страна</label>
                {editMode ? (
                  <input 
                    type="text"
                    value={editedUser.country}
                    onChange={(e) => setEditedUser({...editedUser, country: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{userData.country}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Город</label>
                {editMode ? (
                  <input 
                    type="text"
                    value={editedUser.city}
                    onChange={(e) => setEditedUser({...editedUser, city: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{userData.city}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Telegram ID</label>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: 0, fontFamily: 'monospace' }}>{userData.telegramId}</p>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Telegram Username</label>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {userData.telegramUsername ? `@${userData.telegramUsername}` : 'Не указан'}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Дата регистрации</label>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {new Date(userData.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Статус</label>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {userData.banned ? '🚫 Забанен' : '✅ Активен'}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Объявлений</label>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  📦 {listings.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0 }}>Объявления пользователя ({listings.length})</h2>
              {listings.length > 0 && (
                <button 
                  onClick={handleDeleteAllListings}
                  style={{
                    padding: '12px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🗑️ Удалить все объявления
                </button>
              )}
            </div>

            {listings.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '60px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                <h3>Нет объявлений</h3>
                <p style={{ color: '#64748b' }}>У пользователя пока нет объявлений</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {listings.map(listing => (
                  <div
                    key={listing._id || listing.id}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s',
                      border: listing.status !== 'active' ? '2px solid #ef4444' : 'none'
                    }}
                  >
                    {/* Фото */}
                    <div
                      onClick={() => navigate(`/listing/${listing._id || listing.id}`)}
                      style={{
                        width: '100%',
                        height: '200px',
                        background: listing.photos?.[0] 
                          ? `url(${listing.photos[0]})` 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {listing.status !== 'active' && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#ef4444',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          {listing.status === 'hidden' ? '👁️‍🗨️ СКРЫТО' : '🗑️ УДАЛЕНО'}
                        </div>
                      )}
                    </div>

                    {/* Контент */}
                    <div style={{ padding: '16px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        margin: '0 0 8px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {listing.title}
                      </h3>

                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#667eea',
                        marginBottom: '12px'
                      }}>
                        ${listing.price}
                      </div>

                      <div style={{
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '12px'
                      }}>
                        <div>📅 {new Date(listing.createdAt).toLocaleDateString('ru-RU')}</div>
                        <div>👁️ {listing.views} просмотров</div>
                        <div>🏷️ {listing.category}</div>
                      </div>

                      {/* Действия */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/listing/${listing._id || listing.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          👁️ Открыть
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing._id || listing.id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2>Административные действия</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
              <button
                onClick={() => navigate(`/user/${userId}`)}
                style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}
              >
                👤 Посмотреть публичный профиль
              </button>

              {!userData.banned ? (
                <button
                  onClick={handleBanUser}
                  style={{
                    padding: '16px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'left'
                  }}
                >
                  🚫 Забанить пользователя
                </button>
              ) : (
                <button
                  onClick={handleUnbanUser}
                  style={{
                    padding: '16px 24px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'left'
                  }}
                >
                  ✅ Разбанить пользователя
                </button>
              )}

              <button
                onClick={handleDeleteAllListings}
                disabled={listings.length === 0}
                style={{
                  padding: '16px 24px',
                  background: listings.length === 0 ? '#9ca3af' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: listings.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}
              >
                🗑️ Удалить все объявления ({listings.length})
              </button>

              <button
                onClick={() => {
                  const msg = prompt('Введите сообщение для отправки пользователю:');
                  if (msg) {
                    alert(`Функция отправки сообщений будет реализована в следующей версии.\n\nСообщение: ${msg}`);
                  }
                }}
                style={{
                  padding: '16px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}
              >
                💬 Отправить личное сообщение
              </button>

              <button
                onClick={() => {
                  const reason = prompt('Введите причину предупреждения:');
                  if (reason) {
                    alert(`Пользователь ${userData.nickname} получит предупреждение:\n\n"${reason}"\n\nФункция будет реализована в следующей версии.`);
                  }
                }}
                style={{
                  padding: '16px 24px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}
              >
                ⚠️ Выдать предупреждение
              </button>
            </div>

            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: '#fef3c7',
              borderRadius: '12px',
              border: '2px solid #fbbf24'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#92400e' }}>⚠️ Зона опасности</h3>
              <p style={{ margin: '0 0 16px 0', color: '#78350f' }}>
                Следующие действия необратимы и требуют особой осторожности.
              </p>
              <button
                onClick={() => {
                  if (window.confirm(`ВНИМАНИЕ! Вы собираетесь ПОЛНОСТЬЮ УДАЛИТЬ пользователя ${userData.nickname} и все его данные.\n\nЭто действие НЕОБРАТИМО!\n\nПродолжить?`)) {
                    if (window.confirm('Вы уверены на 100%? Введите "УДАЛИТЬ" для подтверждения')) {
                      alert('Функция полного удаления пользователя будет реализована в следующей версии для безопасности.');
                    }
                  }
                }}
                style={{
                  padding: '16px 24px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  width: '100%'
                }}
              >
                💀 УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ НАВСЕГДА
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
