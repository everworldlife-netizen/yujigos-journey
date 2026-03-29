import Phaser from 'phaser';
import { LevelManager } from '../managers/LevelManager';
import { LEVELS } from '../config/levels';
import { AudioManager } from '../managers/AudioManager';

export class WorldMapScene extends Phaser.Scene {
  private levelManager = new LevelManager();
  private audioManager = new AudioManager();

  constructor() { super('WorldMapScene'); }

  create(): void {
    this.audioManager.stopMusic();
    void this.audioManager.unlock();
    this.cameras.main.fadeIn(350, 10, 8, 22);
    this.levelManager.loadProgress();
    const { width, height } = this.scale;
    const totalH = 4400;

    const container = this.add.container(0, 0);
    container.add(this.add.image(width / 2, totalH / 2, 'bg_world_map').setDisplaySize(width, totalH));

    const pathPoints: Array<{x: number; y: number}> = [];
    for (let i = 1; i <= 50; i++) pathPoints.push({ x: width / 2 + Math.sin(i * 0.7) * 170, y: totalH - i * 80 });
    pathPoints.forEach((p, i) => {
      const d = this.add.image(p.x, p.y, 'world_map_elements', 'path_tile').setDisplaySize(i % 2 ? 36 : 44, i % 2 ? 36 : 44);
      container.add(d);
    });

    LEVELS.forEach((_lvl, idx) => {
      const i = idx + 1;
      const x = width / 2 + Math.sin(i * 0.7) * 170;
      const y = totalH - i * 80;
      const unlocked = this.levelManager.isUnlocked(i);
      const n = this.add.image(x, y, 'world_map_elements', 'level_node').setDisplaySize(74, 74).setAlpha(unlocked ? 1 : 0.5);
      const t = this.add.text(x, y, `${i}`, { fontSize: '26px', color: '#fff', fontStyle: '700' }).setOrigin(0.5);
      container.add([n, t]);
      if (unlocked) {
        this.tweens.add({ targets: n, scale: { from: 1, to: 1.08 }, duration: 800, yoyo: true, repeat: -1 });
        n.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.audioManager.buttonClick();
          this.cameras.main.fadeOut(250, 10, 8, 22);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.levelManager.setCurrent(i);
            this.scene.start('GameScene', { level: i });
          });
        });
      }

      if (i % 8 === 0) {
        const npc = this.add.sprite(x + 80, y - 70, 'npc_sprites', (Math.floor(i / 8) % 18)).setScale(0.2);
        const lm = this.add.image(x + 20, y - 40, 'world_map_elements', 'landmark').setDisplaySize(120, 80).setAlpha(0.7);
        container.add([lm, npc]);
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
