const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const listingSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    default: () => nanoid(10),
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userNickname: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
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
  },
  country: {
    type: String,
    required: true,
  },
  photos: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'rejected', 'deleted'],
    default: 'active',
  },
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

listingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Listing', listingSchema);
