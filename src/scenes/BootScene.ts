import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.8, 28, 0x3a2a67).setOrigin(0.5);
    const bar = this.add.rectangle(bg.x - bg.width / 2, bg.y, 6, 20, 0xff9af2).setOrigin(0, 0.5);

    this.load.on('progress', (v: number) => {
      bar.width = (bg.width - 8) * v;
    });

    this.load.spritesheet('berry_tiles', '/assets/sprites/berry_tiles.png', {
      frameWidth: 352,
      frameHeight: 384,
      endFrame: 31,
    });
    this.load.atlas('ui', '/assets/sprites/ui.png', '/assets/sprites/ui.json');
  }

  create(): void {
    if (!this.textures.exists('berry_tiles')) {
      const g = this.add.graphics();
      const colors = [0xff4f7b, 0x6288ff, 0xaf5dff, 0xff6f59, 0x4cd984, 0xffd45b];
      for (let i = 0; i < 6; i++) {
        g.fillStyle(colors[i], 1).fillCircle(45 + i * 100, 45, 38);
      }
      g.generateTexture('berry_tiles', 700, 90);
      g.destroy();
    }
    this.scene.start('TitleScene');
  }
}
