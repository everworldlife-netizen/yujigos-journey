import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 220, 24, 10);
    g.generateTexture('boot-bar', 220, 24);
    g.destroy();
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
