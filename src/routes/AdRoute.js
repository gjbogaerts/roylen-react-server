const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const User = mongoose.model('User');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const mails = require('../env/mail_list');
const _ = require('lodash');

//checking file path
const fs = require('fs');
const uploadURI = '/uploads/pics';
const upload = require('../utils/uploads');
const baseDir = `${__baseDir}${uploadURI}`;
const d = new Date();
const dirExtension = '/' + d.getFullYear() + '/' + d.getMonth() + '/';
const uploadDir = baseDir + dirExtension;
const dbPicUri = uploadURI + dirExtension;

fs.mkdir(uploadDir, { recursive: true }, (err) => {
  if (err) {
    throw err;
  }
  // console.log(uploadDir + ' created');
});

router.post('/api/ads/removePic', gatekeeper, async (req, res) => {
  const { adId, picUri } = req.body;
  try {
    Ad.findById(adId, (err, doc) => {
      if (err) {
        console.log('1: ', err);
        return res.status(422).send(`Error: ${err}`);
      }
      let pics = doc.pics;
      pics = pics.filter((pic) => pic != picUri);
      doc.updateOne({ pics: pics }, (err2, doc2) => {
        if (err2) {
          console.log('2: ', err2);
          return res.status(422).send(`Error: ${err2}`);
        }
        fs.unlink(__baseDir + picUri, (err3) => {
          if (err3) {
            console.log('3: ', err3);
            return res.status(422).send(`Error deleting file: ${err3}`);
          }
          return res.status(200).send('OK');
        });
      });
    });
  } catch (err) {
    return res.status(422).send(`Error: ${err}`);
  }
});

router.post('/api/ads/addPic', upload.any(), gatekeeper, async (req, res) => {
  const { adId } = req.body;
  const pics = [];
  req.files.map((file) => {
    return pics.push(dbPicUri + file.filename);
  });
  const ad = await Ad.findById(adId);
  let curPics = ad.pics;
  let newPics = pics.concat(curPics);
  let uniqPics = [...new Set(newPics)];
  ad.pics = uniqPics;
  ad.save((err, __) => {
    if (err) {
      console.log(err);
      return res.status(422).send(`Error: ${err}`);
    }
    return res.status(200).send('OK');
  });
});

router.post('/api/ads/update', gatekeeper, async (req, res) => {
  const { adId } = req.body;
  try {
    Ad.findByIdAndUpdate(adId, req.body, { new: true }, (err, doc) => {
      if (err) {
        return res.status(422).send(err);
      }
      return res.status(200).send(doc);
    });
  } catch (err) {
    return res.status(422).send(err);
  }
});

router.post('/api/adCreate', upload.any(), gatekeeper, async (req, res) => {
  // console.log(req.files);
  // console.log(JSON.parse(JSON.stringify(req.body)));

  const {
    title,
    description,
    virtualPrice,
    mainCategory,
    subCategory,
    subSubCategory,
    ageCategory,
    longitude,
    latitude,
  } = req.body;
  const pics = [];
  req.files.map((file) => {
    return pics.push(dbPicUri + file.filename);
  });

  const { _id } = req.user;

  const ad = new Ad({
    creator: _id,
    title,
    description,
    virtualPrice,
    mainCategory,
    subCategory,
    subSubCategory,
    ageCategory,
    pics,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  });
  // console.log(ad);
  try {
    ad.save({}, (err, doc) => {
      if (err) {
        console.log(err);
        res.status(422).send(`Unable to create ad: ${err}`);
      }
      res.status(200).send({ msg: 'Success, ad created', doc });
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
    to: mails.contact,
    from: mails['no-reply'],
    subject: 'Message from contact form Roylen',
    text: `Hey admin,\n\nThere was a warning regarding ad with id: ${adId}.\n\n${dbMessage}`,
    html: `<p>Hey admin,</p><p>There was a warning regarding ad with id: ${adId}</p><p>${dbMessage}</p>`,
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
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
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
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
      .exec((err, doc) => {
        if (err) res.status(422).send(err, 'Could not fetch the ad');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ad');
  }
});

//favorites
router.get('/api/ads/saved/:userId', gatekeeper, async (req, res) => {
  const userId = req.params.userId;
  if (req.user._id == userId) {
    const favAds = req.user.favoriteAds;
    if (!favAds || favAds.length === 0) {
      res.status(200).send([]);
    } else {
      try {
        User.findById(userId, 'favoriteAds')
          .populate({ path: 'favoriteAds', populate: { path: 'creator' } })
          .populate({ path: 'offers', populate: { path: 'fromUser' } })
          .exec((err, doc) => {
            if (err)
              res.status(422).send('Could not fetch the ads from the database');
            let result = _.uniqBy(doc.favoriteAds, '_id');
            res.status(200).send(result);
          });
      } catch (err) {
        res.status(422).send('Error connecting to the database');
      }
    }
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
        unique: false,
      })
      .populate('creator')
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (error) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

//category
/**
 * @deprecated
 */
router.get('/api/ads/c/:category', async (req, res) => {
  try {
    Ad.find({ category: req.params.category, isActive: true })
      .populate('creator')
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
      .sort('-dateAdded')
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

router.post('/api/ads/filter', async (req, res) => {
  // mongoose.set('debug', true);
  // console.log(req.body);
  const {
    mainCategory,
    subCategory,
    subSubCategory,
    ageCategory,
    priceMin,
    priceMax,
    maxDistance,
    latitude,
    longitude,
  } = req.body;
  // console.log(req.body);
  try {
    const q = Ad.find();
    if (Boolean(subSubCategory)) {
      q.where('subSubCategory', subSubCategory);
    }
    if (Boolean(subCategory)) {
      q.where('subCategory', subCategory);
    }
    if (Boolean(mainCategory)) {
      q.where('mainCategory', mainCategory);
    }
    if (Boolean(ageCategory)) {
      q.where('ageCategory', ageCategory);
    }
    if (Boolean(priceMin)) {
      q.where('virtualPrice').gte(priceMin);
    }
    if (Boolean(priceMax)) {
      q.where('virtualPrice').lte(priceMax);
    }
    if (Boolean(maxDistance) && Boolean(longitude) && Boolean(latitude)) {
      q.where('location').within({
        center: [longitude, latitude],
        radius: maxDistance,
        spherical: true,
        unique: false,
      });
    }
    // console.log(q.to);
    q.populate('creator')
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
      .sort('-dateAdded')
      .exec((err, doc) => {
        if (err) {
          // console.log(err + 'bij query');
          return res.status(422).send(err);
        }
        res.status(200).send(doc);
      });
  } catch (err) {
    // console.log(err + 'bij try/catch');
    return res.status(422).send(err);
  }
  mongoose.set('debug', false);
});

//search
router.get('/api/ads/q/:q', async (req, res) => {
  const q = new RegExp(req.params.q, 'gi');
  try {
    let query = Ad.find({ isActive: true })
      .or([
        { title: q },
        { description: q },
        { mainCategory: q },
        { subCategory: q },
        { subSubCategory: q },
      ])
      .populate('creator')
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
      .sort('-dateAdded');
    query.exec((err, doc) => {
      if (err) return res.status(422).send(err, 'Could not fetch the ads');
      res.send(doc);
    });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

//from categories
router.get(
  '/api/ads/category/:categoryType/:categoryName',
  async (req, res) => {
    const _cType = req.params.categoryType;
    let map = {};
    const _cName = req.params.categoryName;
    switch (_cType) {
      case 'mainCategory':
        map = { mainCategory: _cName };
        break;
      case 'subCategory':
        map = { subCategory: _cName };
        break;
      case 'subSubCategory':
        map = { subSubCategory: _cName };
        break;
      case 'ageCategory':
        map = { ageCategory: _cName };
        break;
      default:
        map = {};
    }
    try {
      var q = Ad.find(map)
        .where({ isActive: true })
        .populate('creator')
        .populate({ path: 'offers', populate: { path: 'fromUser' } })
        .sort('-dateAdded');
      // console.log(q.getQuery());
      q.exec((err, doc) => {
        if (err) return res.status(422).send(err);
        res.status(200).send(doc);
      });
    } catch (err) {
      console.log(err);
      res.status(422).send(err);
    }
  }
);

//for user
router.get('/api/ads/fromUser/:userId', async (req, res) => {
  try {
    Ad.find({ creator: req.params.userId })
      .populate('creator')
      .populate({ path: 'offers', populate: { path: 'fromUser' } })
      .sort('-dateAdded')
      .exec((err, doc) => {
        if (err) return res.status(422).send(err, 'Could not fetch the ads');
        res.send(doc);
      });
  } catch (err) {
    res.status(422).send(err, 'Could not fetch the ads');
  }
});

router.delete('/api/ads/:adId/:userId', gatekeeper, async (req, res) => {
  const id = req.params.adId;
  const creator = req.params.userId;
  if (creator != req.user._id) {
    //We can't use identity operator !==, creator is string, req.user._id is an object
    return res.status(422).send('Not authorized to perform this action.');
  }
  try {
    const result = await Ad.deleteOne({ _id: id });
    return res.status(200).json(result.deletedCount);
    // console.log(result.deletedCount);
    // return res.status(200).send({ Result: 'OK' });
  } catch (err) {
    res.status(422).send(err);
  }
});

module.exports = router;
