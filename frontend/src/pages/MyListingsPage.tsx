import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { currencyService } from '../services/currency';
import '../styles/MyListingsPage.css';

interface Listing {
  id: string;
  title: string;
  price: number;
  photo: string;
  category: string;
  status: 'active' | 'hidden' | 'sold';
  views: number;
  favorites: number;
  createdAt: string;
}

export default function MyListingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'hidden' | 'sold'>('all');
  const [dualPrices, setDualPrices] = useState<Map<string, string>>(new Map());
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const loadMyListings = async () => {
      if (!user?.telegramId && !user?.id) return;
      
      try {
        const { listingsAPI } = await import('../services/api');
        const userId = user.telegramId || user.id;
        console.log('📋 Загрузка объявлений пользователя:', userId);
        
        const response = await listingsAPI.getByUser(userId);
        const serverListings = response.data;
        console.log('✅ Получено объявлений с сервера:', serverListings.length);
        
        // Преобразуем формат объявлений
        const formatted = serverListings.map((l: any) => ({
          id: l._id || l.id,
          title: l.title,
          price: l.price || 0,
          photo: l.photos[0] || '',
          category: l.category,
          status: l.status === 'active' ? 'active' : 'hidden' as 'active' | 'hidden' | 'sold',
          views: l.views,
          favorites: 0,
          createdAt: new Date(l.createdAt).toLocaleDateString('ru-RU')
        }));
        setListings(formatted);
        
        // Форматируем цены
        const priceMap = new Map<string, string>();
        const userCountry = user?.country || 'Украина';
        
        for (const listing of formatted) {
          const formattedPrice = await currencyService.formatDualPrice(listing.price, userCountry);
          priceMap.set(listing.id, formattedPrice);
        }
        
        setDualPrices(priceMap);
      } catch (error) {
        console.error('❌ Ошибка загрузки объявлений:', error);
      }
    };
    
    loadMyListings();
  }, [user?.telegramId, user?.id, user?.country]);

  const filteredListings = filter === 'all' 
    ? listings 
    : listings.filter(l => l.status === filter);

  const handleToggleStatus = async (id: string) => {
    try {
      const listing = listings.find(l => l.id === id);
      if (!listing) return;

      const newStatus = listing.status === 'active' ? 'hidden' : 'active';
      const { listingsAPI } = await import('../services/api');
      
      await listingsAPI.updateStatus(id, newStatus);
      
      setListings(prev => prev.map(l => {
        if (l.id === id) {
          return { ...l, status: newStatus as 'active' | 'hidden' | 'sold' };
        }
        return l;
      }));

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      alert(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('myListings.confirmDelete'))) return;

    try {
      const { listingsAPI } = await import('../services/api');
      await listingsAPI.delete(id);
      
      setListings(prev => prev.filter(l => l.id !== id));
      
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert(t('common.error'));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { text: t('myListings.statusActive'), color: '#10b981' },
      hidden: { text: t('myListings.statusHidden'), color: '#f59e0b' },
      sold: { text: t('myListings.statusSold'), color: '#6366f1' }
    };
    return badges[status as keyof typeof badges];
  };

  return (
    <div className="my-listings-page">
      <div className="container">
        {/* Хедер */}
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← {t('common.back')}
          </button>
          <h1 className="page-title">{t('myListings.title')}</h1>
          <button className="add-button" onClick={() => navigate('/add-listing')}>
            + {t('myListings.addNew')}
          </button>
        </div>

        {/* Статистика */}
        <div className="stats-card">
          <div className="stat-item">
            <div className="stat-value">{listings.length}</div>
            <div className="stat-label">{t('myListings.totalListings')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{listings.filter(l => l.status === 'active').length}</div>
            <div className="stat-label">{t('myListings.activeListings')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{listings.reduce((sum, l) => sum + l.views, 0)}</div>
            <div className="stat-label">{t('myListings.totalViews')}</div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('myListings.all')} ({listings.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            {t('myListings.active')} ({listings.filter(l => l.status === 'active').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'hidden' ? 'active' : ''}`}
            onClick={() => setFilter('hidden')}
          >
            {t('myListings.hidden')} ({listings.filter(l => l.status === 'hidden').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'sold' ? 'active' : ''}`}
            onClick={() => setFilter('sold')}
          >
            {t('myListings.sold')} ({listings.filter(l => l.status === 'sold').length})
          </button>
        </div>

        {/* Список объявлений */}
        {filteredListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p className="empty-text">{t('myListings.noListings')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/add-listing')}>
              {t('myListings.createFirst')}
            </button>
          </div>
        ) : (
          <div className="listings-list">
            {filteredListings.map((listing) => {
              const badge = getStatusBadge(listing.status);
              return (
                <div key={listing.id} className="listing-card">
                  <div className="listing-photo">
                    <img src={listing.photo} alt={listing.title} />
                    <div className="status-badge" style={{ backgroundColor: badge.color }}>
                      {badge.text}
                    </div>
                  </div>

                  <div className="listing-content">
                    <h3 className="listing-title">{listing.title}</h3>
                    <div className="listing-price">{dualPrices.get(listing.id) || '...'}</div>
                    
                    <div className="listing-stats">
                      <span className="stat">👁 {listing.views}</span>
                      <span className="stat">⭐ {listing.favorites}</span>
                      <span className="stat">📅 {new Date(listing.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>

                    <div className="listing-actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        title="Просмотреть объявление"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white'
                        }}
                      >
                        👁️
                      </button>
                      <button 
                        className="action-btn chat-btn"
                        onClick={() => navigate(`/chat/${listing.id}`)}
                        title="Открыть чаты"
                      >
                        💬
                      </button>
                      <button 
                        className="action-btn toggle-btn"
                        onClick={() => handleToggleStatus(listing.id)}
                        title={listing.status === 'active' ? t('myListings.hide') : t('myListings.show')}
                      >
                        {listing.status === 'active' ? '🔓' : '🔒'}
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(listing.id)}
                        title={t('common.delete')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
