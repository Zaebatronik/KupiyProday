const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// Получить все чаты пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.userId': req.params.userId,
    }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить конкретный чат
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Чат не найден' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Создать чат
router.post('/', async (req, res) => {
  try {
    const { listingId, participants } = req.body;
    
    // Проверка, существует ли уже чат
    const existingChat = await Chat.findOne({
      listingId,
      'participants.userId': { $all: participants.map(p => p.userId) },
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = new Chat({
      listingId,
      participants,
      messages: [],
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Отправить сообщение
router.post('/:id/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Чат не найден' });
    }

    chat.messages.push(req.body);
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
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
