import Phaser from 'phaser';
import EventBus from '../core/EventBus.js';
import { UI_TEXTURES } from '../config/AssetConfig.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.panels = {
      score: this.makePanel(14, 10, 'SCORE', '0'),
      level: this.makePanel(184, 10, 'LEVEL', '1'),
      moves: this.makePanel(354, 10, 'MOVES', '20')
    };

    const pauseBtn = this.add.image(this.scale.width - 30, 24, UI_TEXTURES.pauseIcon).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => EventBus.emit('game:pause'));

    EventBus.on('ui:update', this.updateUi, this);
    this.events.once('shutdown', () => EventBus.off('ui:update', this.updateUi, this));
  }

  makePanel(x, y, label, value) {
    const panel = this.add.container(x, y).setDepth(50);
    panel.add(this.add.image(0, 0, UI_TEXTURES.panel).setOrigin(0));
    panel.add(this.add.text(14, 8, label, { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px', color: '#cfe0ff' }));
    const valueText = this.add.text(14, 27, value, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700',
      color: '#ffffff'
    });
    panel.add(valueText);
    return valueText;
  }

  updateUi({ score, moves, level }) {
    this.panels.score.setText(`${score}`);
    this.panels.moves.setText(`${moves}`);
    this.panels.level.setText(`${level}`);
  }
}
