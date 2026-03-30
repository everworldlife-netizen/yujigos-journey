import Phaser from 'phaser';
import { getUiTextureKey } from '../config/AssetConfig.js';

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

    const panel = this.add.container(width + 40, 0);
    panel.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7));
    panel.add(this.add.text(width / 2, 140, win ? 'You Win!' : 'Game Over', { fontSize: '48px', color: '#fff' }).setOrigin(0.5));
    panel.add(this.add.text(width / 2, 220, `Score: ${score}`, { fontSize: '32px', color: '#ffdd44' }).setOrigin(0.5));
    const starRow = this.add.container(width / 2, 280);
    for (let i = 0; i < 3; i += 1) {
      const star = this.add.image((i - 1) * 42, 0, getUiTextureKey('star')).setDisplaySize(36, 36);
      if (i >= stars) star.setAlpha(0.2);
      starRow.add(star);
    }
    panel.add(starRow);

    const restart = this.makeButton(width / 2, 360, 'Restart');
    panel.add(restart);
    restart.on('pointerdown', () => {
      this.slideOutToGame(level);
    });

    const next = this.makeButton(width / 2, 430, 'Next Level');
    panel.add(next);
    next.on('pointerdown', () => {
      this.slideOutToGame(level + 1);
    });

    this.tweens.add({ targets: panel, x: 0, duration: 360, ease: 'Cubic.Out' });
  }

  makeButton(x, y, text) {
    return this.add
      .text(x, y, text, { fontSize: '30px', color: '#ffdd44', backgroundColor: '#1f2937', padding: { left: 12, right: 12, top: 8, bottom: 8 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  }

  slideOutToGame(level) {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(220, () => {
      this.scene.stop('ResultsScene');
      this.scene.start('GameScene', { level });
    });
  }
}
