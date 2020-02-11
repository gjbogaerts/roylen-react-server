const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
	creator: {
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
	adNature: {
		type: String,
		enum: ['wanted', 'offered'],
		default: 'offered'
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

AdSchema.index({ title: 10, description: 3 });

mongoose.model('Ad', AdSchema);
