const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const tokenExpiration = '7d';

// Register
router.post('/register', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		const user = new User({
			username: req.body.username,
			password: hashedPassword
		});
		await user.save();
		res.status(201).json({ message: 'User created successfully' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Login
router.post('/login', async (req, res) => {
	try {
		const user = await User.findOne({ username: req.body.username });
		if (!user) return res.status(400).json({ message: 'User not found' });

		const validPassword = await bcrypt.compare(req.body.password, user.password);
		if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET,
			{ expiresIn: tokenExpiration }
		);
		res.json({ token });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Token verification endpoint
router.get('/verify', async (req, res) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'No token provided' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId);

		if (!user) {
			return res.status(401).json({ message: 'User not found' });
		}

		const timeLeft = decoded.exp - Math.floor(Date.now() / 1000);
		console.log('Time left on token:', timeLeft);

		res.json({
			valid: true,
			expiresIn: timeLeft
		});
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ message: 'Token has expired' });
		}
		res.status(401).json({ message: 'Invalid token' });
	}
});

router.post('/refresh', async (req, res) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'No token provided' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Create new token with renewed expiration
		const newToken = jwt.sign(
			{ userId: decoded.userId },
			process.env.JWT_SECRET,
			{ expiresIn: tokenExpiration }
		);

		res.json({ token: newToken });
	} catch (error) {
		res.status(401).json({ message: 'Invalid token' });
	}
});

module.exports = router;