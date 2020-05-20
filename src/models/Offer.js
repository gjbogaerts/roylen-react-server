const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
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
