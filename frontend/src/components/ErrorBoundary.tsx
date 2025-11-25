import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 ErrorBoundary caught an error:', error);
    console.error('📋 Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Можно отправить на сервер для логирования
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>😔</div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '16px',
              }}
            >
              Что-то пошло не так
            </h1>
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              Приложение столкнулось с неожиданной ошибкой. Мы уже работаем над её исправлением.
            </p>

            {this.state.error && (
              <details
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  textAlign: 'left',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#ef4444',
                    marginBottom: '12px',
                  }}
                >
                  Показать технические детали
                </summary>
                <div
                  style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <strong>Ошибка:</strong>
                  <br />
                  {this.state.error.toString()}
                  <br />
                  <br />
                  <strong>Stack trace:</strong>
                  <br />
                  {this.state.error.stack}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                🔄 Обновить страницу
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                ↩️ Попробовать снова
              </button>
            </div>

            <p
              style={{
                marginTop: '24px',
                fontSize: '14px',
                color: '#9ca3af',
              }}
            >
              Если проблема повторяется, обратитесь в{' '}
              <a
                href="/support"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                }}
              >
                службу поддержки
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
