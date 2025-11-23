const mongoose = require('mongoose');

// Генератор уникального ID в формате nickname_XXXXX
function generateListingId(userNickname) {
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-значное число
  return `${userNickname}_${randomDigits}`;
}

const listingSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
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
    required: false,
    default: 'Не указан',
    index: true,
  },
  photos: {
    type: [String], // Массив URL или base64 строк
    default: [],
  },
  country: {
    type: String,
    required: false,
    default: 'Не указана',
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

// Pre-save хук для генерации serialNumber
listingSchema.pre('save', function(next) {
  if (!this.serialNumber) {
    let attempts = 0;
    const maxAttempts = 10;
    
    const generateUniqueId = async () => {
      const id = generateListingId(this.userNickname);
      const existing = await mongoose.model('Listing').findOne({ serialNumber: id });
      
      if (!existing) {
        this.serialNumber = id;
        next();
      } else if (attempts < maxAttempts) {
        attempts++;
        generateUniqueId();
      } else {
        // Fallback: добавляем timestamp если не получилось за 10 попыток
        this.serialNumber = `${this.userNickname}_${Date.now()}`;
        next();
      }
    };
    
    generateUniqueId();
  } else {
    next();
  }
});

// Составной индекс для быстрого поиска активных объявлений
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ userId: 1, status: 1 });
listingSchema.index({ city: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
