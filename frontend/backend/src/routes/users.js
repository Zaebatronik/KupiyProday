const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Регистрация пользователя
router.post('/register', async (req, res) => {
  try {
    const { nickname, country, city, radius, language, contacts } = req.body;

    // Проверка уникальности никнейма
    const existingUser = await User.findOne({ nickname });
    if (existingUser) {
      return res.status(400).json({ message: 'Никнейм уже занят' });
    }

    const user = new User({
      nickname,
      country,
      city,
      radius,
      language,
      contacts: contacts || {},
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
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

// Получение профиля
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
