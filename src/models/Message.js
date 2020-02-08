const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
	adId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Ad'
	},
	fromId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	toId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	adTitle: {
		type: String
	},
	message: {
		type: String,
		required: true
	},
	senderName: {
		type: String
	},
	isRead: {
		type: Boolean,
		default: false
	}
});

mongoose.model('Message', MessageSchema);
