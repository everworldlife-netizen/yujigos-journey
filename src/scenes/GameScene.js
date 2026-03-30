import Phaser from 'phaser';
import { BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS, ROWS, TILE_SIZE } from '../config.js';
import Board from '../systems/Board.js';
import SwapController from '../systems/SwapController.js';
import MatchFinder from '../systems/MatchFinder.js';
import CascadeController from '../systems/CascadeController.js';
import SpawnController from '../systems/SpawnController.js';
import ComboController from '../systems/ComboController.js';
import GoalController from '../systems/GoalController.js';
import EventBus from '../core/EventBus.js';
import { PARTICLE_CONFIG, SPECIAL_TEXTURES, TILE_KEYS, UI_TEXTURES } from '../config/AssetConfig.js';

const TILE_COLORS = [0xff4444, 0x4488ff, 0x44dd44, 0xffdd44, 0xbb44ff, 0xff8844];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#091022');
    this.createAmbience();
    this.createBoardFrame();

    this.board = new Board(this);
    this.board.createInitialGrid();

    let result = MatchFinder.find(this.board.grid);
    while (result.matches.length) {
      result.matches.forEach(({ row, col }) => {
        this.board.grid[row][col] = this.board.randomType();
      });
      result = MatchFinder.find(this.board.grid);
    }

    this.comboController = new ComboController();
    this.goalController = new GoalController();
    this.spawnController = new SpawnController(this, this.board);
    this.cascadeController = new CascadeController(this, this.board, this.spawnController, this.comboController);
    this.swapController = new SwapController(this, this.board, this.cascadeController, this.goalController);

    this.highlightSprite = this.add.image(0, 0, UI_TEXTURES.highlight).setVisible(false).setDepth(8);
    this.createParticleSystems();
    this.createTiles();
    this.bindEvents();

    EventBus.emit('ui:update', this.goalController.getState());
    this.scene.bringToTop('UIScene');
  }

  bindEvents() {
    EventBus.on('game:pause', this.openPause, this);
    EventBus.on('pause:resume', this.resumeGame, this);
    EventBus.on('pause:restart', this.restartGame, this);
    EventBus.on('pause:quit', this.quitGame, this);
    EventBus.on('combo:changed', ({ depth }) => this.showComboFeedback(depth), this);

    this.events.on('matches-resolved', ({ chain, matchCount, consumeMove }) => {
      this.goalController.addScore(matchCount * 10 + chain * 5, this.comboController.getMultiplier());
      if (consumeMove) this.goalController.evaluate(this.hasValidMoves());
    });

    this.events.on('turn-complete', () => {
      const state = this.goalController.evaluate(this.hasValidMoves());
      if (state !== 'active') {
        this.swapController.lock();
        this.scene.launch('ResultsScene', { ...this.goalController.getState(), win: state === 'win' });
      }
    });

    this.events.once('shutdown', () => {
      EventBus.off('game:pause', this.openPause, this);
      EventBus.off('pause:resume', this.resumeGame, this);
      EventBus.off('pause:restart', this.restartGame, this);
      EventBus.off('pause:quit', this.quitGame, this);
      EventBus.off('combo:changed', ({ depth }) => this.showComboFeedback(depth), this);
    });
  }

  createTiles() {
    const tweens = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = this.board.createTileAt(row, col, this.board.grid[row][col]).setScale(0).setAlpha(0);
        tile.setInteractive({ useHandCursor: true });
        tile.on('pointerdown', () => this.onTilePicked({ row, col }));

        tweens.push(
          new Promise((resolve) => {
            this.tweens.add({
              targets: tile,
              scaleX: 1,
              scaleY: 1,
              alpha: 1,
              duration: 320,
              delay: row * 35 + col * 10,
              ease: 'Back.Out',
              onComplete: resolve
            });
          })
        );
      }
    }

    Promise.all(tweens).then(() => this.swapController.unlock());
  }

  onTilePicked(tilePos) {
    if (this.swapController.locked) return;
    if (!this.swapController.selected) {
      this.swapController.selected = tilePos;
      const { x, y } = this.board.gridToWorld(tilePos.row, tilePos.col);
      this.highlightSprite.setPosition(x, y).setVisible(true);
      return;
    }

    const selected = this.swapController.selected;
    if (selected.row === tilePos.row && selected.col === tilePos.col) {
      this.swapController.selected = null;
      this.highlightSprite.setVisible(false);
      return;
    }

    if (!this.swapController.areAdjacent(selected, tilePos)) {
      this.swapController.selected = tilePos;
      const { x, y } = this.board.gridToWorld(tilePos.row, tilePos.col);
      this.highlightSprite.setPosition(x, y);
      return;
    }

    this.highlightSprite.setVisible(false);
    this.swapController.selected = null;
    this.swapController.trySwap(selected, tilePos);
  }

  tweenToGrid(tile, row, col, duration, ease = 'Cubic.Out') {
    if (!tile) return Promise.resolve();
    const target = this.board.gridToWorld(row, col);
    return new Promise((resolve) => {
      this.tweens.add({ targets: tile, x: target.x, y: target.y, duration, ease, onComplete: resolve });
    });
  }

  createParticleSystems() {
    this.matchParticles = this.add.particles(0, 0, UI_TEXTURES.sparkle, PARTICLE_CONFIG.matchBurst).setDepth(16);
  }

  emitMatchBurst(tile, type) {
    this.matchParticles.setTint(TILE_COLORS[type] ?? 0xffffff);
    this.matchParticles.explode(12, tile.x, tile.y);
  }

  async clearMatches(matches, specials) {
    const preserve = new Set(specials.map((s) => `${s.row},${s.col}`));
    await Promise.all(
      matches.map(({ row, col }) => {
        const key = `${row},${col}`;
        const tile = this.board.tiles[row][col];
        if (!tile) return Promise.resolve();

        if (preserve.has(key)) {
          const special = specials.find((s) => s.row === row && s.col === col);
          const overlay = this.add.image(tile.x, tile.y, SPECIAL_TEXTURES[special.specialType]).setDepth(7);
          tile.setData('special', special.specialType);
          this.flashSpecialGlow(tile.x, tile.y);
          tile.setTint(0xffffff);
          if (tile.getData('specialSprite')) tile.getData('specialSprite').destroy();
          tile.setData('specialSprite', overlay);
          return Promise.resolve();
        }

        this.emitMatchBurst(tile, this.board.grid[row][col]);
        return new Promise((resolve) => {
          this.tweens.add({
            targets: [tile, tile.getData('specialSprite')].filter(Boolean),
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 170,
            ease: 'Back.In',
            onComplete: () => {
              if (tile.getData('specialSprite')) tile.getData('specialSprite').destroy();
              this.board.destroyTile(row, col);
              resolve();
            }
          });
        });
      })
    );
  }

  playLandingSquash(tile) {
    if (!tile) return Promise.resolve();
    return new Promise((resolve) => {
      this.tweens.add({
        targets: [tile, tile.getData('specialSprite')].filter(Boolean),
        scaleX: 1.08,
        scaleY: 0.93,
        duration: 80,
        ease: 'Sine.Out',
        yoyo: true,
        onComplete: () => {
          tile.setScale(1);
          const specialSprite = tile.getData('specialSprite');
          if (specialSprite) specialSprite.setScale(1).setPosition(tile.x, tile.y);
          resolve();
        }
      });
    });
  }

  flashSpecialGlow(x, y) {
    const glow = this.add.image(x, y, UI_TEXTURES.specialGlow).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    glow.setScale(PARTICLE_CONFIG.specialGlow.scale.from);
    glow.setAlpha(PARTICLE_CONFIG.specialGlow.alpha.from);
    this.tweens.add({
      targets: glow,
      scale: PARTICLE_CONFIG.specialGlow.scale.to,
      alpha: PARTICLE_CONFIG.specialGlow.alpha.to,
      duration: PARTICLE_CONFIG.specialGlow.duration,
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

  hasValidMoves() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const dirs = [[0, 1], [1, 0]];
        for (const [dr, dc] of dirs) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= ROWS || nc >= COLS) continue;
          [this.board.grid[row][col], this.board.grid[nr][nc]] = [this.board.grid[nr][nc], this.board.grid[row][col]];
          const hasMatch = MatchFinder.find(this.board.grid).matches.length > 0;
          [this.board.grid[row][col], this.board.grid[nr][nc]] = [this.board.grid[nr][nc], this.board.grid[row][col]];
          if (hasMatch) return true;
        }
      }
    }
    return false;
  }

  openPause() {
    this.swapController.lock();
    this.scene.pause('GameScene');
    this.scene.pause('UIScene');
    this.scene.launch('PauseScene');
  }

  resumeGame() {
    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
    this.swapController.unlock();
  }

  restartGame() {
    this.scene.stop('PauseScene');
    this.scene.stop('UIScene');
    this.scene.restart();
    this.scene.launch('UIScene');
  }

  quitGame() {
    this.scene.stop('PauseScene');
    this.scene.stop('UIScene');
    this.scene.start('MainMenuScene');
  }

  createAmbience() {
    const { width, height } = this.scale;
    const bg = this.add.graphics().setDepth(-30);
    bg.fillGradientStyle(0x1d2d62, 0x10214f, 0x0b1230, 0x182549, 1);
    bg.fillRect(0, 0, width, height);
    for (let i = 0; i < 12; i += 1) {
      const light = this.add
        .image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), UI_TEXTURES.bokeh)
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
}
