const express = require('express');
const router = express.Router();
const multer = require('multer');
const Listing = require('../models/Listing');
const User = require('../models/User');
const path = require('path');
const { verifyTelegramAuth, requireAdmin, checkNotBanned, requireRegistered } = require('../middleware/auth');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Получить все объявления
router.get('/', async (req, res) => {
  try {
    const { category, city, country, minPrice, maxPrice, search, status } = req.query;
    let query = {};

    // Показываем только активные по умолчанию (если не указано иное)
    if (status) {
      query.status = status;
    } else {
      query.status = 'active';
    }

    if (category && category !== 'all') query.category = category;
    
    // Фильтрация по локации
    if (country) query.country = country;
    if (city) query.city = city;
    
    // Фильтр по цене
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    // Поиск по тексту
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📋 Запрос объявлений с фильтрами:', query);
    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .lean();
    console.log(`✅ Найдено объявлений: ${listings.length}`);
    
    // userNickname уже есть в модели Listing, просто возвращаем как есть
    res.json(listings);
  } catch (error) {
    console.error('❌ Ошибка получения объявлений:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить объявление по ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Поиск объявления по ID:', req.params.id);
    
    let listing;
    
    // Пытаемся найти по MongoDB _id
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      listing = await Listing.findById(req.params.id);
      console.log('📌 Поиск по MongoDB _id:', listing ? 'найдено' : 'не найдено');
    }
    
    // Если не найдено, ищем по serialNumber или другим полям
    if (!listing) {
      listing = await Listing.findOne({
        $or: [
          { serialNumber: req.params.id },
          { id: req.params.id }
        ]
      });
      console.log('📌 Поиск по serialNumber/id:', listing ? 'найдено' : 'не найдено');
    }
    
    if (!listing) {
      console.log('❌ Объявление не найдено:', req.params.id);
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    
    // Увеличиваем просмотры
    listing.views += 1;
    await listing.save();
    console.log('✅ Объявление найдено:', listing._id, listing.title);
    res.json(listing);
  } catch (error) {
    console.error('❌ Ошибка при поиске объявления:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить объявления пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('👤 Запрос объявлений пользователя:', req.params.userId);
    const listings = await Listing.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    console.log(`✅ Найдено объявлений пользователя: ${listings.length}`);
    res.json(listings);
  } catch (error) {
    console.error('❌ Ошибка получения объявлений пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить ВСЕ объявления (для админа) - включая скрытые
router.get('/admin/all', async (req, res) => {
  try {
    console.log('👑 Админ: запрос всех объявлений');
    const listings = await Listing.find({}).sort({ createdAt: -1 }).lean();
    console.log(`✅ Всего объявлений в базе: ${listings.length}`);
    res.json(listings);
  } catch (error) {
    console.error('❌ Ошибка получения всех объявлений:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Создать объявление (только авторизованные и не забаненные)
router.post('/', verifyTelegramAuth, requireRegistered, checkNotBanned, async (req, res) => {
  try {
    // userId берём из проверенного Telegram auth
    const userId = req.userId;
    const userNickname = req.user.nickname; // Из БД через checkNotBanned
    
    console.log('📝 Создание объявления:', {
      userId,
      userNickname,
      title: req.body.title,
      category: req.body.category,
      photosReceived: Array.isArray(req.body.photos) ? req.body.photos.length : 0
    });
    
    if (!req.body.title || !req.body.description) {
      return res.status(400).json({ 
        message: 'Заполните все поля',
        details: 'title и description обязательны'
      });
    }
    
    // Фото уже в base64 от фронтенда, сохраняем как есть
    const photos = req.body.photos || [];
    
    const newListing = new Listing({
      userId, // Из проверенного auth
      userNickname, // Из БД
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      negotiable: req.body.negotiable || false,
      city: req.body.city,
      country: req.body.country,
      photos,
      status: 'active',
      views: 0,
    });

    await newListing.save();
    console.log('✅ Объявление создано:', newListing._id, newListing.serialNumber);
    
    // Отправляем Socket.IO событие о новом объявлении
    if (req.app.get('io')) {
      req.app.get('io').emit('listing-created', newListing);
      console.log('📡 Socket.IO: Отправлено событие listing-created');
    }
    
    res.status(201).json(newListing);
  } catch (error) {
    console.error('❌ Ошибка создания объявления:', error);
    console.error('Полная ошибка:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      receivedData: {
        userId: req.body.userId,
        userNickname: req.body.userNickname,
        title: req.body.title,
        city: req.body.city,
        country: req.body.country,
      }
    });
    res.status(500).json({ 
      message: 'Ошибка при создании объявления', 
      error: error.message,
      details: error.name === 'ValidationError' ? 'Проверьте правильность заполнения всех полей' : 'Внутренняя ошибка сервера'
    });
  }
});

// Создать объявление с загрузкой файлов (альтернативный метод)
router.post('/upload', upload.array('photos', 5), async (req, res) => {
  try {
    const photos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    const listing = new Listing({
      ...req.body,
      photos,
      status: 'active',
      views: 0,
    });

    await listing.save();
    console.log('✅ Объявление создано через upload:', listing._id);
    
    res.status(201).json(listing);
  } catch (error) {
    console.error('❌ Ошибка создания объявления через upload:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновить объявление (только владелец)
router.put('/:id', verifyTelegramAuth, requireRegistered, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    
    // ✅ Проверяем что пользователь владелец объявления
    if (listing.userId !== req.userId) {
      return res.status(403).json({ message: 'Можно редактировать только свои объявления' });
    }
    
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    console.log(`✏️ Пользователь ${req.userId} обновил объявление ${req.params.id}`);
    res.json(updatedListing);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновить статус
router.patch('/:id/status', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Удалить объявление (только владелец)
router.delete('/:id', verifyTelegramAuth, requireRegistered, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    
    // ✅ Проверяем что пользователь владелец объявления
    if (listing.userId !== req.userId) {
      return res.status(403).json({ message: 'Можно удалять только свои объявления' });
    }
    
    const deletedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' },
      { new: true }
    );
    
    console.log(`🗑️ Пользователь ${req.userId} удалил объявление ${req.params.id}`);
    res.json({ message: 'Объявление удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить список уникальных стран
router.get('/locations/countries', async (req, res) => {
  try {
    const countries = await Listing.distinct('country', { status: 'active' });
    console.log('🌍 Список стран:', countries);
    res.json(countries.filter(c => c)); // Фильтруем пустые значения
  } catch (error) {
    console.error('❌ Ошибка получения стран:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить список уникальных городов для страны
router.get('/locations/cities', async (req, res) => {
  try {
    const { country } = req.query;
    const query = { status: 'active' };
    if (country) query.country = country;
    
    const cities = await Listing.distinct('city', query);
    console.log(`🏙️ Список городов ${country ? `в ${country}` : 'всех'}:`, cities);
    res.json(cities.filter(c => c)); // Фильтруем пустые значения
  } catch (error) {
    console.error('❌ Ошибка получения городов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
