const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const Offer = mongoose.model('Offer');

const router = express.Router();

router.get('/api/offers', gatekeeper, async (req, res) => {
  const userId = req.user._id;
  try {
    const query = Offer.find();
    query.where(ad.creator._id == userId);
    query.exec((err, doc) => {
      if (err) {
        console.log(err);
        return res.status(422).send(err);
      }
      return res.status(200).send('success');
    });
  } catch (err) {
    console.log(err);
    return res.status(422).send(err);
  }
});

router.post('/api/offers/accept', gatekeeper, async (req, res) => {
  const { offerId } = req.body;
  try {
    Offer.update({ _id: offerId }, { accepted: true }, (err, doc) => {
      if (err) {
        console.log(err);
        return res.status(422).send(err);
      }
      return res.status(200).send('OK');
    });
  } catch (err) {
    return res.status(422).send(err);
  }
});

router.post('/api/offers/new', gatekeeper, async (req, res) => {
  const { adId, userId, amount } = req.body;
  const offer = new Offer({
    ad: adId,
    fromUser: userId,
    amountOffered: amount,
  });
  try {
    offer.save({}, (err, _) => {
      if (!err) {
        Ad.updateOne(
          { _id: adId },
          {
            $push: {
              offers: offer,
            },
          },
          (err, _) => {
            if (err) {
              console.log(err);
              return res.status(422).send(err);
            } else {
              return res.status(200).send('OK');
            }
          }
        );
      } else {
        return res.status(422).send(err);
      }
    });
  } catch (err) {
    res.status(422).send(err);
  }
});

module.exports = router;
