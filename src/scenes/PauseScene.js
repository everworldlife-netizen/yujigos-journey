import Phaser from 'phaser';
import EventBus from '../core/EventBus.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);

    const makeBtn = (label, y, cb) => {
      const btn = this.add
        .text(width / 2, y, label, {
          fontFamily: 'Trebuchet MS, Arial, sans-serif',
          fontSize: '32px',
          color: '#ffdd44',
          backgroundColor: '#1f2937',
          padding: { left: 14, right: 14, top: 8, bottom: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', cb);
    };

    makeBtn('Resume', height / 2 - 40, () => EventBus.emit('pause:resume'));
    makeBtn('Restart', height / 2 + 10, () => EventBus.emit('pause:restart'));
    makeBtn('Quit', height / 2 + 60, () => EventBus.emit('pause:quit'));
  }
}
