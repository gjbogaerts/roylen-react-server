const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const AdSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: () => Date.now() + 31 * 24 * 3600 * 1000
  },
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50
  },
  adNature: {
    type: String,
    enum: ['wanted', 'offered'],
    default: 'offered'
  },
  description: {
    type: String,
    required: true,
    maxlength: 5200
  },
  virtualPrice: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isForbidden: {
    type: Boolean,
    default: false
  },
  warnings: {
    type: Number,
    default: 0
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  pics: {
    type: [String]
  },
  category: {
    type: String,
    required: true
  },
  location: {
    type: pointSchema
  }
});

AdSchema.index({ title: 'text', description: 'text' });

mongoose.model('Ad', AdSchema);
