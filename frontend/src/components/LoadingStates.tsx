import '../styles/LoadingState.css';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingState({ message = 'Загрузка...', size = 'medium' }: LoadingStateProps) {
  const sizeMap = {
    small: '24px',
    medium: '48px',
    large: '72px',
  };

  return (
    <div className="loading-state">
      <div className="loading-spinner" style={{ width: sizeMap[size], height: sizeMap[size] }}>
        <div className="spinner"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && (
        <button className="empty-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Ошибка загрузки', 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          🔄 Попробовать снова
        </button>
      )}
    </div>
  );
}
