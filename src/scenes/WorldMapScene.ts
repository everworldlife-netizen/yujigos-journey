import Phaser from 'phaser';
import { LevelManager } from '../managers/LevelManager';
import { LEVELS } from '../config/levels';

export class WorldMapScene extends Phaser.Scene {
  private levelManager = new LevelManager();

  constructor() { super('WorldMapScene'); }

  create(): void {
    this.cameras.main.fadeIn(350, 10, 8, 22);
    this.levelManager.loadProgress();
    const { width, height } = this.scale;
    const totalH = 4400;

    const container = this.add.container(0, 0);
    const colors = [0x2f6d39, 0x2763a7, 0xd76f2e, 0xd8edff, 0x3f2c7e];
    for (let b = 0; b < 5; b++) {
      container.add(this.add.rectangle(width / 2, totalH - b * 880 - 440, width, 880, colors[b], 1));
    }

    const pathPoints: Array<{x: number; y: number}> = [];
    for (let i = 1; i <= 50; i++) pathPoints.push({ x: width / 2 + Math.sin(i * 0.7) * 170, y: totalH - i * 80 });
    const path = this.add.graphics();
    path.lineStyle(14, 0xffffff, 0.2).beginPath().moveTo(width / 2, totalH - 100);
    pathPoints.forEach((p) => path.lineTo(p.x, p.y));
    path.strokePath();
    container.add(path);

    const dots = this.add.group();
    pathPoints.forEach((p, i) => {
      const d = this.add.circle(p.x, p.y, i % 2 ? 4 : 6, 0xfff6c4, 0.9);
      dots.add(d); container.add(d);
      this.tweens.add({ targets: d, alpha: { from: 0.2, to: 1 }, duration: 900 + i * 12, repeat: -1, yoyo: true });
    });

    LEVELS.forEach((_lvl, idx) => {
      const i = idx + 1;
      const x = width / 2 + Math.sin(i * 0.7) * 170;
      const y = totalH - i * 80;
      const unlocked = this.levelManager.isUnlocked(i);
      const n = this.add.circle(x, y, 32, unlocked ? 0xff7db8 : 0x68708a).setStrokeStyle(5, 0xffffff, 0.8);
      const t = this.add.text(x, y, `${i}`, { fontSize: '26px', color: '#fff', fontStyle: '700' }).setOrigin(0.5);
      container.add([n, t]);
      if (unlocked) {
        this.tweens.add({ targets: n, scale: { from: 1, to: 1.08 }, duration: 800, yoyo: true, repeat: -1 });
        n.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.cameras.main.fadeOut(250, 10, 8, 22);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.levelManager.setCurrent(i);
            this.scene.start('GameScene', { level: i });
          });
        });
      } else {
        n.setAlpha(0.6);
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
