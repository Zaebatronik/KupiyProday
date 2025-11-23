import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';

export default function SupportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [reportType, setReportType] = useState<'listing' | 'user' | 'bug' | 'other'>('listing');
  const [listingId, setListingId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || (reportType === 'listing' && !listingId.trim())) {
      alert('⚠️ Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    try {
      const { reportsAPI } = await import('../services/api');
      await reportsAPI.create({
        type: reportType,
        listingId: reportType === 'listing' ? listingId : undefined,
        reportedBy: user?.id || user?.telegramId,
        description: description.trim(),
        status: 'pending'
      });

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      alert('✅ Жалоба отправлена! Мы рассмотрим её в ближайшее время.');
      navigate('/menu');
    } catch (error: any) {
      console.error('❌ Ошибка отправки жалобы:', error);
      alert(`❌ Ошибка: ${error?.message || 'Не удалось отправить жалобу'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: '20px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🚨 Поддержка и жалобы
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '15px' }}>
          Сообщите нам о проблеме или нарушении
        </p>

        {/* Тип жалобы */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Тип обращения
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { value: 'listing', label: '📦 Жалоба на объявление', icon: '📦' },
              { value: 'user', label: '👤 Жалоба на пользователя', icon: '👤' },
              { value: 'bug', label: '🐛 Ошибка в приложении', icon: '🐛' },
              { value: 'other', label: '💬 Другое', icon: '💬' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value as any)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: reportType === type.value ? '2px solid #667eea' : '2px solid #e5e7eb',
                  background: reportType === type.value ? 'rgba(102, 126, 234, 0.1)' : 'white',
                  color: reportType === type.value ? '#667eea' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {type.icon} {type.label.split(' ').slice(1).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* ID объявления (только для жалоб на объявление) */}
        {reportType === 'listing' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              ID объявления <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder="Например: maria_12345"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '15px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <div style={{
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#667eea',
              lineHeight: '1.5'
            }}>
              💡 <strong>Где найти ID?</strong><br/>
              Откройте объявление и найдите "ИДЕНТИФИКАЦИОННЫЙ НОМЕР" внизу страницы. 
              Формат: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                nickname_XXXXX
              </code>
            </div>
          </div>
        )}

        {/* Описание */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Описание проблемы <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите проблему подробно..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontSize: '15px',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: isSubmitting 
              ? '#e5e7eb' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s'
          }}
        >
          {isSubmitting ? 'Отправка...' : '📤 Отправить жалобу'}
        </button>

        {/* Информация */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'white',
          borderRadius: '12px',
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: '1.6'
        }}>
          <strong>ℹ️ Важная информация:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Мы рассматриваем все жалобы в течение 24 часов</li>
            <li>Ложные жалобы могут привести к блокировке аккаунта</li>
            <li>Укажите максимум деталей для быстрого решения</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
