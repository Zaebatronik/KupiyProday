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
  const { listingId, chatId: routeChatId } = useParams<{ listingId?: string; chatId?: string }>();
  const navigate = useNavigate();
  const { user, listings } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [listing, setListing] = useState<any>(null);
  const [chatId, setChatId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ id: string; nickname: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Загрузка прямого чата по ID
  const loadDirectChat = async (chatIdParam: string) => {
    try {
      console.log('🔍 Загрузка прямого чата:', chatIdParam);
      
      // Подключаем Socket.IO если еще не подключен
      if (!socket) {
        socket = io(API_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10
        });
        
        socket.on('connect', () => {
          console.log('✅ Socket.IO подключен:', socket?.id);
          setConnectionStatus('connected');
        });
        
        socket.on('disconnect', () => {
          console.log('⚠️ Socket.IO отключен');
          setConnectionStatus('disconnected');
        });
        
        socket.on('reconnecting', () => {
          console.log('🔄 Переподключение Socket.IO...');
          setConnectionStatus('connecting');
        });
      }
      
      // Загружаем чат с сервера
      const response = await chatsAPI.getById(chatIdParam);
      const chat = response.data;
      
      console.log('✅ Чат загружен:', chat._id);
      
      const myId = user!.telegramId || user!.id;
      const otherUserId = chat.participant1 === myId ? chat.participant2 : chat.participant1;
      const otherUserInfo = chat.participantsInfo?.[otherUserId];
      
      console.log('👥 Идентификация участников:', {
        myId,
        participant1: chat.participant1,
        participant2: chat.participant2,
        otherUserId,
        otherUserInfo
      });
      
      setOtherUser({
        id: otherUserId,
        nickname: otherUserInfo?.nickname || 'Собеседник'
      });
      
      setChatId(chat._id);
      setMessages(chat.messages || []);
      setLoading(false);
      
      // Присоединяемся к комнате чата
      socket?.emit('join-chat', chat._id);
      
      // Слушаем события
      setupSocketListeners(chat._id, myId);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки чата:', error);
      alert('Не удалось загрузить чат');
      navigate('/chats');
    }
  };

  // Настройка слушателей Socket.IO
  const setupSocketListeners = (chatIdParam: string, myId: string) => {
    // Слушаем индикатор "печатает..."
    socket?.on('user-typing', (data: { userId: string; chatId: string }) => {
      if (data.chatId === chatIdParam && data.userId !== myId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket?.on('user-stopped-typing', (data: { userId: string; chatId: string }) => {
      if (data.chatId === chatIdParam && data.userId !== myId) {
        setIsTyping(false);
      }
    });

    // Слушаем новые сообщения
    socket?.on('new-message', (message: Message) => {
      console.log('📨 Получено новое сообщение через Socket.IO:', {
        senderId: message.senderId,
        text: message.text?.substring(0, 30),
        myId
      });
      
      const myUserId = user!.telegramId || user!.id;
      
      setMessages(prev => {
        const exists = prev.some(m => 
          (m._id && m._id === message._id) || 
          (m.id === message.id && m.timestamp === message.timestamp)
        );
        
        if (exists) {
          console.log('⚠️ Сообщение уже существует, пропускаем');
          return prev;
        }
        
        if (message.senderId === myUserId) {
          console.log('⚠️ Это наше сообщение, пропускаем');
          return prev;
        }
        
        console.log('✅ Добавляем новое сообщение');
        return [...prev, message];
      });
    });

    // Персональные уведомления
    console.log('🔊 Подписываемся на персональные уведомления:', `message-to-${myId}`);
    socket?.on(`message-to-${myId}`, (data: { chatId: string; message: Message }) => {
      console.log('📨 Получено персональное уведомление:', {
        chatId: data.chatId,
        senderId: data.message.senderId,
        text: data.message.text?.substring(0, 30),
        expectedListener: `message-to-${myId}`
      });
      
      if (data.chatId !== chatIdParam) {
        console.log('⚠️ Сообщение не для этого чата');
        return;
      }
      
      setMessages(prev => {
        const exists = prev.some(m => 
          (m._id && m._id === data.message._id) || 
          (m.id === data.message.id && m.timestamp === data.message.timestamp)
        );
        
        if (exists) {
          console.log('⚠️ Сообщение уже существует, пропускаем');
          return prev;
        }
        
        console.log('✅ Добавляем персональное сообщение');
        return [...prev, data.message];
      });
    });
  };

  // Инициализация Socket.IO и загрузка чата
  useEffect(() => {
    // Режим 1: Прямой чат по ID (из списка чатов)
    if (routeChatId && user) {
      loadDirectChat(routeChatId);
      return;
    }
    
    // Режим 2: Чат по объявлению (создаем/находим чат)
    if (!listingId || !user) return;

    // Загружаем объявление с сервера
    const loadListing = async () => {
      try {
        console.log('🔍 Поиск объявления с ID:', listingId);
        
        // Сначала пробуем найти в локальном store (проверяем все возможные ID)
        let foundListing = listings.find((l: any) => 
          l.id === listingId || 
          l._id === listingId || 
          l.id?.toString() === listingId || 
          l._id?.toString() === listingId
        );
        
        if (foundListing) {
          console.log('✅ Объявление найдено в локальном store:', foundListing.title);
        }
        
        // Если нет - пробуем загрузить с сервера
        if (!foundListing) {
          console.log('📥 Загружаем объявление с сервера:', listingId);
          try {
            const response = await listingsAPI.getById(listingId);
            foundListing = response.data;
            
            if (foundListing) {
              console.log('✅ Объявление загружено с сервера:', foundListing.title);
              
              // Добавляем в локальный store для будущего использования
              const { addListing } = useStore.getState();
              const existsInStore = listings.some((l: any) => 
                l.id === foundListing!.id || l._id === foundListing!._id
              );
              if (!existsInStore) {
                addListing(foundListing);
                console.log('📝 Объявление добавлено в локальный store');
              }
            }
          } catch (serverError: any) {
            console.log('⚠️ Ошибка загрузки с сервера:', serverError.message);
            console.log('⚠️ Проверяем localStorage как последний вариант');
            
            // Fallback: проверяем localStorage
            const localListings = localStorage.getItem('listings');
            if (localListings) {
              const parsedListings = JSON.parse(localListings);
              foundListing = parsedListings.find((l: any) => 
                l.id === listingId || 
                l._id === listingId ||
                l.id?.toString() === listingId || 
                l._id?.toString() === listingId
              );
              if (foundListing) {
                console.log('✅ Объявление найдено в localStorage');
              }
            }
          }
        }

        if (!foundListing) {
          console.error('❌ Объявление не найдено нигде. ID:', listingId);
          console.log('📋 Доступные объявления:', listings.map((l: any) => ({
            id: l.id,
            _id: l._id,
            title: l.title
          })));
          alert('Объявление не найдено. Попробуйте перезагрузить каталог.');
          navigate('/catalog');
          return null;
        }

        setListing(foundListing);
        return foundListing;
      } catch (error) {
        console.error('❌ Критическая ошибка загрузки объявления:', error);
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
          setConnectionStatus('connected');
        });
        
        socket.on('disconnect', () => {
          console.log('⚠️ Socket.IO отключен');
          setConnectionStatus('disconnected');
        });
        
        socket.on('reconnecting', () => {
          console.log('🔄 Переподключение Socket.IO...');
          setConnectionStatus('connecting');
        });
      }

      try {
        const isSeller = foundListing.userId === user.id || foundListing.userId === user.telegramId;
        const sellerId = foundListing.userId;
        const buyerId = user.telegramId || user.id;
        
        if (!buyerId) {
          alert('Ошибка: не удалось определить ID пользователя');
          navigate(-1);
          return;
        }

        // Проверяем что пользователь не пытается написать сам себе
        if (isSeller || sellerId === buyerId) {
          alert('Это ваше объявление. Вы не можете написать сообщение сами себе.');
          navigate(-1);
          return;
        }

        console.log('👥 Инициализация чата:', {
          isSeller,
          sellerId,
          buyerId,
          sellerNickname: foundListing.userNickname,
          buyerNickname: user.nickname
        });

        // Определяем собеседника
        if (isSeller) {
          // Я продавец, собеседник - покупатель (тот кто первым написал)
          setOtherUser({ id: buyerId, nickname: user.nickname }); // Временно, обновим после получения чата
        } else {
          // Я покупатель, собеседник - продавец
          setOtherUser({ id: sellerId, nickname: foundListing.userNickname });
        }

        try {
          // НОВАЯ ЛОГИКА: используем findOrCreate для получения/создания чата между двумя пользователями
          const response = await chatsAPI.findOrCreate({
            buyerId,
            sellerId,
            listingId,
            buyerNickname: user.nickname,
            sellerNickname: foundListing.userNickname
          });
          
          const chat = response.data;
          console.log('✅ Чат получен/создан:', chat._id, 'Сообщений:', chat.messages?.length || 0);

          // Определяем собеседника из чата
          const myId = user.telegramId || user.id;
          const otherUserId = chat.participant1 === myId ? chat.participant2 : chat.participant1;
          
          console.log('👥 Идентификация участников:', {
            myId,
            myTelegramId: user.telegramId,
            myUserId: user.id,
            participant1: chat.participant1,
            participant2: chat.participant2,
            otherUserId,
            socketListener: `message-to-${myId}`
          });
          
          // Получаем информацию о собеседнике из participantsInfo
          const participantsInfo = chat.participantsInfo || new Map();
          const otherUserInfo = participantsInfo[otherUserId] || participantsInfo.get?.(otherUserId);
          
          if (otherUserInfo) {
            setOtherUser({ 
              id: otherUserId, 
              nickname: otherUserInfo.nickname || (isSeller ? 'Покупатель' : foundListing.userNickname)
            });
          } else {
            setOtherUser({ 
              id: otherUserId, 
              nickname: isSeller ? 'Покупатель' : foundListing.userNickname
            });
          }

          setChatId(chat._id);
          setMessages(chat.messages || []);

          // Присоединяемся к комнате чата
          socket?.emit('join-chat', chat._id);

          // Настраиваем слушатели Socket.IO
          setupSocketListeners(chat._id, myId);

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

  // Отправка индикатора печати
  const handleTyping = () => {
    if (!socket || !chatId || !user) return;
    
    // Отправляем событие "начал печатать"
    socket.emit('typing', {
      chatId,
      userId: user.telegramId || user.id
    });
    
    // Сбрасываем предыдущий таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Через 2 секунды отправляем "перестал печатать"
    typingTimeoutRef.current = window.setTimeout(() => {
      socket?.emit('stop-typing', {
        chatId,
        userId: user.telegramId || user.id
      });
    }, 2000);
  };

  // Отправка сообщения
  const handleSend = async () => {
    if (!messageText.trim() || !user || !chatId) {
      console.log('⚠️ Нельзя отправить:', { messageText: !!messageText.trim(), user: !!user, chatId });
      return;
    }

    const userId = user.telegramId || user.id;
    const messageData = {
      senderId: userId,
      text: messageText.trim(),
      timestamp: Date.now()
    };

    console.log('📤 Отправка сообщения:', {
      chatId,
      senderId: userId,
      text: messageText.trim().substring(0, 50) + '...'
    });

    try {
      // Добавляем сообщение локально сразу (оптимистичное обновление)
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        ...messageData
      };
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageText('');

      // Тактильная обратная связь
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      // Отправляем на сервер
      try {
        console.log('🌐 Отправка на сервер...');
        const response = await chatsAPI.sendMessage(chatId, messageData);
        console.log('✅ Ответ от сервера:', {
          chatId: response.data._id,
          messagesCount: response.data.messages?.length,
          participants: response.data.participants
        });
        
        // Обновляем сообщения с сервера (чтобы получить правильные _id)
        if (response.data.messages) {
          console.log(`🔄 Обновляю сообщения с сервера (${response.data.messages.length} штук)`);
          setMessages(response.data.messages);
        }
        
        // Socket.IO отправку делает backend через global.io.emit
        // Поэтому здесь ничего не делаем - сообщение уже разослано сервером
        console.log('✅ Сообщение отправлено. Backend автоматически разошлет через Socket.IO');
      } catch (serverError) {
        console.error('⚠️ Ошибка отправки на сервер:', serverError);
        // Сохраняем в localStorage
        const localChatKey = `chat_${listingId}_${user.id}`;
        const localChat = localStorage.getItem(localChatKey);
        const chat = localChat ? JSON.parse(localChat) : { messages: [] };
        chat.messages.push(messageData);
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--tg-theme-bg-color, #fff)'
    }}>
      {/* Шапка с информацией о собеседнике */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--tg-theme-hint-color, #e5e7eb)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
      }}>
        {/* Кнопка назад */}
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ←
        </button>

        {/* Информация о собеседнике */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'white' }}>
              {otherUser?.nickname || 'Собеседник'}
            </span>
            {/* Индикатор статуса подключения */}
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionStatus === 'connected' ? '#10b981' : 
                         connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444',
              boxShadow: connectionStatus === 'connected' ? '0 0 8px #10b981' : 'none'
            }} />
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.8)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            💬 {listing.title}
          </div>
        </div>

        {/* Аватар с кликом на профиль */}
        <div
          onClick={() => {
            if (otherUser?.id) {
              navigate(`/user/${otherUser.id}`);
            }
          }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          👤
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
            const myUserId = user?.telegramId || user?.id;
            const isMyMessage = msg.senderId === myUserId;
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
        
        {/* Индикатор "печатает..." */}
        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginTop: '12px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)',
              color: 'var(--tg-theme-hint-color, #9ca3af)',
              fontSize: '14px'
            }}>
              <span className="typing-dots">печатает</span>
              <span className="dot-1">.</span>
              <span className="dot-2">.</span>
              <span className="dot-3">.</span>
            </div>
          </div>
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
          onChange={(e) => {
            setMessageText(e.target.value);
            handleTyping();
          }}
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

      {/* CSS для анимации точек */}
      <style>{`
        @keyframes blink {
          0%, 20% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 0; }
        }
        .dot-1 { animation: blink 1.4s infinite; animation-delay: 0s; }
        .dot-2 { animation: blink 1.4s infinite; animation-delay: 0.2s; }
        .dot-3 { animation: blink 1.4s infinite; animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

