const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const AdSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: () => Date.now() + 31 * 24 * 3600 * 1000,
  },
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    maxlength: 5200,
  },
  virtualPrice: {
    type: Number,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isForbidden: {
    type: Boolean,
    default: false,
  },
  warnings: {
    type: Number,
    default: 0,
  },
  isValidated: {
    type: Boolean,
    default: false,
  },
  pics: {
    type: [String],
  },
  offers: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Offer',
    },
  ],
  mainCategory: {
    type: String,
  },
  subCategory: {
    type: String,
  },
  subSubCategory: {
    type: String,
  },
  ageCategory: {
    type: String,
    default: '0-16',
    enum: ['0-1', '2-4', '5-6', '7-10', '10-12', '12-16', '0-16'],
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  location: {
    type: pointSchema,
  },
});

AdSchema.index(
  {
    title: 'text',
    description: 'text',
    mainCategory: 'text',
    subCategory: 'text',
    subSubCategory: 'text',
  },
  {
    name: 'searchIndex',
    weights: { title: 10, description: 5, subSubCategory: 5 },
  }
);

mongoose.model('Ad', AdSchema);
