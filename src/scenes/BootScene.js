import Phaser from 'phaser';

const COLORS = [0xff4444, 0x4488ff, 0x44dd44, 0xffdd44, 0xbb44ff, 0xff8844];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    COLORS.forEach((color, index) => {
      const g = this.add.graphics();
      g.clear();
      g.fillStyle(color, 1);
      g.fillCircle(28, 28, 26);
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(20, 20, 12);
      g.lineStyle(2, 0xffffff, 0.35);
      g.strokeCircle(28, 28, 26);
      g.generateTexture(`tile-${index}`, 56, 56);
      g.destroy();
    });

    const highlight = this.add.graphics();
    highlight.lineStyle(4, 0xffffff, 1);
    highlight.strokeCircle(28, 28, 30);
    highlight.generateTexture('highlight', 64, 64);
    highlight.destroy();

    this.scene.start('GameScene');
  }
}
