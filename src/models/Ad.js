const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
	_userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	dateAdded: {
		type: Date,
		default: Date.now
	},
	expiryDate: {
		type: Date,
		default: () => Date.now() + 31 * 24 * 3600 * 1000
	},
	title: {
		type: String,
		required: true,
		minlength: 5,
		maxlength: 50
	},
	description: {
		type: String,
		required: true,
		maxlength: 5200
	},
	virtualPrice: {
		type: Number,
		min: 0
	},
	isActive: {
		type: Boolean,
		default: true
	},
	pics: {
		type: [String]
	},
	category: {
		type: String,
		required: true
	}
});

mongoose.model('Ad', AdSchema);