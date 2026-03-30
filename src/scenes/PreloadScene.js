import Phaser from 'phaser';

const COLORS = [0xff4444, 0x4488ff, 0x44dd44, 0xffdd44, 0xbb44ff, 0xff8844];

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 240, 30, 0x223355, 1);
    const bar = this.add.image(width / 2 - 110, height / 2, 'boot-bar').setOrigin(0, 0.5).setScale(0, 1);
    this.load.on('progress', (value) => bar.setScale(value, 1));
    this.load.on('complete', () => barBg.destroy());

    this.loadAssets();
  }

  loadAssets() {
    COLORS.forEach((color, index) => {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(28, 28, 26);
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(20, 20, 12);
      g.lineStyle(2, 0xffffff, 0.35);
      g.strokeCircle(28, 28, 26);
      g.generateTexture(`tile-${index}`, 56, 56);
      g.destroy();
    });

    const light = this.add.graphics();
    light.fillStyle(0xffffff, 1);
    light.fillCircle(20, 20, 20);
    light.generateTexture('bokeh', 40, 40);
    light.destroy();

    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffffff, 1);
    sparkle.fillCircle(5, 5, 5);
    sparkle.generateTexture('sparkle', 10, 10);
    sparkle.destroy();

    const highlight = this.add.graphics();
    highlight.lineStyle(4, 0xffffff, 1);
    highlight.strokeCircle(28, 28, 30);
    highlight.generateTexture('highlight', 64, 64);
    highlight.destroy();

    const glow = this.add.graphics();
    glow.fillStyle(0xffffff, 0.9);
    glow.fillCircle(40, 40, 34);
    glow.lineStyle(3, 0xffffff, 0.6);
    glow.strokeCircle(40, 40, 36);
    glow.generateTexture('special-glow', 80, 80);
    glow.destroy();

    const panel = this.add.graphics();
    panel.fillStyle(0x233a77, 1);
    panel.fillRoundedRect(0, 0, 160, 66, 14);
    panel.lineStyle(2, 0x8fb0ff, 0.45);
    panel.strokeRoundedRect(0, 0, 160, 66, 14);
    panel.generateTexture('ui-panel', 160, 66);
    panel.destroy();

    const button = this.add.graphics();
    button.fillStyle(0x1f2937, 1);
    button.fillRoundedRect(0, 0, 220, 66, 18);
    button.lineStyle(3, 0xffdd44, 0.9);
    button.strokeRoundedRect(0, 0, 220, 66, 18);
    button.generateTexture('ui-button', 220, 66);
    button.destroy();

    const pauseIcon = this.add.graphics();
    pauseIcon.fillStyle(0xffffff, 1);
    pauseIcon.fillRect(4, 2, 6, 16);
    pauseIcon.fillRect(14, 2, 6, 16);
    pauseIcon.generateTexture('ui-pause-icon', 24, 20);
    pauseIcon.destroy();

    const specialStriped = this.add.graphics();
    specialStriped.lineStyle(5, 0xfff1a8, 1);
    specialStriped.strokeLineShape(new Phaser.Geom.Line(8, 8, 48, 48));
    specialStriped.strokeLineShape(new Phaser.Geom.Line(8, 48, 48, 8));
    specialStriped.generateTexture('special-striped', 56, 56);
    specialStriped.destroy();

    const specialBomb = this.add.graphics();
    specialBomb.fillStyle(0xffc1d9, 0.9);
    specialBomb.fillCircle(28, 28, 10);
    specialBomb.generateTexture('special-bomb', 56, 56);
    specialBomb.destroy();

    const specialRainbow = this.add.graphics();
    [0xff4444, 0xffdd44, 0x44dd44, 0x4488ff, 0xbb44ff].forEach((c, i) => {
      specialRainbow.fillStyle(c, 0.95);
      specialRainbow.fillCircle(28, 28, 24 - i * 4);
    });
    specialRainbow.generateTexture('special-rainbow', 56, 56);
    specialRainbow.destroy();
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
