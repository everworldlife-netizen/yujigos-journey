import Phaser from 'phaser';
import { ASSET_ENTRIES } from '../config/AssetManifest.js';
import SpriteGenerator from '../utils/SpriteGenerator.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 240, 30, 0x223355, 1);
    const bar = this.add.image(width / 2 - 110, height / 2, 'boot-bar').setOrigin(0, 0.5).setScale(1, 1);
    this.tweens.add({ targets: bar, scaleX: 0, duration: 350, ease: 'Quad.Out', yoyo: true });
    this.time.delayedCall(380, () => {
      barBg.destroy();
      bar.destroy();
    });

    ASSET_ENTRIES.forEach((entry) => {
      this.load.image(entry.key, entry.path);
    });
  }

  create() {
    SpriteGenerator.generateAll(this);
    this.scene.start('MainMenuScene');
  }
}
