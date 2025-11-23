const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  radius: {
    type: Number,
    default: 0,
  },
  language: {
    type: String,
    default: 'ru',
  },
  contacts: {
    telegram: String,
    phone: String,
    email: String,
  },
  telegramId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
