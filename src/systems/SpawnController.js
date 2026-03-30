import { COLS, ROWS } from '../config.js';

export default class SpawnController {
  constructor(scene, board) {
    this.scene = scene;
    this.board = board;
  }

  fillEmpty() {
    const spawns = [];
    for (let col = 0; col < COLS; col += 1) {
      let empties = 0;
      for (let row = ROWS - 1; row >= 0; row -= 1) {
        if (this.board.grid[row][col] === -1) empties += 1;
      }

      for (let row = 0; row < ROWS; row += 1) {
        if (this.board.grid[row][col] !== -1) continue;
        const type = this.board.randomType();
        this.board.grid[row][col] = type;
        spawns.push({ row, col, type, fromRow: row - empties });
        empties -= 1;
      }
    }
    return Promise.all(
      spawns.map(({ row, col, type, fromRow }) => {
        const from = this.board.gridToWorld(fromRow, col);
        const tile = this.board.createTileSprite(row, col, type, from.x, from.y).setScale(0);
        return Promise.all([
          this.scene.tweenToGrid(tile, row, col, Math.max(120, Math.abs(row - fromRow) * 105)),
          new Promise((resolve) => {
            this.scene.tweens.add({
              targets: tile,
              scaleX: 1,
              scaleY: 1,
              duration: 260,
              delay: row * 30,
              ease: 'Back.Out',
              onComplete: resolve
            });
          })
        ]);
      })
    );
  }
}
