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
});

mongoose.model('Offer', OfferSchema);
