const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String, // Изменено на String для поддержки "system" и Telegram ID
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  translatedText: {
    type: String,
    default: null
  },
  originalLanguage: {
    type: String,
    default: 'ru'
  },
  isSystemMessage: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  // НОВАЯ ЛОГИКА: Чат между двумя конкретными пользователями (не привязан к объявлению)
  participant1: {
    type: String, // Telegram ID первого пользователя
    required: true,
    index: true,
  },
  participant2: {
    type: String, // Telegram ID второго пользователя
    required: true,
    index: true,
  },
  // Храним информацию об участниках
  participantsInfo: {
    type: Map,
    of: {
      nickname: String,
      language: {
        type: String,
        default: 'ru'
      },
      contactsShared: {
        type: Boolean,
        default: false,
      },
      contacts: {
        telegram: String,
        phone: String,
        email: String,
      },
    }
  },
  // Опционально: можем хранить ссылку на объявление с которого начался чат (для истории)
  initialListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false,
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Индекс для быстрого поиска чата между двумя пользователями
chatSchema.index({ participant1: 1, participant2: 1 }, { unique: true });

chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chat', chatSchema);
