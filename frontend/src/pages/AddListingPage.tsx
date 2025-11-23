import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { listingsAPI } from '../services/api';
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
  const { user, addListing } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [negotiable, setNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Валидация в реальном времени
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (title && title.length < 3) {
      newErrors.title = 'Название должно быть минимум 3 символа';
    }
    if (description && description.length < 10) {
      newErrors.description = 'Описание должно быть минимум 10 символов';
    }
    if (price && parseFloat(price) <= 0) {
      newErrors.price = 'Цена должна быть больше 0';
    }
    if (photos.length === 0 && (title || description)) {
      newErrors.photos = 'Добавьте хотя бы 1 фото';
    }
    
    setErrors(newErrors);
  }, [title, description, price, photos]);

  const isFormValid = () => {
    return title.trim().length >= 3 
      && description.trim().length >= 10 
      && price && parseFloat(price) > 0 
      && category 
      && photos.length > 0
      && Object.keys(errors).length === 0;
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
          
          // Сжатие до 70% качества
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
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
      
      const listingData = {
        userId: userId, // Telegram ID пользователя
        userNickname: user?.nickname || 'Anonymous',
        category,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
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
      
      // Сохраняем локально
      addListing(listing);
      console.log('✅ Объявление сохранено локально');

      // Отправляем на сервер (только данные, без локальных ID)
      try {
        console.log('🌐 Отправка на сервер:', {
          url: import.meta.env.VITE_API_URL || 'http://localhost:3001',
          data: {
            ...listingData,
            userId: listingData.userId,
            userNickname: listingData.userNickname,
            city: listingData.city || user?.city || 'Не указан',
            country: listingData.country || user?.country || 'Не указана'
          }
        });
        const response = await listingsAPI.create({
          ...listingData,
          city: listingData.city || user?.city || 'Не указан',
          country: listingData.country || user?.country || 'Не указана'
        });
        console.log('✅ Объявление сохранено на сервере:', response.data);
        
        // Вибрация успеха
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
      } catch (serverError: any) {
        console.error('❌ Ошибка при сохранении на сервер:', {
          message: serverError?.message,
          response: serverError?.response?.data,
          status: serverError?.response?.status,
          data: serverError?.response?.data
        });
        
        const errorMessage = serverError?.response?.data?.message || serverError?.message || 'Неизвестная ошибка';
        const errorDetails = serverError?.response?.data?.details || '';
        
        console.warn('⚠️ Объявление сохранено только локально');
        
        // Вибрация ошибки
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
        
        // Показываем пользователю подробную ошибку
        alert(`⚠️ Ошибка публикации:\n\n${errorMessage}\n${errorDetails}\n\nОбъявление сохранено локально и будет синхронизировано позже.`);
      }

      // Очищаем черновик после успешной публикации
      clearDraft();
      
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
              {price ? `${parseFloat(price).toLocaleString('ru-RU')} ₽` : '0 ₽'}
              {negotiable && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '8px' }}>• Торг</span>}
            </div>
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
                {t('addListing.price')}
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
                />
                <span className="currency">₽</span>
              </div>
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
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              border: '2px solid rgba(102, 126, 234, 0.2)'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#667eea' }}>
                💡 Советы для лучшего объявления:
              </h4>
              <ul style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>Добавьте качественные фото с разных ракурсов</li>
                <li>Опишите состояние товара честно и подробно</li>
                <li>Укажите причину продажи - это повышает доверие</li>
                <li>Реагируйте быстро на сообщения покупателей</li>
              </ul>
            </div>
          </>
        )}

        {/* Кнопка публикации */}
        <div className="form-actions">
          {!isFormValid() && !showPreview && (
            <div style={{
              textAlign: 'center',
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              ⚠️ Заполните все обязательные поля правильно
            </div>
          )}
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
              cursor: isFormValid() ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? t('addListing.publishing') : showPreview ? '✅ Опубликовать' : '👁️ Предпросмотр и публикация'}
          </button>
        </div>
      </div>
    </div>
  );
}
