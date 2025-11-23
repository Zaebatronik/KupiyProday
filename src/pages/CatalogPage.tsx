import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import '../styles/CatalogPage.css';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  category: string;
  city: string;
  photos: string[];
  createdAt: string;
  userId: string;
  isFavorite?: boolean;
}

const ITEMS_PER_PAGE = 12;

const categoryEmojis: Record<string, string> = {
  all: '📦',
  transport: '🚗',
  realestate: '🏠',
  electronics: '📱',
  services: '💼',
  fashion: '👕',
  home: '🛋️',
  hobbies: '🎮',
  animals: '🐾',
  jobs: '💻',
  other: '📌',
};

export default function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { listings: storeListings } = useStore();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Фильтры
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Загрузка данных с сервера
  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const { listingsAPI } = await import('../services/api');
        const response = await listingsAPI.getAll();
        const serverListings = response.data;

        const formattedListings = serverListings.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          price: l.price || 0,
          negotiable: l.negotiable,
          category: l.category,
          city: l.city,
          photos: l.photos,
          createdAt: l.createdAt,
          userId: l.userId,
          isFavorite: false
        }));
        
        setListings(formattedListings);
        setFilteredListings(formattedListings);
        console.log(`✅ Loaded ${formattedListings.length} listings from server:`, formattedListings.map((l: Listing) => l.title));
      } catch (error) {
        console.error('Failed to load listings from server:', error);
        // Fallback на локальные данные
        const formattedListings = storeListings.map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          price: l.price || 0,
          negotiable: l.negotiable,
          category: l.category,
          city: l.city,
          photos: l.photos,
          createdAt: new Date(l.createdAt).toISOString(),
          userId: l.userId,
          isFavorite: false
        }));
        setListings(formattedListings);
        setFilteredListings(formattedListings);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
    
    // Автообновление каждые 5 секунд
    const interval = setInterval(() => {
      console.log('🔄 CatalogPage: Автообновление списка объявлений...');
      loadListings();
    }, 5000);

    return () => clearInterval(interval);
  }, [storeListings]);

  // Фильтрация и сортировка
  useEffect(() => {
    let result = [...listings];

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.city.toLowerCase().includes(query)
      );
    }

    // Категория
    if (selectedCategory !== 'all') {
      result = result.filter((listing) => listing.category === selectedCategory);
    }

    // Цена
    if (priceMin) {
      result = result.filter((listing) => listing.price >= Number(priceMin));
    }
    if (priceMax) {
      result = result.filter((listing) => listing.price <= Number(priceMax));
    }

    // Сортировка
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    setFilteredListings(result);
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, priceMin, priceMax, listings]);

  // Пагинация
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(listingId)) {
      newFavorites.delete(listingId);
    } else {
      newFavorites.add(listingId);
    }
    setFavorites(newFavorites);
  };

  const handleListingClick = (listingId: string) => {
    navigate(`/listing/${listingId}`);
  };

  const resetFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setShowFilter(false);
  };

  const applyFilters = () => {
    setShowFilter(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const categories = [
    'all',
    'transport',
    'realestate',
    'electronics',
    'services',
    'fashion',
    'home',
    'hobbies',
    'animals',
    'jobs',
    'other',
  ];

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              borderRadius: '12px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#5568d3')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#667eea')}
          >
            🏠
          </button>
          <h1 className="catalog-title" style={{ margin: 0, flex: 1 }}>{t('catalog.title')}</h1>
        </div>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder={t('catalog.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-button" onClick={() => setShowFilter(true)}>
            🎚️ {t('catalog.filter')}
          </button>
        </div>

        <div className="categories-scroll">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {categoryEmojis[category]} {t(`categories.${category}`)}
            </button>
          ))}
        </div>

        <div className="catalog-controls">
          <span className="results-count">
            {filteredListings.length} {t('catalog.noResults').split(' ')[0]}
          </span>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Сначала новые</option>
            <option value="date-asc">Сначала старые</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
          </select>
        </div>
      </div>

      <div className="catalog-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <div className="loading-text">{t('catalog.loading')}</div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div className="no-results-text">{t('catalog.noResults')}</div>
            <div className="no-results-hint">Попробуйте изменить параметры поиска</div>
          </div>
        ) : (
          <>
            <div className="listings-grid">
              {currentListings.map((listing) => (
                <div key={listing.id} className="listing-card" onClick={() => handleListingClick(listing.id)}>
                  <div className="listing-category">
                    {categoryEmojis[listing.category]} {t(`categories.${listing.category}`)}
                  </div>
                  <button
                    className={`favorite-button ${favorites.has(listing.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(listing.id, e)}
                  >
                    {favorites.has(listing.id) ? '❤️' : '🤍'}
                  </button>
                  {listing.photos.length > 0 ? (
                    <img src={listing.photos[0]} alt={listing.title} className="listing-image" />
                  ) : (
                    <div className="listing-placeholder">{categoryEmojis[listing.category]}</div>
                  )}
                  <div className="listing-info">
                    <div className="listing-price">
                      {listing.negotiable ? '≈ ' : ''}
                      {formatPrice(listing.price)}
                    </div>
                    <div className="listing-title">{listing.title}</div>
                    <div className="listing-location">📍 {listing.city}</div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Показываем первую, последнюю и текущую страницу с соседними
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`page-button ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="page-info">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  className="page-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно фильтров */}
      {showFilter && (
        <div className="filter-modal" onClick={() => setShowFilter(false)}>
          <div className="filter-content" onClick={(e) => e.stopPropagation()}>
            <div className="filter-header">
              <h2 className="filter-title">{t('catalog.filter')}</h2>
              <button className="close-button" onClick={() => setShowFilter(false)}>
                ✕
              </button>
            </div>

            <div className="filter-body">
              <div className="filter-section">
                <div className="filter-section-title">Цена, ₽</div>
                <div className="price-inputs">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="От"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="price-separator">—</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="До"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button className="reset-button" onClick={resetFilters}>
                Сбросить
              </button>
              <button className="apply-button" onClick={applyFilters}>
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
