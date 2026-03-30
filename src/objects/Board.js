import { ROWS, COLS, TILE_TYPES } from '../config.js';
import { findMatchesInGrid } from '../utils/MatchFinder.js';

export default class Board {
  constructor() {
    this.grid = [];
  }

  randomType() {
    return Math.floor(Math.random() * TILE_TYPES);
  }

  createBoard() {
    this.grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => this.randomType())
    );
    this.removeInitialMatches();
    return this.grid;
  }

  removeInitialMatches() {
    let matches = this.findMatches();
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        this.grid[row][col] = this.randomType();
      });
      matches = this.findMatches();
    }
  }

  swap(r1, c1, r2, c2) {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;
  }

  findMatches() {
    return findMatchesInGrid(this.grid);
  }

  hasValidMoves() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const directions = [
          [0, 1],
          [1, 0]
        ];

        for (const [dr, dc] of directions) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (nextRow >= ROWS || nextCol >= COLS) continue;

          this.swap(row, col, nextRow, nextCol);
          const hasMatch = this.findMatches().length > 0;
          this.swap(row, col, nextRow, nextCol);

          if (hasMatch) return true;
        }
      }
    }
    return false;
  }

  clearMatches(matches) {
    matches.forEach(({ row, col }) => {
      this.grid[row][col] = -1;
    });
  }

  applyGravity() {
    const movements = [];

    for (let col = 0; col < COLS; col += 1) {
      let writeRow = ROWS - 1;

      for (let row = ROWS - 1; row >= 0; row -= 1) {
        const value = this.grid[row][col];
        if (value === -1) continue;

        if (writeRow !== row) {
          this.grid[writeRow][col] = value;
          this.grid[row][col] = -1;
          movements.push({ fromRow: row, toRow: writeRow, col, type: value });
        }
        writeRow -= 1;
      }
    }

    return movements;
  }

  fillEmpty() {
    const spawns = [];

    for (let col = 0; col < COLS; col += 1) {
      let emptiesAbove = 0;

      for (let row = ROWS - 1; row >= 0; row -= 1) {
        if (this.grid[row][col] === -1) {
          emptiesAbove += 1;
        }
      }

      for (let row = 0; row < ROWS; row += 1) {
        if (this.grid[row][col] === -1) {
          const type = this.randomType();
          this.grid[row][col] = type;
          spawns.push({ row, col, type, fromRow: row - emptiesAbove });
          emptiesAbove -= 1;
        }
      }
    }

    return spawns;
  }
}
