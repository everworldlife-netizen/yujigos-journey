import Phaser from 'phaser';
import { LEVELS } from '../config/levels';

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, 70, 'Select Level', {
      fontSize: '48px',
      color: '#fff8ff',
      fontFamily: 'Trebuchet MS',
      stroke: '#2f1946',
      strokeThickness: 6,
    }).setOrigin(0.5);

    LEVELS.forEach((level, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = width / 2 - 280 + col * 140;
      const y = 190 + row * 180;
      const btn = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 120, 140, 0x2a1a41, 0.9).setStrokeStyle(2, 0xd9b6ff);
      const t = this.add.text(0, -34, `${level.id}`, { fontSize: '38px', color: '#fff' }).setOrigin(0.5);
      const s = this.add.text(0, 32, `${level.targetScore}`, { fontSize: '16px', color: '#ffe7ff' }).setOrigin(0.5);
      btn.add([bg, t, s]);
      btn.setSize(120, 140);
      btn.setInteractive(new Phaser.Geom.Rectangle(-60, -70, 120, 140), Phaser.Geom.Rectangle.Contains);
      btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.08, duration: 120 }));
      btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 120 }));
      btn.on('pointerdown', () => this.scene.start('PlayGame', { levelId: level.id - 1 }));
    });
  }
}
