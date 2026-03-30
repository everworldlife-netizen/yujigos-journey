import Phaser from 'phaser';
import { calculateLayout } from '../utils/LayoutCalculator.js';
import EventBus from '../utils/EventBus.js';
import Board from '../systems/board/Board.js';
import SwapController from '../systems/input/SwapController.js';
import MatchFinder from '../systems/match/MatchFinder.js';
import CascadeController from '../systems/cascade/CascadeController.js';
import SpawnController from '../systems/cascade/SpawnController.js';
import ComboController from '../systems/scoring/ComboController.js';
import GoalController from '../systems/scoring/GoalController.js';
import EffectsManager from '../effects/EffectsManager.js';
import { getBackgroundTextureKey, getBoardTextureKey } from '../config/AssetConfig.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.level = data?.level ?? 1;
  }

  create() {
    this.cameras.main.setBackgroundColor('#091022');
    this.layout = calculateLayout(this.scale.width, this.scale.height);

    this.createAmbience();
    this.createBoardFrame();

    this.board = new Board(this, this.level);
    this.board.createInitialGrid();

    this.effectsManager = new EffectsManager(this);
    this.swapController = new SwapController(this, this.board);
    this.matchFinder = MatchFinder;
    this.spawnController = new SpawnController(this, this.board);
    this.cascadeController = new CascadeController(this, this.board);
    this.comboController = new ComboController();
    this.goalController = new GoalController(this.level);
    // EXTENSION: Register additional systems here

    this.createTiles();
    this.bindEvents();

    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    this.scene.launch('UIScene');
    this.scene.bringToTop('UIScene');

    this.scale.on('resize', this.handleResize, this);
  }

  bindEvents() {
    EventBus.on('game:pause', this.openPause, this);
    EventBus.on('pause:resume', this.resumeGame, this);
    EventBus.on('pause:restart', this.restartGame, this);
    EventBus.on('pause:quit', this.quitGame, this);
    EventBus.on('goal:win', (state) => this.transitionToResults({ ...state, win: true }), this);
    EventBus.on('goal:lose', (state) => this.transitionToResults({ ...state, win: false }), this);
    EventBus.on('cascade:step', ({ depth, matchCount }) => {
      if (matchCount >= 4) EventBus.emit('fx:flash', { alpha: 0.08, duration: 40 });
      if (depth >= 2) EventBus.emit('fx:comboText', { depth });
    });

    this.input.on('pointermove', this.updateParallax, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('pointermove', this.updateParallax, this);
      EventBus.off('game:pause', this.openPause, this);
      EventBus.off('pause:resume', this.resumeGame, this);
      EventBus.off('pause:restart', this.restartGame, this);
      EventBus.off('pause:quit', this.quitGame, this);
      this.swapController.destroy();
      this.spawnController.destroy();
      this.cascadeController.destroy();
      this.comboController.destroy();
      this.goalController.destroy();
      this.effectsManager.destroy();
      if (this.ambientParticles) this.ambientParticles.destroy();
    });
  }

  createTiles() {
    const tweens = [];
    for (let row = 0; row < this.board.grid.length; row += 1) {
      for (let col = 0; col < this.board.grid[row].length; col += 1) {
        const sprite = this.board.createTileAt(row, col, this.board.grid[row][col]).sprite.setScale(0).setAlpha(0);
        sprite.setData('idlePhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
        sprite.setData('idleRotPhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
        sprite.setData('idleAmplitude', Phaser.Math.FloatBetween(1.6, 2));
        sprite.setData('idleRotAmplitude', Phaser.Math.FloatBetween(0.6, 1));
        tweens.push(
          new Promise((resolve) => {
            this.tweens.add({
              targets: sprite,
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

    Promise.all(tweens).then(() => EventBus.emit('input:unlock'));
  }

  handleResize(gameSize) {
    this.layout = calculateLayout(gameSize.width, gameSize.height);
    if (this.bgImage) this.bgImage.setPosition(gameSize.width / 2, gameSize.height / 2).setDisplaySize(gameSize.width, gameSize.height);
    if (this.radialGlow) this.radialGlow.setPosition(gameSize.width / 2, gameSize.height / 2);
    if (this.ambientParticles) this.ambientParticles.setPosition(0, 0).setParticleBounds(0, 0, gameSize.width, gameSize.height);
    this.effectsManager.resize(gameSize.width, gameSize.height);
    this.createBoardFrame();

    for (const rowTiles of this.board.tiles) {
      for (const tile of rowTiles) {
        if (!tile) continue;
        const { x, y } = this.board.gridToWorld(tile.row, tile.col);
        tile.sprite.setPosition(x, y).setDisplaySize(this.layout.tileSize, this.layout.tileSize);
        const specialSprite = tile.sprite.getData('specialSprite');
        if (specialSprite) specialSprite.setPosition(x, y).setDisplaySize(this.layout.tileSize, this.layout.tileSize);
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

    return new Promise((resolve) => {
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
          if (!landingBounce) return resolve();
          this.tweens.add({ targets: tile, y: target.y, duration: 180, ease: 'Back.Out', onUpdate: () => this.syncSpecialSprite(tile), onComplete: resolve });
        }
      });
    });
  }

  syncSpecialSprite(tile) {
    const specialSprite = tile?.getData('specialSprite');
    if (specialSprite) specialSprite.setPosition(tile.x, tile.y).setAngle(tile.angle).setScale(tile.scaleX, tile.scaleY).setAlpha(tile.alpha);
  }

  async transitionToResults(payload) {
    EventBus.emit('input:lock');
    const tiles = this.board.tiles.flat().map((tile) => tile?.sprite).filter(Boolean);
    await Promise.all(
      tiles.map((tile) => new Promise((resolve) => {
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
      }))
    );

    this.cameras.main.fadeOut(220, 255, 255, 255);
    this.time.delayedCall(220, () => {
      this.scene.stop('UIScene');
      this.scene.start('ResultsScene', payload);
    });
  }

  openPause() {
    EventBus.emit('input:lock');
    this.scene.pause('GameScene');
    this.scene.pause('UIScene');
    this.scene.launch('PauseScene');
  }

  resumeGame() {
    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
    EventBus.emit('input:unlock');
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
    const backgroundOrder = ['sunberryMeadow', 'frostberryFalls', 'enchantedForest', 'cosmicIsland', 'sunberryDesert'];
    const key = getBackgroundTextureKey(backgroundOrder[(Math.max(1, this.level) - 1) % backgroundOrder.length]);
    this.bgImage = this.textures.exists(key)
      ? this.add.image(width / 2, height / 2, key).setDisplaySize(width, height).setDepth(-30)
      : this.add.rectangle(width / 2, height / 2, width, height, 0x0c1232, 1).setDepth(-30);

    if (!this.textures.exists('bg_radial_gradient')) {
      const gradient = this.add.graphics().setDepth(-29);
      gradient.fillStyle(0xffffff, 1);
      gradient.fillCircle(width / 2, height / 2, Math.max(width, height) * 0.55);
      gradient.generateTexture('bg_radial_gradient', width, height);
      gradient.destroy();
    }

    this.radialGlow = this.add.image(width / 2, height / 2, 'bg_radial_gradient').setAlpha(0.16).setDepth(-29);
    this.radialGlow.setBlendMode(Phaser.BlendModes.SCREEN);

    if (this.ambientParticles) this.ambientParticles.destroy();
    this.ambientParticles = this.add.particles(0, 0, 'fx_sparkle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 5000, max: 11000 },
      alpha: { start: 0.2, end: 0 },
      scale: { start: 0.35, end: 0.05 },
      speedY: { min: -15, max: -4 },
      speedX: { min: -6, max: 6 },
      quantity: 1,
      frequency: 220,
      blendMode: Phaser.BlendModes.ADD
    }).setDepth(-28);
  }

  createBoardFrame() {
    this.boardFrameElements?.forEach((element) => element.destroy());
    this.boardFrameElements = [];
    const { boardWidth, boardHeight, boardX: x, boardY: y } = this.layout;
    const cx = x + boardWidth / 2;
    const cy = y + boardHeight / 2;

    const frameKey = getBoardTextureKey('frame');
    if (this.textures.exists(frameKey)) this.boardFrameElements.push(this.add.image(cx, cy, frameKey).setDisplaySize(boardWidth + 40, boardHeight + 40).setDepth(-8));

    const frameGraphics = this.add.graphics().setDepth(-9);
    frameGraphics.fillStyle(0x2f1f0f, 0.97);
    frameGraphics.fillRoundedRect(x - 26, y - 26, boardWidth + 52, boardHeight + 52, 26);
    frameGraphics.lineStyle(12, 0x7d5427, 1);
    frameGraphics.strokeRoundedRect(x - 20, y - 20, boardWidth + 40, boardHeight + 40, 24);
    frameGraphics.lineStyle(6, 0xd6a85d, 0.9);
    frameGraphics.strokeRoundedRect(x - 14, y - 14, boardWidth + 28, boardHeight + 28, 20);
    frameGraphics.lineStyle(2, 0xfff0c2, 0.5);
    frameGraphics.strokeRoundedRect(x - 10, y - 10, boardWidth + 20, boardHeight + 20, 18);
    frameGraphics.fillStyle(0x000000, 0.26);
    frameGraphics.fillRoundedRect(x - 6, y - 6, boardWidth + 12, boardHeight + 12, 16);
    this.boardFrameElements.push(frameGraphics);

    const backgroundKey = getBoardTextureKey('background');
    if (this.textures.exists(backgroundKey)) this.boardFrameElements.push(this.add.image(cx, cy, backgroundKey).setDisplaySize(boardWidth, boardHeight).setDepth(-7));
    else this.boardFrameElements.push(this.add.rectangle(cx, cy, boardWidth, boardHeight, 0x121b3b, 0.84).setDepth(-7));
  }

  updateParallax(pointer) {
    const px = (pointer.x - this.scale.width / 2) / this.scale.width;
    const py = (pointer.y - this.scale.height / 2) / this.scale.height;
    if (this.bgImage) this.bgImage.setPosition(this.scale.width / 2 - px * 8, this.scale.height / 2 - py * 8);
    if (this.radialGlow) this.radialGlow.setPosition(this.scale.width / 2 - px * 12, this.scale.height / 2 - py * 12);
  }
}
