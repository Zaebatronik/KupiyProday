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
    const { category, city, minPrice, maxPrice, search } = req.query;
    let query = { status: 'active' };

    if (category && category !== 'all') query.category = category;
    if (city) query.city = city;
    if (minPrice) query.price = { $gte: parseInt(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseInt(maxPrice) };
    if (search) query.title = { $regex: search, $options: 'i' };

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
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
    const listings = await Listing.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Создать объявление
router.post('/', upload.array('photos', 5), async (req, res) => {
  try {
    const photos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    const listing = new Listing({
      ...req.body,
      photos,
    });

    await listing.save();
    res.status(201).json(listing);
  } catch (error) {
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
