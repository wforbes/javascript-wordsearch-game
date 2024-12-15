async function login() {
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;

	try {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, password })
		});

		const data = await response.json();
		if (data.token) {
			document.getElementById('username').value = '';
			document.getElementById('password').value = '';

			localStorage.setItem('token', data.token);
			showGame();
		}
	} catch (error) {
		console.error('Login error:', error);
	}
}

function showGame() {
	document.getElementById('auth-container').style.display = 'none';
	document.getElementById('game-container').style.display = 'block';
	game.initializeGrid();
	game.renderGrid();
}

function logout() {
	localStorage.removeItem('token');
	document.getElementById('auth-container').style.display = 'block';
	document.getElementById('game-container').style.display = 'none';
}

function showRegister() {
	document.getElementById('username').value = '';
	document.getElementById('password').value = '';
	document.getElementById('login-form').style.display = 'none';
	document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
	document.getElementById('reg-username').value = '';
	document.getElementById('reg-password').value = '';
	document.getElementById('reg-confirm-password').value = '';
	document.getElementById('login-form').style.display = 'block';
	document.getElementById('register-form').style.display = 'none';
}

async function register() {
	const username = document.getElementById('reg-username').value;
	const password = document.getElementById('reg-password').value;
	const confirmPassword = document.getElementById('reg-confirm-password').value;

	// Basic validation
	if (password !== confirmPassword) {
		alert('Passwords do not match!');
		return;
	}

	try {
		const response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, password })
		});

		const data = await response.json();

		if (response.ok) {
			alert('Registration successful! Please login.');
			showLogin();
			// Clear the registration form
			document.getElementById('reg-username').value = '';
			document.getElementById('reg-password').value = '';
			document.getElementById('reg-confirm-password').value = '';
		} else {
			alert(data.message || 'Registration failed. Please try again.');
		}
	} catch (error) {
		console.error('Registration error:', error);
		alert('Registration failed. Please try again.');
	}
}