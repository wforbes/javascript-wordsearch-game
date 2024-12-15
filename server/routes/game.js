const router = require('express').Router();
const Game = require('../models/game');
const jwt = require('jsonwebtoken');

// Middleware to verify token and attach user
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'No token provided' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.userId = decoded.userId;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid token' });
	}
};

router.get('/list', authenticateToken, async (req, res) => {
	try {
		const games = await Game.find({
			user: req.userId
		}).sort({ lastSaved: -1 });

		res.json({
			active: games.filter(game => !game.completed),
			completed: games.filter(game => game.completed)
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Save game state
router.post('/save', authenticateToken, async (req, res) => {
	try {
		const { grid, words, foundWords, completed } = req.body;

		// Find existing game or create new one
		let game = await Game.findOne({
			user: req.userId,
			completed: false
		});

		if (!game) {
			game = new Game({
				user: req.userId,
				grid,
				words,
				foundWords,
				completed
			});
		} else {
			game.grid = grid;
			game.words = words;
			game.foundWords = foundWords;
			game.completed = completed;
			game.lastSaved = Date.now();
		}

		await game.save();
		res.json({ message: 'Game saved successfully' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Load game state (either specific game or most recent)
router.get('/load/:gameId?', authenticateToken, async (req, res) => {
	try {
		let game;

		if (req.params.gameId) {
			// Load specific game
			game = await Game.findOne({
				_id: req.params.gameId,
				user: req.userId
			});
		} else {
			// Load most recent active game
			game = await Game.findOne({
				user: req.userId,
				completed: false
			}).sort({ lastSaved: -1 });
		}

		if (!game) {
			return res.status(404).json({
				message: 'No saved game found',
				status: 'NEW_GAME_NEEDED'
			});
		}

		res.json(game);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;