import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { listingsAPI } from '../services/api';
import { currencyService } from '../services/currency';
import '../styles/AddListingPage.css';

const CATEGORIES = [
  { id: 'electronics', icon: '📱', labelKey: 'categories.electronics' },
  { id: 'clothing', icon: '👕', labelKey: 'categories.clothing' },
  { id: 'furniture', icon: '🛋️', labelKey: 'categories.furniture' },
  { id: 'books', icon: '📚', labelKey: 'categories.books' },
  { id: 'sports', icon: '⚽', labelKey: 'categories.sports' },
  { id: 'toys', icon: '🧸', labelKey: 'categories.toys' },
  { id: 'home', icon: '🏠', labelKey: 'categories.home' },
  { id: 'transport', icon: '🚗', labelKey: 'categories.transport' },
  { id: 'pets', icon: '🐾', labelKey: 'categories.pets' },
  { id: 'services', icon: '🔧', labelKey: 'categories.services' },
  { id: 'other', icon: '📦', labelKey: 'categories.other' },
];

const DRAFT_KEY = 'listing_draft';

export default function AddListingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [negotiable, setNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPrice, setLocalPrice] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Загрузка черновика при монтировании
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || '');
        setDescription(parsed.description || '');
        setPrice(parsed.price || '');
        setCategory(parsed.category || '');
        setPhotos(parsed.photos || []);
        setNegotiable(parsed.negotiable || false);
        console.log('✅ Черновик загружен');
      } catch (e) {
        console.error('❌ Ошибка загрузки черновика:', e);
      }
    }
  }, []);

  // Конвертация цены из локальной валюты в USD для предпросмотра
  useEffect(() => {
    const convertPrice = async () => {
      if (price && user?.country) {
        const priceNum = parseFloat(price);
        if (!isNaN(priceNum) && priceNum > 0) {
          const localCurrency = currencyService.getCurrencyByCountry(user.country);
          if (localCurrency !== 'USD') {
            // Конвертируем из локальной валюты в USD
            const convertedUSD = await currencyService.convertToUSD(priceNum, localCurrency);
            setLocalPrice(`≈ $${convertedUSD.toFixed(2)}`);
          } else {
            setLocalPrice('');
          }
        } else {
          setLocalPrice('');
        }
      } else {
        setLocalPrice('');
      }
    };
    convertPrice();
  }, [price, user?.country]);

  // Автосохранение черновика каждые 3 секунды
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || description || price || category || photos.length > 0) {
        const draft = { title, description, price, category, photos, negotiable };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
        console.log('💾 Черновик сохранён');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, description, price, category, photos, negotiable]);

  // Умная валидация в реальном времени с подсказками
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (title) {
      if (title.length < 3) {
        newErrors.title = `✏️ Минимум 3 символа (еще ${3 - title.length})`;
      } else if (title.length > 100) {
        newErrors.title = '⚠️ Максимум 100 символов';
      }
    } else if (!title && (description || price || photos.length > 0)) {
      newErrors.title = '❌ Название обязательно';
    }
    
    if (description) {
      if (description.length < 5) {
        newErrors.description = `✏️ Минимум 5 символов (еще ${5 - description.length})`;
      } else if (description.length > 1000) {
        newErrors.description = '⚠️ Максимум 1000 символов';
      }
    }
    
    if (price) {
      const priceNum = parseFloat(price);
      if (priceNum <= 0 || isNaN(priceNum)) {
        newErrors.price = '❌ Укажите цену больше 0';
      }
    }
    
    // Фото не обязательны, но рекомендуем
    
    if (!category && (title || description || price || photos.length > 0)) {
      newErrors.category = '❌ Выберите категорию';
    }
    
    setErrors(newErrors);
  }, [title, description, price, photos, category]);

  const isFormValid = () => {
    return title.trim().length >= 3 
      && description.trim().length >= 5 
      && price && parseFloat(price) > 0 
      && category;
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Максимальные размеры
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;
          
          // Пропорциональное уменьшение
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Сжатие до 60% качества для меньшего размера
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxPhotos = 5;

    for (let i = 0; i < Math.min(files.length, maxPhotos - photos.length); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file);
          setPhotos(prev => [...prev, compressed]);
          console.log(`✅ Фото сжато: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
        } catch (error) {
          console.error('❌ Ошибка сжатия фото:', error);
          alert('Ошибка при обработке фото. Попробуйте другое изображение.');
        }
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price || !category || photos.length === 0) {
      alert(t('addListing.fillAllFields'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Используем telegramId как основной ID (если есть) или id
      const userId = user?.telegramId || user?.id || 'unknown';
      
      // Конвертируем цену из локальной валюты в USD для хранения
      let priceInUSD = parseFloat(price);
      if (user?.country) {
        const localCurrency = currencyService.getCurrencyByCountry(user.country);
        if (localCurrency !== 'USD') {
          priceInUSD = await currencyService.convertToUSD(parseFloat(price), localCurrency);
          console.log(`💱 Конвертация: ${price} ${localCurrency} = $${priceInUSD.toFixed(2)} USD`);
        }
      }
      
      const listingData = {
        userId: userId, // Telegram ID пользователя
        userNickname: user?.nickname || 'Anonymous',
        category,
        title: title.trim(),
        description: description.trim(),
        price: priceInUSD, // Сохраняем в USD
        negotiable,
        city: user?.city || 'Не указан',
        country: user?.country || 'RU',
        photos, // Base64 фотографии
        status: 'active' as const,
        views: 0,
      };

      // Полный объект объявления с всеми обязательными полями для типа Listing
      const listing = {
        id: `listing_${Date.now()}`,
        serialNumber: `SN${Date.now()}`,
        ...listingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('📝 Создаём объявление:', {
        userId,
        title: listing.title,
        photosCount: photos.length
      });
      
      // Пытаемся отправить на сервер
      console.log('🌐 Отправка на сервер:', import.meta.env.VITE_API_URL);
      
      try {
        const response = await listingsAPI.create({
          ...listingData,
          city: listingData.city || user?.city || 'Не указан',
          country: listingData.country || user?.country || 'Не указана'
        });
        
        console.log('✅ Объявление сохранено на сервере:', response.data);
        
        // Обновляем локальный стор с данными с сервера
        const { addListing, setListings, listings } = useStore.getState();
        const serverListing = response.data;
        
        // Добавляем в стор если его там еще нет
        const existingIndex = listings.findIndex(l => l.id === serverListing.id || l._id === serverListing._id);
        if (existingIndex === -1) {
          addListing(serverListing);
          console.log('📝 Объявление добавлено в локальный стор');
        } else {
          // Обновляем существующее
          const updatedListings = [...listings];
          updatedListings[existingIndex] = serverListing;
          setListings(updatedListings);
          console.log('📝 Объявление обновлено в локальном сторе');
        }
      } catch (serverError) {
        console.warn('⚠️ Сервер недоступен, сохраняем локально:', serverError);
        
        // Сохраняем локально если сервер недоступен
        const { addListing } = useStore.getState();
        addListing(listing);
        console.log('💾 Объявление сохранено локально');
      }
      
      // Вибрация успеха
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      // Очищаем черновик после успешной публикации
      clearDraft();
      
      // Перезагружаем все объявления с сервера для синхронизации
      try {
        const allListingsResponse = await listingsAPI.getAll();
        const { setListings } = useStore.getState();
        setListings(allListingsResponse.data);
        console.log('🔄 Все объявления обновлены с сервера');
      } catch (e) {
        console.log('⚠️ Не удалось перезагрузить все объявления:', e);
      }
      
      // Показываем успех и переходим
      alert('✅ Объявление успешно опубликовано!');
      navigate('/my-listings');
    } catch (error: any) {
      console.error('❌ Критическая ошибка при создании объявления:', error);
      alert(`❌ Ошибка: ${error?.message || 'Не удалось создать объявление'}\n\nПопробуйте еще раз или обратитесь к администратору.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
  };

  return (
    <div className="add-listing-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← {t('common.back')}
          </button>
          <h1 className="page-title">{t('addListing.title')}</h1>
          <button 
            className="preview-button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            {showPreview ? '✏️ Редактировать' : '👁️ Предпросмотр'}
          </button>
        </div>
        
        {lastSaved && (
          <div style={{
            textAlign: 'center',
            color: '#10b981',
            fontSize: '13px',
            marginBottom: '12px',
            fontWeight: '600'
          }}>
            💾 Черновик сохранён {lastSaved.toLocaleTimeString('ru-RU')}
          </div>
        )}

        {/* Предпросмотр */}
        {showPreview && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: '22px', fontWeight: '700' }}>
              📋 Предпросмотр объявления
            </h2>
            {photos.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <img 
                  src={photos[0]} 
                  alt="Preview" 
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
                {photos.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto' }}>
                    {photos.slice(1).map((photo, i) => (
                      <img 
                        key={i}
                        src={photo} 
                        alt={`Thumb ${i}`}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: '#e0e7ff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4338ca'
              }}>
                {category && CATEGORIES.find(c => c.id === category)?.icon} {category && t(CATEGORIES.find(c => c.id === category)?.labelKey || '')}
              </span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              {title || 'Название объявления'}
            </h3>
            <p style={{ color: '#64748b', marginBottom: '12px', fontSize: '15px' }}>
              {description || 'Описание объявления...'}
            </p>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>
              {price ? `$${parseFloat(price).toLocaleString('ru-RU')}` : '$0'}
              {negotiable && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '8px' }}>• Торг</span>}
            </div>
            {localPrice && (
              <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px' }}>
                {localPrice}
              </div>
            )}
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              📍 {user?.city}, {user?.country}
            </div>
          </div>
        )}

        {!showPreview && (
          <>
            {/* Фото */}
            <div className="form-section">
              <label className="section-label">
                {t('addListing.photos')} ({photos.length}/5)
                {errors.photos && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '13px' }}>⚠️ {errors.photos}</span>}
              </label>
          <div className="photo-grid">
            {photos.map((photo, index) => (
              <div key={index} className="photo-item">
                <img src={photo} alt={`Photo ${index + 1}`} />
                <button
                  className="remove-photo"
                  onClick={() => handleRemovePhoto(index)}
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                className="add-photo-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="add-icon">+</span>
                <span className="add-text">{t('addListing.addPhoto')}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Категория */}
        <div className="form-section">
          <label className="section-label">{t('addListing.category')}</label>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-button ${category === cat.id ? 'selected' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{t(cat.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

            {/* Название */}
            <div className="form-section">
              <label className="section-label">
                {t('addListing.itemTitle')}
                {errors.title && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '13px' }}>⚠️ {errors.title}</span>}
              </label>
              <input
                type="text"
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder={t('addListing.itemTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <div className="char-count" style={{ color: title.length > 80 ? '#f59e0b' : '#94a3b8' }}>
                {title.length}/100
              </div>
            </div>

            {/* Описание */}
            <div className="form-section">
              <label className="section-label">
                {t('addListing.description')}
                {errors.description && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '13px' }}>⚠️ {errors.description}</span>}
              </label>
              <textarea
                className={`textarea ${errors.description ? 'input-error' : ''}`}
                placeholder={t('addListing.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={500}
              />
              <div className="char-count" style={{ color: description.length > 450 ? '#f59e0b' : '#94a3b8' }}>
                {description.length}/500
              </div>
            </div>

            {/* Цена */}
            <div className="form-section">
              <label className="section-label">
                {t('addListing.price')} ({user?.country ? `в ${currencyService.getCurrencySymbol(currencyService.getCurrencyByCountry(user.country))}` : 'в вашей валюте'})
                {errors.price && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '13px' }}>⚠️ {errors.price}</span>}
              </label>
              <div className="price-input-wrapper">
                <input
                  type="number"
                  className={`input price-input ${errors.price ? 'input-error' : ''}`}
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <span className="currency">
                  {user?.country ? currencyService.getCurrencySymbol(currencyService.getCurrencyByCountry(user.country)) : '$'}
                </span>
              </div>
              {localPrice && (
                <div style={{ fontSize: '14px', color: '#667eea', marginTop: '8px', fontWeight: '500' }}>
                  💱 В долларах: {localPrice}
                </div>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">{t('addListing.negotiable')}</span>
              </label>
            </div>

            {/* Подсказки */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '100px',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              color: 'white'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✨ Советы для лучшего объявления:
              </h4>
              <ul style={{ fontSize: '15px', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
                <li><strong>📸 Фото:</strong> Добавьте 3-5 качественных фото с разных ракурсов</li>
                <li><strong>📝 Описание:</strong> Укажите состояние, размеры, причину продажи</li>
                <li><strong>💰 Цена:</strong> Адекватная цена = быстрая продажа</li>
                <li><strong>⚡ Активность:</strong> Быстро отвечайте на сообщения</li>
              </ul>
            </div>
          </>
        )}

        {/* Кнопка публикации - зафиксирована внизу */}
        <div className="form-actions" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.98) 70%, rgba(255,255,255,0.95) 85%, transparent)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
        }}>
          <button
            className="btn btn-primary btn-large"
            onClick={() => {
              if (showPreview) {
                handleSubmit();
                clearDraft();
              } else {
                setShowPreview(true);
              }
            }}
            disabled={isSubmitting || !isFormValid()}
            style={{
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
              width: '100%'
            }}
          >
            {isSubmitting ? t('addListing.publishing') : showPreview ? '✅ Опубликовать' : '👁️ Предпросмотр и публикация'}
          </button>
        </div>
      </div>
    </div>
  );
}
