let tokenCheckInterval;
const tokenCheckDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
const tokenRefreshDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds

document.addEventListener('DOMContentLoaded', checkAuthStatus);

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
			// Clear login form
			document.getElementById('username').value = '';
			document.getElementById('password').value = '';

			localStorage.setItem('token', data.token);
			showWelcome();
		} else {
			alert('Login failed. Please check your credentials.');
		}
	} catch (error) {
		console.error('Login error:', error);
		alert('Login failed. Please try again.');
	}
}

function startTokenCheck() {
	// Clear any existing interval
	if (tokenCheckInterval) {
		clearInterval(tokenCheckInterval);
	}

	tokenCheckInterval = setInterval(checkTokenExpiration, tokenCheckDuration);
}

function stopTokenCheck() {
	if (tokenCheckInterval) {
		clearInterval(tokenCheckInterval);
		tokenCheckInterval = null;
	}
}

function showGame() {
	document.getElementById('loading').style.display = 'none';
	document.getElementById('auth-container').style.display = 'none';
	document.getElementById('game-container').style.display = 'block';
	document.getElementById('app-toolbar').style.display = 'flex';

	startTokenCheck();

	game = new WordSearchGame();
	game.startNewGame();
}

function logout() {
	localStorage.removeItem('token');
	showAuth();
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

async function checkAuthStatus() {
    const loading = document.getElementById('loading');
    const authContainer = document.getElementById('auth-container');
    const gameContainer = document.getElementById('game-container');
    const welcomeContainer = document.getElementById('welcome-container');
	const appToolbar = document.getElementById('app-toolbar');

    // Show loading, hide others
    loading.style.display = 'block';
    authContainer.style.display = 'none';
    gameContainer.style.display = 'none';
    welcomeContainer.style.display = 'none';
	appToolbar.style.display = 'none';

    const token = localStorage.getItem('token');
    if (!token) {
        loading.style.display = 'none';
        authContainer.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loading.style.display = 'none';
            showWelcome();  // Show welcome page instead of game
        } else {
            localStorage.removeItem('token');
            loading.style.display = 'none';
            authContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        loading.style.display = 'none';
        authContainer.style.display = 'block';
    }
}

function showAuth() {
	document.getElementById('loading').style.display = 'none';
	document.getElementById('auth-container').style.display = 'block';
	document.getElementById('game-container').style.display = 'none';
	document.getElementById('welcome-container').style.display = 'none';
	document.getElementById('app-toolbar').style.display = 'none';
}

// Helper function to get auth headers
function getAuthHeaders() {
	const token = localStorage.getItem('token');
	return {
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json'
	};
}

// Use this for authenticated requests
async function authenticatedFetch(url, options = {}) {
	checkTokenExpiration();
	const headers = getAuthHeaders();
	const response = await fetch(url, {
		...options,
		headers: {
			...headers,
			...(options.headers || {})
		}
	});

	if (response.status === 401) {
		// Token expired or invalid
		localStorage.removeItem('token');
		window.location.reload();
		return null;
	}

	return response;
}

async function checkTokenExpiration() {
	const token = localStorage.getItem('token');
	if (!token) return;

	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		const expirationTime = payload.exp * 1000;
		const now = Date.now();
		const timeUntilExpiry = expirationTime - now;

		if (timeUntilExpiry < tokenRefreshDuration) {
			const refreshed = await refreshToken();
			if (!refreshed) {
				handleTokenError();
			}
		}
	} catch (error) {
		console.error('Token check failed:', error);
		handleTokenError();
	}
}

async function refreshToken() {
	try {
		const response = await fetch('/api/auth/refresh', {
			method: 'POST',
			headers: getAuthHeaders()
		});

		if (response.ok) {
			console.log("token refreshed");
			const data = await response.json();
			localStorage.setItem('token', data.token);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Token refresh failed:', error);
		return false;
	}
}

async function handleTokenError() {
	stopTokenCheck();
	localStorage.removeItem('token');
	alert('Your session has expired. Please log in again.');
	showAuth();
}

function showWelcome() {
	document.getElementById('loading').style.display = 'none';
	document.getElementById('auth-container').style.display = 'none';
	document.getElementById('game-container').style.display = 'none';
	document.getElementById('welcome-container').style.display = 'block';
	document.getElementById('app-toolbar').style.display = 'flex';

	loadGamesList();
}

async function loadGamesList() {
	try {
		const response = await fetch('/api/game/list', {
			headers: getAuthHeaders()
		});

		if (response.ok) {
			const { active, completed } = await response.json();
			renderGamesList(active, 'active-games-list');
			renderGamesList(completed, 'completed-games-list');
		}
	} catch (error) {
		console.error('Error loading games:', error);
	}
}

function renderGamesList(games, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (games.length === 0) {
        container.innerHTML = '<p>No games found</p>';
        return;
    }

    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        const lastSaved = new Date(game.lastSaved).toLocaleString();
        const wordsFound = game.foundWords ? game.foundWords.length : 0;
        const totalWords = game.words ? game.words.length : 0;

        gameCard.innerHTML = `
            <div class="info">
                <p>Last played: ${lastSaved}</p>
                <p>Progress: ${wordsFound}/${totalWords} words found</p>
            </div>
            <div class="actions">
                <button onclick="loadGame('${game._id}')">
                    ${game.completed ? 'View' : 'Continue'}
                </button>
                ${!game.completed ? `
                    <button onclick="deleteGame('${game._id}')">Delete</button>
                ` : ''}
            </div>
        `;

        container.appendChild(gameCard);
    });
}

function returnToWelcome() {
    if (game) {
        game.saveGameState();  // Save current progress
    }
    showWelcome();
}

async function startNewGame() {
    document.getElementById('welcome-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    game = new WordSearchGame();
    game.startNewGame();
}

async function loadGame(gameId) {
    document.getElementById('welcome-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    game = new WordSearchGame();
    await game.loadGameState(gameId);
}

async function deleteGame(gameId) {
    if (confirm('Are you sure you want to delete this game?')) {
        try {
            const response = await fetch(`/api/game/${gameId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                loadGamesList();
            }
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    }
}