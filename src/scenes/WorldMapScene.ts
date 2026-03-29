import Phaser from 'phaser';
import { LevelManager } from '../managers/LevelManager';
import { LEVELS } from '../config/levels';

export class WorldMapScene extends Phaser.Scene {
  private levelManager = new LevelManager();

  constructor() { super('WorldMapScene'); }

  create(): void {
    this.levelManager.loadProgress();
    const { width, height } = this.scale;
    const totalH = 4400;

    const container = this.add.container(0, 0);
    for (let b = 0; b < 5; b++) {
      const colors = [0x21315f, 0x26492f, 0x5b2f61, 0x5f3f2b, 0x2f4f57];
      container.add(this.add.rectangle(width / 2, totalH - b * 880 - 440, width, 880, colors[b], 1));
    }

    const path = this.add.graphics();
    path.lineStyle(12, 0xfbe3ff, 0.65);
    path.beginPath();
    path.moveTo(width / 2, totalH - 100);
    for (let i = 1; i <= 50; i++) {
      path.lineTo(width / 2 + Math.sin(i * 0.7) * 170, totalH - i * 80);
    }
    path.strokePath();
    container.add(path);

    LEVELS.forEach((lvl, idx) => {
      const i = idx + 1;
      const x = width / 2 + Math.sin(i * 0.7) * 170;
      const y = totalH - i * 80;
      const unlocked = this.levelManager.isUnlocked(i);
      const n = this.add.circle(x, y, 32, unlocked ? 0xff7db8 : 0x68708a).setStrokeStyle(5, 0xffffff, 0.8);
      const t = this.add.text(x, y, `${i}`, { fontSize: '26px', color: '#fff', fontStyle: '700' }).setOrigin(0.5);
      container.add([n, t]);
      if (unlocked) {
        n.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.levelManager.setCurrent(i);
          this.scene.start('GameScene', { level: i });
        });
      }
    });

    this.cameras.main.setBounds(0, 0, width, totalH);
    this.cameras.main.scrollY = totalH - height;

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY - p.velocity.y * 0.02, 0, totalH - height);
    });
  }
}
