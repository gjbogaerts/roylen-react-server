const express = require('express');
const mongoose = require('mongoose');

const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const User = mongoose.model('User');
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
		creator: _id,
		title,
		description,
		virtualPrice,
		category,
		pics
	});
	await ad.save({}, (err, doc) => {
		res.send(doc);
	});
	User.populate(ad);
});

router.get('/api/ads/', async (req, res) => {
	try {
		Ad.find({ isActive: true })
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

/**
 * TODO: work on these routes
 */
//category
router.get('/api/ads/category/:category', async (req, res) => {
	res.send(req.params.category);
});
//search
router.get('/api/ads/q/:q', async (req, res) => {
	res.send(req.params.q);
});
//filter
router.get('/api/ads/f/:f', async (req, res) => {
	res.send(req.params.f);
});

module.exports = router;
