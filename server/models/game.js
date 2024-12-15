const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	grid: [[String]],
	words: [{
		word: String,
		found: {
			type: Boolean,
			default: false
		}
	}],
	score: {
		type: Number,
		default: 0
	},
	startTime: {
		type: Date,
		default: Date.now
	},
	lastSaved: {
		type: Date,
		default: Date.now
	},
	completed: {
		type: Boolean,
		default: false
	},
	difficulty: {
		type: String,
		enum: ['easy', 'medium', 'hard'],
		default: 'medium'
	}
});

module.exports = mongoose.model('Game', gameSchema);