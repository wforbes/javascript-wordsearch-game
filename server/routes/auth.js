const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
		res.json({ token });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;