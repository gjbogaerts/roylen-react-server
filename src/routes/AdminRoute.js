const express = require('express');
const mongoose = require('mongoose');
const Ad = mongoose.model('Ad');
const User = mongoose.model('User');
const router = express.Router();
const ADMIN = require('../env/admin');

const sendErr = (res, err) => {
	return res.status(422).send({ error: 1, message: err });
};

router.post('/api/admin/user/ban', (req, res) => {
	const { id } = req.body;
	try {
		User.updateOne({ _id: id }, { isBanned: true }, (err, doc) => {
			if (err) return sendErr(res, err);
			return res.status(200).send({ error: 0, modified: doc.modified });
		});
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.post('/api/admin/user/unban', (req, res) => {
	const { id } = req.body;
	try {
		User.updateOne({ _id: id }, { isBanned: false }, (err, doc) => {
			if (err) return sendErr(res, err);
			return res.status(200).send({ error: 0, modified: doc.modified });
		});
	} catch (err) {
		return sendErr(res, err.message);
	}
});

router.post('/api/admin/auth', (req, res) => {
	const adminString = JSON.stringify(ADMIN);
	const reqString = JSON.stringify(req.body);
	if (adminString === reqString) {
		res.status(200).send({ result: 1 });
	} else {
		res.status(422).send({ result: 0 });
	}
});

router.post('/api/admin/ads/forbid', async (req, res) => {
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

router.post('/api/admin/ads/unforbid', async (req, res) => {
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
				'Error torying to update the ad. Please use the command line directly or try later.'
			);
	}
});

module.exports = router;
