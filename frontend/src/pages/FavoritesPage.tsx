import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import '../styles/FavoritesPage.css';

interface Listing {
  id: string;
  title: string;
  price: number;
  photo: string;
  city: string;
  category: string;
  negotiable: boolean;
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, listings, removeFromFavorites } = useStore();
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);

  useEffect(() => {
    // Загружаем данные избранных объявлений
    const loadFavorites = async () => {
      try {
        const { listingsAPI } = await import('../services/api');
        const response = await listingsAPI.getAll();
        const allListings = response.data;

        // Фильтруем только избранные
        const favListings = allListings
          .filter((l: any) => favorites.includes(l.id))
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            price: l.price || 0,
            photo: l.photos[0] || '',
            city: l.city,
            category: l.category,
            negotiable: l.negotiable,
          }));

        setFavoriteListings(favListings);
        console.log(`✅ Загружено ${favListings.length} избранных объявлений`);
      } catch (error) {
        console.error('Failed to load favorites:', error);
        // Fallback на локальные данные
        const favListings = listings
          .filter((l) => favorites.includes(l.id))
          .map((l) => ({
            id: l.id,
            title: l.title,
            price: l.price || 0,
            photo: l.photos[0] || '',
            city: l.city,
            category: l.category,
            negotiable: l.negotiable,
          }));
        setFavoriteListings(favListings);
      }
    };

    loadFavorites();
  }, [favorites, listings]);

  const handleRemoveFavorite = (id: string) => {
    removeFromFavorites(id);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  return (
    <div className="favorites-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← Назад
          </button>
          <h1 className="page-title">⭐ Избранное</h1>
        </div>

        {favoriteListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💫</div>
            <h2>Пока пусто</h2>
            <p>Здесь будут ваши избранные объявления</p>
            <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
              📦 Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="favorites-grid">
            {favoriteListings.map((listing) => (
              <div key={listing.id} className="favorite-card">
                <div
                  className="card-image"
                  style={{
                    backgroundImage: `url(${listing.photo})`,
                  }}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <button
                    className="remove-favorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(listing.id);
                    }}
                  >
                    ❌
                  </button>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{listing.title}</h3>
                  <div className="card-price">
                    {listing.price.toLocaleString('ru-RU')} ₽
                    {listing.negotiable && <span className="negotiable-badge">Торг</span>}
                  </div>
                  <div className="card-location">📍 {listing.city}</div>
                  {/* Информация о продавце */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if ((listing as any).userId) {
                        navigate(`/user/${(listing as any).userId}`);
                      }
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      background: 'rgba(102, 126, 234, 0.08)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>👤</span>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#667eea',
                    }}>
                      @{(listing as any).userNickname || 'Продавец'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
