import Phaser from 'phaser';
import { COLS, ROWS } from '../config.js';
import { calculateLayout } from '../utils/Layout.js';
import Board from '../systems/Board.js';
import SwapController from '../systems/SwapController.js';
import CascadeController from '../systems/CascadeController.js';
import SpawnController from '../systems/SpawnController.js';
import ComboController from '../systems/ComboController.js';
import GoalController from '../systems/GoalController.js';
import EventBus from '../core/EventBus.js';
import {
  PARTICLE_CONFIG,
  TILE_PARTICLE_TINTS,
  getBackgroundTextureKey,
  getBoardTextureKey,
  getFxTextureKey,
  getSpecialTextureKey
} from '../config/AssetConfig.js';

const MAX_PARTICLES = 200;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.level = data?.level ?? 1;
  }

  create() {
    this.idleMotionPaused = false;
    this.comboParticleMultiplier = 1;
    this.floatingTextPool = [];
    this.activeFloatingTexts = new Set();
    this.dragTile = null;

    this.cameras.main.setBackgroundColor('#091022');
    this.layout = calculateLayout(this.scale.width, this.scale.height);
    this.createAmbience();
    this.createBoardFrame();

    this.board = new Board(this);
    this.board.createInitialGrid();

    this.comboController = new ComboController();
    this.goalController = new GoalController(this.level);
    this.spawnController = new SpawnController(this, this.board);
    this.cascadeController = new CascadeController(this, this.board, this.spawnController, this.comboController);
    this.swapController = new SwapController(this, this.board, this.cascadeController, this.goalController);

    this.selectionGlow = null;
    this.selectionGlowTween = null;
    this.flashOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff, 0).setOrigin(0).setDepth(40);
    this.vignette = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x1a0010, 0)
      .setDepth(39)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.createParticleSystems();
    this.createTiles();
    this.bindEvents();

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene');
    EventBus.emit('ui:update', this.goalController.getState());
    this.scene.bringToTop('UIScene');

    this.scale.on('resize', this.handleResize, this);
  }

  bindEvents() {
    EventBus.on('game:pause', this.openPause, this);
    EventBus.on('pause:resume', this.resumeGame, this);
    EventBus.on('pause:restart', this.restartGame, this);
    EventBus.on('pause:quit', this.quitGame, this);
    EventBus.on('combo:changed', this.showComboFeedback, this);

    this.events.on('matches-resolved', ({ chain, matchCount }) => {
      this.goalController.addScore(matchCount * 10, chain);
      if (matchCount >= 4) {
        this.tweens.add({ targets: this.flashOverlay, alpha: 0.08, duration: 40, yoyo: true, ease: 'Sine.Out' });
      }
    });

    this.events.on('turn-complete', () => {
      const state = this.goalController.evaluate();
      if (state !== 'active') {
        this.swapController.lock();
        this.transitionToResults({ ...this.goalController.getState(), win: state === 'win' });
      }
    });

    this.input.on('pointermove', this.updateParallax, this);

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
      EventBus.off('game:pause', this.openPause, this);
      EventBus.off('pause:resume', this.resumeGame, this);
      EventBus.off('pause:restart', this.restartGame, this);
      EventBus.off('pause:quit', this.quitGame, this);
      EventBus.off('combo:changed', this.showComboFeedback, this);
      this.input.off('pointermove', this.updateParallax, this);
    });
  }

  setBoardActionState(active) {
    this.idleMotionPaused = active;
    for (const rowTiles of this.board.tiles) {
      for (const tile of rowTiles) {
        if (!tile) continue;
        if (active) this.pauseIdleFloat(tile);
        else this.resumeIdleFloat(tile);
      }
    }
  }

  createTiles() {
    const tweens = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = this.board.createTileAt(row, col, this.board.grid[row][col]).setScale(0).setAlpha(0);
        tile.setData('idlePhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
        tile.setData('idleRotPhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
        tile.setData('idleAmplitude', Phaser.Math.FloatBetween(1.6, 2));
        tile.setData('idleRotAmplitude', Phaser.Math.FloatBetween(0.6, 1));
        tile.setData('interactiveScale', 1);

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

  onTilePointerDown(tile) {
    this.dragTile = tile;
    this.dragStart = { x: tile.x, y: tile.y };
    tile.setData('interactiveScale', 1.08);
    this.tweens.add({ targets: tile, scaleX: 1.08, scaleY: 1.08, duration: 60, ease: 'Sine.Out' });
  }

  onTilePointerUp(tile, pointer) {
    if (pointer && this.dragStart && !this.swapController.locked) {
      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minSwipe = 20;
      if (distance >= minSwipe) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const minAxis = Math.max(0.01, Math.min(absX, absY));
        const maxAxis = Math.max(absX, absY);
        const angleDeg = Phaser.Math.RadToDeg(Math.atan2(minAxis, maxAxis));
        if (angleDeg <= 45) {
          const row = tile.getData('row');
          const col = tile.getData('col');
          const target =
            absX >= absY
              ? { row, col: col + (dx > 0 ? 1 : -1) }
              : { row: row + (dy > 0 ? 1 : -1), col };
          if (target.row >= 0 && target.row < ROWS && target.col >= 0 && target.col < COLS) {
            this.swapController.selected = { row, col };
            this.hideSelectionGlow();
            this.swapController.selected = null;
            this.swapController.trySwap({ row, col }, target);
          }
        }
      }
    }

    tile.setData('interactiveScale', 1);
    this.tweens.add({
      targets: tile,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      duration: 80,
      ease: 'Sine.In',
      onUpdate: () => this.syncSpecialSprite(tile)
    });
    this.dragTile = null;
    this.dragStart = null;
  }

  onTileDragged(tile, pointer) {
    if (!pointer.isDown || this.dragTile !== tile) return;
    const dx = pointer.x - tile.x;
    const dy = pointer.y - tile.y;
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    const angle = Math.abs(dx) > Math.abs(dy) ? Phaser.Math.Clamp(dx * 0.08, -3, 3) : Phaser.Math.Clamp(-dy * 0.08, -3, 3);
    tile.angle = angle;
    this.syncSpecialSprite(tile);
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
      return;
    }

    this.hideSelectionGlow();
    this.swapController.selected = null;
    this.swapController.trySwap(selected, tilePos);
  }

  handleResize(gameSize) {
    this.layout = calculateLayout(gameSize.width, gameSize.height);
    if (this.flashOverlay) this.flashOverlay.setSize(gameSize.width, gameSize.height);
    if (this.vignette) this.vignette.setPosition(gameSize.width / 2, gameSize.height / 2).setSize(gameSize.width, gameSize.height);
    if (this.bgImage) this.bgImage.setPosition(gameSize.width / 2, gameSize.height / 2).setDisplaySize(gameSize.width, gameSize.height);
    if (this.radialGlow) this.radialGlow.setPosition(gameSize.width / 2, gameSize.height / 2);

    this.createBoardFrame();
    if (this.board?.tiles) {
      for (const rowTiles of this.board.tiles) {
        for (const tile of rowTiles) {
          if (!tile) continue;
          const { x, y } = this.board.gridToWorld(tile.getData('row'), tile.getData('col'));
          tile.setPosition(x, y).setDisplaySize(this.layout.tileSize, this.layout.tileSize);
          const specialSprite = tile.getData('specialSprite');
          if (specialSprite) specialSprite.setPosition(x, y).setDisplaySize(this.layout.tileSize, this.layout.tileSize);
          this.resumeIdleFloat(tile);
        }
      }
    }
  }

  tweenToGrid(tile, row, col, duration, easeOrOptions = 'Cubic.Out') {
    if (!tile) return Promise.resolve();
    const target = this.board.gridToWorld(row, col);
    const options = typeof easeOrOptions === 'string' ? { ease: easeOrOptions } : easeOrOptions;
    const ease = options.ease ?? 'Cubic.Out';
    const landingBounce = options.landingBounce ?? false;
    const delay = options.delay ?? 0;
    const overshoot = options.overshoot ?? 4;
    const arc = options.arc ?? 0;
    const pulse = options.pulse ?? false;
    this.pauseIdleFloat(tile);

    return new Promise((resolve) => {
      if (pulse) {
        this.tweens.add({ targets: tile, scale: 0.95, duration: duration * 0.4, yoyo: true, ease: 'Sine.InOut' });
      }

      const startX = tile.x;
      const startY = tile.y;
      const proxy = { t: 0 };
      this.tweens.add({
        targets: proxy,
        t: 1,
        delay,
        duration,
        ease,
        onUpdate: () => {
          const p = proxy.t;
          tile.x = Phaser.Math.Linear(startX, target.x, p);
          tile.y = Phaser.Math.Linear(startY, landingBounce ? target.y + overshoot : target.y, p) - Math.sin(Math.PI * p) * arc;
          this.syncSpecialSprite(tile);
        },
        onComplete: () => {
          if (!landingBounce) {
            this.resumeIdleFloat(tile);
            resolve();
            return;
          }

          this.tweens.add({
            targets: tile,
            y: target.y,
            duration: 180,
            ease: 'Back.Out',
            onUpdate: () => this.syncSpecialSprite(tile),
            onComplete: () => {
              this.tweens.add({
                targets: tile,
                scaleX: 1.1,
                scaleY: 0.9,
                duration: 60,
                yoyo: true,
                ease: 'Sine.Out',
                onComplete: () => {
                  this.resumeIdleFloat(tile);
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  }

  createParticleSystems() {
    this.matchParticles = this.add
      .particles(0, 0, getFxTextureKey('matchBurst'), { ...PARTICLE_CONFIG.matchBurst, maxParticles: MAX_PARTICLES })
      .setDepth(16);

    this.bokehParticles = this.add
      .particles(0, 0, getFxTextureKey('sparkle'), {
        x: { min: 0, max: this.scale.width },
        y: { min: this.scale.height + 30, max: this.scale.height + 120 },
        lifespan: { min: 12000, max: 24000 },
        speedY: { min: -20, max: -8 },
        speedX: { min: -6, max: 6 },
        scale: { start: 2.4, end: 3.8 },
        alpha: { start: 0.1, end: 0 },
        quantity: 1,
        frequency: 700,
        tint: [0x8bb6ff, 0xc89fff, 0xffc58a],
        maxParticles: this.scale.width < 768 ? 10 : 20,
        blendMode: 'ADD'
      })
      .setDepth(-20);
  }

  emitMatchBurst(tile, type) {
    this.matchParticles.setTint(TILE_PARTICLE_TINTS[type] ?? 0xffffff);
    const baseCount = this.scale.width < 768 ? Phaser.Math.Between(8, 12) : Phaser.Math.Between(10, 14);
    const count = Math.round(baseCount * this.comboParticleMultiplier);
    this.matchParticles.explode(Math.min(count, MAX_PARTICLES), tile.x, tile.y);
  }

  async clearMatches(matches, specials) {
    const preserve = new Set(specials.map((s) => `${s.row},${s.col}`));
    await Promise.all(
      matches.map(({ row, col }, index) => {
        const key = `${row},${col}`;
        const tile = this.board.tiles[row][col];
        if (!tile) return Promise.resolve();

        if (preserve.has(key)) {
          const special = specials.find((s) => s.row === row && s.col === col);
          const overlay = this.add.image(tile.x, tile.y, getSpecialTextureKey(special.specialType)).setDepth(7);
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
          this.time.delayedCall(index * 20, () => {
            this.tweens.add({
              targets: [tile, tile.getData('specialSprite')].filter(Boolean),
              scaleX: 1.25,
              scaleY: 1.25,
              duration: 100,
              ease: 'Back.Out',
              onComplete: () => {
                tile.setTint(0xffffff);
                const specialSprite = tile.getData('specialSprite');
                if (specialSprite) specialSprite.setTint(0xffffff);
                this.time.delayedCall(60, () => {
                  tile.clearTint();
                  if (specialSprite) specialSprite.clearTint();
                  this.tweens.add({
                    targets: [tile, specialSprite].filter(Boolean),
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0,
                    duration: 120,
                    ease: 'Sine.In',
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
        });
      })
    );
  }

  flashSpecialGlow(x, y) {
    const glow = this.add.image(x, y, getFxTextureKey('specialGlow')).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
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
    if (depth <= 1) this.comboParticleMultiplier = 1;
    if (depth === 2) this.comboParticleMultiplier = 1.5;
    if (depth === 3) this.comboParticleMultiplier = 2;
    if (depth === 4) this.comboParticleMultiplier = 2.5;
    if (depth >= 5) this.comboParticleMultiplier = 3;
  }

  getFloatingText() {
    const pooled = this.floatingTextPool.pop();
    if (pooled) {
      pooled.setActive(true).setVisible(true);
      this.activeFloatingTexts.add(pooled);
      return pooled;
    }
    const text = this.add
      .text(this.scale.width / 2, this.layout.boardY - 18, '', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '36px',
        fontStyle: '700',
        color: '#fff6bf',
        stroke: '#603500',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.activeFloatingTexts.add(text);
    return text;
  }

  releaseFloatingText(text) {
    text.setActive(false).setVisible(false).setScale(1).setAngle(0).setAlpha(1);
    this.activeFloatingTexts.delete(text);
    this.floatingTextPool.push(text);
  }

  showComboFeedback({ depth }) {
    if (depth < 2) return;
    const levels = {
      2: { text: 'Nice!', size: 34, color: '#fff6bf', stroke: '#603500', shake: { px: 0, ms: 0 }, vignette: 0 },
      3: { text: 'Great!', size: 44, color: '#ffd66b', stroke: '#6a3b00', shake: { px: 2, ms: 80 }, vignette: 0 },
      4: { text: 'Amazing!', size: 52, color: '#ffc07a', stroke: '#7a3200', shake: { px: 3, ms: 120 }, vignette: 0.2 },
      5: { text: 'INCREDIBLE!', size: 66, color: '#ffffff', stroke: '#6328a1', shake: { px: 5, ms: 150 }, vignette: 0.3 }
    };
    const tier = levels[Math.min(depth, 5)];

    const text = this.getFloatingText();
    text
      .setText(tier.text)
      .setStyle({
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: `${tier.size}px`,
        fontStyle: '700',
        color: tier.color,
        stroke: tier.stroke,
        strokeThickness: 6
      })
      .setPosition(this.scale.width / 2, this.layout.boardY - 18)
      .setScale(1)
      .setAlpha(1);

    this.tweens.add({
      targets: text,
      scale: 1.2,
      y: text.y - 24,
      alpha: 0,
      duration: 600,
      ease: 'Sine.Out',
      onUpdate: () => {
        if (depth >= 5) {
          const color = Phaser.Display.Color.HSVToRGB((this.time.now % 1000) / 1000, 0.6, 1);
          text.setColor(`#${color.color.toString(16).padStart(6, '0')}`);
        }
      },
      onComplete: () => this.releaseFloatingText(text)
    });

    if (tier.shake.px > 0) {
      this.cameras.main.shake(tier.shake.ms, tier.shake.px / 1000);
    }

    if (depth >= 5) {
      this.tweens.add({ targets: this.flashOverlay, alpha: 0.2, duration: 80, yoyo: true, ease: 'Sine.Out' });
      this.tweens.add({
        targets: this.boardFrameGlow,
        alpha: { from: 0.2, to: 0.55 },
        duration: 220,
        yoyo: true,
        repeat: 1
      });
    } else {
      this.tweens.add({ targets: this.boardFrameGlow, alpha: 0.32, duration: 130, yoyo: true, ease: 'Sine.InOut' });
    }

    if (tier.vignette > 0) {
      this.tweens.add({ targets: this.vignette, alpha: tier.vignette, duration: 90, yoyo: true, ease: 'Sine.Out' });
    }
  }

  async transitionToResults(payload) {
    const tiles = this.board.tiles.flat().filter(Boolean);
    await Promise.all(
      tiles.map(
        (tile) =>
          new Promise((resolve) => {
            this.pauseIdleFloat(tile);
            this.tweens.add({
              targets: tile,
              x: tile.x + Phaser.Math.Between(-120, 120),
              y: tile.y + Phaser.Math.Between(-160, 80),
              alpha: 0,
              angle: Phaser.Math.Between(-35, 35),
              duration: 280,
              ease: 'Cubic.Out',
              onUpdate: () => this.syncSpecialSprite(tile),
              onComplete: resolve
            });
          })
      )
    );

    this.cameras.main.fadeOut(220, 255, 255, 255);
    this.time.delayedCall(220, () => {
      this.scene.stop('UIScene');
      this.scene.start('ResultsScene', payload);
    });
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
    this.scene.restart({ level: this.level });
  }

  quitGame() {
    this.scene.stop('PauseScene');
    this.scene.stop('UIScene');
    this.scene.start('MainMenuScene');
  }

  createAmbience() {
    const { width, height } = this.scale;
    const key = getBackgroundTextureKey('game');
    if (this.textures.exists(key)) {
      this.bgImage = this.add.image(width / 2, height / 2, key).setDisplaySize(width, height).setDepth(-30);
    } else {
      this.bgImage = this.add.rectangle(width / 2, height / 2, width, height, 0x10203f, 1).setDepth(-30);
    }

    if (!this.textures.exists('bg_radial_gradient')) {
      const gradient = this.add.graphics().setDepth(-29);
      gradient.fillStyle(0xffffff, 1);
      gradient.fillCircle(width / 2, height / 2, Math.max(width, height) * 0.55);
      gradient.generateTexture('bg_radial_gradient', width, height);
      gradient.destroy();
    }

    this.radialGlow = this.add.image(width / 2, height / 2, 'bg_radial_gradient').setAlpha(0.14).setDepth(-29);
    this.radialGlow.setBlendMode(Phaser.BlendModes.SCREEN);

    this.gradientHue = { v: 0 };
    this.tweens.add({
      targets: this.gradientHue,
      v: 1,
      duration: 30000,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        const rgb = Phaser.Display.Color.HSVToRGB(this.gradientHue.v % 1, 0.3, 1);
        this.radialGlow.setTint(rgb.color);
      }
    });
  }

  createBoardFrame() {
    this.boardFrameElements?.forEach((element) => element.destroy());
    this.boardFrameElements = [];
    const { boardWidth, boardHeight, boardX: x, boardY: y } = this.layout;
    const cx = x + boardWidth / 2;
    const cy = y + boardHeight / 2;

    const frameKey = getBoardTextureKey('frame');
    if (this.textures.exists(frameKey)) {
      this.boardFrameElements.push(this.add.image(cx, cy, frameKey).setDisplaySize(boardWidth + 40, boardHeight + 40).setDepth(-8));
    }

    const frameGraphics = this.add.graphics().setDepth(-9);
    frameGraphics.fillStyle(0x3b2210, 0.96);
    frameGraphics.fillRoundedRect(x - 20, y - 20, boardWidth + 40, boardHeight + 40, 22);
    frameGraphics.lineStyle(8, 0xd6a452, 1);
    frameGraphics.strokeRoundedRect(x - 16, y - 16, boardWidth + 32, boardHeight + 32, 20);
    frameGraphics.lineStyle(3, 0xffe3a0, 0.7);
    frameGraphics.strokeRoundedRect(x - 12, y - 12, boardWidth + 24, boardHeight + 24, 18);

    this.boardFrameElements.push(frameGraphics);
    this.boardFrameElements.push(this.add.rectangle(cx, cy, boardWidth - 12, boardHeight - 12, 0x000000, 0.2).setDepth(-7));

    this.boardFrameGlow = this.add.rectangle(cx, cy, boardWidth + 48, boardHeight + 48, 0xffd998, 0.12).setDepth(-10);
    this.boardFrameGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.boardFrameGlow, alpha: { from: 0.08, to: 0.2 }, duration: 1600, yoyo: true, repeat: -1 });
    this.boardFrameElements.push(this.boardFrameGlow);

    this.frameShimmer = this.add.rectangle(x - 20, y - 20, 26, 4, 0xfff0c7, 0.6).setOrigin(0.5).setDepth(-6);
    this.frameShimmer.setBlendMode(Phaser.BlendModes.ADD);
    this.boardFrameElements.push(this.frameShimmer);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 6000,
      repeat: -1,
      onUpdate: (tw) => {
        const p = tw.getValue();
        const perimeter = 2 * (boardWidth + 40 + boardHeight + 40);
        const dist = p * perimeter;
        const top = boardWidth + 40;
        const right = top + boardHeight + 40;
        const bottom = right + boardWidth + 40;

        if (dist <= top) {
          this.frameShimmer.setPosition(x - 20 + dist, y - 20).setRotation(0);
        } else if (dist <= right) {
          this.frameShimmer.setPosition(x + boardWidth + 20, y - 20 + (dist - top)).setRotation(Math.PI / 2);
        } else if (dist <= bottom) {
          this.frameShimmer.setPosition(x + boardWidth + 20 - (dist - right), y + boardHeight + 20).setRotation(Math.PI);
        } else {
          this.frameShimmer.setPosition(x - 20, y + boardHeight + 20 - (dist - bottom)).setRotation(Math.PI * 1.5);
        }
      }
    });

    const backgroundKey = getBoardTextureKey('background');
    if (this.textures.exists(backgroundKey)) {
      this.boardFrameElements.push(this.add.image(cx, cy, backgroundKey).setDisplaySize(boardWidth, boardHeight).setDepth(-7));
    } else {
      this.boardFrameElements.push(this.add.rectangle(cx, cy, boardWidth, boardHeight, 0x162b57, 0.95).setDepth(-7));
    }
  }

  updateParallax(pointer) {
    const px = (pointer.x - this.scale.width / 2) / this.scale.width;
    const py = (pointer.y - this.scale.height / 2) / this.scale.height;
    if (this.bgImage) this.bgImage.setPosition(this.scale.width / 2 - px * 8, this.scale.height / 2 - py * 8);
    if (this.radialGlow) this.radialGlow.setPosition(this.scale.width / 2 - px * 12, this.scale.height / 2 - py * 12);
  }

  showSelectionGlow(tilePos) {
    const { x, y } = this.board.gridToWorld(tilePos.row, tilePos.col);
    const tile = this.board.tiles[tilePos.row][tilePos.col];
    if (!this.selectionGlow) {
      this.selectionGlow = this.add.circle(x, y, this.layout.tileSize * 0.6, 0xb9f7ff, 0.55).setDepth(4);
      this.selectionGlow.setBlendMode(Phaser.BlendModes.ADD);
    } else {
      this.selectionGlow.setPosition(x, y).setVisible(true);
    }
    this.selectionGlowTween?.stop();
    this.selectionGlow.setAlpha(0.3).setScale(1);
    this.selectionGlowTween = this.tweens.add({
      targets: this.selectionGlow,
      alpha: { from: 0.3, to: 0.6 },
      scale: { from: 0.95, to: 1.08 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    if (tile) this.onTilePointerDown(tile);
  }

  hideSelectionGlow() {
    if (!this.selectionGlow) return;
    this.selectionGlowTween?.stop();
    this.tweens.add({ targets: this.selectionGlow, alpha: 0, duration: 80, onComplete: () => this.selectionGlow.setVisible(false) });

    if (this.dragTile) this.onTilePointerUp(this.dragTile);
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
    if (!tile || !tile.active || this.idleMotionPaused) return;
    this.pauseIdleFloat(tile);
    const { y } = this.board.gridToWorld(tile.getData('row'), tile.getData('col'));
    tile.y = y;
    tile.setData('baseY', y);
    const phase = tile.getData('idlePhase') ?? 0;
    const rotPhase = tile.getData('idleRotPhase') ?? 0;
    const amplitude = tile.getData('idleAmplitude') ?? 1.8;
    const rotAmplitude = tile.getData('idleRotAmplitude') ?? 1;
    const idleTween = this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 2600,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        tile.y = y + Math.sin(t + phase) * amplitude;
        const dragBias = tile === this.dragTile ? tile.angle : 0;
        tile.angle = dragBias + Math.sin(t * 0.5 + rotPhase) * rotAmplitude;
        this.syncSpecialSprite(tile);
      }
    });
    tile.setData('idleTween', idleTween);
  }

  syncSpecialSprite(tile) {
    const specialSprite = tile?.getData('specialSprite');
    if (specialSprite) {
      specialSprite.setPosition(tile.x, tile.y);
      specialSprite.setAngle(tile.angle);
      specialSprite.setScale(tile.scaleX, tile.scaleY);
      specialSprite.setAlpha(tile.alpha);
    }
  }
}
