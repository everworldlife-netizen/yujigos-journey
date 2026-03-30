import { COLS, ROWS } from '../config.js';

export default class MatchFinder {
  static find(grid) {
    const matched = new Set();
    const horizontalRuns = [];
    const verticalRuns = [];

    for (let row = 0; row < ROWS; row += 1) {
      let run = 1;
      for (let col = 1; col <= COLS; col += 1) {
        const same = col < COLS && grid[row][col] !== -1 && grid[row][col] === grid[row][col - 1];
        if (same) run += 1;
        else {
          if (run >= 3) {
            const start = col - run;
            horizontalRuns.push({ row, start, length: run });
            for (let i = start; i < col; i += 1) matched.add(`${row},${i}`);
          }
          run = 1;
        }
      }
    }

    for (let col = 0; col < COLS; col += 1) {
      let run = 1;
      for (let row = 1; row <= ROWS; row += 1) {
        const same = row < ROWS && grid[row][col] !== -1 && grid[row][col] === grid[row - 1][col];
        if (same) run += 1;
        else {
          if (run >= 3) {
            const start = row - run;
            verticalRuns.push({ col, start, length: run });
            for (let i = start; i < row; i += 1) matched.add(`${i},${col}`);
          }
          run = 1;
        }
      }
    }

    const specials = [];
    horizontalRuns.forEach((run) => {
      if (run.length >= 4) {
        specials.push({ row: run.row, col: run.start + Math.floor((run.length - 1) / 2), specialType: run.length >= 5 ? 'rainbow' : 'striped' });
      }
    });
    verticalRuns.forEach((run) => {
      if (run.length >= 4) {
        specials.push({ row: run.start + Math.floor((run.length - 1) / 2), col: run.col, specialType: run.length >= 5 ? 'rainbow' : 'bomb' });
      }
    });

    const crosses = new Set();
    horizontalRuns.forEach((h) => {
      verticalRuns.forEach((v) => {
        if (v.col >= h.start && v.col < h.start + h.length && h.row >= v.start && h.row < v.start + v.length) {
          crosses.add(`${h.row},${v.col}`);
        }
      });
    });

    crosses.forEach((key) => {
      const [row, col] = key.split(',').map(Number);
      specials.push({ row, col, specialType: 'bomb' });
    });

    const uniqueSpecials = Array.from(new Map(specials.map((s) => [`${s.row},${s.col}`, s])).values());

    return {
      matches: Array.from(matched).map((k) => {
        const [row, col] = k.split(',').map(Number);
        return { row, col };
      }),
      specials: uniqueSpecials
    };
  }
}
