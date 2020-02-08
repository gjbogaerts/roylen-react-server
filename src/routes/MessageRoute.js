const express = require('express');
const mongoose = require('mongoose');
const gatekeeper = require('../middlewares/gatekeeper');
const router = express.Router();
const Message = mongoose.model('Message');

router.post('/api/message', gatekeeper, async (req, res) => {
	const { senderName, message, fromId, toId, adId, adTitle } = req.body;

	const msg = new Message({
		adId: adId,
		fromId: fromId,
		toId: toId,
		adTitle,
		message,
		senderName,
		isRead: false
	});
	await msg.save({}, (err, doc) => {
		if (err) {
			res
				.status(422)
				.send('Unable to store or send your message. Please try again later.');
		} else {
			res.status(200).send('Success!');
		}
	});
	console.log(msg);
});

module.exports = router;
