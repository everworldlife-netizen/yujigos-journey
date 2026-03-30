import GAME_CONFIG from '../../config/GameConfig.js';
import EventBus from '../../utils/EventBus.js';
import MatchFinder from '../match/MatchFinder.js';
import { getSpecialTextureKey } from '../../config/AssetConfig.js';

export default class CascadeController {
  constructor(scene, board) {
    this.scene = scene;
    this.board = board;
    EventBus.on('cascade:start', this.resolve, this);
  }

  applyGravity() {
    const moves = [];
    for (let col = 0; col < GAME_CONFIG.BOARD_COLS; col += 1) {
      let write = GAME_CONFIG.BOARD_ROWS - 1;
      for (let row = GAME_CONFIG.BOARD_ROWS - 1; row >= 0; row -= 1) {
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
        const tile = this.board.tiles[toRow][col]?.sprite;
        const fallDistance = Math.abs(toRow - fromRow);
        return this.scene.tweenToGrid(tile, toRow, col, Math.max(GAME_CONFIG.FALL_DURATION_MIN, fallDistance * GAME_CONFIG.FALL_DURATION_PER_ROW), {
          ease: 'Quad.In',
          landingBounce: true,
          overshoot: 4,
          delay: col * 16
        });
      })
    );
  }

  async clearMatches(matches, specials) {
    const preserve = new Set(specials.map((s) => `${s.row},${s.col}`));
    await Promise.all(matches.map(({ row, col }, index) => this.clearSingle(row, col, preserve, specials, index)));
  }

  clearSingle(row, col, preserve, specials, index) {
    const key = `${row},${col}`;
    const tileModel = this.board.tiles[row][col];
    const tile = tileModel?.sprite;
    if (!tile) return Promise.resolve();

    if (preserve.has(key)) {
      const special = specials.find((s) => s.row === row && s.col === col);
      const overlay = this.scene.add.image(tile.x, tile.y, getSpecialTextureKey(special.specialType)).setDepth(7);
      tile.setData('special', special.specialType);
      if (tile.getData('specialSprite')) tile.getData('specialSprite').destroy();
      tile.setData('specialSprite', overlay);
      EventBus.emit('fx:specialGlow', { x: tile.x, y: tile.y });
      return Promise.resolve();
    }

    tileModel?.setState('matched');
    EventBus.emit('fx:matchBurst', { x: tile.x, y: tile.y, type: this.board.grid[row][col] });
    return new Promise((resolve) => {
      this.scene.time.delayedCall(index * GAME_CONFIG.MATCH_POP_DELAY_STEP, () => {
        this.scene.tweens.add({
          targets: [tile, tile.getData('specialSprite')].filter(Boolean),
          scaleX: 1.25,
          scaleY: 1.25,
          duration: GAME_CONFIG.MATCH_POP_DURATION,
          ease: 'Back.Out',
          onComplete: () => {
            this.scene.tweens.add({
              targets: [tile, tile.getData('specialSprite')].filter(Boolean),
              scaleX: 0,
              scaleY: 0,
              alpha: 0,
              duration: 120,
              ease: 'Sine.In',
              onComplete: () => {
                this.board.destroyTile(row, col);
                resolve();
              }
            });
          }
        });
      });
    });
  }

  async resolve({ initialMatches }) {
    let result = initialMatches;
    let depth = 0;
    EventBus.emit('input:lock');
    while (result.matches.length) {
      depth += 1;
      EventBus.emit('cascade:step', { depth, matchCount: result.matches.length });
      EventBus.emit('match:found', result);
      EventBus.emit('match:clear', { matchCount: result.matches.length, depth });
      await this.clearMatches(result.matches, result.specials);
      await this.applyGravity();
      await new Promise((resolve) => EventBus.emit('spawn:fill', { resolve }));
      result = MatchFinder.find(this.board.grid);
    }
    EventBus.emit('cascade:end');
    EventBus.emit('input:unlock');
    EventBus.emit('turn:complete');
  }

  destroy() {
    EventBus.off('cascade:start', this.resolve, this);
  }
}
