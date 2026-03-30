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
    const scaleFactor = Phaser.Math.Clamp(width / 720, 0.85, 1.2);
    const { score, targetScore, win, level } = this.dataModel;
    const stars = win ? Math.max(1, Math.min(3, Math.ceil((score / targetScore) * 3))) : 0;

    const panel = this.add.container(width + 40, 0);
    panel.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7));
    panel.add(this.add.text(width / 2, height * 0.2, win ? 'You Win!' : 'Game Over', { fontSize: `${Math.floor(52 * scaleFactor)}px`, color: '#fff' }).setOrigin(0.5));
    panel.add(this.add.text(width / 2, height * 0.3, `Score: ${score}`, { fontSize: `${Math.floor(34 * scaleFactor)}px`, color: '#ffdd44' }).setOrigin(0.5));
    const starRow = this.add.container(width / 2, height * 0.39);
    for (let i = 0; i < 3; i += 1) {
      const size = Math.max(36, Math.floor(44 * scaleFactor));
      const star = this.add.image((i - 1) * (size + 8), 0, getUiTextureKey('star')).setDisplaySize(size, size);
      if (i >= stars) star.setAlpha(0.2);
      starRow.add(star);
    }
    panel.add(starRow);

    const restart = this.makeButton(width / 2, height * 0.56, 'Restart', scaleFactor);
    panel.add(restart);
    restart.on('pointerdown', () => this.slideOutToGame(level));

    const next = this.makeButton(width / 2, height * 0.66, 'Next Level', scaleFactor);
    panel.add(next);
    next.on('pointerdown', () => this.slideOutToGame(level + 1));

    this.tweens.add({ targets: panel, x: 0, duration: 360, ease: 'Cubic.Out' });
  }

  makeButton(x, y, text, scaleFactor) {
    const button = this.add
      .text(x, y, text, {
        fontSize: `${Math.floor(32 * scaleFactor)}px`,
        color: '#ffdd44',
        backgroundColor: '#1f2937',
        padding: { left: 16, right: 16, top: 10, bottom: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const h = Math.max(44, button.height);
    button.setDisplaySize(button.width, h);
    return button;
  }

  slideOutToGame(level) {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(220, () => {
      this.scene.stop('ResultsScene');
      this.scene.start('GameScene', { level });
    });
  }
}
