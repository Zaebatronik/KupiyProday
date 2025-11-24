// SimpleChatPage - Anonymous real-time chat with Socket.IO and localStorage fallback
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { io, Socket } from 'socket.io-client';
import { chatsAPI, listingsAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://kupiyproday.onrender.com';
let socket: Socket | null = null;

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  _id?: string;
  createdAt?: string;
}

export default function SimpleChatPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user, listings } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [listing, setListing] = useState<any>(null);
  const [chatId, setChatId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Инициализация Socket.IO и загрузка чата
  useEffect(() => {
    if (!listingId || !user) return;

    // Загружаем объявление с сервера
    const loadListing = async () => {
      try {
        // Сначала пробуем найти в локальном store (проверяем и id, и _id)
        let foundListing = listings.find((l: any) => 
          l.id === listingId || l._id === listingId
        );
        
        // Если нет - пробуем загрузить с сервера
        if (!foundListing) {
          console.log('📥 Загружаем объявление с сервера:', listingId);
          try {
            const response = await listingsAPI.getById(listingId);
            foundListing = response.data;
            console.log('✅ Объявление загружено с сервера:', foundListing);
          } catch (serverError) {
            console.log('⚠️ Сервер недоступен, проверяем localStorage');
            // Fallback: проверяем localStorage
            const localListings = localStorage.getItem('listings');
            if (localListings) {
              const parsedListings = JSON.parse(localListings);
              foundListing = parsedListings.find((l: any) => 
                l.id === listingId || l._id === listingId
              );
              if (foundListing) {
                console.log('✅ Объявление найдено в localStorage');
              }
            }
          }
        }

        if (!foundListing) {
          alert('Объявление не найдено');
          navigate('/catalog');
          return null;
        }

        setListing(foundListing);
        return foundListing;
      } catch (error) {
        console.error('❌ Ошибка загрузки объявления:', error);
        alert('Не удалось загрузить объявление');
        navigate('/catalog');
        return null;
      }
    };

    const init = async () => {
      const foundListing = await loadListing();
      if (!foundListing) return;

      // Подключаем Socket.IO с автопереподключением
      if (!socket) {
        socket = io(API_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10
        });
        
        socket.on('connect', () => {
          console.log('✅ Socket.IO подключен:', socket?.id);
        });
        
        socket.on('disconnect', () => {
          console.log('⚠️ Socket.IO отключен');
        });
      }

      try {
        const isSeller = foundListing.userId === user.id || foundListing.userId === user.telegramId;

        try {
          let chat;
          
          // Сначала пробуем найти существующий чат
          try {
            const existingChatResponse = await chatsAPI.getByListingAndUser(listingId, user.id);
            chat = existingChatResponse.data;
            console.log('✅ Найден существующий чат:', chat._id);
          } catch (notFoundError: any) {
            // Если чат не найден (404), создаем новый (только для покупателя)
            if (notFoundError.response?.status === 404) {
              if (isSeller) {
                console.log('⚠️ Продавец пытается открыть несуществующий чат');
                alert('Чат еще не создан. Покупатель должен написать первым.');
                navigate(-1);
                return;
              }
              
              console.log('📝 Покупатель создает новый чат...');
              const response = await chatsAPI.create({
                listingId,
                participants: [
                  { userId: foundListing.userId, nickname: foundListing.userNickname },
                  { userId: user.id, nickname: user.nickname }
                ]
              });
              chat = response.data;
              console.log('✅ Новый чат создан:', chat._id);
            } else {
              throw notFoundError;
            }
          }

          setChatId(chat._id);
          setMessages(chat.messages || []);

          // Присоединяемся к комнате чата
          socket?.emit('join-chat', chat._id);

          // Слушаем новые сообщения от других пользователей
          socket?.on('new-message', (message: Message) => {
            console.log('📨 Получено новое сообщение через Socket.IO:', message);
            
            // Добавляем только если это не наше сообщение и его еще нет
            setMessages(prev => {
              const exists = prev.some(m => 
                (m._id && m._id === message._id) || 
                (m.id === message.id && m.timestamp === message.timestamp)
              );
              
              if (exists) {
                console.log('⚠️ Сообщение уже существует, пропускаем');
                return prev;
              }
              
              if (message.senderId === user.id) {
                console.log('⚠️ Это наше сообщение, пропускаем');
                return prev;
              }
              
              console.log('✅ Добавляем новое сообщение');
              return [...prev, message];
            });
          });

          console.log('✅ Чат готов к использованию');
        } catch (serverError) {
          console.log('⚠️ Сервер недоступен, работаем в режиме localStorage');
          // Fallback: работаем с localStorage
          const localChatKey = `chat_${listingId}_${user.id}`;
          const localChat = localStorage.getItem(localChatKey);
          const chatId = localChatKey;
          setChatId(chatId);
          
          if (localChat) {
            const parsedChat = JSON.parse(localChat);
            setMessages(parsedChat.messages || []);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        setLoading(false);
      }
    };

    init();

    // Периодическое обновление чата с сервера (каждые 5 секунд)
    const intervalId = setInterval(async () => {
      if (chatId && !chatId.startsWith('chat_')) {
        try {
          const response = await chatsAPI.getById(chatId);
          const serverMessages = response.data.messages || [];
          
          // Обновляем только если есть новые сообщения
          if (serverMessages.length > messages.length) {
            console.log(`🔄 Обновлено ${serverMessages.length - messages.length} новых сообщений`);
            setMessages(serverMessages);
          }
        } catch (error) {
          console.log('⚠️ Не удалось обновить чат:', error);
        }
      }
    }, 5000);

    // Очистка при размонтировании
    return () => {
      socket?.off('new-message');
      clearInterval(intervalId);
    };
  }, [listingId, user, listings, navigate, chatId, messages.length]);

  // Автопрокрутка
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка сообщения
  const handleSend = async () => {
    if (!messageText.trim() || !user || !chatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      text: messageText.trim(),
      timestamp: Date.now()
    };

    try {
      // Добавляем сообщение локально сразу
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');

      // Тактильная обратная связь
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      // Пробуем отправить на сервер
      try {
        const response = await chatsAPI.sendMessage(chatId, newMessage);
        console.log('✅ Сообщение отправлено на сервер:', response.data);
        
        // Обновляем сообщения с сервера (чтобы получить правильные _id)
        if (response.data.messages) {
          setMessages(response.data.messages);
        }
        
        // Отправляем через Socket.IO для моментальной доставки другому пользователю
        socket?.emit('send-message', {
          chatId,
          message: newMessage
        });
        console.log('📡 Сообщение отправлено через Socket.IO');
      } catch (serverError) {
        console.error('⚠️ Ошибка отправки на сервер:', serverError);
        // Сохраняем в localStorage
        const localChatKey = `chat_${listingId}_${user.id}`;
        const localChat = localStorage.getItem(localChatKey);
        const chat = localChat ? JSON.parse(localChat) : { messages: [] };
        chat.messages.push(newMessage);
        localStorage.setItem(localChatKey, JSON.stringify(chat));
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Не удалось отправить сообщение');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Удалить сообщение?')) return;
    
    // Пока просто удаляем локально (можно добавить API endpoint для удаления)
    setMessages(prev => prev.filter(m => m._id !== messageId));
  };

  if (loading || !listing) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка чата...</div>;
  }

  const otherUserNickname = listing.userId === user?.id 
    ? 'Покупатель' 
    : listing.userNickname;

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
        gap: '16px',
        WebkitOverflowScrolling: 'touch'
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
                key={msg._id || `msg-${Math.random()}`}
                style={{
                  display: 'flex',
                  justifyContent: isMyMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: isMyMessage 
                    ? 'var(--tg-theme-button-color, #3b82f6)' 
                    : 'var(--tg-theme-secondary-bg-color, #f3f4f6)',
                  color: isMyMessage 
                    ? 'var(--tg-theme-button-text-color, white)' 
                    : 'var(--tg-theme-text-color, #000)',
                  position: 'relative'
                }}>
                  {isMyMessage && (
                    <button
                      onClick={() => handleDeleteMessage(msg._id!)}
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        padding: '0'
                      }}
                    >
                      ×
                    </button>
                  )}
                  <div style={{ fontSize: '14px', wordWrap: 'break-word' }}>
                    {msg.text}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    opacity: 0.7
                  }}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
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
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
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
            padding: '12px 16px',
            borderRadius: '22px',
            border: '1px solid var(--tg-theme-hint-color, #e5e7eb)',
            background: 'var(--tg-theme-secondary-bg-color, #f9fafb)',
            color: 'var(--tg-theme-text-color, #000)',
            fontSize: '16px',
            outline: 'none',
            minHeight: '44px'
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
      <div style={{ 
        padding: '12px 16px', 
        paddingTop: 0,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
      }}>
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

