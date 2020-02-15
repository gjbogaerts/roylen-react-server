const express = require('express');
const mongoose = require('mongoose');
const util = require('util');
const gatekeeper = require('../middlewares/gatekeeper');
const Ad = mongoose.model('Ad');
const User = mongoose.model('User');
const router = express.Router();

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
		creator,
		adNature
	} = req.body;
	// console.log(req.user._id);
	// console.log(creator);
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
		adNature
	});
	// console.log(ad);
	await ad.save({}, (err, doc) => {
		if (err) res.status(422).send(`Unable to create ad: ${err}`);
		res.send({ msg: 'Success, ad created', doc });
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

/**
 * TODO: work on these routes
 */
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

module.exports = router;
