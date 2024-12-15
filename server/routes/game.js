const router = require('express').Router();
const Game = require('../models/game');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Access denied' });

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) return res.status(403).json({ message: 'Invalid token' });
		req.user = user;
		next();
	});
};

// Create new game
router.post('/new', authenticateToken, async (req, res) => {
	try {
		const { difficulty } = req.body;
		const game = new Game({
			userId: req.user.userId,
			difficulty,
			grid: generateGrid(), // You'll need to implement this function
			words: generateWords(difficulty) // You'll need to implement this function
		});

		await game.save();
		res.status(201).json(game);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Save game progress
router.put('/save/:gameId', authenticateToken, async (req, res) => {
	try {
		const { grid, words, score } = req.body;
		const game = await Game.findOne({
			_id: req.params.gameId,
			userId: req.user.userId
		});

		if (!game) {
			return res.status(404).json({ message: 'Game not found' });
		}

		game.grid = grid;
		game.words = words;
		game.score = score;
		game.lastSaved = Date.now();

		await game.save();
		res.json(game);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Get user's games
router.get('/my-games', authenticateToken, async (req, res) => {
	try {
		const games = await Game.find({
			userId: req.user.userId
		}).sort({ lastSaved: -1 });
		res.json(games);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Get specific game
router.get('/:gameId', authenticateToken, async (req, res) => {
	try {
		const game = await Game.findOne({
			_id: req.params.gameId,
			userId: req.user.userId
		});

		if (!game) {
			return res.status(404).json({ message: 'Game not found' });
		}

		res.json(game);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Complete game
router.put('/complete/:gameId', authenticateToken, async (req, res) => {
	try {
		const { score } = req.body;
		const game = await Game.findOne({
			_id: req.params.gameId,
			userId: req.user.userId
		});

		if (!game) {
			return res.status(404).json({ message: 'Game not found' });
		}

		game.completed = true;
		game.score = score;
		await game.save();

		// Update user's game history
		await User.findByIdAndUpdate(req.user.userId, {
			$push: {
				gameHistory: {
					date: Date.now(),
					score: score,
					completed: true
				}
			}
		});

		res.json(game);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Delete game
router.delete('/:gameId', authenticateToken, async (req, res) => {
	try {
		const game = await Game.findOneAndDelete({
			_id: req.params.gameId,
			userId: req.user.userId
		});

		if (!game) {
			return res.status(404).json({ message: 'Game not found' });
		}

		res.json({ message: 'Game deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Helper functions for grid and word generation
function generateGrid() {
	// Implementation for generating the word search grid
	// This is a simple example - you might want to make this more sophisticated
	const size = 10;
	const grid = [];
	for (let i = 0; i < size; i++) {
		grid[i] = [];
		for (let j = 0; j < size; j++) {
			grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
		}
	}
	return grid;
}

function generateWords(difficulty) {
	// Implementation for generating words based on difficulty
	// This is a simple example - you might want to use a word list database
	const wordLists = {
		easy: ['CAT', 'DOG', 'RAT', 'BAT'],
		medium: ['HOUSE', 'MOUSE', 'PLANT', 'TRAIN'],
		hard: ['ELEPHANT', 'COMPUTER', 'CALENDAR', 'MOUNTAIN']
	};

	return wordLists[difficulty].map(word => ({
		word: word,
		found: false
	}));
}

module.exports = router;