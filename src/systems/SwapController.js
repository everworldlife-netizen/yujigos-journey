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
    this.lock();
    this.board.swapCells(a.row, a.col, b.row, b.col);

    await Promise.all([
      this.scene.tweenToGrid(this.board.tiles[a.row][a.col], a.row, a.col, 220, 'Sine.InOut'),
      this.scene.tweenToGrid(this.board.tiles[b.row][b.col], b.row, b.col, 220, 'Sine.InOut')
    ]);

    const result = MatchFinder.find(this.board.grid);
    if (!result.matches.length) {
      this.board.swapCells(a.row, a.col, b.row, b.col);
      await Promise.all([
        this.scene.tweenToGrid(this.board.tiles[a.row][a.col], a.row, a.col, 200, 'Sine.InOut'),
        this.scene.tweenToGrid(this.board.tiles[b.row][b.col], b.row, b.col, 200, 'Sine.InOut')
      ]);
      this.unlock();
      return;
    }

    this.goalController.consumeMove();
    await this.cascadeController.resolve(result, true);
    this.unlock();
    this.scene.events.emit('turn-complete');
  }
}
