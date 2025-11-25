const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Listing = require('../models/Listing');

// Получить все чаты пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📋 Получение всех чатов для пользователя:', userId);
    
    // Ищем все чаты где пользователь - participant1 ИЛИ participant2
    const chats = await Chat.find({
      $or: [
        { participant1: userId },
        { participant2: userId }
      ]
    }).sort({ updatedAt: -1 });
    
    console.log(`✅ Найдено ${chats.length} чатов для пользователя ${userId}`);
    res.json(chats);
  } catch (error) {
    console.error('❌ Ошибка получения чатов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// НОВЫЙ ЭНДПОИНТ: Найти или создать чат между двумя пользователями
router.post('/find-or-create', async (req, res) => {
  try {
    const { buyerId, sellerId, listingId, buyerNickname, sellerNickname } = req.body;
    
    console.log('🔍 Поиск/создание чата между:', {
      buyerId,
      sellerId,
      listingId,
      buyerNickname,
      sellerNickname
    });

    // Проверяем что пользователи разные
    if (buyerId === sellerId) {
      return res.status(400).json({ message: 'Нельзя создать чат с самим собой' });
    }

    // Сортируем ID чтобы всегда был единый порядок (меньший - participant1, больший - participant2)
    const [participant1, participant2] = [buyerId, sellerId].sort();
    
    console.log('📌 Отсортированные участники:', { participant1, participant2 });

    // Ищем существующий чат
    let chat = await Chat.findOne({
      participant1,
      participant2
    });

    if (chat) {
      console.log(`✅ Чат уже существует: ${chat._id}, сообщений: ${chat.messages.length}`);
      return res.json(chat);
    }

    // Создаём новый чат
    console.log('🆕 Создаём новый чат...');
    
    // Получаем информацию об объявлении
    const listing = await Listing.findById(listingId);
    
    const participantsInfo = new Map();
    participantsInfo.set(buyerId, {
      nickname: buyerNickname,
      language: 'ru',
      contactsShared: false,
      contacts: {}
    });
    participantsInfo.set(sellerId, {
      nickname: sellerNickname,
      language: 'ru',
      contactsShared: false,
      contacts: {}
    });

    chat = new Chat({
      participant1,
      participant2,
      participantsInfo,
      initialListingId: listingId,
      messages: [{
        senderId: 'system',
        text: `Чат начат по объявлению: ${listing ? listing.title : 'Объявление'}`,
        isSystemMessage: true,
        createdAt: new Date()
      }]
    });

    await chat.save();
    console.log(`✅ Чат создан: ${chat._id}`);
    
    res.status(201).json(chat);
  } catch (error) {
    console.error('❌ Ошибка создания чата:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить конкретный чат
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Получение чата по ID:', req.params.id);
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      console.log('❌ Чат не найден:', req.params.id);
      return res.status(404).json({ message: 'Чат не найден' });
    }
    console.log(`✅ Чат найден: ${chat._id}, сообщений: ${chat.messages.length}, участников: ${chat.participants.length}`);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// УСТАРЕВШИЙ МЕТОД - оставлен для обратной совместимости
router.post('/', async (req, res) => {
  try {
    console.log('⚠️ ПРЕДУПРЕЖДЕНИЕ: Используется устаревший метод создания чата. Используйте /find-or-create');
    
    const { listingId, participants } = req.body;
    
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ message: 'Требуется ровно 2 участника' });
    }

    // Перенаправляем на новый метод
    const buyerId = participants[0].userId;
    const sellerId = participants[1].userId;
    const buyerNickname = participants[0].nickname;
    const sellerNickname = participants[1].nickname;

    return res.redirect(307, `/api/chats/find-or-create?buyerId=${buyerId}&sellerId=${sellerId}&listingId=${listingId}&buyerNickname=${buyerNickname}&sellerNickname=${sellerNickname}`);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Отправить сообщение
router.post('/:id/messages', async (req, res) => {
  try {
    const { senderId, text } = req.body;
    
    console.log('📨 Получен запрос на отправку сообщения:', {
      chatId: req.params.id,
      senderId,
      text: text?.substring(0, 50) + '...'
    });

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      console.log('❌ Чат не найден:', req.params.id);
      return res.status(404).json({ message: 'Чат не найден' });
    }

    // Проверяем что отправитель - участник чата (приводим к строке для сравнения)
    const senderIdStr = String(senderId);
    const participant1Str = String(chat.participant1);
    const participant2Str = String(chat.participant2);
    
    console.log('🔍 Проверка участника чата:', {
      senderId: senderIdStr,
      participant1: participant1Str,
      participant2: participant2Str,
      isParticipant1: senderIdStr === participant1Str,
      isParticipant2: senderIdStr === participant2Str
    });
    
    if (senderIdStr !== participant1Str && senderIdStr !== participant2Str) {
      console.log('❌ Пользователь не является участником чата:', senderIdStr);
      return res.status(403).json({ message: 'Вы не являетесь участником этого чата' });
    }

    console.log('✅ Чат найден, добавляю сообщение. Участники:', {
      participant1: chat.participant1,
      participant2: chat.participant2
    });
    
    const newMessage = {
      senderId,
      text,
      isSystemMessage: false,
      createdAt: new Date()
    };
    
    chat.messages.push(newMessage);
    chat.updatedAt = new Date();
    await chat.save();
    
    console.log(`✅ Сообщение сохранено. Всего сообщений в чате: ${chat.messages.length}`);
    
    // Эмитим событие через Socket.IO в комнату чата
    if (global.io) {
      const messageToSend = {
        ...newMessage,
        _id: chat.messages[chat.messages.length - 1]._id // Добавляем _id из MongoDB
      };
      
      // Определяем получателя (приводим к строке)
      const senderIdStr = String(senderId);
      const participant1Str = String(chat.participant1);
      const participant2Str = String(chat.participant2);
      const recipientId = senderIdStr === participant1Str ? participant2Str : participant1Str;
      
      console.log('📡 Подготовка к отправке сообщения:', {
        senderId: senderIdStr,
        recipientId,
        participant1: participant1Str,
        participant2: participant2Str,
        chatRoom: chat._id.toString(),
        personalEvent: `message-to-${recipientId}`
      });
      
      // Отправляем в комнату чата (всем кто в ней)
      global.io.to(chat._id.toString()).emit('new-message', messageToSend);
      console.log('📡 Событие new-message отправлено в комнату:', chat._id.toString());
      
      // Также отправляем персонально получателю (на случай если он не в комнате)
      global.io.emit(`message-to-${recipientId}`, {
        chatId: chat._id,
        message: messageToSend
      });
      console.log('📡 Персональное уведомление отправлено получателю:', recipientId, `(событие: message-to-${recipientId})`);
    } else {
      console.log('⚠️ global.io не определён - Socket.IO недоступен');
    }
    
    res.status(201).json(chat);
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Поделиться контактами
router.post('/:id/share-contacts', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Чат не найден' });
    }

    const participant = chat.participants.find(
      p => p.userId.toString() === req.body.userId
    );

    if (participant) {
      participant.contactsShared = true;
      participant.contacts = req.body.contacts;
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
