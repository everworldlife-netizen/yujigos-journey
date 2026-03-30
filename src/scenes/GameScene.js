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

    this.selectionGlow = null;
    this.selectionGlowTween = null;
    this.comboParticleMultiplier = 1;
    this.flashOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff, 0).setOrigin(0).setDepth(40);
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
        tile.setData('idlePhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
        tile.setData('idleAmplitude', Phaser.Math.FloatBetween(1.3, 2));

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
              onComplete: () => {
                this.resumeIdleFloat(tile);
                resolve();
              }
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
      this.showSelectionGlow(tilePos);
      return;
    }

    const selected = this.swapController.selected;
    if (selected.row === tilePos.row && selected.col === tilePos.col) {
      this.swapController.selected = null;
      this.hideSelectionGlow();
      return;
    }

    if (!this.swapController.areAdjacent(selected, tilePos)) {
      this.swapController.selected = tilePos;
      this.showSelectionGlow(tilePos);
      return;
    }

    this.hideSelectionGlow();
    this.swapController.selected = null;
    this.swapController.trySwap(selected, tilePos);
  }

  tweenToGrid(tile, row, col, duration, easeOrOptions = 'Cubic.Out') {
    if (!tile) return Promise.resolve();
    const target = this.board.gridToWorld(row, col);
    const options = typeof easeOrOptions === 'string' ? { ease: easeOrOptions } : easeOrOptions;
    const ease = options.ease ?? 'Cubic.Out';
    const landingBounce = options.landingBounce ?? false;
    const delay = options.delay ?? 0;
    const overshoot = options.overshoot ?? 4;
    this.pauseIdleFloat(tile);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: tile,
        x: target.x,
        y: landingBounce ? target.y + overshoot : target.y,
        delay,
        duration,
        ease,
        onUpdate: () => this.syncSpecialSprite(tile),
        onComplete: () => {
          if (!landingBounce) {
            this.resumeIdleFloat(tile);
            resolve();
            return;
          }

          this.tweens.add({
            targets: tile,
            y: target.y,
            duration: 120,
            ease: 'Back.Out',
            onUpdate: () => this.syncSpecialSprite(tile),
            onComplete: () => {
              this.resumeIdleFloat(tile);
              resolve();
            }
          });
        }
      });
    });
  }

  createParticleSystems() {
    this.matchParticles = this.add.particles(0, 0, UI_TEXTURES.sparkle, PARTICLE_CONFIG.matchBurst).setDepth(16);
  }

  emitMatchBurst(tile, type) {
    this.matchParticles.setTint(TILE_COLORS[type] ?? 0xffffff);
    const baseCount = Phaser.Math.Between(12, 15);
    this.matchParticles.explode(Math.round(baseCount * this.comboParticleMultiplier), tile.x, tile.y);
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
          this.pauseIdleFloat(tile);
          this.tweens.add({
            targets: [tile, tile.getData('specialSprite')].filter(Boolean),
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 80,
            ease: 'Back.Out',
            onComplete: () => {
              tile.setTint(0xffffff);
              const specialSprite = tile.getData('specialSprite');
              if (specialSprite) specialSprite.setTint(0xffffff);
              this.time.delayedCall(50, () => {
                tile.clearTint();
                if (specialSprite) specialSprite.clearTint();
                this.tweens.add({
                  targets: [tile, specialSprite].filter(Boolean),
                  scaleX: 0,
                  scaleY: 0,
                  alpha: 0,
                  duration: 120,
                  ease: 'Back.In',
                  onComplete: () => {
                    if (tile.getData('specialSprite')) tile.getData('specialSprite').destroy();
                    this.board.destroyTile(row, col);
                    resolve();
                  }
                });
              });
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

  setComboDepth(depth) {
    if (depth <= 2) this.comboParticleMultiplier = 1;
    if (depth === 3) this.comboParticleMultiplier = 1.5;
    if (depth === 4) this.comboParticleMultiplier = 2;
    if (depth >= 5) this.comboParticleMultiplier = 3;
  }

  showComboFeedback(chainLevel) {
    const levels = [
      { min: 2, text: 'Nice!', size: 34, color: '#fff6bf', stroke: '#603500', particles: 1, shake: 0, flash: 0 },
      { min: 3, text: 'Great!', size: 42, color: '#fff0c2', stroke: '#633300', particles: 1.5, shake: 2, flash: 0 },
      { min: 4, text: 'Amazing!', size: 50, color: '#ffd86b', stroke: '#6a3900', particles: 2, shake: 3, flash: 0 },
      { min: 5, text: 'INCREDIBLE!', size: 64, color: '#ffffff', stroke: '#6328a1', particles: 3, shake: 5, flash: 0.22 }
    ];
    const tier = levels.reduce((acc, entry) => (chainLevel >= entry.min ? entry : acc), levels[0]);
    this.comboParticleMultiplier = tier.particles;
    console.log(`combo-sfx placeholder | depth=${chainLevel} | pitch=${1 + chainLevel * 0.12}`);

    const text = this.add
      .text(this.scale.width / 2, BOARD_OFFSET_Y - 18, tier.text, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: `${tier.size}px`,
        fontStyle: '700',
        color: tier.color,
        stroke: tier.stroke,
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

    if (tier.shake > 0) {
      this.cameras.main.shake(100, tier.shake / 1000);
    }
    if (tier.flash > 0) {
      this.tweens.add({
        targets: this.flashOverlay,
        alpha: tier.flash,
        duration: 70,
        yoyo: true,
        ease: 'Sine.Out'
      });
    }
    if (chainLevel >= 5) {
      this.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 480,
        onUpdate: (tween) => {
          const color = Phaser.Display.Color.HSVToRGB((tween.getValue() % 360) / 360, 0.75, 1);
          text.setColor(`#${color.color.toString(16).padStart(6, '0')}`);
        }
      });
    }
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
    const colorDrift = this.add.rectangle(width / 2, height / 2, width, height, 0x56a3ff, 0.08).setDepth(-29);
    this.tweens.add({
      targets: colorDrift,
      alpha: { from: 0.05, to: 0.12 },
      duration: 4500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    this.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 22000,
      repeat: -1,
      onUpdate: (tween) => {
        const color = Phaser.Display.Color.HSVToRGB((tween.getValue() % 360) / 360, 0.4, 1);
        colorDrift.setFillStyle(color.color, colorDrift.alpha);
      }
    });
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

    const shimmerPath = new Phaser.Curves.Path(x - 14, y - 14)
      .lineTo(x + boardWidth + 14, y - 14)
      .lineTo(x + boardWidth + 14, y + boardHeight + 14)
      .lineTo(x - 14, y + boardHeight + 14)
      .lineTo(x - 14, y - 14);
    const shimmer = this.add.rectangle(x - 14, y - 14, 40, 3, 0xfff6cc, 0.8).setOrigin(0.5).setDepth(-5);
    shimmer.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 5000,
      repeat: -1,
      onUpdate: (tween) => {
        const p = shimmerPath.getPoint(tween.getValue());
        shimmer.setPosition(p.x, p.y);
      }
    });
  }

  showSelectionGlow(tilePos) {
    const { x, y } = this.board.gridToWorld(tilePos.row, tilePos.col);
    if (!this.selectionGlow) {
      this.selectionGlow = this.add.circle(x, y, TILE_SIZE * 0.58, 0xb9f7ff, 0.55).setDepth(4);
      this.selectionGlow.setBlendMode(Phaser.BlendModes.ADD);
    } else {
      this.selectionGlow.setPosition(x, y).setVisible(true);
    }
    this.selectionGlowTween?.stop();
    this.selectionGlow.setAlpha(0.3).setScale(1);
    this.selectionGlowTween = this.tweens.add({
      targets: this.selectionGlow,
      alpha: { from: 0.3, to: 0.7 },
      scale: { from: 0.96, to: 1.07 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  hideSelectionGlow() {
    if (!this.selectionGlow) return;
    this.selectionGlowTween?.stop();
    this.selectionGlow.setVisible(false);
  }

  async shakeTiles(tiles, intensity = 2, duration = 150) {
    await Promise.all(
      tiles
        .filter(Boolean)
        .map(
          (tile) =>
            new Promise((resolve) => {
              const startX = tile.x;
              this.tweens.add({
                targets: tile,
                x: startX + intensity,
                duration,
                ease: 'Sine.InOut',
                yoyo: true,
                repeat: 2,
                onUpdate: () => this.syncSpecialSprite(tile),
                onComplete: () => {
                  tile.x = startX;
                  this.syncSpecialSprite(tile);
                  resolve();
                }
              });
            })
        )
    );
  }

  pauseIdleFloat(tile) {
    const tween = tile?.getData('idleTween');
    if (tween) {
      tween.stop();
      tile.setData('idleTween', null);
    }
  }

  resumeIdleFloat(tile) {
    if (!tile || !tile.active) return;
    this.pauseIdleFloat(tile);
    const { y } = this.board.gridToWorld(tile.getData('row'), tile.getData('col'));
    tile.y = y;
    tile.setData('baseY', y);
    const phase = tile.getData('idlePhase') ?? 0;
    const amplitude = tile.getData('idleAmplitude') ?? 1.8;
    const idleTween = this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 2200,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: (tween) => {
        tile.y = y + Math.sin(tween.getValue() + phase) * amplitude;
        this.syncSpecialSprite(tile);
      }
    });
    tile.setData('idleTween', idleTween);
  }

  syncSpecialSprite(tile) {
    const specialSprite = tile?.getData('specialSprite');
    if (specialSprite) specialSprite.setPosition(tile.x, tile.y);
  }
}
