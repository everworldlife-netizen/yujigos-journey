import Phaser from 'phaser';

const GEM_COLORS = [0x5ce1ff, 0xff6ec7, 0xffb347, 0x8fff71, 0xb38dff, 0xff6f6f, 0x7cf9f2];

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height * 0.8, width * 0.55, 20, 0x3d2658).setOrigin(0.5);
    const bar = this.add.rectangle(barBg.x - barBg.width / 2, barBg.y, 2, 14, 0xfaf4ff).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = Math.max(2, (barBg.width - 6) * v); });
    this.load.on('complete', () => this.scene.start('LevelSelect'));

    this.time.delayedCall(80, () => this.generateTextures());
  }

  private generateTextures(): void {
    for (let i = 0; i < GEM_COLORS.length; i += 1) {
      const key = `gem-${i}`;
      const g = this.add.graphics();
      g.fillStyle(GEM_COLORS[i], 1);
      g.fillCircle(30, 30, 24);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(22, 20, 8);
      g.lineStyle(4, 0xffffff, 0.3);
      g.strokeCircle(30, 30, 22);
      g.generateTexture(key, 60, 60);
      g.destroy();
    }

    const fx = this.add.graphics();
    fx.fillStyle(0xffffff, 1);
    fx.fillCircle(6, 6, 5);
    fx.generateTexture('spark', 12, 12);
    fx.clear();
    fx.fillStyle(0xffffff, 0.65);
    fx.fillRect(0, 0, 8, 32);
    fx.generateTexture('ray', 8, 32);
    fx.clear();
    fx.fillStyle(0x273042, 1);
    fx.fillRoundedRect(0, 0, 60, 60, 12);
    fx.lineStyle(2, 0x8ec7ff, 0.5);
    fx.strokeRoundedRect(2, 2, 56, 56, 11);
    fx.generateTexture('stone', 60, 60);
    fx.destroy();
  }
}
