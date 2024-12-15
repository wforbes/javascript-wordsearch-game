class WordSearchGame {
	constructor() {
		this.grid = [];
		this.words = [];
		this.size = 10;
		this.directions = [
			[0, 1],   // right
			[1, 0],   // down
			[1, 1],   // diagonal right-down
			[-1, 1],  // diagonal right-up
		];
		this.isSelecting = false;
		this.selectedCells = [];
		this.foundWords = new Set();
		this.gameActive = false;
		this.autoSaveTimeout = null;
	}

	startNewGame() {
		// Clear any existing auto-save timeout
		if (this.autoSaveTimeout) {
			clearTimeout(this.autoSaveTimeout);
			this.autoSaveTimeout = null;
		}

		checkTokenExpiration();
		this.grid = [];
		this.words = [];
		this.foundWords.clear();
		this.selectedCells = [];
		this.gameActive = true;
		this.loadGameState().then(loaded => {
			if (!loaded) {
				// If no saved game, start new one
				this.initializeGrid();
			}
			this.renderGrid();
		});
	}

	initializeGrid() {
		// Create empty grid
		this.grid = Array(this.size).fill().map(() => Array(this.size).fill(''));

		// Sample words (you can modify this list or load from external source)
		const wordList = ['HELLO', 'WORLD', 'GAME', 'PLAY', 'FUN'];

		// Add words to the grid
		wordList.forEach(word => {
			if (this.addWord(word)) {
				this.words.push(word);
			}
		});

		// Fill remaining empty cells
		this.fillRemainingCells();
	}

	addWord(word) {
		// Try multiple times to place the word
		for (let attempts = 0; attempts < 50; attempts++) {
			// Choose random starting position and direction
			const row = Math.floor(Math.random() * this.size);
			const col = Math.floor(Math.random() * this.size);
			const direction = this.directions[Math.floor(Math.random() * this.directions.length)];

			if (this.canPlaceWord(word, row, col, direction)) {
				this.placeWord(word, row, col, direction);
				return true;
			}
		}
		return false;
	}

	canPlaceWord(word, row, col, direction) {
		const [dRow, dCol] = direction;

		// Check if word fits within grid bounds
		if (row + dRow * (word.length - 1) >= this.size ||
			row + dRow * (word.length - 1) < 0 ||
			col + dCol * (word.length - 1) >= this.size ||
			col + dCol * (word.length - 1) < 0) {
			return false;
		}

		// Check if word can be placed without conflicts
		for (let i = 0; i < word.length; i++) {
			const currentRow = row + dRow * i;
			const currentCol = col + dCol * i;
			const currentCell = this.grid[currentRow][currentCol];

			if (currentCell !== '' && currentCell !== word[i]) {
				return false;
			}
		}

		return true;
	}

	placeWord(word, row, col, direction) {
		const [dRow, dCol] = direction;

		for (let i = 0; i < word.length; i++) {
			const currentRow = row + dRow * i;
			const currentCol = col + dCol * i;
			this.grid[currentRow][currentCol] = word[i];
		}
	}

	fillRemainingCells() {
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				if (this.grid[i][j] === '') {
					this.grid[i][j] = String.fromCharCode(
						65 + Math.floor(Math.random() * 26)
					);
				}
			}
		}
	}

	checkGameCompletion() {
		if (this.foundWords.size === this.words.length) {
			// Clear any pending auto-save
			if (this.autoSaveTimeout) {
				clearTimeout(this.autoSaveTimeout);
				this.autoSaveTimeout = null;
			}

			// Save the final state of the game
			this.saveGameState();

			this.gameActive = false;
			setTimeout(() => {
				const playAgain = confirm('Congratulations! You found all the words! Would you like to play again?');
				if (playAgain) {
					this.startNewGame();
				} else {
					// Optional: Show a summary or return to main menu
					this.showGameSummary();
				}
			}, 500);
		}
	}

	showGameSummary() {
		const gameGrid = document.getElementById('game-grid');
		const wordList = document.getElementById('word-list');

		// Clear the game area
		gameGrid.innerHTML = '';
		wordList.innerHTML = '';

		// Show summary message
		const summaryDiv = document.createElement('div');
		summaryDiv.className = 'game-summary';
		summaryDiv.innerHTML = `
			<h2>Game Complete!</h2>
			<p>You found all ${this.words.length} words!</p>
			<button onclick="game.startNewGame()">Start New Game</button>
		`;
		gameGrid.appendChild(summaryDiv);
	}

	endSelection() {
		if (!this.isSelecting || !this.gameActive) return;

		this.isSelecting = false;
		const word = this.getSelectedWord();

		const foundWord = this.words.find(w =>
			w === word || w === word.split('').reverse().join('')
		);

		if (foundWord && !this.foundWords.has(foundWord)) {
			this.foundWords.add(foundWord);
			this.markWordAsFound(foundWord);
			this.checkGameCompletion();
		} else {
			this.clearSelection();
		}
	}

	renderGrid() {
		const gameGrid = document.getElementById('game-grid');
		gameGrid.innerHTML = '';

		// Always render the grid, even for completed games
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const cell = document.createElement('div');
				cell.className = 'grid-cell';
				cell.textContent = this.grid[i][j];
				cell.dataset.row = i;
				cell.dataset.col = j;

				// Check if this cell is part of any found word
				if (this.isCellInFoundWord(i, j)) {
					cell.classList.add('found');
				}

				// Only add event listeners if game is active
				if (this.gameActive) {
					cell.addEventListener('mousedown', (e) => this.startSelection(e, i, j));
					cell.addEventListener('mouseover', (e) => this.updateSelection(e, i, j));
					cell.addEventListener('mouseup', () => this.endSelection());
				}

				gameGrid.appendChild(cell);
			}
		}

		// Add mouse leave handler for the grid only if game is active
		if (this.gameActive) {
			gameGrid.addEventListener('mouseleave', () => {
				if (this.isSelecting) this.endSelection();
			});
			gameGrid.addEventListener('selectstart', (e) => e.preventDefault());
		}

		this.renderWordList();
	}

	// Add this new helper method to check if a cell is part of a found word
	isCellInFoundWord(row, col) {
		for (const word of this.foundWords) {
			// For each possible starting position that could include our cell
			for (let startOffset = 0; startOffset < word.length; startOffset++) {
				// Check each direction
				for (const [dRow, dCol] of this.directions) {
					// Calculate potential start position
					const startRow = row - (dRow * startOffset);
					const startCol = col - (dCol * startOffset);

					// Check if a word starts here and includes our cell
					if (this.checkWordAtPosition(word, startRow, startCol, dRow, dCol, row, col)) {
						return true;
					}

					// Check reverse direction
					const revStartRow = row + (dRow * (startOffset - (word.length - 1)));
					const revStartCol = col + (dCol * (startOffset - (word.length - 1)));
					if (this.checkWordAtPosition(word, revStartRow, revStartCol, -dRow, -dCol, row, col)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	checkWordAtPosition(word, startRow, startCol, dRow, dCol, targetRow, targetCol) {
		// First check if the word would be in bounds
		for (let i = 0; i < word.length; i++) {
			const currentRow = startRow + (dRow * i);
			const currentCol = startCol + (dCol * i);

			// Check bounds
			if (currentRow < 0 || currentRow >= this.size ||
				currentCol < 0 || currentCol >= this.size) {
				return false;
			}
		}

		// Now check if the word matches and includes our target cell
		let foundTarget = false;
		for (let i = 0; i < word.length; i++) {
			const currentRow = startRow + (dRow * i);
			const currentCol = startCol + (dCol * i);

			// Check if this is our target cell
			if (currentRow === targetRow && currentCol === targetCol) {
				foundTarget = true;
			}

			// Check if letter matches
			if (this.grid[currentRow][currentCol] !== word[i]) {
				return false;
			}
		}

		// Return true only if we found the target cell and the word matches
		return foundTarget;
	}

	renderWordList() {
		const wordList = document.getElementById('word-list');
		wordList.innerHTML = '<h3>Find these words:</h3>';
		const ul = document.createElement('ul');
		this.words.forEach(word => {
			const li = document.createElement('li');
			li.textContent = word;
			li.dataset.word = word;
			if (this.foundWords.has(word)) {
				li.classList.add('word-found');
			}
			ul.appendChild(li);
		});
		wordList.appendChild(ul);
	}

	startSelection(event, row, col) {
		this.isSelecting = true;
		this.selectedCells = [{ row, col }];
		this.updateCellHighlight();
	}

	updateSelection(event, row, col) {
		if (!this.isSelecting) return;

		const lastCell = this.selectedCells[0];
		const newCells = [];

		// Calculate direction
		const dRow = row - lastCell.row;
		const dCol = col - lastCell.col;

		// Only allow selection in valid directions
		if (!this.isValidDirection(dRow, dCol)) return;

		// Calculate all cells in the line
		const length = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;
		const stepRow = dRow === 0 ? 0 : dRow / Math.abs(dRow);
		const stepCol = dCol === 0 ? 0 : dCol / Math.abs(dCol);

		for (let i = 0; i < length; i++) {
			const currentRow = lastCell.row + (stepRow * i);
			const currentCol = lastCell.col + (stepCol * i);
			if (currentRow >= 0 && currentRow < this.size &&
				currentCol >= 0 && currentCol < this.size) {
				newCells.push({ row: currentRow, col: currentCol });
			}
		}

		this.selectedCells = newCells;
		this.updateCellHighlight();
	}

	getSelectedWord() {
		return this.selectedCells.map(cell =>
			this.grid[cell.row][cell.col]
		).join('');
	}

	updateCellHighlight() {
		// Clear all highlights
		document.querySelectorAll('.grid-cell').forEach(cell =>
			cell.classList.remove('selected')
		);

		// Add highlight to selected cells
		this.selectedCells.forEach(({ row, col }) => {
			const cell = document.querySelector(
				`.grid-cell[data-row="${row}"][data-col="${col}"]`
			);
			if (cell) cell.classList.add('selected');
		});
	}

	clearSelection() {
		this.selectedCells = [];
		this.updateCellHighlight();
	}

	markWordAsFound(word) {
		// Highlight the found word in the grid
		this.selectedCells.forEach(({ row, col }) => {
			const cell = document.querySelector(
				`.grid-cell[data-row="${row}"][data-col="${col}"]`
			);
			if (cell) {
				cell.classList.remove('selected');
				cell.classList.add('found');
			}
			this.scheduleAutoSave();
		});

		// Mark the word in the word list
		const wordElement = document.querySelector(`#word-list li[data-word="${word}"]`);
		if (wordElement) {
			wordElement.classList.add('word-found');
		}
	}

	isValidDirection(dRow, dCol) {
		// Check if the selection direction matches one of our valid directions
		return this.directions.some(([validDRow, validDCol]) => {
			const scale = Math.max(Math.abs(dRow), Math.abs(dCol));
			return scale === 0 || (
				dRow / scale === validDRow &&
				dCol / scale === validDCol
			);
		});
	}

	scheduleAutoSave() {

		// Don't schedule saves for completed games
		if (!this.gameActive) {
			return;
		}

		if (this.autoSaveTimeout) {
			clearTimeout(this.autoSaveTimeout);
		}
		this.autoSaveTimeout = setTimeout(() => {
			this.saveGameState()
		}, 1000);
	}

	async saveGameState() {
		// Don't save if we're just viewing a completed game
		if (!this.gameActive) {
			return;
		}

		try {
			const gameState = {
				grid: this.grid,
				words: this.words,
				foundWords: Array.from(this.foundWords),
				completed: this.foundWords.size === this.words.length
			};

			const response = await fetch('/api/game/save', {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(gameState)
			});

			if (!response.ok) {
				console.error('Failed to save game state');
			}
		} catch (error) {
			console.error('Error saving game state:', error);
		}
	}

	async loadGameState(gameId) {
		try {
			const url = gameId
				? `/api/game/load/${gameId}`
				: '/api/game/load';

			const response = await fetch(url, {
				method: 'GET',
				headers: getAuthHeaders()
			});

			if (response.ok) {
				const gameState = await response.json();
				this.grid = gameState.grid;
				this.words = gameState.words;
				this.foundWords = new Set(gameState.foundWords);
				this.gameActive = !gameState.completed;

				// Render the grid without saving a new game state
				this.renderGrid();

				// If game is completed, show completion status but don't save
				if (gameState.completed) {
					this.showCompletedGameView();
				}

				return true;
			}

			if (response.status === 404) {
				console.log('No saved game found, starting new game');
				return false;
			}

			console.error('Failed to load game state:', response.status);
			return false;
		} catch (error) {
			console.error('Error loading game state:', error);
			return false;
		}
	}

	showCompletedGameView() {
		const gameContainer = document.getElementById('game-container');
		const completionMessage = document.createElement('div');
		completionMessage.className = 'completion-message';
		completionMessage.innerHTML = `
			<h2>Completed Game</h2>
			<p>Words found: ${this.foundWords.size}/${this.words.length}</p>
			<button onclick="returnToWelcome()">Return to Games List</button>
		`;
		gameContainer.appendChild(completionMessage);
	}
}

// Initialize game and start first game
let game;
