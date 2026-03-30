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

const TILE_COLORS = [0xff4444, 0x4488ff, 0x44dd44, 0xffdd44, 0xbb44ff, 0xff8844];

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
    this.level = 1;
  }

  create() {
    this.cameras.main.setBackgroundColor('#091022');
    this.score = 0;
    this.moves = START_MOVES;
    this.chainLevel = 0;
    this.inputLocked = true;

    this.createAmbience();
    this.createBoardFrame();

    this.board = new Board();
    this.board.createBoard();

    this.createHud();

    this.tileSprites = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const type = this.board.grid[row][col];
        const { x, y } = this.gridToWorld(row, col);
        const tile = new Tile(this, row, col, type, x, y);
        tile.sprite.setScale(0);
        tile.sprite.setAlpha(0);
        tile.sprite.on('pointerdown', () => this.onTileClicked(tile));
        this.tileSprites[row][col] = tile;
      }
    }

    this.highlightSprite = this.add.image(0, 0, 'highlight').setVisible(false).setDepth(8);
    this.createParticleSystems();
    this.animateUiEntrance();
    this.animateInitialTiles();
  }

  createAmbience() {
    const { width, height } = this.scale;

    const bg = this.add.graphics().setDepth(-30);
    bg.fillGradientStyle(0x1d2d62, 0x10214f, 0x0b1230, 0x182549, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 12; i += 1) {
      const light = this.add
        .image(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height),
          'bokeh'
        )
        .setTint(Phaser.Display.Color.GetColor(200 + Phaser.Math.Between(0, 40), 180, 255))
        .setAlpha(Phaser.Math.FloatBetween(0.08, 0.2))
        .setScale(Phaser.Math.FloatBetween(1.2, 3))
        .setDepth(-25);

      this.tweens.add({
        targets: light,
        x: light.x + Phaser.Math.Between(-40, 40),
        y: light.y + Phaser.Math.Between(-70, 70),
        alpha: Phaser.Math.FloatBetween(0.06, 0.16),
        duration: Phaser.Math.Between(7000, 14000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }

  createBoardFrame() {
    const boardWidth = COLS * TILE_SIZE;
    const boardHeight = ROWS * TILE_SIZE;
    const x = BOARD_OFFSET_X;
    const y = BOARD_OFFSET_Y;

    const shadow = this.add.graphics().setDepth(-10);
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(x - 18, y - 14, boardWidth + 36, boardHeight + 36, 26);

    const frame = this.add.graphics().setDepth(-8);
    frame.fillStyle(0x332211, 0.8);
    frame.fillRoundedRect(x - 14, y - 14, boardWidth + 28, boardHeight + 28, 24);

    frame.lineStyle(4, 0xe8c572, 0.95);
    frame.strokeRoundedRect(x - 14, y - 14, boardWidth + 28, boardHeight + 28, 24);

    frame.lineStyle(2, 0xffe7a7, 0.55);
    frame.strokeRoundedRect(x - 10, y - 10, boardWidth + 20, boardHeight + 20, 20);

    const innerGlow = this.add.graphics().setDepth(-6);
    innerGlow.fillStyle(0xffffff, 0.06);
    innerGlow.fillRoundedRect(x - 4, y - 4, boardWidth + 8, boardHeight + 8, 14);
  }

  createHudPanel(x, y, width, height, label, value, delay) {
    const panel = this.add.container(x, y).setDepth(15).setAlpha(0);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.28);
    shadow.fillRoundedRect(4, 6, width, height, 14);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2f3f74, 0x3f5ea0, 0x1b2c58, 0x273e77, 1);
    bg.fillRoundedRect(0, 0, width, height, 14);
    bg.lineStyle(2, 0x8fb0ff, 0.45);
    bg.strokeRoundedRect(0, 0, width, height, 14);

    const labelText = this.add.text(14, 8, label, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '14px',
      color: '#cfe0ff'
    });

    const valueText = this.add.text(14, 27, value, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700',
      color: '#ffffff'
    });

    panel.add([shadow, bg, labelText, valueText]);
    panel.setData('delay', delay);
    return { panel, valueText };
  }

  createHud() {
    const panelWidth = 160;
    const panelHeight = 66;
    const y = 10;

    this.scorePanel = this.createHudPanel(14, y, panelWidth, panelHeight, 'SCORE', '0', 0);
    this.levelPanel = this.createHudPanel(184, y, panelWidth, panelHeight, 'LEVEL', `${this.level}`, 80);
    this.movesPanel = this.createHudPanel(
      354,
      y,
      panelWidth,
      panelHeight,
      'MOVES',
      `${this.moves}`,
      160
    );
  }

  animateUiEntrance() {
    [this.scorePanel.panel, this.levelPanel.panel, this.movesPanel.panel].forEach((panel) => {
      panel.y -= 24;
      this.tweens.add({
        targets: panel,
        y: panel.y + 24,
        alpha: 1,
        duration: 420,
        delay: panel.getData('delay'),
        ease: 'Back.Out'
      });
    });
  }

  animateInitialTiles() {
    const allTweens = [];

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = this.tileSprites[row][col];
        allTweens.push(
          new Promise((resolve) => {
            this.tweens.add({
              targets: tile.sprite,
              scaleX: 1,
              scaleY: 1,
              alpha: 1,
              duration: 320,
              delay: row * 35 + col * 10,
              ease: 'Back.Out',
              onComplete: () => resolve()
            });
          })
        );
      }
    }

    Promise.all(allTweens).then(() => {
      this.inputLocked = false;
    });
  }

  createParticleSystems() {
    this.matchParticles = this.add.particles(0, 0, 'sparkle', {
      lifespan: 350,
      speed: { min: 35, max: 120 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      gravityY: 40,
      quantity: 10,
      emitting: false
    });
    this.matchParticles.setDepth(16);
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

  tweenTileTo(tile, row, col, duration, ease = 'Cubic.Out') {
    const target = this.gridToWorld(row, col);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: tile.sprite,
        x: target.x,
        y: target.y,
        duration,
        ease,
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

    await Promise.all([
      this.tweenTileTo(a, bRow, bCol, 220, 'Sine.InOut'),
      this.tweenTileTo(b, aRow, aCol, 220, 'Sine.InOut')
    ]);

    a.setGridPosition(bRow, bCol);
    b.setGridPosition(aRow, aCol);
    this.board.swap(aRow, aCol, bRow, bCol);

    const matches = this.board.findMatches();

    if (matches.length === 0) {
      this.tileSprites[aRow][aCol] = a;
      this.tileSprites[bRow][bCol] = b;

      await Promise.all([
        this.tweenTileTo(a, aRow, aCol, 200, 'Sine.InOut'),
        this.tweenTileTo(b, bRow, bCol, 200, 'Sine.InOut')
      ]);

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
    this.scorePanel.valueText.setText(`${this.score}`);
    this.movesPanel.valueText.setText(`${this.moves}`);
    this.levelPanel.valueText.setText(`${this.level}`);
  }

  getSpecialCandidates(matches) {
    const matchSet = new Set(matches.map(({ row, col }) => `${row},${col}`));
    const specials = new Map();

    for (let row = 0; row < ROWS; row += 1) {
      let run = 1;
      for (let col = 1; col <= COLS; col += 1) {
        const same =
          col < COLS &&
          this.board.grid[row][col] !== -1 &&
          this.board.grid[row][col] === this.board.grid[row][col - 1];

        if (same) {
          run += 1;
          continue;
        }

        if (run >= 4) {
          const midCol = col - Math.ceil(run / 2);
          const key = `${row},${midCol}`;
          if (matchSet.has(key)) {
            specials.set(key, run >= 5 ? 'rainbow' : 'striped');
          }
        }
        run = 1;
      }
    }

    for (let col = 0; col < COLS; col += 1) {
      let run = 1;
      for (let row = 1; row <= ROWS; row += 1) {
        const same =
          row < ROWS &&
          this.board.grid[row][col] !== -1 &&
          this.board.grid[row][col] === this.board.grid[row - 1][col];

        if (same) {
          run += 1;
          continue;
        }

        if (run >= 4) {
          const midRow = row - Math.ceil(run / 2);
          const key = `${midRow},${col}`;
          if (matchSet.has(key)) {
            specials.set(key, run >= 5 ? 'rainbow' : 'bomb');
          }
        }
        run = 1;
      }
    }

    return Array.from(specials.entries()).map(([key, specialType]) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col, specialType };
    });
  }

  async resolveMatches(initialMatches) {
    let matches = initialMatches;
    this.chainLevel = 0;

    while (matches.length > 0) {
      this.chainLevel += 1;
      if (this.chainLevel > 1) {
        this.showComboFeedback(this.chainLevel);
      }

      const specialCandidates = this.getSpecialCandidates(matches);
      const preserve = new Set(specialCandidates.map(({ row, col }) => `${row},${col}`));
      const clearList = matches.filter(({ row, col }) => !preserve.has(`${row},${col}`));

      await this.clearMatches(clearList);
      this.board.clearMatches(clearList);

      specialCandidates.forEach(({ row, col, specialType }) => {
        const tile = this.tileSprites[row][col];
        if (!tile) return;
        tile.setSpecial(specialType);
        this.flashSpecialGlow(tile.sprite.x, tile.sprite.y);
      });

      this.score += matches.length * 10 + this.chainLevel * 5;
      this.updateHud();

      await this.animateGravity();
      await this.animateFill();

      matches = this.board.findMatches();
    }
  }

  emitMatchBurst(tile) {
    this.matchParticles.setPosition(tile.sprite.x, tile.sprite.y);
    this.matchParticles.setTint(TILE_COLORS[tile.type] ?? 0xffffff);
    this.matchParticles.explode(12, tile.sprite.x, tile.sprite.y);
  }

  async clearMatches(matches) {
    await Promise.all(
      matches.map(({ row, col }) => {
        const tile = this.tileSprites[row][col];
        if (!tile) return Promise.resolve();
        this.emitMatchBurst(tile);

        return new Promise((resolve) => {
          this.tweens.add({
            targets: tile.sprite,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 170,
            ease: 'Back.In',
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
      const duration = Math.max(120, Math.abs(toRow - fromRow) * 110);
      return this.tweenTileTo(tile, toRow, col, duration, 'Cubic.Out').then(() =>
        this.playLandingSquash(tile)
      );
    });

    await Promise.all(tweens);
  }

  playLandingSquash(tile) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: tile.sprite,
        scaleX: 1.08,
        scaleY: 0.93,
        duration: 80,
        ease: 'Sine.Out',
        yoyo: true,
        onComplete: () => {
          tile.sprite.setScale(1);
          resolve();
        }
      });
    });
  }

  async animateFill() {
    const spawns = this.board.fillEmpty();

    const tweens = spawns.map(({ row, col, type, fromRow }) => {
      const target = this.gridToWorld(row, col);
      const from = this.gridToWorld(fromRow, col);
      const tile = new Tile(this, row, col, type, from.x, from.y);
      tile.sprite.setScale(0);
      tile.sprite.on('pointerdown', () => this.onTileClicked(tile));
      this.tileSprites[row][col] = tile;

      const duration = Math.max(120, Math.abs(row - fromRow) * 105);
      return Promise.all([
        this.tweenTileTo(tile, row, col, duration, 'Cubic.Out').then(() => this.playLandingSquash(tile)),
        new Promise((resolve) => {
          this.tweens.add({
            targets: tile.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 260,
            delay: row * 30,
            ease: 'Back.Out',
            onComplete: () => resolve()
          });
        })
      ]);
    });

    await Promise.all(tweens);
  }

  flashSpecialGlow(x, y) {
    const glow = this.add.image(x, y, 'special-glow').setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    glow.setScale(0.2);
    glow.setAlpha(0.95);

    this.tweens.add({
      targets: glow,
      scale: 1.1,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.Out',
      onComplete: () => glow.destroy()
    });
  }

  showComboFeedback(chainLevel) {
    const messages = ['Nice!', 'Great!', 'Amazing!', 'Unstoppable!'];
    const message = messages[Math.min(chainLevel - 2, messages.length - 1)];
    const intensity = Math.min(1 + chainLevel * 0.1, 1.6);

    const text = this.add
      .text(this.scale.width / 2, BOARD_OFFSET_Y - 18, message, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: `${Math.round(30 * intensity)}px`,
        fontStyle: '700',
        color: '#fff6bf',
        stroke: '#603500',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setScale(0.2)
      .setAlpha(0);

    this.tweens.add({
      targets: text,
      scale: 1,
      alpha: 1,
      y: text.y - 20,
      duration: 220,
      ease: 'Back.Out',
      yoyo: true,
      hold: 120,
      onComplete: () => text.destroy()
    });
  }

  showEndOverlay(message) {
    this.inputLocked = true;

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setDepth(40);
    this.add
      .text(width / 2, height / 2 - 40, message, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '48px',
        color: '#ffffff'
      })
      .setDepth(41)
      .setOrigin(0.5);

    const playAgain = this.add
      .text(width / 2, height / 2 + 40, 'Play Again', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '32px',
        color: '#ffdd44',
        backgroundColor: '#1f2937',
        padding: { left: 14, right: 14, top: 8, bottom: 8 }
      })
      .setDepth(41)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgain.on('pointerdown', () => this.scene.restart());
  }
}
