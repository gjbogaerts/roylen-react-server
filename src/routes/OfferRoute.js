const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const Offer = mongoose.model('Offer');
const User = mongoose.model('User');
const sgMail = require('@sendgrid/mail');
const mails = require('../env/mail_list');

const router = express.Router();

router.post('/api/offers/finalizetransaction', gatekeeper, async (req, res) => {
  const userId = req.user._id;
  const { offerId, from, to, amount } = req.body;
  if (from != userId) {
    return res.status(422).send('Not authorized');
  }
  try {
    Offer.updateOne({ _id: offerId }, { closed: true }, (err, doc) => {
      if (err) {
        return res.status(422).send(err);
      }
      if (doc.nModified == 0) {
        return res.status(422).send('Dit aanbod is reeds betaald.');
      }
      User.updateOne({ _id: to }, { $inc: { nix: amount } }, (err, doc1) => {
        if (err) {
          return res.status(422).send(err);
        }
        User.updateOne(
          { _id: from },
          { $inc: { nix: amount * -1 } },
          (err, doc) => {
            if (err) {
              return res.status(422).send(err);
            }
            return res.status(200).send('OK');
          }
        );
      });
    });
  } catch (err) {
    return res.status(422).send(err);
  }
});

router.get('/api/offers/fromUser', gatekeeper, async (req, res) => {
  const userId = req.user._id;
  try {
    const query = Offer.find();
    query
      .where('fromUser')
      .equals(userId)
      .populate('ad')
      .populate('fromUser')
      .sort('dateAdded')
      .exec((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(422).send(err);
        }
        return res.status(200).send(doc);
      });
  } catch (err) {
    console.log(err);
    return res.status(422).send(err);
  }
});

router.post('/api/offers/accept', gatekeeper, async (req, res) => {
  const { offerId, fromUserEmail, adTitle } = req.body;
  try {
    Offer.findById(offerId, (err, doc) => {
      if (err) {
        return res.status(422).send(err);
      }
      doc.accepted = true;
      const amount = doc.amountOffered;
      doc.save((err, result) => {
        if (err) {
          return res.status(422).send(err);
        }

        const acceptedEmail = {
          to: fromUserEmail,
          from: mails['no-reply'],
          subject: 'Je bod is geaccepteerd',
          text:
            'Beste, \n\nJe bod op ' +
            adTitle +
            ' van ' +
            amount +
            ' nix is geaccepteerd. Je kunt nu naar de app gaan en een afspraak maken voor de overdracht.\n\nMet vriendelijke groet,\n\nHet Roylen-Team',
          html:
            '<p>Beste, <br><br>Je bod op ' +
            adTitle +
            ' van ' +
            amount +
            ' nix is geaccepteerd. Je kunt nu naar de app gaan en een afspraak maken voor de overdracht.</p><p>Met vriendelijke groet,</p><p>Het Roylen-Team</p>',
        };

        sgMail.send(acceptedEmail, false, (err, result) => {
          if (err) return res.status(422).send({ error: err });
          return res.status(200).send('OK');
        });
      });
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
