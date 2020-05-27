const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const Offer = mongoose.model('Offer');
const User = mongoose.model('User');
const SendGridKey = require('../env/sendgrid');
const sgMail = require('@sendgrid/mail');

const router = express.Router();

router.get('/api/offers/fromUser', gatekeeper, async (req, res) => {
  const userId = req.user._id;
  try {
    const query = Offer.find();
    query.where(fromUser == userId);
    query.populate('ad');
    query.sort('dateAdded');
    query.exec((err, doc) => {
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
          from: 'no-reply@roylen.net',
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
