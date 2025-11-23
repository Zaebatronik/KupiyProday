const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['new_message', 'new_response', 'listing_sold', 'listing_approved', 'listing_rejected'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: String, // ID чата, объявления и т.д.
  },
  relatedType: {
    type: String,
    enum: ['chat', 'listing', 'user']
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска непрочитанных уведомлений
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
