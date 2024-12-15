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



	renderGrid() {
		const gameGrid = document.getElementById('game-grid');
		gameGrid.innerHTML = '';

		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const cell = document.createElement('div');
				cell.className = 'grid-cell';
				cell.textContent = this.grid[i][j];
				cell.dataset.row = i;
				cell.dataset.col = j;

				// Add event listeners for selection
				cell.addEventListener('mousedown', (e) => this.startSelection(e, i, j));
				cell.addEventListener('mouseover', (e) => this.updateSelection(e, i, j));
				cell.addEventListener('mouseup', () => this.endSelection());

				gameGrid.appendChild(cell);
			}
		}

		// Add mouse leave handler for the grid
		gameGrid.addEventListener('mouseleave', () => {
			if (this.isSelecting) this.endSelection();
		});

		// Prevent text selection on the grid
		gameGrid.addEventListener('selectstart', (e) => e.preventDefault());

		this.renderWordList();
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

	endSelection() {
		if (!this.isSelecting) return;

		this.isSelecting = false;
		const word = this.getSelectedWord();

		// Check if word exists in our word list
		const foundWord = this.words.find(w =>
			w === word || w === word.split('').reverse().join('')
		);

		if (foundWord && !this.foundWords.has(foundWord)) {
			this.foundWords.add(foundWord);
			this.markWordAsFound(foundWord);
			this.checkGameCompletion();
		} else {
			// Clear selection if word not found
			this.clearSelection();
		}
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

	checkGameCompletion() {
		if (this.foundWords.size === this.words.length) {
			setTimeout(() => {
				alert('Congratulations! You found all the words!');
				// You can add more completion logic here
			}, 500);
		}
	}
}

// Initialize game
const game = new WordSearchGame();