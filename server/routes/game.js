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
		const user = req.userId;
		const gameState = req.body;

		// Create a new game document instead of updating existing one
		const game = new Game({
			user,
			grid: gameState.grid,
			words: gameState.words,
			foundWords: gameState.foundWords,
			completed: gameState.completed,
			difficulty: gameState.difficulty,
			lastSaved: new Date()
		});

		await game.save();
		res.status(200).json({
			message: 'Game saved successfully',
			gameId: game._id
		});
	} catch (error) {
		console.error('Error saving game:', error);
		res.status(500).json({ message: 'Error saving game state' });
	}
});

router.put('/save/:gameId', authenticateToken, async (req, res) => {
	try {
		const user = req.userId;
		const gameId = req.params.gameId;
		const gameState = req.body;

		const game = await Game.findOne({ _id: gameId, user });
		if (!game) {
			return res.status(404).json({ message: 'Game not found' });
		}

		game.grid = gameState.grid;
		game.words = gameState.words;
		game.foundWords = gameState.foundWords;
		game.completed = gameState.completed;
		game.difficulty = gameState.difficulty;
		game.lastSaved = new Date();

		await game.save();
		res.status(200).json({ message: 'Game updated successfully' });
	} catch (error) {
		console.error('Error updating game:', error);
		res.status(500).json({ message: 'Error updating game state' });
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

		game = game.toObject();
		game.gameId = game._id.toString();
		delete game._id;

		res.json(game);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.delete('/:gameId', authenticateToken, async (req, res) => {
	try {
		await Game.deleteOne({ _id: req.params.gameId, user: req.userId });
		res.status(200).json({ message: 'Game deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;