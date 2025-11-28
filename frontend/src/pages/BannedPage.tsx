import { useStore } from '../store';
import '../styles/BannedPage.css';

export default function BannedPage() {
  const { user } = useStore();

  return (
    <div className="banned-page">
      <div className="banned-content">
        <div className="banned-icon">🚫</div>
        <h1 className="banned-title">ВЫ ЗАБАНЕНЫ!</h1>
        
        {user?.nickname && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid rgba(239, 68, 68, 0.3)'
          }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#ef4444' }}>
              👤 Пользователь: <strong>{user.nickname}</strong>
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
              ID: {user.telegramId || user.id}
            </p>
          </div>
        )}
        
        <p className="banned-message">
          Ваш аккаунт был заблокирован за нарушение правил платформы.
        </p>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '18px' }}>
            ⚠️ Возможные причины бана:
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            margin: 0, 
            padding: '0 0 0 24px',
            color: '#475569',
            lineHeight: '1.8'
          }}>
            <li>Публикация запрещенных товаров</li>
            <li>Мошенничество или обман пользователей</li>
            <li>Спам или навязчивая реклама</li>
            <li>Оскорбления других пользователей</li>
            <li>Нарушение правил пользования</li>
          </ul>
        </div>
        
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
          Для разблокировки обратитесь к администратору
        </p>
        
        <button
          onClick={() => {
            const ADMIN_ID = '670170626';
            const message = `Здравствуйте! Я ${user?.nickname || 'пользователь'} (ID: ${user?.telegramId || user?.id}). Хочу узнать причину блокировки и возможность разблокировки аккаунта.`;
            window.location.href = `/direct-chat/admin-${user?.telegramId || user?.id}?adminId=${ADMIN_ID}&message=${encodeURIComponent(message)}`;
          }}
          style={{
            marginTop: '24px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '24px auto 0'
          }}
        >
          <span>💬</span>
          Написать администратору
        </button>
      </div>
    </div>
  );
}
