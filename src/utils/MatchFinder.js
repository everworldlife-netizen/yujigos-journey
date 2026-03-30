import { ROWS, COLS } from '../config.js';

export function findMatchesInGrid(grid) {
  const matched = new Set();

  for (let row = 0; row < ROWS; row += 1) {
    let count = 1;

    for (let col = 1; col <= COLS; col += 1) {
      if (col < COLS && grid[row][col] === grid[row][col - 1] && grid[row][col] !== -1) {
        count += 1;
      } else {
        if (count >= 3) {
          for (let k = col - count; k < col; k += 1) {
            matched.add(`${row},${k}`);
          }
        }
        count = 1;
      }
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    let count = 1;

    for (let row = 1; row <= ROWS; row += 1) {
      if (row < ROWS && grid[row][col] === grid[row - 1][col] && grid[row][col] !== -1) {
        count += 1;
      } else {
        if (count >= 3) {
          for (let k = row - count; k < row; k += 1) {
            matched.add(`${k},${col}`);
          }
        }
        count = 1;
      }
    }
  }

  return Array.from(matched).map((key) => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}
