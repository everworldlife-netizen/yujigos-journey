import Phaser from 'phaser';
import EventBus from '../core/EventBus.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.scale;
    const scaleFactor = Phaser.Math.Clamp(width / 720, 0.85, 1.2);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);

    const makeBtn = (label, y, cb) => {
      const btn = this.add
        .text(width / 2, y, label, {
          fontFamily: 'Trebuchet MS, Arial, sans-serif',
          fontSize: `${Math.floor(34 * scaleFactor)}px`,
          color: '#ffdd44',
          backgroundColor: '#1f2937',
          padding: { left: 20, right: 20, top: 12, bottom: 12 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const h = Math.max(44, btn.height);
      btn.setDisplaySize(btn.width, h);
      btn.on('pointerdown', cb);
    };

    makeBtn('Resume', height / 2 - 70, () => EventBus.emit('pause:resume'));
    makeBtn('Restart', height / 2, () => EventBus.emit('pause:restart'));
    makeBtn('Quit', height / 2 + 70, () => EventBus.emit('pause:quit'));
  }
}
