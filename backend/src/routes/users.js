const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Получить всех пользователей (для админа)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Регистрация пользователя
router.post('/register', async (req, res) => {
  try {
    const { id, nickname, telegramUsername, country, city, radius, language, contacts } = req.body;

    console.log('📝 Регистрация пользователя:', { 
      telegramId: id, 
      nickname, 
      telegramUsername,
      country, 
      city 
    });

    // Проверка существующего пользователя по Telegram ID
    let user = await User.findOne({ telegramId: id });
    
    if (user) {
      console.log('👤 Пользователь уже существует, обновляем данные');
      // Обновляем данные существующего пользователя
      user.nickname = nickname;
      user.telegramUsername = telegramUsername;
      user.country = country;
      user.city = city;
      user.radius = radius;
      user.language = language;
      user.contacts = contacts || {};
      await user.save();
      return res.json(user);
    }

    // Проверка уникальности никнейма
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({ message: 'Никнейм уже занят' });
    }

    // Создаём нового пользователя
    user = new User({
      telegramId: id,
      nickname,
      telegramUsername,
      country,
      city,
      radius,
      language,
      contacts: contacts || {},
    });

    await user.save();
    console.log('✅ Пользователь создан:', user._id, `(Telegram: ${id}, Nickname: ${nickname})`);
    res.status(201).json(user);
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Проверка доступности никнейма
router.get('/check-nickname/:nickname', async (req, res) => {
  try {
    const user = await User.findOne({ nickname: req.params.nickname });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение профиля по Telegram ID или MongoDB ID
router.get('/:id', async (req, res) => {
  try {
    let user;
    
    // Пробуем найти по Telegram ID
    user = await User.findOne({ telegramId: req.params.id });
    
    // Если не нашли, пробуем по MongoDB ID
    if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(req.params.id);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление профиля
router.put('/:id', async (req, res) => {
  try {
    let user;
    
    // Пробуем обновить по Telegram ID
    user = await User.findOneAndUpdate(
      { telegramId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    // Если не нашли, пробуем по MongoDB ID
    if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Удаление пользователя
router.delete('/:id', async (req, res) => {
  try {
    let user;
    
    // Пробуем удалить по Telegram ID
    user = await User.findOneAndDelete({ telegramId: req.params.id });
    
    // Если не нашли, пробуем по MongoDB ID
    if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findByIdAndDelete(req.params.id);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
