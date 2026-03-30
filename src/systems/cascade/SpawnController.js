import GAME_CONFIG from '../../config/GameConfig.js';
import EventBus from '../../utils/EventBus.js';

export default class SpawnController {
  constructor(scene, board) {
    this.scene = scene;
    this.board = board;
    EventBus.on('spawn:fill', this.fillEmpty, this);
  }

  async fillEmpty({ resolve }) {
    const spawns = [];
    for (let col = 0; col < GAME_CONFIG.BOARD_COLS; col += 1) {
      let empties = 0;
      for (let row = GAME_CONFIG.BOARD_ROWS - 1; row >= 0; row -= 1) if (this.board.grid[row][col] === -1) empties += 1;
      for (let row = 0; row < GAME_CONFIG.BOARD_ROWS; row += 1) {
        if (this.board.grid[row][col] !== -1) continue;
        const type = this.board.randomType();
        this.board.grid[row][col] = type;
        spawns.push({ row, col, type, fromRow: row - empties });
        empties -= 1;
      }
    }

    await Promise.all(
      spawns.map(({ row, col, type, fromRow }) => {
        const from = this.board.gridToWorld(fromRow, col);
        const tile = this.board.createTileAt(row, col, type, from).sprite.setScale(0);
        tile.setData('idlePhase', Math.random() * Math.PI * 2);
        tile.setData('idleAmplitude', 1.3 + Math.random() * 0.7);
        tile.setData('idleRotPhase', Math.random() * Math.PI * 2);
        tile.setData('idleRotAmplitude', 0.6 + Math.random() * 0.4);
        return Promise.all([
          this.scene.tweenToGrid(tile, row, col, Math.max(GAME_CONFIG.FALL_DURATION_MIN, Math.abs(row - fromRow) * GAME_CONFIG.FALL_DURATION_PER_ROW), {
            ease: 'Quad.In',
            landingBounce: true,
            overshoot: 4,
            delay: row * 30
          }),
          new Promise((done) => {
            this.scene.tweens.add({ targets: tile, scaleX: 1, scaleY: 1, duration: GAME_CONFIG.SPAWN_SCALE_DURATION, delay: row * 30, ease: 'Back.Out', onComplete: done });
          })
        ]);
      })
    );

    resolve();
  }

  destroy() {
    EventBus.off('spawn:fill', this.fillEmpty, this);
  }
}
