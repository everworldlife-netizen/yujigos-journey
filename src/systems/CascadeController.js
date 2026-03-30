import { COLS, ROWS } from '../config.js';
import MatchFinder from './MatchFinder.js';

export default class CascadeController {
  constructor(scene, board, spawnController, comboController) {
    this.scene = scene;
    this.board = board;
    this.spawnController = spawnController;
    this.comboController = comboController;
  }

  applyGravity() {
    const moves = [];
    for (let col = 0; col < COLS; col += 1) {
      let write = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row -= 1) {
        if (this.board.grid[row][col] === -1) continue;
        if (write !== row) {
          this.board.moveTile(row, col, write, col);
          moves.push({ fromRow: row, toRow: write, col });
        }
        write -= 1;
      }
    }

    return Promise.all(
      moves.map(({ fromRow, toRow, col }) => {
        const tile = this.board.tiles[toRow][col];
        const fallDistance = Math.abs(toRow - fromRow);
        return this.scene.tweenToGrid(tile, toRow, col, Math.max(120, fallDistance * 95), {
          ease: 'Quad.In',
          landingBounce: true,
          overshoot: 4,
          delay: col * 16
        });
      })
    );
  }

  async resolve(initialMatches) {
    let result = initialMatches;
    this.comboController.reset();

    while (result.matches.length) {
      const chain = this.comboController.bump();
      if (this.scene.setComboDepth) this.scene.setComboDepth(chain);
      this.scene.events.emit('matches-resolved', { chain, matchCount: result.matches.length });
      await this.scene.clearMatches(result.matches, result.specials);
      await this.applyGravity();
      await this.spawnController.fillEmpty();
      result = MatchFinder.find(this.board.grid);
    }
  }
}
