const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWTKey = require('../env/keys');
const gatekeeper = require('../middlewares/gatekeeper');
const User = mongoose.model('User');
const SendGridKey = require('../env/sendgrid');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const mails = require('../env/mail_list');
sgMail.setApiKey(SendGridKey);

//checking file path
const fs = require('fs');
const upload = require('../utils/uploads');
const uploadURI = '/uploads/pics';
const baseDir = `${__baseDir}${uploadURI}`;
const d = new Date();
const dirExtension = '/' + d.getFullYear() + '/' + d.getMonth() + '/';
const uploadDir = baseDir + dirExtension;
const dbAvatarUri = uploadURI + dirExtension;

fs.mkdir(uploadDir, { recursive: true }, (err) => {
  if (err) {
    throw err;
  }
  // console.log(uploadDir + ' created');
});

router.get('/api/checkEmail/:email', async (req, res) => {
  try {
    User.find({ email: req.params.email }, '_id', (err, doc) => {
      if (err) return res.status(422).send({ err: err.message });
      return res.status(200).send({ numUsers: doc.length });
    });
  } catch (err) {
    res.status(422).send({ err: err.message });
  }
});

router.get('/api/checkScreenName/:screenName', async (req, res) => {
  try {
    User.find({ screenName: req.params.screenName }, '_id', (err, doc) => {
      if (err) return res.status(422).send({ err: err.message });
      return res.status(200).send({ numUsers: doc.length });
    });
  } catch (err) {
    res.status(422).send({ err: err.message });
  }
});

router.post('/api/signup', async (req, res) => {
  const { email, password, screenName } = req.body;
  try {
    const user = new User({ email, password, screenName, nix: 100 });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWTKey);
    res.send({ ...user.toJSON(), token });
  } catch (e) {
    console.log(e);
    return res.status(422).send({ error: e.message });
  }
});

router.post('/api/confirmResetPassword', async (req, res) => {
  const pwResetKey = req.body.key;
  const password = req.body.pw;
  try {
    const user = await User.findOne({ pwResetKey });
    if (!user) {
      return res.status(422).send({ error: 'No user found with this key' });
    }
    user.password = password;
    user.pwResetKey = '';
    user.save({}, (err, doc) => {
      if (err) return res.status(422).send({ error: err });
      return res.status(200).send({
        success: 1,
        msg:
          'Your password has been reset. You can now login with your new password',
        doc,
      });
    });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

router.post('/api/resetPassword', async (req, res) => {
  const { email } = req.body;
  // console.log(req.body);
  const secretKey = crypto.randomBytes(20).toString('hex');
  try {
    User.updateOne({ email }, { pwResetKey: secretKey }, (err, doc) => {
      if (err) return res.status(422).send({ error: err.message });
      if (doc.nModified === 1) {
        const msg = {
          to: email,
          from: mails['no-reply'],
          subject: 'Reset your password',
          text: `Dear Roylen-user,\n\nsomebody, maybe you, has requested a new password to access the Roylen app. Please open the app, click the 'reset password' button on the login-page, and use the key provided here to reset your password.\n\n__________________________\n\nKey:${secretKey}\n\n__________________________\n\nTake care, you can only use this key once! \n\nWith kind regards,\nThe Roylen Team\n\nPS: you didn't ask for your password to reset? You don't need to do anything, your account is safe.\nPPS: You can't reply to this mail; your reply will get lost in the great empty void of bits and data on the internet...`,
          html: `<p>Dear Roylen-user,</p><p>Somebody, maybe you, has requested a new password to access the Roylen app. Please open the app, click the 'reset password' button on the login-page, and use the key provided here to reset your password.</p><p><hr /><p>Key:<br />${secretKey}</p><hr /><p>Take care, you can only use this key once!</p><p>With kind regards,</p><p>The Roylen Team</p><p>PS: you didn't ask for your password to reset? You don't need to do anything, your account is safe.</p><p>PPS: You can't reply to this mail; your reply will get lost in the great empty void of bits and data on the internet...</p>`,
        };
        sgMail.send(msg, false, (error, result) => {
          if (error) return res.status(422).send({ error: error });
          return res.status(200).send({
            result,
            success: 1,
            msg:
              "We have sent you a secret key to reset your password. If you don't see it, please check your spambox.",
          });
        });
      } else {
        return res.status(200).send({
          error:
            "Sorry, we're unable to provide you with a password reset key. Please check the spelling of your email address.",
        });
      }
    });
  } catch (e) {
    return res.status(422).send({ error: e.message });
  }
});

router.post('/api/favorite', async (req, res) => {
  const { userId, adId } = req.body;
  const currUser = await User.findById(userId);
  let favAds = currUser.favoriteAds;
  if (favAds.includes(adId)) {
    favAds = favAds.filter((ad) => adId != ad._id);
  } else {
    favAds.push(adId);
  }
  try {
    currUser.updateOne({ favoriteAds: favAds }, (err, doc) => {
      if (err) return send422(res);
      return res.status(200).send({ user: doc });
    });
  } catch (err) {
    return send422(res);
  }
});

router.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('no email, passwor');
    return send422(res);
  }
  const user = await User.findOne({ email });
  if (!user) {
    console.log('no users');
    return send422(res);
  }
  try {
    await user.comparePassword(password);
    const token = jwt.sign({ userId: user._id }, JWTKey);
    // console.log(user.toJSON());
    // console.log(token);
    res.send({ ...user.toJSON(), token });
  } catch (err) {
    return send422(res);
  }
});

router.post('/api/profile', upload.any(), gatekeeper, async (req, res) => {
  try {
    let imagePath = null;
    if (req.files && req.files.length > 0) {
      // imagePath = upload.storage;
      imagePath = dbAvatarUri + req.files[0]['filename'];
    }
    let { email } = req.body;
    if (email == '' || email == null) {
      email = req.user.email;
    }
    const q = { _id: req.user._id };
    let newData;
    if (imagePath != null) {
      newData = { email, avatar: imagePath };
    } else {
      newData = { email };
    }
    User.findByIdAndUpdate(
      q,
      newData,
      { useFindAndModify: false, returnOriginal: false },
      (err, doc) => {
        if (err) return send422(err);
        return res.send({ success: 1, doc: doc });
      }
    );
  } catch (err) {
    // console.log('upload', err);
    return send422(err);
  }
});

const send422 = (res) => {
  res.status(422).send({ error: 'Must provide valid email and password' });
};

module.exports = router;
