import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { locationService, Country, City } from '../services/location';
import '../styles/CountryPage.css';

const popularCountries: Country[] = [
  { code: 'RU', name: 'Россия', nameRu: 'Россия', flag: '🇷🇺' },
  { code: 'UA', name: 'Україна', nameRu: 'Украина', flag: '🇺🇦' },
  { code: 'BY', name: 'Беларусь', nameRu: 'Беларусь', flag: '🇧🇾' },
  { code: 'KZ', name: 'Қазақстан', nameRu: 'Казахстан', flag: '🇰🇿' },
  { code: 'DE', name: 'Deutschland', nameRu: 'Германия', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameRu: 'Франция', flag: '🇫🇷' },
  { code: 'ES', name: 'España', nameRu: 'Испания', flag: '🇪🇸' },
  { code: 'PL', name: 'Polska', nameRu: 'Польша', flag: '🇵🇱' },
  { code: 'US', name: 'USA', nameRu: 'США', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', nameRu: 'Великобритания', flag: '🇬🇧' },
];

export default function LocationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [step, setStep] = useState<'country' | 'city'>('country');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Загрузка городов при выборе страны
  useEffect(() => {
    if (selectedCountry && step === 'city') {
      loadCities();
    }
  }, [selectedCountry, step]);

  const loadCities = async () => {
    if (!selectedCountry) return;
    setLoadingCities(true);
    try {
      const data = await locationService.getCities(selectedCountry.nameRu);
      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    setTimeout(() => setStep('city'), 300);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    // Сохраняем выбор
    localStorage.setItem('registrationCountry', JSON.stringify(selectedCountry));
    localStorage.setItem('registrationCity', city.nameRu);
    
    setTimeout(() => navigate('/radius'), 300);
  };

  const handleGeolocation = async () => {
    setLoadingLocation(true);
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    try {
      // Telegram WebApp 6.9+ поддерживает геолокацию через LocationManager
      if (window.Telegram?.WebApp?.LocationManager) {
        console.log('📍 Используем Telegram LocationManager');
        
        // Инициализируем LocationManager если нужно
        if (window.Telegram.WebApp.LocationManager.init) {
          window.Telegram.WebApp.LocationManager.init();
        }
        
        // Запрашиваем локацию
        window.Telegram.WebApp.LocationManager.getLocation((location) => {
          if (location && location.latitude && location.longitude) {
            console.log('✅ Telegram location:', location);
            reverseGeocode(location.latitude, location.longitude);
          } else {
            console.log('⚠️ Telegram location failed, fallback to navigator');
            fallbackToNavigator();
          }
        });
      } else {
        console.log('📍 Telegram LocationManager недоступен, используем Navigator API');
        fallbackToNavigator();
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      setLoadingLocation(false);
      alert(t('registration.geolocationError') || 'Не удалось определить местоположение');
    }
  };

  const fallbackToNavigator = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Navigator geolocation error:', error);
          setLoadingLocation(false);
          alert(t('registration.geolocationError') || 'Не удалось определить местоположение. Выберите вручную.');
        }
      );
    } else {
      setLoadingLocation(false);
      alert(t('registration.geolocationNotSupported') || 'Геолокация не поддерживается');
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      console.log(`🌍 Определяем местоположение: ${lat}, ${lon}`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru&zoom=10`
      );
      const data = await response.json();
      
      console.log('📍 Nominatim ответ:', data);
      
      if (data && data.address) {
        const address = data.address;
        
        // Определяем страну (пробуем разные поля)
        const country = address.country;
        
        // Определяем город (пробуем все возможные варианты)
        const city = address.city || 
                     address.town || 
                     address.village || 
                     address.municipality ||
                     address.suburb ||
                     address.county;
        
        console.log(`🏙️ Найдено: ${country}, ${city}`);
        
        if (country) {
          // Ищем страну в списке
          const foundCountry = popularCountries.find(c => 
            c.nameRu.toLowerCase().includes(country.toLowerCase()) || 
            c.name.toLowerCase().includes(country.toLowerCase()) ||
            country.toLowerCase().includes(c.nameRu.toLowerCase()) ||
            country.toLowerCase().includes(c.name.toLowerCase())
          );
          
          if (foundCountry) {
            console.log(`✅ Страна найдена: ${foundCountry.nameRu}`);
            setSelectedCountry(foundCountry);
            
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            
            setStep('city');
            
            // Загружаем города
            const citiesData = await locationService.getCities(foundCountry.nameRu);
            setCities(citiesData);
            
            if (city) {
              // Ищем город в базе
              const foundCity = citiesData.find(c => 
                c.nameRu.toLowerCase().includes(city.toLowerCase()) ||
                c.name.toLowerCase().includes(city.toLowerCase()) ||
                city.toLowerCase().includes(c.nameRu.toLowerCase()) ||
                city.toLowerCase().includes(c.name.toLowerCase())
              );
              
              if (foundCity) {
                console.log(`✅ Город найден в базе: ${foundCity.nameRu}`);
                setCitySearch(foundCity.nameRu);
                
                // Показываем уведомление
                if (window.Telegram?.WebApp) {
                  window.Telegram.WebApp.showAlert(
                    `📍 Определено: ${foundCountry.nameRu}, ${foundCity.nameRu}\n\nВы можете изменить город или нажать на найденный для продолжения.`
                  );
                }
              } else {
                console.log(`⚠️ Город не найден в базе, используем: ${city}`);
                setCitySearch(city);
                
                if (window.Telegram?.WebApp) {
                  window.Telegram.WebApp.showAlert(
                    `📍 Определено: ${foundCountry.nameRu}, ${city}\n\nНачните вводить название города для уточнения.`
                  );
                }
              }
            }
          } else {
            console.log(`⚠️ Страна не найдена в списке: ${country}`);
            setLoadingLocation(false);
            alert(`Страна "${country}" пока не поддерживается. Выберите вручную.`);
          }
        } else {
          throw new Error('Не удалось определить страну');
        }
      } else {
        throw new Error('Некорректный ответ от сервиса геолокации');
      }
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      setLoadingLocation(false);
      
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      
      const errorMessage = t('registration.geolocationError') || 'Не удалось определить местоположение. Пожалуйста, выберите вручную.';
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const filteredCountries = popularCountries.filter((country) =>
    country.nameRu.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = cities.filter((city) =>
    city.nameRu.toLowerCase().includes(citySearch.toLowerCase()) ||
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Рендер страницы выбора страны
  if (step === 'country') {
    return (
      <div className="country-page">
        <div className="container">
          <h1 className="page-title">{t('registration.selectCountry')}</h1>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px' }}>
            {t('registration.locationHint')}
          </p>

          <button
            onClick={handleGeolocation}
            disabled={loadingLocation}
            style={{
              width: '100%',
              marginBottom: '20px',
              padding: '18px',
              borderRadius: '16px',
              border: 'none',
              background: loadingLocation 
                ? '#e5e7eb' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loadingLocation ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: loadingLocation ? 'none' : '0 8px 24px rgba(102, 126, 234, 0.4)',
              transform: 'scale(1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseDown={(e) => !loadingLocation && (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => !loadingLocation && (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => !loadingLocation && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loadingLocation ? (
              <>
                <span style={{ 
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block'
                }}>
                  ⏳
                </span>
                <span>Определяем ваше местоположение...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '20px' }}>📍</span>
                <span>Определить автоматически</span>
              </>
            )}
          </button>
          
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          <div style={{ 
            textAlign: 'center', 
            color: '#94a3b8', 
            fontSize: '14px',
            margin: '16px 0',
            position: 'relative'
          }}>
            <span style={{ 
              background: 'white', 
              padding: '0 12px',
              position: 'relative',
              zIndex: 1
            }}>
              или выберите вручную
            </span>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              background: '#e5e7eb',
              zIndex: 0
            }} />
          </div>

          <input
            type="text"
            className="input search-input"
            placeholder={t('registration.searchCountry')}
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <div className="country-list">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                className={`country-item ${selectedCountry?.code === country.code ? 'selected' : ''}`}
                onClick={() => handleCountrySelect(country)}
              >
                <span className="country-flag">{country.flag}</span>
                <span className="country-name">{country.nameRu}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Рендер страницы выбора города
  return (
    <div className="country-page">
      <div className="container">
        <button
          onClick={() => {
            setStep('country');
            setSelectedCity(null);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#667eea',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 0'
          }}
        >
          ← {t('registration.back')}
        </button>

        <h1 className="page-title">{t('registration.selectCity')}</h1>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px' }}>
          {selectedCountry?.flag} {selectedCountry?.nameRu}
        </p>

        <input
          type="text"
          className="input search-input"
          placeholder={t('registration.searchCity')}
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          style={{ marginBottom: '16px' }}
          autoFocus
        />

        {loadingCities ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Загрузка городов...
          </div>
        ) : filteredCities.length > 0 ? (
          <div className="country-list">
            {filteredCities.slice(0, 50).map((city) => (
              <button
                key={city.nameRu}
                className={`country-item ${selectedCity?.nameRu === city.nameRu ? 'selected' : ''}`}
                onClick={() => handleCitySelect(city)}
              >
                <span className="country-name">{city.nameRu}</span>
              </button>
            ))}
            {filteredCities.length > 50 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                color: '#94a3b8',
                fontSize: '14px'
              }}>
                Показаны первые 50 результатов. Уточните запрос для более точного поиска.
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            {citySearch ? 'Ничего не найдено. Попробуйте другой запрос.' : 'Начните вводить название города'}
          </div>
        )}
      </div>
    </div>
  );
}
