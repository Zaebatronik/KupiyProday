import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import type { Listing } from '../types';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useStore();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [error, setError] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        const listingData = response.data;
        setListing(listingData);
        
        // Конвертируем цену для покупателя
        if (listingData.price && user?.country) {
          const { currencyService } = await import('../services/currency');
          const formattedPrice = await currencyService.formatDualPrice(
            listingData.price,
            user.country
          );
          setDisplayPrice(formattedPrice);
        }
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
    
    // Открываем внутренний чат, используем id из URL или _id из MongoDB
    const listingId = id || listing._id || listing.id;
    navigate(`/chat/${listingId}`);
    
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

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
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
              onClick={openFullscreen}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'pointer'
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
              {listing.price ? (displayPrice || `$${listing.price}`) : 'Договорная'}
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
            {t(`categories.${listing.category}`)}
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
            {t('listing.descriptionLabel')}
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onClick={() => {
          if (listing.userId) {
            navigate(`/user/${listing.userId}`);
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👤 Продавец
            <span style={{
              fontSize: '12px',
              color: '#667eea',
              fontWeight: '500',
              padding: '2px 8px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '6px'
            }}>
              кликните чтобы открыть профиль
            </span>
          </h3>
          <p style={{
            margin: 0,
            fontSize: '18px',
            color: '#667eea',
            fontWeight: '700',
            textDecoration: 'underline'
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
        {listing.userId === user?.id || listing.userId === user?.telegramId ? (
          // Если это моё объявление - показываем кнопки управления
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/my-listings')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '16px',
                border: '2px solid #667eea',
                background: 'white',
                color: '#667eea',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✏️ {t('common.edit')}
            </button>
            <button
              onClick={() => navigate('/catalog')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📋 {t('menu.catalog')}
            </button>
          </div>
        ) : (
          // Если чужое объявление - показываем кнопку "Написать продавцу"
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
            💬 {t('chat.seller')}
          </button>
        )}
      </div>

      {/* Fullscreen фото галерея */}
      {isFullscreen && listing.photos && listing.photos.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeFullscreen}
        >
          {/* Кнопка закрыть */}
          <button
            onClick={closeFullscreen}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(10px)'
            }}
          >
            ✕
          </button>

          {/* Счетчик фото */}
          {listing.photos.length > 1 && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                zIndex: 10000
              }}
            >
              {currentPhotoIndex + 1} / {listing.photos.length}
            </div>
          )}

          {/* Изображение */}
          <img
            src={listing.photos[currentPhotoIndex]}
            alt={listing.title}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              userSelect: 'none'
            }}
          />

          {/* Навигация */}
          {listing.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                  backdropFilter: 'blur(10px)'
                }}
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                  backdropFilter: 'blur(10px)'
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Индикаторы */}
          {listing.photos.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                zIndex: 10000
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {listing.photos.map((_, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: index === currentPhotoIndex 
                      ? 'white' 
                      : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
