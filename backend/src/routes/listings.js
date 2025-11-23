const express = require('express');
const router = express.Router();
const multer = require('multer');
const Listing = require('../models/Listing');
const path = require('path');

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
    const { category, city, minPrice, maxPrice, search, status } = req.query;
    let query = {};

    // Показываем только активные по умолчанию (если не указано иное)
    if (status) {
      query.status = status;
    } else {
      query.status = 'active';
    }

    if (category && category !== 'all') query.category = category;
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

    console.log('📋 Запрос объявлений:', query);
    const listings = await Listing.find(query).sort({ createdAt: -1 }).lean();
    console.log(`✅ Найдено объявлений: ${listings.length}`);
    
    res.json(listings);
  } catch (error) {
    console.error('❌ Ошибка получения объявлений:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получить объявление по ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    listing.views += 1;
    await listing.save();
    res.json(listing);
  } catch (error) {
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

// Создать объявление
router.post('/', upload.array('photos', 5), async (req, res) => {
  try {
    const photos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    console.log('📝 Создание объявления:', {
      userId: req.body.userId,
      title: req.body.title,
      photosCount: photos.length
    });
    
    const listing = new Listing({
      ...req.body,
      photos,
      status: 'active', // Автоматически активное
      views: 0,
    });

    await listing.save();
    console.log('✅ Объявление создано:', listing._id, listing.serialNumber);
    
    res.status(201).json(listing);
  } catch (error) {
    console.error('❌ Ошибка создания объявления:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновить объявление
router.put('/:id', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    res.json(listing);
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

// Удалить объявление
router.delete('/:id', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' },
      { new: true }
    );
    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    res.json({ message: 'Объявление удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
