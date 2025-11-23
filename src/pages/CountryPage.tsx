import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Country } from '../types';
import '../styles/CountryPage.css';

const popularCountries: Country[] = [
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'UA', name: 'Україна', flag: '🇺🇦' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'KZ', name: 'Қазақстан', flag: '🇰🇿' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'PL', name: 'Polska', flag: '🇵🇱' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', flag: '🇬🇧' },
];

export default function CountryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const filteredCountries = popularCountries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    // Автоматический переход после выбора
    localStorage.setItem('registrationCountry', JSON.stringify(country));
    setTimeout(() => {
      navigate('/city');
    }, 300);
  };

  return (
    <div className="country-page">
      <div className="container">
        <h1 className="page-title">{t('registration.selectCountry')}</h1>

        <input
          type="text"
          className="input search-input"
          placeholder={t('registration.searchCountry')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

      <div className="country-list">
        {filteredCountries.map((country) => (
          <button
            key={country.code}
            className={`country-item ${selectedCountry?.code === country.code ? 'selected' : ''}`}
            onClick={() => handleSelect(country)}
          >
            <span className="country-flag">{country.flag}</span>
            <span className="country-name">{country.name}</span>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
