const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const listingSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    default: () => nanoid(10),
    unique: true,
    index: true,
  },
  userId: {
    type: String, // Изменили на String для поддержки Telegram ID
    required: true,
    index: true,
  },
  userNickname: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: 'text', // Для текстового поиска
  },
  description: {
    type: String,
    required: true,
    index: 'text', // Для текстового поиска
  },
  price: {
    type: Number,
    default: null,
  },
  negotiable: {
    type: Boolean,
    default: false,
  },
  city: {
    type: String,
    required: true,
    index: true,
  },
  country: {
    type: String,
    required: true,
    index: true,
  },
  photos: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'rejected', 'deleted'],
    default: 'active',
    index: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Для сортировки по дате
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Составной индекс для быстрого поиска активных объявлений
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ userId: 1, status: 1 });
listingSchema.index({ city: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
