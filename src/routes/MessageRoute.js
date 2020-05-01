const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const router = express.Router();
const Message = mongoose.model('Message');
const SendGridKey = require('../env/sendgrid');
const sgMail = require('@sendgrid/mail');

router.get('/api/message/:userId', gatekeeper, async (req, res) => {
  if (req.user._id != req.params.userId) {
    return res.status(422).send('You are not authorized to get these messages');
  } else {
    try {
      Message.find({ toId: req.user._id /* isRead: false  */ })
        .populate('fromId')
        .sort('-dateSent')
        .exec((err, doc) => {
          // console.log(doc);
          if (err) {
            return res
              .status(422)
              .send('Something went wrong trying to pick up your messages.');
          }
          res.status(200).send(doc);
        });
    } catch (err) {
      res
        .status(422)
        .send(
          'Something went wrong when we tried to pick up your messages. Please try again later.'
        );
    }
  }
});

router.post('/api/message/markRead/', gatekeeper, async (req, res) => {
  try {
    Message.updateOne(
      { _id: req.body.messageId },
      { isRead: true },
      (err, doc) => {
        if (err) {
          return res
            .status(422)
            .send(
              `Unable to process your request. Please try again later: ${err}`
            );
        } else {
          return res.status(200).send('Request executed');
        }
      }
    );
  } catch (err) {
    return res
      .status(422)
      .send(`Unable to process your request. Please try again later: ${err}`);
  }
});

router.post('/api/message', gatekeeper, async (req, res) => {
  const { senderName, message, fromId, toId, adId, adTitle } = req.body;

  const msg = new Message({
    adId: adId,
    fromId: fromId,
    toId: toId,
    adTitle,
    message,
    senderName,
    isRead: false,
  });
  await msg.save({}, (err, doc) => {
    if (err) {
      res
        .status(422)
        .send('Unable to store or send your message. Please try again later.');
    } else {
      res.status(200).send('Success!');
    }
  });
  // console.log(msg);
});

// stub
router.post('/api/message/contact', async (req, res) => {
  const { msg, email } = req.body;
  if (!email) email = 'no-reply@roylen.ga';
  const contact = {
    to: 'roylen@raker.nl',
    from: email,
    subject: 'Message from contact form Roylen',
    text: msg,
    html: msg,
  };

  sgMail.send(contact, false, (err, result) => {
    if (err) return res.status(422).send({ error: err });
    return res.status(200).send('status is sufficient');
  });
});

module.exports = router;
