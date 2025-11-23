import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
  // Socket.IO live updates
  const socketRef = useRef<Socket | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { listings: storeListings } = useStore();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveUpdating, setLiveUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Фильтры
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [onlyNegotiable, setOnlyNegotiable] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // Загрузка истории поиска
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Загрузка данных с сервера + live-обновление через Socket.IO
  useEffect(() => {
    let isMounted = true;
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
        if (isMounted) {
          setListings(formattedListings);
          setFilteredListings(formattedListings);
          console.log(`✅ Loaded ${formattedListings.length} listings from server:`, formattedListings.map((l: Listing) => l.title));
        }
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
        if (isMounted) {
          setListings(formattedListings);
          setFilteredListings(formattedListings);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadListings();

    // Подключение к Socket.IO
    if (!socketRef.current) {
      // URL backend-а (без /api)
      const backendUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
      socketRef.current = io(backendUrl, { transports: ['websocket'] });
      socketRef.current.on('connect', () => {
        console.log('🟢 Socket.IO connected (CatalogPage)');
      });
      socketRef.current.on('listing-updated', () => {
        console.log('🔔 Получено событие listing-updated, обновляю список...');
        setLiveUpdating(true);
        loadListings();
        setTimeout(() => setLiveUpdating(false), 2000);
      });
      socketRef.current.on('listing-created', () => {
        console.log('🔔 Получено событие listing-created, обновляю список...');
        setLiveUpdating(true);
        loadListings();
        setTimeout(() => setLiveUpdating(false), 2000);
      });
      socketRef.current.on('disconnect', () => {
        console.log('🔴 Socket.IO disconnected (CatalogPage)');
      });
    }

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
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

    // Только с торгом
    if (onlyNegotiable) {
      result = result.filter((listing) => listing.negotiable);
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
  }, [searchQuery, selectedCategory, sortBy, priceMin, priceMax, onlyNegotiable, listings]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Сохранение в историю
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
    
    setShowSearchHistory(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const resetFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setOnlyNegotiable(false);
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
          {liveUpdating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              animation: 'pulse 1s ease-in-out infinite'
            }}>
              <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
              Обновление...
            </div>
          )}
        </div>

        <div className="search-bar" style={{ position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            placeholder={t('catalog.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchHistory(true)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                setShowSearchHistory(false);
              }}
              style={{
                position: 'absolute',
                right: '120px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '5px',
                color: '#999'
              }}
            >
              ✕
            </button>
          )}
          <button className="filter-button" onClick={() => setShowFilter(true)}>
            🎚️ {t('catalog.filter')}
          </button>

          {/* История поиска */}
          {showSearchHistory && searchHistory.length > 0 && (
            <div 
              className="search-history"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginTop: '8px',
                zIndex: 100,
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #eee'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
                  {t('catalog.recentSearches')}
                </span>
                <button
                  onClick={clearSearchHistory}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {t('catalog.clearHistory')}
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSearchQuery(item);
                    handleSearch(item);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < searchHistory.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#999' }}>🔍</span>
                  <span style={{ color: '#333', fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>
          )}
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
                <div className="filter-section-title">💰 Цена, ₽</div>
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

              <div className="filter-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={onlyNegotiable}
                    onChange={(e) => setOnlyNegotiable(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>🤝 {t('catalog.onlyNegotiable')}</span>
                </label>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">📊 {t('catalog.sortBy')}</div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="date-desc">{t('catalog.newest')}</option>
                  <option value="date-asc">{t('catalog.oldest')}</option>
                  <option value="price-asc">{t('catalog.cheapest')}</option>
                  <option value="price-desc">{t('catalog.expensive')}</option>
                </select>
              </div>

              <div className="filter-stats" style={{
                marginTop: '20px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#666'
              }}>
                {t('catalog.found')}: <strong>{filteredListings.length}</strong> {t('catalog.listings')}
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
