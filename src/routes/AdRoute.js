const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const uploadURI = '/uploads/pics';
const upload = require('../utils/uploads');

router.post('/api/adCreate', upload.any(), gatekeeper, async (req, res) => {
  // console.log(req.files);
  // console.log(JSON.parse(JSON.stringify(req.body)));

  const {
    title,
    description,
    virtualPrice,
    category,
    adNature,
    longitude,
    latitude
  } = req.body;
  const pics = [];
  req.files.map(file => {
    return pics.push(uploadURI + '/' + file.filename);
  });

  const { _id } = req.user;

  const ad = new Ad({
    creator: _id,
    title,
    description,
    virtualPrice,
    category,
    pics,
    adNature,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    }
  });
  try {
    await ad.save({}, (err, doc) => {
      if (err) res.status(422).send(`Unable to create ad: ${err}`);
      res.send({ msg: 'Success, ad created', doc });
    });
  } catch (err) {
    console.log(err);
    res.status(422).send(`Unable to create ad: ${err}`);
  }
});

router.post('/api/ads/warning', async (req, res) => {
  const { adId } = req.body;
  let dbMessage = null;
  await Ad.findOneAndUpdate(
    { _id: adId },
    { $inc: { warnings: 1 } },
    (err, doc) => {
      dbMessage = err;
      if (!doc.isModified) {
        dbMessage = 'Nothing was modified.';
      } else {
        dbMessage = 'Database is updated.';
      }
    }
  );
  const contact = {
    to: 'roylen@raker.nl',
    from: 'no-reply@roylen.ga',
    subject: 'Message from contact form Roylen',
    text: `Hey admin,\n\nThere was a warning regarding ad with id: ${adId}.\n\n${dbMessage}`,
    html: `<p>Hey admin,</p><p>There was a warning regarding ad with id: ${adId}</p><p>${dbMessage}</p>`
  };

  sgMail.send(contact, false, (err, result) => {
    if (err) return res.status(422).send({ error: err });
    return res.status(200).send('OK');
  });
});

router.get('/api/ads/', async (req, res) => {
  try {
    Ad.find({ isActive: true, isForbidden: false })
      .sort({ dateAdded: -1 })
      .populate('creator')
      .exec((err, docs) => {
        if (err) {
          return res.send('Error connecting to the database');
        }
        res.send(docs);
      });
  } catch (err) {
    res.status(422).send('Could not fetch the ads.');
  }
});
router.get('/api/ads/:adId', async (req, res) => {
  try {
    Ad.findById(req.params.adId)
      .populate('creator')
      .exec((err, doc) => {
        if (err) res.status(422).send(err, 'Could not fetch the ad');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ad');
  }
});

//distance
router.post('/api/ads/withDistance', async (req, res) => {
  const { dist, longitude, latitude } = req.body;
  // console.log(dist, longitude, latitude);
  try {
    await Ad.find()
      .where('location')
      .within({
        center: [longitude, latitude],
        radius: dist,
        spherical: true,
        unique: false
      })
      .populate('creator')
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (error) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

//category
router.get('/api/ads/c/:category', async (req, res) => {
  try {
    Ad.find({ category: req.params.category, isActive: true })
      .populate('creator')
      .sort('-dateAdded')
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});
//search
router.get('/api/ads/q/:q', async (req, res) => {
  try {
    Ad.find({ $text: { $search: req.params.q } })
      .where({ isActive: true })
      .populate('creator')
      .sort('-dateAdded')
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

//for user
router.get('/api/ads/fromUser/:userId', async (req, res) => {
  try {
    Ad.find({ creator: req.params.userId })
      .sort('-dateAdded')
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

router.delete('/api/ads', gatekeeper, async (req, res) => {
  const { id, creator } = req.body;
  if (creator != req.user._id) {
    //We can't use identity operator !==, creator is string, req.user._id is an object
    return res.status(422).send('Not authorized to perform this action.');
  }
  try {
    const result = await Ad.deleteOne({ _id: id });
    return res.status(200).json(result.deletedCount);
    // console.log(result.deletedCount);
  } catch (err) {
    res.status(422).send(err);
  }
});

module.exports = router;
