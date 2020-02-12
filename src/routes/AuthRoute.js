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

sgMail.setApiKey(SendGridKey);
const uploadURI = '/uploads/pics';
const upload = require('../utils/uploads');

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

router.post('/api/resetPassword', async (req, res) => {
	const { email } = req.body;
	const secretKey = crypto.randomBytes(20).toString('hex');
	try {
		const user = User.updateOne(
			{ email },
			{ pwResetKey: secretKey },
			(err, doc) => {
				if (err) return res.status(422).send({ error: err.message });
				if (doc.nModified === 1) {
					const msg = {
						to: email,
						from: 'do-not-reply@roylen.ga',
						subject: 'Reset your password',
						text: `Dear Roylen-user,\n\nsomebody, maybe you, has requested a new password to access the Roylen app. Please open the app, click the 'reset password' button on the login-page, and use the key provided here to reset your password.\n\n__________________________\n\nKey:${secretKey}\n\n__________________________With kind regards,\nThe Roylen Team\n\nPS: you didn't ask for your password to reset? You don't need to do anything, your account is safe.\nPPS: You can't reply to this mail; your reply will get lost in the great empty void of bits and data on the internet...`,
						html: `<p>Dear Roylen-user,</p><p>Somebody, maybe you, has requested a new password to access the Roylen app. Please open the app, click the 'reset password' button on the login-page, and use the key provided here to reset your password.</p><p><hr /><p>Key:<br />${secretKey}</p><hr /><p>With kind regards,</p><p>The Roylen Team</p><p>PS: you didn't ask for your password to reset? You don't need to do anything, your account is safe.</p><p>PPS: You can't reply to this mail; your reply will get lost in the great empty void of bits and data on the internet...</p>`
					};
					sgMail.send(msg);
					return res
						.status(200)
						.send({
							succes: 1,
							msg: 'We have sent you a secret key to reset your password. '
						});
				} else {
					return res
						.status(200)
						.send(
							"Sorry, we're unable to provide you with a password reset key. Please check the spelling of your email address."
						);
				}
			}
		);
	} catch (e) {
		return res.status(422).send({ error: e.message });
	}
});

router.post('/api/signin', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return send422(res);
	}
	const user = await User.findOne({ email });
	if (!user) {
		return send422(res);
	}
	try {
		await user.comparePassword(password);
		const token = jwt.sign({ userId: user._id }, JWTKey);
		res.send({ ...user.toJSON(), token });
	} catch (err) {
		return send422(res);
	}
});

router.post('/api/profile', upload.any(), gatekeeper, async (req, res) => {
	try {
		let imagePath = null;
		if (req.files && req.files.length > 0) {
			imagePath = uploadURI + '/' + req.files[0]['filename'];
		}
		let email = req.user.email;
		if (req.body['email'] != '') {
			email = req.body['email'];
		}
		const q = { _id: req.user._id };
		const newData = { email, avatar: imagePath };
		User.findByIdAndUpdate(
			q,
			newData,
			{ useFindAndModify: false },
			(err, doc) => {
				if (err) return send422(res);
				return res.send({ success: 1, avatar: doc.avatar });
			}
		);
	} catch (err) {
		return send422(res);
	}
});

const send422 = res => {
	res.status(422).send({ error: 'Must provide valid email and password' });
};

module.exports = router;
