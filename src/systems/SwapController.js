import MatchFinder from './MatchFinder.js';

export default class SwapController {
  constructor(scene, board, cascadeController, goalController) {
    this.scene = scene;
    this.board = board;
    this.cascadeController = cascadeController;
    this.goalController = goalController;
    this.selected = null;
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  lock() {
    this.locked = true;
  }

  areAdjacent(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  async trySwap(a, b) {
    if (!this.areAdjacent(a, b)) return false;

    this.lock();
    if (this.scene.setBoardActionState) this.scene.setBoardActionState(true);
    this.board.swapCells(a.row, a.col, b.row, b.col);
    const swappedA = this.board.tiles[a.row][a.col];
    const swappedB = this.board.tiles[b.row][b.col];

    await Promise.all([
      this.scene.tweenToGrid(swappedA, a.row, a.col, 200, { ease: 'Cubic.InOut', arc: 6, pulse: true }),
      this.scene.tweenToGrid(swappedB, b.row, b.col, 200, { ease: 'Cubic.InOut', arc: 6, pulse: true })
    ]);

    const result = MatchFinder.find(this.board.grid);
    if (!result.matches.length) {
      this.board.swapCells(a.row, a.col, b.row, b.col);
      await Promise.all([
        this.scene.tweenToGrid(swappedA, b.row, b.col, 150, { ease: 'Cubic.InOut', arc: 4, pulse: true }),
        this.scene.tweenToGrid(swappedB, a.row, a.col, 150, { ease: 'Cubic.InOut', arc: 4, pulse: true })
      ]);
      await new Promise((resolve) => this.scene.time.delayedCall(80, resolve));
      await Promise.all([
        this.scene.tweenToGrid(swappedA, a.row, a.col, 150, { ease: 'Cubic.InOut', arc: 4, pulse: true }),
        this.scene.tweenToGrid(swappedB, b.row, b.col, 150, { ease: 'Cubic.InOut', arc: 4, pulse: true })
      ]);
      await this.scene.shakeTiles([swappedA, swappedB], 2, 26);
      if (this.scene.setBoardActionState) this.scene.setBoardActionState(false);
      this.unlock();
      return false;
    }

    this.goalController.consumeMove();
    await this.cascadeController.resolve(result);
    if (this.scene.setBoardActionState) this.scene.setBoardActionState(false);
    this.unlock();
    this.scene.events.emit('turn-complete');
    return true;
  }
}
