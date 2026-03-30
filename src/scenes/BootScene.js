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

    const bokeh = this.add.graphics();
    bokeh.fillStyle(0xffffff, 1);
    bokeh.fillCircle(20, 20, 20);
    bokeh.generateTexture('bokeh', 40, 40);
    bokeh.destroy();

    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffffff, 1);
    sparkle.fillCircle(5, 5, 5);
    sparkle.generateTexture('sparkle', 10, 10);
    sparkle.destroy();

    const glow = this.add.graphics();
    glow.fillStyle(0xffffff, 0.9);
    glow.fillCircle(40, 40, 34);
    glow.lineStyle(3, 0xffffff, 0.6);
    glow.strokeCircle(40, 40, 36);
    glow.generateTexture('special-glow', 80, 80);
    glow.destroy();

    this.scene.start('GameScene');
  }
}
