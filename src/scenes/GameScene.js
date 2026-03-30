import Phaser from 'phaser';
import {
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  COLS,
  ROWS,
  START_MOVES,
  TARGET_SCORE,
  TILE_SIZE
} from '../config.js';
import Board from '../objects/Board.js';
import Tile from '../objects/Tile.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.board = null;
    this.tileSprites = [];
    this.selectedTile = null;
    this.highlightSprite = null;
    this.inputLocked = false;
    this.score = 0;
    this.moves = START_MOVES;
    this.chainLevel = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f172a');
    this.score = 0;
    this.moves = START_MOVES;
    this.chainLevel = 0;
    this.inputLocked = false;

    this.board = new Board();
    this.board.createBoard();

    this.scoreText = this.add.text(24, 16, 'Score: 0', { fontSize: '24px', color: '#ffffff' });
    this.movesText = this.add.text(260, 16, `Moves: ${this.moves}`, {
      fontSize: '24px',
      color: '#ffffff'
    });

    this.tileSprites = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const type = this.board.grid[row][col];
        const { x, y } = this.gridToWorld(row, col);
        const tile = new Tile(this, row, col, type, x, y);
        tile.sprite.on('pointerdown', () => this.onTileClicked(tile));
        this.tileSprites[row][col] = tile;
      }
    }

    this.highlightSprite = this.add.image(0, 0, 'highlight').setVisible(false);
  }

  gridToWorld(row, col) {
    return {
      x: BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2,
      y: BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2
    };
  }

  areAdjacent(a, b) {
    const dRow = Math.abs(a.row - b.row);
    const dCol = Math.abs(a.col - b.col);
    return dRow + dCol === 1;
  }

  onTileClicked(tile) {
    if (this.inputLocked) return;

    if (!this.selectedTile) {
      this.selectedTile = tile;
      this.highlightSprite.setPosition(tile.sprite.x, tile.sprite.y).setVisible(true);
      return;
    }

    if (tile === this.selectedTile) {
      this.selectedTile = null;
      this.highlightSprite.setVisible(false);
      return;
    }

    if (!this.areAdjacent(this.selectedTile, tile)) {
      this.selectedTile = tile;
      this.highlightSprite.setPosition(tile.sprite.x, tile.sprite.y).setVisible(true);
      return;
    }

    const first = this.selectedTile;
    this.selectedTile = null;
    this.highlightSprite.setVisible(false);
    this.handleSwap(first, tile);
  }

  tweenTileTo(tile, row, col, duration) {
    const target = this.gridToWorld(row, col);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: tile.sprite,
        x: target.x,
        y: target.y,
        duration,
        onComplete: () => resolve()
      });
    });
  }

  async handleSwap(a, b) {
    this.inputLocked = true;

    const aRow = a.row;
    const aCol = a.col;
    const bRow = b.row;
    const bCol = b.col;

    this.tileSprites[aRow][aCol] = b;
    this.tileSprites[bRow][bCol] = a;

    await Promise.all([this.tweenTileTo(a, bRow, bCol, 200), this.tweenTileTo(b, aRow, aCol, 200)]);

    a.setGridPosition(bRow, bCol);
    b.setGridPosition(aRow, aCol);
    this.board.swap(aRow, aCol, bRow, bCol);

    const matches = this.board.findMatches();

    if (matches.length === 0) {
      this.tileSprites[aRow][aCol] = a;
      this.tileSprites[bRow][bCol] = b;

      await Promise.all([this.tweenTileTo(a, aRow, aCol, 200), this.tweenTileTo(b, bRow, bCol, 200)]);

      a.setGridPosition(aRow, aCol);
      b.setGridPosition(bRow, bCol);
      this.board.swap(aRow, aCol, bRow, bCol);
      this.inputLocked = false;
      return;
    }

    this.moves -= 1;
    this.updateHud();

    await this.resolveMatches(matches);

    if (this.score >= TARGET_SCORE) {
      this.showEndOverlay('You Win!');
      return;
    }

    if (this.moves <= 0 || !this.board.hasValidMoves()) {
      this.showEndOverlay('Game Over');
      return;
    }

    this.inputLocked = false;
  }

  updateHud() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.movesText.setText(`Moves: ${this.moves}`);
  }

  async resolveMatches(initialMatches) {
    let matches = initialMatches;
    this.chainLevel = 0;

    while (matches.length > 0) {
      this.chainLevel += 1;
      await this.clearMatches(matches);
      this.board.clearMatches(matches);

      this.score += matches.length * 10 + this.chainLevel * 5;
      this.updateHud();

      await this.animateGravity();
      await this.animateFill();

      matches = this.board.findMatches();
    }
  }

  async clearMatches(matches) {
    await Promise.all(
      matches.map(({ row, col }) => {
        const tile = this.tileSprites[row][col];
        if (!tile) return Promise.resolve();

        return new Promise((resolve) => {
          this.tweens.add({
            targets: tile.sprite,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 150,
            onComplete: () => {
              tile.destroy();
              this.tileSprites[row][col] = null;
              resolve();
            }
          });
        });
      })
    );
  }

  async animateGravity() {
    const movements = this.board.applyGravity();

    movements.forEach(({ fromRow, toRow, col }) => {
      const tile = this.tileSprites[fromRow][col];
      this.tileSprites[fromRow][col] = null;
      this.tileSprites[toRow][col] = tile;
    });

    const tweens = movements.map(({ fromRow, toRow, col }) => {
      const tile = this.tileSprites[toRow][col];
      if (!tile) return Promise.resolve();
      tile.setGridPosition(toRow, col);
      const duration = Math.max(100, Math.abs(toRow - fromRow) * 100);
      return this.tweenTileTo(tile, toRow, col, duration);
    });

    await Promise.all(tweens);
  }

  async animateFill() {
    const spawns = this.board.fillEmpty();

    const tweens = spawns.map(({ row, col, type, fromRow }) => {
      const target = this.gridToWorld(row, col);
      const from = this.gridToWorld(fromRow, col);
      const tile = new Tile(this, row, col, type, from.x, from.y);
      tile.sprite.on('pointerdown', () => this.onTileClicked(tile));
      this.tileSprites[row][col] = tile;

      const duration = Math.max(100, Math.abs(row - fromRow) * 100);
      return this.tweenTileTo(tile, row, col, duration);
    });

    await Promise.all(tweens);
  }

  showEndOverlay(message) {
    this.inputLocked = true;

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    this.add
      .text(width / 2, height / 2 - 40, message, {
        fontSize: '48px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const playAgain = this.add
      .text(width / 2, height / 2 + 40, 'Play Again', {
        fontSize: '32px',
        color: '#ffdd44',
        backgroundColor: '#1f2937',
        padding: { left: 14, right: 14, top: 8, bottom: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgain.on('pointerdown', () => this.scene.restart());
  }
}
