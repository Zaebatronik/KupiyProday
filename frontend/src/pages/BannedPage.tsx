import '../styles/BannedPage.css';

export default function BannedPage() {
  return (
    <div className="banned-page">
      <div className="banned-content">
        <div className="banned-icon">🚫</div>
        <h1 className="banned-title">ВЫ ЗАБАНЕНЫ!</h1>
        <p className="banned-message">
          Ваш аккаунт был заблокирован за нарушение правил платформы.
        </p>
        <div className="banned-emoji">😔📱</div>
        <div className="banned-advice">
          <p className="advice-title">👋 Совет от администрации:</p>
          <p className="advice-text">
            Убирайте телефон и идите на улицу!
            <br />
            Свежий воздух полезен для здоровья 🌳
          </p>
        </div>
        <p className="banned-hint">
          Для разблокировки обратитесь в службу поддержки
        </p>
      </div>
    </div>
  );
}
