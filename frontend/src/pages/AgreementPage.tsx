import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AgreementPage.css';

export default function AgreementPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    navigate('/country');
  };

  const handleDecline = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
    window.Telegram?.WebApp?.close();
  };

  return (
    <div className="agreement-page">
      <div className="container">
        <h1 className="page-title">{t('agreement.title')}</h1>

        <div className="agreement-content">
          <p className="agreement-text">{t('agreement.text')}</p>
        </div>

        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{t('agreement.accept')}</span>
          </label>
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary btn-large"
            disabled={!accepted}
            onClick={handleAccept}
          >
            {t('registration.continue')}
          </button>
          <button
            className="btn btn-outline btn-large"
            onClick={handleDecline}
          >
            {t('agreement.decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
