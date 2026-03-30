import Phaser from 'phaser';
import GAME_CONFIG from '../../config/GameConfig.js';
import EventBus from '../../utils/EventBus.js';
import MatchFinder from '../match/MatchFinder.js';

export default class SwapController {
  constructor(scene, board) {
    this.scene = scene;
    this.board = board;
    this.selected = null;
    this.locked = true;
    this.dragTile = null;
    this.dragStart = null;

    EventBus.on('input:tileDown', this.onTileDown, this);
    EventBus.on('input:tileUp', this.onTileUp, this);
    EventBus.on('input:lock', this.lock, this);
    EventBus.on('input:unlock', this.unlock, this);
  }

  unlock() { this.locked = false; }
  lock() { this.locked = true; }

  areAdjacent(a, b) { return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1; }

  async trySwap(a, b) {
    if (!this.areAdjacent(a, b) || this.locked) return false;
    this.lock();
    EventBus.emit('swap:start', { a, b });
    this.board.swapCells(a.row, a.col, b.row, b.col);
    const swappedA = this.board.tiles[a.row][a.col]?.sprite;
    const swappedB = this.board.tiles[b.row][b.col]?.sprite;

    await Promise.all([
      this.scene.tweenToGrid(swappedA, a.row, a.col, GAME_CONFIG.SWAP_DURATION, { ease: 'Cubic.InOut', arc: 6, pulse: true }),
      this.scene.tweenToGrid(swappedB, b.row, b.col, GAME_CONFIG.SWAP_DURATION, { ease: 'Cubic.InOut', arc: 6, pulse: true })
    ]);

    const result = MatchFinder.find(this.board.grid);
    if (!result.matches.length) {
      this.board.swapCells(a.row, a.col, b.row, b.col);
      await Promise.all([
        this.scene.tweenToGrid(swappedA, b.row, b.col, GAME_CONFIG.SWAP_INVALID_DURATION, { ease: 'Cubic.InOut', arc: 4, pulse: true }),
        this.scene.tweenToGrid(swappedB, a.row, a.col, GAME_CONFIG.SWAP_INVALID_DURATION, { ease: 'Cubic.InOut', arc: 4, pulse: true })
      ]);
      await new Promise((resolve) => this.scene.time.delayedCall(GAME_CONFIG.TURN_BUFFER_DELAY, resolve));
      await Promise.all([
        this.scene.tweenToGrid(swappedA, a.row, a.col, GAME_CONFIG.SWAP_INVALID_DURATION, { ease: 'Cubic.InOut', arc: 4, pulse: true }),
        this.scene.tweenToGrid(swappedB, b.row, b.col, GAME_CONFIG.SWAP_INVALID_DURATION, { ease: 'Cubic.InOut', arc: 4, pulse: true })
      ]);
      if (swappedA && swappedB) EventBus.emit('fx:shake', { tiles: [swappedA, swappedB], intensity: 2, duration: 26 });
      EventBus.emit('swap:invalid', { a, b });
      this.unlock();
      return false;
    }

    EventBus.emit('moves:consume');
    EventBus.emit('swap:complete', { a, b });
    EventBus.emit('cascade:start', { initialMatches: result });
    return true;
  }

  onTileDown({ row, col, sprite, pointer }) {
    if (this.locked) return;
    this.dragTile = sprite;
    this.dragStart = { x: sprite.x, y: sprite.y };
    sprite.setData('interactiveScale', 1.08);
    this.scene.tweens.add({ targets: sprite, scaleX: 1.08, scaleY: 1.08, duration: 60, ease: 'Sine.Out' });

    if (!this.selected) {
      this.selected = { row, col };
      return;
    }

    const selected = this.selected;
    if (selected.row === row && selected.col === col) {
      this.selected = null;
      return;
    }

    if (this.areAdjacent(selected, { row, col })) {
      this.selected = null;
      this.trySwap(selected, { row, col });
    }
  }

  onTileUp({ row, col, pointer, sprite }) {
    if (sprite) this.scene.tweens.add({ targets: sprite, scaleX: 1, scaleY: 1, angle: 0, duration: 80, ease: 'Sine.In' });
    if (!pointer || !this.dragStart || this.locked) return;
    const dx = pointer.x - this.dragStart.x;
    const dy = pointer.y - this.dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < GAME_CONFIG.MIN_SWIPE_DISTANCE) return;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const minAxis = Math.max(0.01, Math.min(absX, absY));
    const maxAxis = Math.max(absX, absY);
    const angleDeg = Phaser.Math.RadToDeg(Math.atan2(minAxis, maxAxis));
    if (angleDeg > 45) return;

    const target = absX >= absY ? { row, col: col + (dx > 0 ? 1 : -1) } : { row: row + (dy > 0 ? 1 : -1), col };
    if (target.row < 0 || target.row >= GAME_CONFIG.BOARD_ROWS || target.col < 0 || target.col >= GAME_CONFIG.BOARD_COLS) return;
    this.trySwap({ row, col }, target);
  }

  destroy() {
    EventBus.off('input:tileDown', this.onTileDown, this);
    EventBus.off('input:tileUp', this.onTileUp, this);
    EventBus.off('input:lock', this.lock, this);
    EventBus.off('input:unlock', this.unlock, this);
  }
}
