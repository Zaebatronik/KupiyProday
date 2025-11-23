import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocationSelector from '../components/LocationSelector';
import '../styles/CityPage.css';

export default function CityPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    // Загружаем сохранённую страну из CountryPage
    const savedCountry = localStorage.getItem('registrationCountry');
    if (savedCountry) {
      const country = JSON.parse(savedCountry);
      setSelectedCountry(country.nameRu || country.name);
    }
  }, []);

  const handleContinue = () => {
    if (selectedCity) {
      localStorage.setItem('registrationCity', selectedCity);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      navigate('/radius');
    }
  };

  return (
    <div className="city-page">
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t('registration.selectCity')}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '15px' }}>
          {t('registration.cityHint')}
        </p>

        <LocationSelector
          selectedCountry={selectedCountry}
          selectedCity={selectedCity}
          onCountryChange={setSelectedCountry}
          onCityChange={setSelectedCity}
        />

        <button
          onClick={handleContinue}
          disabled={!selectedCity}
          style={{
            width: '100%',
            marginTop: '32px',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: selectedCity 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : '#e5e7eb',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor: selectedCity ? 'pointer' : 'not-allowed',
            boxShadow: selectedCity ? '0 8px 24px rgba(102, 126, 234, 0.4)' : 'none',
            transition: 'all 0.3s',
            transform: 'scale(1)'
          }}
          onMouseDown={(e) => selectedCity && (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => selectedCity && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {selectedCity ? `${t('registration.continueToCity')} ${selectedCity}` : t('registration.selectCityButton')}
        </button>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#64748b',
          lineHeight: '1.6'
        }}>
          {t('registration.citySearchHint')}
        </div>
      </div>
    </div>
  );
}
