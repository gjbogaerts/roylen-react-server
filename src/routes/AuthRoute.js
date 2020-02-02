const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWTKey = require('../env/keys');
const gatekeeper = require('../middlewares/gatekeeper');
const User = mongoose.model('User');

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
