import Phaser from 'phaser';
import { getTileTextureKey } from '../../config/AssetConfig.js';

export default class Tile {
  constructor(scene, { type, row, col, sprite, special = null }) {
    this.scene = scene;
    this.type = type;
    this.row = row;
    this.col = col;
    this.special = special;
    this.sprite = sprite;
  }

  static createSprite(scene, type, x, y, tileSize) {
    return scene.add.image(x, y, getTileTextureKey(type)).setDepth(5).setDisplaySize(tileSize, tileSize);
  }

  setPosition(row, col, x, y) {
    this.row = row;
    this.col = col;
    this.sprite.setPosition(x, y);
  }

  playIdleTween() {
    const tween = this.scene.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 2600,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        const baseY = this.sprite.getData('baseY') ?? this.sprite.y;
        const phase = this.sprite.getData('idlePhase') ?? 0;
        const rotPhase = this.sprite.getData('idleRotPhase') ?? 0;
        const amplitude = this.sprite.getData('idleAmplitude') ?? 1.8;
        const rotAmplitude = this.sprite.getData('idleRotAmplitude') ?? 1;
        this.sprite.y = baseY + Math.sin(t + phase) * amplitude;
        this.sprite.angle = Math.sin(t * 0.5 + rotPhase) * rotAmplitude;
      }
    });
    this.sprite.setData('idleTween', tween);
  }

  pauseIdle() {
    const tween = this.sprite.getData('idleTween');
    if (tween) {
      tween.stop();
      this.sprite.setData('idleTween', null);
    }
  }

  resumeIdle() {
    this.pauseIdle();
    this.playIdleTween();
  }

  destroy() {
    const specialSprite = this.sprite.getData('specialSprite');
    if (specialSprite) specialSprite.destroy();
    this.sprite.destroy();
  }

  // EXTENSION: Add new special types here
}
