import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/RadiusPage.css';

const radiusOptions = [0, 10, 25, 50, 100, 150, 200, 300, 500];

export default function RadiusPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [radius, setRadius] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRadius(Number(e.target.value));
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const handleButtonClick = (value: number) => {
    setRadius(value);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleContinue = () => {
    localStorage.setItem('registrationRadius', radius.toString());
    navigate('/nickname');
  };

  const getRadiusLabel = () => {
    if (radius === 0) return t('registration.onlyMyCity');
    return `${radius} ${t('common.km')}`;
  };

  // Вычисляем угол поворота стрелки (0-360 градусов)
  const arrowRotation = (radius / 500) * 360;

  return (
    <div className="container radius-page">
      <h1 className="page-title">{t('registration.selectRadius')}</h1>

      <div className="slider-container">
        <div className="slider-value">{getRadiusLabel()}</div>
        
        {/* Круговой компас-локатор */}
        <div className="compass-container">
          <div className="compass-circle">
            <div className="compass-marks">
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
              <div className="compass-mark"></div>
            </div>
            <div 
              className="compass-arrow" 
              style={{ transform: `translate(-50%, -50%) rotate(${arrowRotation}deg)` }}
            ></div>
            <div className="compass-center"></div>
          </div>
        </div>
        
        <input
          type="range"
          min="0"
          max="500"
          step="10"
          value={radius}
          onChange={handleSliderChange}
          className="radius-slider"
        />
        
        <div className="slider-labels">
          <span>{t('registration.radius')}</span>
        </div>
      </div>

      <div className="radius-buttons">
        {radiusOptions.map((value) => (
          <button
            key={value}
            className={`radius-btn ${radius === value ? 'active' : ''}`}
            onClick={() => handleButtonClick(value)}
          >
            {value === 0 ? t('registration.onlyMyCity') : `${value}`}
          </button>
        ))}
      </div>

      <div className="fixed-bottom">
        <button
          className="btn btn-primary btn-large"
          onClick={handleContinue}
        >
          {t('registration.continue')}
        </button>
      </div>
    </div>
  );
}
