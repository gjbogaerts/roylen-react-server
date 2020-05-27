const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  ad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  amountOffered: {
    type: Number,
    min: 0,
  },
  accepted: {
    type: Boolean,
    default: false,
  },
  closed: {
    type: Boolean,
    default: false,
  },
});

mongoose.model('Offer', OfferSchema);
