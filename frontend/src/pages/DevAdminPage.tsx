import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enableAdminDevMode, disableAdminDevMode } from '../utils/telegram';

/**
 * Секретная страница для включения режима разработки админа
 * Доступна по адресу /dev-admin
 */
export default function DevAdminPage() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(localStorage.getItem('dev_admin_mode') === 'true');

  const handleToggle = () => {
    if (enabled) {
      disableAdminDevMode();
      setEnabled(false);
      localStorage.clear();
      alert('✅ Режим админа выключен. localStorage очищен.');
    } else {
      enableAdminDevMode();
      setEnabled(true);
      alert('✅ Режим админа включён! Теперь можете зарегистрироваться с ID 670170626');
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>🔧 Режим разработки админа</h1>
      
      <div style={{
        background: '#f3f4f6',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
          <strong>Статус:</strong> {enabled ? '✅ Включён' : '❌ Выключен'}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
          ID: 670170626
        </p>
      </div>

      <div style={{
        background: '#fef3c7',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #fbbf24'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#92400e' }}>
          ⚠️ Внимание!
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
          Этот режим предназначен ТОЛЬКО для тестирования администратором.
          Обычные пользователи должны регистрироваться через Telegram.
        </p>
      </div>

      <div style={{
        background: '#e0e7ff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #818cf8'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#3730a3' }}>
          📝 Инструкция:
        </h3>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4338ca' }}>
          <li>Включите режим админа</li>
          <li>Очистите localStorage (или это будет сделано автоматически)</li>
          <li>Пройдите регистрацию с любым никнеймом</li>
          <li>Ваш ID будет: 670170626</li>
          <li>После тестирования выключите режим</li>
        </ol>
      </div>

      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '8px',
          border: 'none',
          background: enabled ? '#dc2626' : '#10b981',
          color: 'white',
          cursor: 'pointer',
          marginBottom: '12px'
        }}
      >
        {enabled ? '❌ Выключить режим админа' : '✅ Включить режим админа'}
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: 'white',
          color: '#374151',
          cursor: 'pointer'
        }}
      >
        ← Вернуться
      </button>
    </div>
  );
}
