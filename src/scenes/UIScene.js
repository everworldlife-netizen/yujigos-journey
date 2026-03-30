import Phaser from 'phaser';
import EventBus from '../core/EventBus.js';
import { getUiTextureKey } from '../config/AssetConfig.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.currentScore = 0;
    this.currentMoves = 20;

    this.panelContainers = {
      score: this.add.container(-180, 10),
      level: this.add.container(184, -80),
      moves: this.add.container(this.scale.width + 180, 10)
    };

    this.panels = {
      score: this.makePanel(this.panelContainers.score, 14, 10, 'SCORE', '0'),
      level: this.makePanel(this.panelContainers.level, 184, 10, 'LEVEL', '1'),
      moves: this.makePanel(this.panelContainers.moves, 354, 10, 'MOVES', '20')
    };

    const pauseIconKey = getUiTextureKey('pauseIcon');
    const pauseBtn = this.textures.exists(pauseIconKey)
      ? this.add.image(this.scale.width - 30, 24, pauseIconKey)
      : this.add.rectangle(this.scale.width - 30, 24, 26, 22, 0x1f355f, 0.95);
    pauseBtn.setDepth(50);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => EventBus.emit('game:pause'));

    this.animateHudIntro();

    EventBus.on('ui:update', this.updateUi, this);
    this.events.once('shutdown', () => EventBus.off('ui:update', this.updateUi, this));
  }

  animateHudIntro() {
    this.tweens.add({ targets: this.panelContainers.score, x: 0, duration: 400, ease: 'Cubic.Out' });
    this.tweens.add({ targets: this.panelContainers.moves, x: 0, duration: 400, delay: 100, ease: 'Cubic.Out' });
    this.tweens.add({ targets: this.panelContainers.level, y: 0, duration: 400, delay: 200, ease: 'Cubic.Out' });
  }

  makePanel(parent, x, y, label, value) {
    const panel = this.add.container(x, y).setDepth(50);
    const panelKey = getUiTextureKey('panel');
    if (this.textures.exists(panelKey)) {
      panel.add(this.add.image(0, 0, panelKey).setOrigin(0));
    } else {
      panel.add(this.add.rectangle(80, 33, 160, 66, 0x2d4b8f, 0.95).setStrokeStyle(2, 0xffffff, 0.4));
    }
    panel.add(this.add.text(14, 8, label, { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px', color: '#cfe0ff' }));
    const valueText = this.add.text(14, 27, value, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700',
      color: '#ffffff'
    });
    panel.add(valueText);
    parent.add(panel);
    return valueText;
  }

  updateUi({ score, moves, level }) {
    this.panels.level.setText(`${level}`);

    if (moves !== this.currentMoves) {
      this.currentMoves = moves;
      this.panels.moves.setText(`${moves}`);
      this.tweens.add({ targets: this.panels.moves, scale: 1.15, duration: 100, yoyo: true, ease: 'Sine.Out' });
    }

    if (score !== this.currentScore) {
      const from = this.currentScore;
      this.currentScore = score;
      this.tweens.addCounter({
        from,
        to: score,
        duration: 280,
        ease: 'Sine.Out',
        onUpdate: (tw) => this.panels.score.setText(`${Math.floor(tw.getValue())}`)
      });

      if (score - from >= 80) {
        this.tweens.add({ targets: this.panels.score, scale: 1.12, duration: 100, yoyo: true, ease: 'Sine.Out' });
        this.tweens.add({ targets: this.panels.score, alpha: 0.75, duration: 100, yoyo: true, ease: 'Sine.InOut' });
      }
    }
  }
}
