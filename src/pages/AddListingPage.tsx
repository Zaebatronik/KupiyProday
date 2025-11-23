import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function AddListingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    const maxPhotos = 5;

    for (let i = 0; i < Math.min(files.length, maxPhotos - photos.length); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPhotos(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
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

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    // Имитация отправки (в будущем здесь будет API запрос)
    setTimeout(() => {
      alert(t('addListing.success'));
      navigate('/my-listings');
    }, 1000);
  };

  return (
    <div className="add-listing-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← {t('common.back')}
          </button>
          <h1 className="page-title">{t('addListing.title')}</h1>
        </div>

        {/* Фото */}
        <div className="form-section">
          <label className="section-label">
            {t('addListing.photos')} ({photos.length}/5)
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
          <label className="section-label">{t('addListing.itemTitle')}</label>
          <input
            type="text"
            className="input"
            placeholder={t('addListing.itemTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          <div className="char-count">{title.length}/100</div>
        </div>

        {/* Описание */}
        <div className="form-section">
          <label className="section-label">{t('addListing.description')}</label>
          <textarea
            className="textarea"
            placeholder={t('addListing.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={500}
          />
          <div className="char-count">{description.length}/500</div>
        </div>

        {/* Цена */}
        <div className="form-section">
          <label className="section-label">{t('addListing.price')}</label>
          <div className="price-input-wrapper">
            <input
              type="number"
              className="input price-input"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
            />
            <span className="currency">₽</span>
          </div>
          <div className="price-hint">{t('addListing.priceHint')}</div>
        </div>

        {/* Кнопка публикации */}
        <div className="form-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !description || !price || !category || photos.length === 0}
          >
            {isSubmitting ? t('addListing.publishing') : t('addListing.publish')}
          </button>
        </div>
      </div>
    </div>
  );
}
