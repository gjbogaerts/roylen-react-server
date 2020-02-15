const express = require('express');
const mongoose = require('mongoose');
const Ad = mongoose.model('Ad');
const User = mongoose.model('User');
const router = express.Router();
const ADMIN = require('../env/admin');

const jwt = require('jsonwebtoken');
const JWTKey = require('../env/keys');
const adminSecure = require('../middlewares/adminkeeper');

const sendErr = (res, err) => {
	return res.status(422).send({ error: 1, message: err });
};

router.get('/api/admin/users', adminSecure, (req, res) => {
	try {
		User.find({}, '_id screenName', { limit: 50 }, (err, doc) => {
			if (err) return sendErr(res, err);
			res.send(doc);
		});
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.get('/api/admin/user/:id', adminSecure, (req, res) => {
	try {
		// console.log('hey: ', req.params.id);
		User.findById(
			req.params.id,
			'_id screenName email nix avatar isBanned',
			(err, doc) => {
				if (err) return sendErr(res, err);
				// console.log(doc);
				res.send(doc);
			}
		);
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.post('/api/admin/user/userByScreenName', adminSecure, (req, res) => {
	const name = req.body.screenName;
	try {
		User.findOne({ screenName: name }, '_id', (err, doc) => {
			if (err) return sendErr(res, err);
			return res.send(doc);
		});
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.post('/api/admin/user/ban', adminSecure, (req, res) => {
	const { id } = req.body;
	try {
		User.updateOne({ _id: id }, { isBanned: true }, (err, doc) => {
			if (err) return sendErr(res, err);
			return res.status(200).send(doc);
		});
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.post('/api/admin/user/unban', adminSecure, (req, res) => {
	const { id } = req.body;
	try {
		User.updateOne({ _id: id }, { isBanned: false }, (err, doc) => {
			if (err) return sendErr(res, err);
			return res.status(200).send(doc);
		});
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.post('/api/admin/ads/forbid', adminSecure, async (req, res) => {
	const { id } = req.body;
	try {
		Ad.updateOne({ _id: id }, { isForbidden: true }, (err, doc) => {
			if (err) {
				return res.status(422).send(err);
			}
			return res.status(200).send(doc);
		});
	} catch (err) {
		res
			.status(422)
			.send(
				'Error trying to update the ad. Please use the command line directly or try later.'
			);
	}
});

router.post('/api/admin/ads/unforbid', adminSecure, async (req, res) => {
	const { id } = req.body;
	try {
		Ad.updateOne({ _id: id }, { isForbidden: false }, (err, doc) => {
			if (err) return res.status(422).send(err);
			return res.status(200).send(doc);
		});
	} catch (err) {
		res
			.status(422)
			.send(
				'Error trying to update the ad. Please use the command line directly or try later.'
			);
	}
});

router.post('/api/admin/auth', (req, res) => {
	const adminString = JSON.stringify(ADMIN);
	const reqString = JSON.stringify(req.body);
	const adminName = req.body.fn;
	if (adminString === reqString) {
		const token = jwt.sign({ name: adminName }, JWTKey);
		res.status(200).send({ result: 1, token });
	} else {
		res.status(422).send({ result: 0 });
	}
});

module.exports = router;
