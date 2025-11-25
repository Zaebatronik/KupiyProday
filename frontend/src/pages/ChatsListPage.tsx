import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { chatsAPI } from '../services/api';
import '../styles/ChatsListPage.css';

interface Chat {
  _id: string;
  participant1: string;
  participant2: string;
  participantsInfo: {
    [key: string]: {
      nickname: string;
      language?: string;
    };
  };
  initialListingId?: string;
  messages: Array<{
    senderId: string;
    text: string;
    timestamp?: number;
    createdAt?: string;
  }>;
  updatedAt: string;
}

export default function ChatsListPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadChats();
  }, [user, navigate]);

  const loadChats = async () => {
    try {
      setLoading(true);
      
      // Пробуем загрузить с сервера
      try {
        const userId = user!.telegramId || user!.id;
        const response = await chatsAPI.getByUser(userId);
        setChats(response.data || []);
        console.log('✅ Чаты загружены с сервера:', response.data);
      } catch (serverError) {
        console.log('⚠️ Сервер недоступен, чаты недоступны');
        setChats([]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const myId = user?.telegramId || user?.id;
    const otherUserId = chat.participant1 === myId ? chat.participant2 : chat.participant1;
    const otherUserInfo = chat.participantsInfo?.[otherUserId];
    return otherUserInfo ? { userId: otherUserId, nickname: otherUserInfo.nickname } : null;
  };

  const getLastMessage = (chat: Chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'Нет сообщений';
    }
    const lastMsg = chat.messages[chat.messages.length - 1];
    return lastMsg.text;
  };

  const getUnreadCount = (chat: Chat) => {
    // Простая логика: считаем сообщения не от текущего пользователя
    const myId = user?.telegramId || user?.id;
    return chat.messages?.filter(m => m.senderId !== myId).length || 0;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="chats-list-page">
        <div className="loading">Загрузка чатов...</div>
      </div>
    );
  }

  // Фильтруем чаты - только с сообщениями и с другими участниками
  const activeChats = chats.filter(chat => {
    if (!chat.messages || chat.messages.length === 0) return false;
    const otherUser = getOtherParticipant(chat);
    return otherUser !== undefined;
  });

  return (
    <div className="chats-list-page">
      <div className="header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Назад
        </button>
        <h1>💬 Мои сообщения</h1>
      </div>

      {activeChats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>У вас пока нет сообщений</p>
          <button onClick={() => navigate('/catalog')} className="browse-button">
            Смотреть объявления
          </button>
        </div>
      ) : (
        <div className="chats-list">
          {activeChats.map(chat => {
            const otherUser = getOtherParticipant(chat);
            const lastMessage = getLastMessage(chat);
            const unreadCount = getUnreadCount(chat);
            
            return (
              <div
                key={chat._id}
                className="chat-item"
                onClick={() => navigate(`/direct-chat/${chat._id}`)}
              >
                <div className="chat-avatar">
                  {otherUser?.nickname?.[0]?.toUpperCase() || '?'}
                </div>
                
                <div className="chat-content">
                  <div className="chat-header">
                    <span className="chat-name">
                      {otherUser?.nickname || 'Пользователь'}
                    </span>
                    <span className="chat-time">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="chat-preview">
                    <span className="last-message">{lastMessage}</span>
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
