const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWTKey = require('../env/keys');
const gatekeeper = require('../middlewares/gatekeeper');
const User = mongoose.model('User');

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

router.post('/api/profile', gatekeeper, async (req, res) => {
	const { _id, email, screenName } = req.body;
	console.log(req.body);
	console.log(req.user);
});

const send422 = res => {
	res.status(422).send({ error: 'Must provide valid email and password' });
};

module.exports = router;
