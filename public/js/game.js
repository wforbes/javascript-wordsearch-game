class WordSearchGame {
	constructor() {
		this.grid = [];
		this.words = [];
		this.size = 10;
	}

	initializeGrid() {
		// Create empty grid
		for (let i = 0; i < this.size; i++) {
			this.grid[i] = new Array(this.size).fill('');
		}
	}

	addWord(word) { }

	fillRemainingCells() {
		// Fill empty cells with random letters
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
				gameGrid.appendChild(cell);
			}
		}
	}
}

// Initialize game
const game = new WordSearchGame();