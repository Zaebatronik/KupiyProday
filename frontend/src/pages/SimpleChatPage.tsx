import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';

interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  text: string;
  timestamp: number;
}

interface LocalChat {
  listingId: string;
  sellerId: string;
  sellerNickname: string;
  buyerId: string;
  buyerNickname: string;
  messages: Message[];
}

export default function SimpleChatPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user, listings } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [listing, setListing] = useState<any>(null);
  const [otherUserNickname, setOtherUserNickname] = useState('');

  // Загрузка чата из localStorage
  useEffect(() => {
    if (!listingId || !user) return;

    // Находим объявление
    const foundListing = listings.find(l => l.id === listingId);
    if (!foundListing) {
      alert('Объявление не найдено');
      navigate('/catalog');
      return;
    }

    setListing(foundListing);

    // Определяем кто продавец, кто покупатель
    const isSeller = foundListing.userId === user.id || foundListing.userId === user.telegramId;
    setOtherUserNickname(isSeller ? 'Покупатель' : foundListing.userNickname);

    // Загружаем сообщения из localStorage
    const chatKey = `chat_${listingId}_${user.id}`;
    const savedChat = localStorage.getItem(chatKey);
    if (savedChat) {
      try {
        const chat: LocalChat = JSON.parse(savedChat);
        setMessages(chat.messages || []);
      } catch (e) {
        console.error('Ошибка загрузки чата:', e);
      }
    }
  }, [listingId, user, listings, navigate]);

  // Автопрокрутка
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка сообщения
  const handleSend = () => {
    if (!messageText.trim() || !user || !listing) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderNickname: user.nickname || 'Вы',
      text: messageText.trim(),
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Сохраняем в localStorage
    const chatKey = `chat_${listingId}_${user.id}`;
    const chat: LocalChat = {
      listingId: listingId!,
      sellerId: listing.userId,
      sellerNickname: listing.userNickname,
      buyerId: user.id,
      buyerNickname: user.nickname || 'Покупатель',
      messages: updatedMessages
    };
    localStorage.setItem(chatKey, JSON.stringify(chat));

    // Очищаем поле ввода
    setMessageText('');

    // Тактильная обратная связь
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!listing) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--tg-theme-bg-color, #fff)'
    }}>
      {/* Шапка */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--tg-theme-hint-color, #e5e7eb)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--tg-theme-secondary-bg-color, #f9fafb)'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--tg-theme-button-color, #3b82f6)',
            color: 'var(--tg-theme-button-text-color, white)',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>{otherUserNickname}</div>
          <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #9ca3af)' }}>
            {listing.title}
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--tg-theme-hint-color, #9ca3af)',
            fontSize: '14px'
          }}>
            👋 Начните диалог!<br />
            Задайте вопрос о товаре
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMyMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  background: isMyMessage 
                    ? 'var(--tg-theme-button-color, #3b82f6)' 
                    : 'var(--tg-theme-secondary-bg-color, #f3f4f6)',
                  color: isMyMessage 
                    ? 'var(--tg-theme-button-text-color, white)' 
                    : 'var(--tg-theme-text-color, #000)'
                }}>
                  <div style={{ fontSize: '14px', wordWrap: 'break-word' }}>
                    {msg.text}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    opacity: 0.7
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Подсказка об обмене контактами */}
      <div style={{
        padding: '8px 16px',
        background: '#fef3c7',
        borderTop: '1px solid #fbbf24',
        fontSize: '12px',
        textAlign: 'center',
        color: '#92400e'
      }}>
        💡 Договорились? Обменяйтесь контактами через кнопку ниже
      </div>

      {/* Поле ввода */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--tg-theme-hint-color, #e5e7eb)',
        display: 'flex',
        gap: '8px',
        background: 'var(--tg-theme-bg-color, #fff)'
      }}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '20px',
            border: '1px solid var(--tg-theme-hint-color, #e5e7eb)',
            background: 'var(--tg-theme-secondary-bg-color, #f9fafb)',
            color: 'var(--tg-theme-text-color, #000)',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!messageText.trim()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: messageText.trim() 
              ? 'var(--tg-theme-button-color, #3b82f6)' 
              : '#d1d5db',
            color: 'white',
            fontSize: '18px',
            cursor: messageText.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          ➤
        </button>
      </div>

      {/* Кнопка обмена контактами */}
      <div style={{ padding: '12px 16px', paddingTop: 0 }}>
        <button
          onClick={() => {
            const telegramUrl = `https://t.me/user?id=${listing.userId}`;
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.openTelegramLink(telegramUrl);
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📞 Открыть контакт продавца
        </button>
      </div>
    </div>
  );
}
