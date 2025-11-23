import { useNavigate } from 'react-router-dom';
import '../styles/GoodbyePage.css';

export default function GoodbyePage() {
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="goodbye-page">
      <div className="goodbye-content">
        <div className="goodbye-icon">😢</div>
        <h1 className="goodbye-title">Нам очень жаль!</h1>
        <p className="goodbye-message">
          Мы расстроены, что вы покидаете нас. 
          <br />
          Надеемся, что вы вернётесь снова!
        </p>
        <div className="goodbye-emoji">🐻💔</div>
        <button className="return-button" onClick={handleReturn}>
          🏠 Вернуться
        </button>
        <p className="goodbye-hint">
          Нажмите кнопку, чтобы начать заново
        </p>
      </div>
    </div>
  );
}
