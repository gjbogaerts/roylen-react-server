const express = require('express');
const mongoose = require('mongoose');

const gatekeeper = require('../middlewares/gatekeeper');
const User = mongoose.model('User');
const Ad = mongoose.model('Ad');
const router = express.Router();

const uploadURI = '/uploads/pics';
const upload = require('../utils/uploads');

router.post('/api/adCreate', upload.any(), gatekeeper, async (req, res) => {
	const { _id } = req.user;
	const { title, description, virtualPrice, category } = req.body;
	const pics = [];
	req.files.map(file => {
		return pics.push(uploadURI + '/' + file.filename);
	});
	const ad = new Ad({
		_userId: _id,
		title,
		description,
		virtualPrice,
		category,
		pics
	});
	await ad.save({}, (err, doc) => {
		res.send(doc);
	});
});

router.get('/api/ads/', gatekeeper, async (req, res) => {
	try {
		Ad.find({ isActive: true }, (err, docs) => {
			if (err) {
				return res.send('Error connecting to the database');
			}
			res.send(docs);
		});
	} catch (err) {
		res.status(422).send('Could not fetch the ads.');
	}
});
router.get('/api/ads/:adId', gatekeeper, async (req, res) => {
	try {
		Ad.findById(req.params.adId, (err, doc) => {
			if (err) {
				return res.send('Error connecting to the database');
			}
			res.send(doc);
		});
	} catch (err) {
		res.status(422).send('Could not fetch the ad');
	}
});

module.exports = router;