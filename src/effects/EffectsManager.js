import Phaser from 'phaser';
import { PARTICLE_CONFIG, TILE_PARTICLE_TINTS, getFxTextureKey } from '../config/AssetConfig.js';
import GAME_CONFIG from '../config/GameConfig.js';
import EventBus from '../utils/EventBus.js';
import ObjectPool from '../utils/ObjectPool.js';

export default class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.comboParticleMultiplier = 1;
    this.flashOverlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0xffffff, 0).setOrigin(0).setDepth(40);
    this.vignette = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0x1a0010, 0).setDepth(39).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.matchParticles = scene.add.particles(0, 0, getFxTextureKey('matchBurst'), { ...PARTICLE_CONFIG.matchBurst, maxParticles: GAME_CONFIG.MAX_PARTICLES }).setDepth(16);
    this.sparkleParticles = scene.add.particles(0, 0, getFxTextureKey('sparkle'), {
      lifespan: 520,
      speed: { min: 15, max: 70 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.95, end: 0 },
      quantity: 8,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD
    }).setDepth(17);

    this.comboTextPool = new ObjectPool(
      () => scene.add.text(scene.scale.width / 2, scene.layout.boardY - 18, '', { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '36px', fontStyle: '700', color: '#fff6bf', stroke: '#603500', strokeThickness: 6 }).setOrigin(0.5).setDepth(25),
      (text) => text.setActive(false).setVisible(false).setScale(1).setAngle(0).setAlpha(1)
    );

    EventBus.on('fx:matchBurst', this.onMatchBurst, this);
    EventBus.on('fx:specialGlow', this.onSpecialGlow, this);
    EventBus.on('fx:comboText', this.onComboText, this);
    EventBus.on('fx:shake', this.onShake, this);
    EventBus.on('fx:flash', this.onFlash, this);
    EventBus.on('combo:update', this.onComboUpdate, this);
  }

  onMatchBurst({ x, y, type }) {
    const tint = TILE_PARTICLE_TINTS[type] ?? 0xffffff;
    this.matchParticles.setTint(tint);
    this.sparkleParticles.setTint(tint);
    const baseCount = this.scene.scale.width < 768 ? Phaser.Math.Between(8, 12) : Phaser.Math.Between(10, 14);
    this.matchParticles.explode(Math.min(Math.round(baseCount * this.comboParticleMultiplier), GAME_CONFIG.MAX_PARTICLES), x, y);
    this.sparkleParticles.explode(Phaser.Math.Between(6, 10), x, y);
  }

  onSpecialGlow({ x, y }) {
    const glow = this.scene.add.image(x, y, getFxTextureKey('specialGlow')).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    glow.setScale(PARTICLE_CONFIG.specialGlow.scale.from).setAlpha(PARTICLE_CONFIG.specialGlow.alpha.from);
    this.scene.tweens.add({
      targets: glow,
      scale: PARTICLE_CONFIG.specialGlow.scale.to,
      alpha: PARTICLE_CONFIG.specialGlow.alpha.to,
      duration: PARTICLE_CONFIG.specialGlow.duration,
      ease: 'Cubic.Out',
      onComplete: () => glow.destroy()
    });
  }

  onComboUpdate({ depth }) {
    this.comboParticleMultiplier = depth <= 1 ? 1 : Math.min(3, 1 + depth * 0.5);
    if (depth < 2) return;
    EventBus.emit('fx:comboText', { depth });
  }

  onComboText({ depth }) {
    const labels = { 2: 'Nice!', 3: 'Great!', 4: 'Amazing!', 5: 'INCREDIBLE!' };
    const text = this.comboTextPool.acquire().setActive(true).setVisible(true).setText(labels[Math.min(depth, 5)] ?? 'Combo!').setPosition(this.scene.scale.width / 2, this.scene.layout.boardY - 18);
    this.scene.tweens.add({ targets: text, scale: 1.2, y: text.y - 24, alpha: 0, duration: 600, ease: 'Sine.Out', onComplete: () => this.comboTextPool.release(text) });
    if (depth >= 3) this.scene.cameras.main.shake(depth >= 5 ? 150 : 80, depth >= 5 ? 0.005 : 0.002);
    if (depth >= 5) this.onFlash({ alpha: 0.2, duration: 80 });
  }

  onShake({ tiles = [], intensity = 2, duration = 150 }) {
    tiles.filter(Boolean).forEach((tile) => {
      const startX = tile.x;
      this.scene.tweens.add({ targets: tile, x: startX + intensity, duration, ease: 'Sine.InOut', yoyo: true, repeat: 2, onComplete: () => { tile.x = startX; } });
    });
  }

  onFlash({ alpha = 0.08, duration = 40 }) {
    this.scene.tweens.add({ targets: this.flashOverlay, alpha, duration, yoyo: true, ease: 'Sine.Out' });
  }

  resize(width, height) {
    this.flashOverlay.setSize(width, height);
    this.vignette.setPosition(width / 2, height / 2).setSize(width, height);
  }

  destroy() {
    this.matchParticles?.destroy();
    this.sparkleParticles?.destroy();
    this.flashOverlay?.destroy();
    this.vignette?.destroy();
    EventBus.off('fx:matchBurst', this.onMatchBurst, this);
    EventBus.off('fx:specialGlow', this.onSpecialGlow, this);
    EventBus.off('fx:comboText', this.onComboText, this);
    EventBus.off('fx:shake', this.onShake, this);
    EventBus.off('fx:flash', this.onFlash, this);
    EventBus.off('combo:update', this.onComboUpdate, this);
  }
}
