import { useState, useEffect, useRef } from 'react';
import { locationService, Country, City } from '../services/location';

interface LocationSelectorProps {
  selectedCountry: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  compact?: boolean;
}

export default function LocationSelector({
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  compact = false
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countryQuery, setCountryQuery] = useState(selectedCountry);
  const [cityQuery, setCityQuery] = useState(selectedCity);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  
  const countryInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Загрузка стран
  useEffect(() => {
    const loadCountries = async () => {
      const data = await locationService.getCountries();
      setCountries(data);
      setFilteredCountries(data);
    };
    loadCountries();
  }, []);

  // Загрузка городов при выборе страны
  useEffect(() => {
    const loadCities = async () => {
      if (selectedCountry) {
        const data = await locationService.getCities(selectedCountry);
        setCities(data);
        setFilteredCities(data);
      } else {
        setCities([]);
        setFilteredCities([]);
      }
    };
    loadCities();
  }, [selectedCountry]);

  // Фильтрация стран при вводе
  useEffect(() => {
    if (countryQuery) {
      const filtered = countries.filter(c =>
        c.nameRu.toLowerCase().includes(countryQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(countryQuery.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [countryQuery, countries]);

  // Фильтрация городов при вводе
  useEffect(() => {
    if (cityQuery) {
      const filtered = cities.filter(c =>
        c.nameRu.toLowerCase().includes(cityQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(cityQuery.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [cityQuery, cities]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node) &&
          countryInputRef.current && !countryInputRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node) &&
          cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    setCountryQuery(country.nameRu);
    onCountryChange(country.nameRu);
    onCityChange(''); // Сбрасываем город
    setCityQuery('');
    setShowCountryDropdown(false);
  };

  const handleCitySelect = (city: City) => {
    setCityQuery(city.nameRu);
    onCityChange(city.nameRu);
    setShowCityDropdown(false);
  };

  const clearLocation = () => {
    setCountryQuery('');
    setCityQuery('');
    onCountryChange('');
    onCityChange('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: '12px', position: 'relative' }}>
      {/* Поле страны */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={countryInputRef}
            type="text"
            value={countryQuery}
            onChange={(e) => {
              setCountryQuery(e.target.value);
              setShowCountryDropdown(true);
            }}
            onFocus={() => setShowCountryDropdown(true)}
            placeholder="🌍 Страна..."
            style={{
              width: '100%',
              padding: '12px 40px 12px 12px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
              transition: 'border 0.2s',
              background: 'white'
            }}
            onFocusCapture={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => setTimeout(() => e.currentTarget.style.borderColor = '#e5e7eb', 200)}
          />
          {countryQuery && (
            <button
              onClick={() => {
                setCountryQuery('');
                onCountryChange('');
                setCityQuery('');
                onCityChange('');
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#999',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Дропдаун стран */}
        {showCountryDropdown && filteredCountries.length > 0 && (
          <div
            ref={countryDropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000
            }}
          >
            {filteredCountries.slice(0, 50).map((country) => (
              <div
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <span style={{ fontSize: '20px' }}>{country.flag}</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{country.nameRu}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Поле города */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={cityInputRef}
            type="text"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setShowCityDropdown(true);
            }}
            onFocus={() => setShowCityDropdown(true)}
            disabled={!selectedCountry}
            placeholder="🏙️ Город..."
            style={{
              width: '100%',
              padding: '12px 40px 12px 12px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
              transition: 'border 0.2s',
              background: selectedCountry ? 'white' : '#f5f5f5',
              cursor: selectedCountry ? 'text' : 'not-allowed'
            }}
            onFocusCapture={(e) => selectedCountry && (e.currentTarget.style.borderColor = '#667eea')}
            onBlur={(e) => setTimeout(() => e.currentTarget.style.borderColor = '#e5e7eb', 200)}
          />
          {cityQuery && (
            <button
              onClick={() => {
                setCityQuery('');
                onCityChange('');
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#999',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Дропдаун городов */}
        {showCityDropdown && filteredCities.length > 0 && (
          <div
            ref={cityDropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000
            }}
          >
            {filteredCities.map((city, index) => (
              <div
                key={index}
                onClick={() => handleCitySelect(city)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderBottom: index < filteredCities.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{city.nameRu}</span>
                {city.population && (
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {(city.population / 1000).toFixed(0)}к
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка очистки */}
      {(selectedCountry || selectedCity) && (
        <button
          onClick={clearLocation}
          style={{
            padding: '12px',
            borderRadius: '12px',
            border: '2px solid #667eea',
            background: 'white',
            color: '#667eea',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#667eea';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#667eea';
          }}
        >
          🌍 Все города
        </button>
      )}
    </div>
  );
}
