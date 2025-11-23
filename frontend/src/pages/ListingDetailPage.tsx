import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Listing } from '../types';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadListing = async () => {
      if (!id) {
        setError('ID объявления не указан');
        setLoading(false);
        return;
      }

      try {
        const { listingsAPI } = await import('../services/api');
        const response = await listingsAPI.getById(id);
        setListing(response.data);
      } catch (err: any) {
        console.error('Ошибка загрузки объявления:', err);
        setError(err.message || 'Не удалось загрузить объявление');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id]);

  const handleContactSeller = () => {
    if (!listing) return;
    
    // Создаём чат с продавцом
    navigate(`/chat/${listing.id}`);
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const nextPhoto = () => {
    if (listing && listing.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % listing.photos.length);
    }
  };

  const prevPhoto = () => {
    if (listing && listing.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + listing.photos.length) % listing.photos.length);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
        <h2 style={{ marginBottom: '12px', color: '#1f2937' }}>Объявление не найдено</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error || 'Возможно, оно было удалено'}</p>
        <button
          onClick={() => navigate('/catalog')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Вернуться к каталогу
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '80px' }}>
      {/* Галерея фотографий */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '400px',
        background: '#000',
        overflow: 'hidden'
      }}>
        {listing.photos && listing.photos.length > 0 ? (
          <>
            <img
              src={listing.photos[currentPhotoIndex]}
              alt={listing.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            
            {listing.photos.length > 1 && (
              <>
                {/* Индикаторы фото */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 10
                }}>
                  {listing.photos.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: index === currentPhotoIndex 
                          ? 'white' 
                          : 'rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.3s'
                      }}
                    />
                  ))}
                </div>

                {/* Кнопки навигации */}
                <button
                  onClick={prevPhoto}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={nextPhoto}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}
                >
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#e5e7eb',
            color: '#9ca3af',
            fontSize: '48px'
          }}>
            📦
          </div>
        )}

        {/* Кнопка назад */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          ←
        </button>
      </div>

      {/* Информация об объявлении */}
      <div style={{ padding: '20px' }}>
        {/* Цена и категория */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {listing.price ? `${listing.price} ₽` : 'Договорная'}
            </h1>
            {listing.negotiable && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Торг
              </span>
            )}
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: '#f3f4f6',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            display: 'inline-block'
          }}>
            {listing.category}
          </div>
        </div>

        {/* Название */}
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937',
          lineHeight: '1.4'
        }}>
          {listing.title}
        </h2>

        {/* Описание */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Описание
          </h3>
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: '#4b5563',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {listing.description}
          </p>
        </div>

        {/* Местоположение */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            📍 Местоположение
          </h3>
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: '#4b5563'
          }}>
            {listing.city}, {listing.country}
          </p>
        </div>

        {/* Продавец */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            👤 Продавец
          </h3>
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: '#4b5563',
            fontWeight: '500'
          }}>
            @{listing.userNickname}
          </p>
        </div>

        {/* Информация */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: '1.6'
        }}>
          <div style={{ 
            marginBottom: '12px',
            padding: '10px',
            background: 'white',
            borderRadius: '8px',
            border: '2px dashed rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
              ИДЕНТИФИКАЦИОННЫЙ НОМЕР
            </div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '700',
              fontFamily: 'monospace',
              color: '#667eea',
              letterSpacing: '0.5px'
            }}>
              {listing.serialNumber}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              💡 Используйте при подаче жалобы
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>👁️ Просмотры:</strong> {listing.views}
          </div>
          <div>
            <strong>📅 Опубликовано:</strong> {new Date(listing.createdAt).toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>

      {/* Фиксированная кнопка внизу */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
        zIndex: 100
      }}>
        <button
          onClick={handleContactSeller}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          💬 Написать продавцу
        </button>
      </div>
    </div>
  );
}
