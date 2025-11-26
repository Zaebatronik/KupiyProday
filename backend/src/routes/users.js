const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyTelegramAuth, requireAdmin, checkNotBanned } = require('../middleware/auth');

// Получить всех пользователей (для админа)
router.get('/', async (req, res) => {
  try {
    console.log('👥 Запрос всех пользователей...');
    const users = await User.find().sort({ createdAt: -1 });
    console.log(`✅ Найдено пользователей в БД: ${users.length}`);
    
    if (users.length === 0) {
      console.warn('⚠️ База данных пуста! Нет зарегистрированных пользователей.');
    } else {
      console.log('📋 Список пользователей:');
      users.forEach((u, index) => {
        console.log(`  ${index + 1}. ${u.nickname} (Telegram ID: ${u.telegramId}, City: ${u.city})`);
      });
    }
    
    res.json(users);
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error);
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
    let isNewUser = false;
    
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
      
      // Отправляем Socket.IO событие об обновлении
      if (req.app.get('io')) {
        req.app.get('io').emit('user-updated', user);
        console.log('📡 Socket.IO: Отправлено событие user-updated');
      }
      
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
    isNewUser = true;
    
    console.log('✅ Пользователь создан в БД:', {
      _id: user._id,
      telegramId: user.telegramId,
      nickname: user.nickname,
      city: user.city
    });
    
    // Проверяем что пользователь действительно сохранился
    const savedUser = await User.findById(user._id);
    if (!savedUser) {
      console.error('❌ Пользователь не найден после сохранения!');
      return res.status(500).json({ message: 'Ошибка сохранения пользователя' });
    }
    
    console.log('✅ Подтверждение: пользователь найден в БД');
    
    // Отправляем Socket.IO событие о новом пользователе
    if (req.app.get('io')) {
      req.app.get('io').emit('user-registered', savedUser);
      console.log('📡 Socket.IO: Отправлено событие user-registered для всех подключенных клиентов');
    }
    
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

// Обновление профиля (только сам пользователь может редактировать свой профиль)
router.put('/:id', verifyTelegramAuth, async (req, res) => {
  try {
    // ✅ Проверяем что пользователь редактирует свой профиль
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Можно редактировать только свой профиль' });
    }
    
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

// Удаление пользователя (только админ)
router.delete('/:id', verifyTelegramAuth, requireAdmin, async (req, res) => {
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
    
    console.log(`🗑️ Админ удалил пользователя: ${user.nickname} (${user.telegramId})`);
    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Забанить пользователя (только админ)
router.post('/:id/ban', verifyTelegramAuth, requireAdmin, async (req, res) => {
  try {
    let user;
    
    // Пробуем найти по Telegram ID
    user = await User.findOneAndUpdate(
      { telegramId: req.params.id },
      { banned: true, bannedAt: new Date() },
      { new: true }
    );
    
    // Если не нашли, пробуем по MongoDB ID
    if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: true, bannedAt: new Date() },
        { new: true }
      );
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    console.log(`🚫 Админ забанил пользователя: ${user.nickname} (${user.telegramId})`);
    res.json(user);
  } catch (error) {
    console.error('❌ Ошибка бана:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Разбанить пользователя (только админ)
router.post('/:id/unban', verifyTelegramAuth, requireAdmin, async (req, res) => {
  try {
    let user;
    
    // Пробуем найти по Telegram ID
    user = await User.findOneAndUpdate(
      { telegramId: req.params.id },
      { banned: false, bannedAt: null },
      { new: true }
    );
    
    // Если не нашли, пробуем по MongoDB ID
    if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: false, bannedAt: null },
        { new: true }
      );
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    console.log(`✅ Админ разбанил пользователя: ${user.nickname} (${user.telegramId})`);
    res.json(user);
  } catch (error) {
    console.error('❌ Ошибка разбана:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
