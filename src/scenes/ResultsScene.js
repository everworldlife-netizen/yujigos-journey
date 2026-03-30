import Phaser from 'phaser';
import { UI_TEXTURES } from '../config/AssetConfig.js';

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('ResultsScene');
  }

  init(data) {
    this.dataModel = data;
  }

  create() {
    const { width, height } = this.scale;
    const { score, targetScore, win, level } = this.dataModel;
    const stars = win ? Math.max(1, Math.min(3, Math.ceil((score / targetScore) * 3))) : 0;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.add.text(width / 2, 140, win ? 'You Win!' : 'Game Over', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
    this.add.text(width / 2, 220, `Score: ${score}`, { fontSize: '32px', color: '#ffdd44' }).setOrigin(0.5);
    const starRow = this.add.container(width / 2, 280);
    for (let i = 0; i < 3; i += 1) {
      const key = i < stars ? UI_TEXTURES.starFilled : UI_TEXTURES.starEmpty;
      starRow.add(this.add.image((i - 1) * 42, 0, key).setDisplaySize(36, 36));
    }

    const restart = this.makeButton(width / 2, 360, 'Restart');
    restart.on('pointerdown', () => {
      this.scene.stop('ResultsScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene', { level });
    });

    const next = this.makeButton(width / 2, 430, 'Next Level');
    next.on('pointerdown', () => {
      this.scene.stop('ResultsScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene', { level: level + 1 });
    });
  }

  makeButton(x, y, text) {
    return this.add
      .text(x, y, text, { fontSize: '30px', color: '#ffdd44', backgroundColor: '#1f2937', padding: { left: 12, right: 12, top: 8, bottom: 8 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  }
}
