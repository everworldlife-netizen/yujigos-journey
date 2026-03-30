import Phaser from 'phaser';
import EventBus from '../core/EventBus.js';
import { getUiTextureKey } from '../config/AssetConfig.js';
import { calculateLayout } from '../utils/Layout.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.currentScore = 0;
    this.currentMoves = 20;
    this.layout = calculateLayout(this.scale.width, this.scale.height);

    this.panelContainers = {
      score: this.add.container(0, 0),
      level: this.add.container(0, 0),
      moves: this.add.container(0, 0)
    };

    this.panels = {
      score: this.makePanel(this.panelContainers.score, 'SCORE', '0'),
      level: this.makePanel(this.panelContainers.level, 'LEVEL', '1'),
      moves: this.makePanel(this.panelContainers.moves, 'MOVES', '20')
    };

    const pauseIconKey = getUiTextureKey('pauseIcon');
    const pauseSize = 44;
    this.pauseBtn = this.add.container(0, 0).setDepth(50).setSize(pauseSize, pauseSize).setInteractive();
    const pauseBg = this.add.rectangle(0, 0, pauseSize, pauseSize, 0x1f355f, 0.9).setStrokeStyle(2, 0xffffff, 0.3);
    const pauseIcon = this.textures.exists(pauseIconKey)
      ? this.add.image(0, 0, pauseIconKey).setDisplaySize(24, 20)
      : this.add.rectangle(0, 0, 22, 18, 0xffffff, 0.95);
    this.pauseBtn.add([pauseBg, pauseIcon]);
    this.pauseBtn.on('pointerdown', () => EventBus.emit('game:pause'));

    this.layoutHud(false);
    this.animateHudIntro();

    this.scale.on('resize', this.onResize, this);
    EventBus.on('ui:update', this.updateUi, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      EventBus.off('ui:update', this.updateUi, this);
    });
  }

  onResize(gameSize) {
    this.layout = calculateLayout(gameSize.width, gameSize.height);
    this.layoutHud(false);
  }

  layoutHud(animated) {
    const { width, hudTop, hudHeight, boardX, boardWidth, scaleFactor, safeTop } = this.layout;
    const rowY = hudTop + hudHeight / 2;
    const labelSize = Math.max(12, Math.floor(14 * scaleFactor));
    const valueSize = Math.max(20, Math.floor(26 * scaleFactor));

    Object.values(this.panels).forEach((panel) => {
      panel.label.setFontSize(labelSize);
      panel.value.setFontSize(valueSize);
    });

    const leftX = boardX;
    const centerX = boardX + boardWidth / 2;
    const rightX = boardX + boardWidth;

    const targets = [
      { c: this.panelContainers.score, x: leftX, y: rowY },
      { c: this.panelContainers.level, x: centerX - this.panelContainers.level.width / 2, y: rowY },
      { c: this.panelContainers.moves, x: rightX - this.panelContainers.moves.width, y: rowY }
    ];

    targets.forEach(({ c, x, y }) => {
      if (animated) this.tweens.add({ targets: c, x, y, duration: 350, ease: 'Cubic.Out' });
      else c.setPosition(x, y);
    });

    this.pauseBtn.setPosition(width - 30, safeTop + 30);
  }

  animateHudIntro() {
    this.panelContainers.score.x -= 100;
    this.panelContainers.level.y -= 80;
    this.panelContainers.moves.x += 100;
    this.layoutHud(true);
  }

  makePanel(parent, label, value) {
    const panel = this.add.container(0, 0).setDepth(50);
    const panelKey = getUiTextureKey('panel');
    if (this.textures.exists(panelKey)) {
      const img = this.add.image(0, 0, panelKey).setOrigin(0);
      panel.add(img);
    } else {
      panel.add(this.add.rectangle(74, 32, 148, 64, 0x2d4b8f, 0.95).setStrokeStyle(2, 0xffffff, 0.4));
    }
    const labelText = this.add.text(12, 6, label, { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px', color: '#cfe0ff' });
    const valueText = this.add.text(12, 24, value, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700',
      color: '#ffffff'
    });
    panel.add([labelText, valueText]);
    parent.add(panel);
    return { label: labelText, value: valueText };
  }

  updateUi({ score, moves, level }) {
    this.panels.level.value.setText(`${level}`);

    if (moves !== this.currentMoves) {
      this.currentMoves = moves;
      this.panels.moves.value.setText(`${moves}`);
      this.tweens.add({ targets: this.panels.moves.value, scale: 1.15, duration: 100, yoyo: true, ease: 'Sine.Out' });
    }

    if (score !== this.currentScore) {
      const from = this.currentScore;
      this.currentScore = score;
      this.tweens.addCounter({
        from,
        to: score,
        duration: 280,
        ease: 'Sine.Out',
        onUpdate: (tw) => this.panels.score.value.setText(`${Math.floor(tw.getValue())}`)
      });

      if (score - from >= 80) {
        this.tweens.add({ targets: this.panels.score.value, scale: 1.12, duration: 100, yoyo: true, ease: 'Sine.Out' });
        this.tweens.add({ targets: this.panels.score.value, alpha: 0.75, duration: 100, yoyo: true, ease: 'Sine.InOut' });
      }
    }
  }
}
