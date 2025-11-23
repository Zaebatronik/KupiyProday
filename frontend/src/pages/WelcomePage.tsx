import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import type { Language } from '../types';
import '../styles/WelcomePage.css';

const languages: { code: Language; flag: string; name: string }[] = [
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'uk', flag: '🇺🇦', name: 'Українська' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const setLanguage = useStore((state) => state.setLanguage);

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode);
    i18n.changeLanguage(langCode);
    
    // Тактильная обратная связь
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    navigate('/agreement');
  };

  return (
    <div className="welcome-page">
      {/* ТЕСТОВЫЙ БАННЕР */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        padding: '16px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        borderRadius: '12px',
        margin: '12px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
      }}>
        🚀 ТЕСТОВАЯ ВЕРСИЯ - АВТОДЕПЛОЙ РАБОТАЕТ!
      </div>
      <div className="welcome-header">
        {/* Анимация медведя с корзинкой */}
        <div className="bear-cart-animation">
          <div className="bear-container">
            {/* Вылетающие вещи из корзины */}
            <div className="flying-items">
              <div className="item phone">📱</div>
              <div className="item laptop">💻</div>
              <div className="item tshirt">👕</div>
              <div className="item sneakers">👟</div>
              <div className="item car">🚗</div>
              <div className="item house">🏠</div>
            </div>

            {/* Медведь бежит лицом к пользователю */}
            <div className="bear">
              {/* Рюкзак за спиной */}
              <div className="backpack">
                <div className="backpack-body">
                  <div className="backpack-pocket"></div>
                  <div className="backpack-zipper"></div>
                </div>
                <div className="backpack-straps">
                  <div className="strap left"></div>
                  <div className="strap right"></div>
                </div>
              </div>
              
              {/* Голова */}
              <div className="bear-head">
                <div className="bear-ear left">
                  <div className="ear-inner"></div>
                </div>
                <div className="bear-ear right">
                  <div className="ear-inner"></div>
                </div>
                <div className="bear-face">
                  <div className="bear-eye left">
                    <div className="pupil"></div>
                    <div className="eye-shine"></div>
                  </div>
                  <div className="bear-eye right">
                    <div className="pupil"></div>
                    <div className="eye-shine"></div>
                  </div>
                  <div className="bear-snout">
                    <div className="bear-nose">
                      <div className="nostril left"></div>
                      <div className="nostril right"></div>
                    </div>
                    <div className="bear-mouth"></div>
                  </div>
                  <div className="bear-cheeks">
                    <div className="cheek left"></div>
                    <div className="cheek right"></div>
                  </div>
                </div>
              </div>
              {/* Тело */}
              <div className="bear-body">
                <div className="bear-belly"></div>
                <div className="bear-chest"></div>
              </div>
              {/* Руки медведя */}
              <div className="bear-arms">
                <div className="bear-arm left throwing">
                  <div className="paw"></div>
                  <div className="fingers">
                    <div className="finger"></div>
                    <div className="finger"></div>
                    <div className="finger"></div>
                  </div>
                </div>
                <div className="bear-arm right throwing">
                  <div className="paw"></div>
                  <div className="fingers">
                    <div className="finger"></div>
                    <div className="finger"></div>
                    <div className="finger"></div>
                  </div>
                </div>
              </div>
              {/* Ноги */}
              <div className="bear-legs">
                <div className="bear-leg left">
                  <div className="foot"></div>
                </div>
                <div className="bear-leg right">
                  <div className="foot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h1 className="app-title">🐻 Берлога</h1>
        <p className="app-slogan">Покупай и продавай что угодно рядом с домом</p>
      </div>

      <div className="welcome-messages">
        <p>Добро пожаловать в Берлогу!</p>
        <p>Welcome to Berloga!</p>
        <p>Ласкаво просимо до Берлога!</p>
      </div>

      <div className="language-selector">
        <h2>🌍 Select Language / Выберите язык</h2>
        <div className="language-grid">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className="language-button"
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <span className="flag">{lang.flag}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
