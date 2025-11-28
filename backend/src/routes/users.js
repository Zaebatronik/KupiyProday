const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyTelegramAuth, requireAdmin, requireRegistered, checkNotBanned } = require('../middleware/auth');

// Получить всех пользователей (для админа)
router.get('/', verifyTelegramAuth, requireAdmin, async (req, res) => {
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
    
    // Проверка уникальности никнейма (для всех случаев)
    if (user && user.nickname !== nickname) {
      // Если пользователь меняет никнейм, проверяем уникальность
      const existingNickname = await User.findOne({ nickname });
      if (existingNickname && existingNickname.telegramId !== id) {
        console.log('❌ Никнейм уже занят другим пользователем');
        return res.status(400).json({ message: 'Никнейм уже занят' });
      }
    } else if (!user) {
      // Для новых пользователей также проверяем
      const existingNickname = await User.findOne({ nickname });
      if (existingNickname) {
        console.log('❌ Никнейм уже занят');
        return res.status(400).json({ message: 'Никнейм уже занят' });
      }
    }
    
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

// Получение пользователя по Telegram ID (для проверки существования)
router.get('/telegram/:telegramId', verifyTelegramAuth, requireRegistered, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение профиля по Telegram ID или MongoDB ID
router.get('/:id', verifyTelegramAuth, requireRegistered, async (req, res) => {
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
router.put('/:id', verifyTelegramAuth, requireRegistered, async (req, res) => {
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

// Удаление пользователя (только админ) - ПОЛНОЕ УДАЛЕНИЕ ВСЕХ ДАННЫХ
router.delete('/:id', verifyTelegramAuth, requireAdmin, async (req, res) => {
  try {
    const Listing = require('../models/Listing');
    const Chat = require('../models/Chat');
    
    let user;
    let userId = req.params.id;
    
    // Пробуем удалить по Telegram ID
    user = await User.findOne({ telegramId: userId });
    
    // Если не нашли, пробуем по MongoDB ID
    if (!user && userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
      if (user) {
        userId = user.telegramId; // Получаем Telegram ID для удаления связанных данных
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    console.log(`🗑️ Админ удаляет пользователя: ${user.nickname} (${userId})`);
    
    // Удаляем все объявления пользователя
    const deletedListings = await Listing.deleteMany({ userId: userId });
    console.log(`  ✅ Удалено объявлений: ${deletedListings.deletedCount}`);
    
    // Удаляем все чаты где пользователь участник
    const deletedChats = await Chat.deleteMany({
      $or: [
        { participant1: userId },
        { participant2: userId }
      ]
    });
    console.log(`  ✅ Удалено чатов: ${deletedChats.deletedCount}`);
    
    // Удаляем самого пользователя
    await User.findOneAndDelete({ telegramId: userId });
    console.log(`  ✅ Пользователь удалён из базы`);
    
    res.json({ 
      message: 'Пользователь и все его данные удалены',
      deleted: {
        user: 1,
        listings: deletedListings.deletedCount,
        chats: deletedChats.deletedCount
      }
    });
  } catch (error) {
    console.error('❌ Ошибка удаления пользователя:', error);
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

// 🚨 УДАЛИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (только админ)
router.delete('/admin/delete-all-users', verifyTelegramAuth, requireAdmin, async (req, res) => {
  try {
    console.log('🚨 ВНИМАНИЕ: Админ запросил удаление ВСЕХ пользователей!');
    
    const count = await User.countDocuments();
    console.log(`📊 Пользователей в базе: ${count}`);
    
    if (count === 0) {
      return res.json({ message: 'База уже пуста', deletedCount: 0 });
    }
    
    const result = await User.deleteMany({});
    console.log(`✅ Удалено пользователей: ${result.deletedCount}`);
    
    // Отправляем Socket.IO событие всем клиентам
    if (req.app.get('io')) {
      req.app.get('io').emit('database-reset', { message: 'База пользователей очищена' });
    }
    
    res.json({ 
      message: 'Все пользователи удалены', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('❌ Ошибка удаления всех пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
