import EventBus from '../utils/EventBus.js';
import { getUiTextureKey } from '../config/AssetConfig.js';

export default class HudManager {
  constructor(scene, layout) {
    this.scene = scene;
    this.layout = layout;
    this.currentScore = 0;
    this.currentMoves = 20;

    this.panelContainers = { score: scene.add.container(0, 0), level: scene.add.container(0, 0), moves: scene.add.container(0, 0) };
    this.panels = {
      score: this.makePanel(this.panelContainers.score, 'SCORE', '0', 'display-score'),
      level: this.makePanel(this.panelContainers.level, 'LEVEL', '1', 'display-level'),
      moves: this.makePanel(this.panelContainers.moves, 'MOVES', '20', 'display-moves')
    };

    const pauseSize = 46;
    this.pauseBtn = scene.add.container(0, 0).setDepth(50).setSize(pauseSize, pauseSize).setInteractive();
    const pauseKey = getUiTextureKey('btn-pause');
    const pauseBg = scene.textures.exists(pauseKey)
      ? scene.add.image(0, 0, pauseKey).setDisplaySize(54, 54)
      : scene.add.circle(0, 0, pauseSize / 2, 0x0f1730, 0.72).setStrokeStyle(2, 0x8bc2ff, 0.42);
    this.pauseBtn.add([pauseBg]);
    this.pauseBtn.on('pointerdown', () => EventBus.emit('game:pause'));

    EventBus.on('score:update', this.onScoreUpdate, this);
    EventBus.on('moves:update', this.onMovesUpdate, this);
  }

  makePanel(parent, label, value, textureName) {
    const panel = this.scene.add.container(0, 0).setDepth(50);
    const panelKey = getUiTextureKey(textureName);
    if (this.scene.textures.exists(panelKey)) panel.add(this.scene.add.image(0, 0, panelKey).setOrigin(0));
    else panel.add(this.scene.add.rectangle(86, 36, 172, 72, 0x0f1730, 0.64).setStrokeStyle(2, 0x8bc2ff, 0.4));
    const labelText = this.scene.add.text(16, 10, label, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: '#aed1ff'
    });
    const valueText = this.scene.add.text(16, 32, value, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '26px',
      fontStyle: '700',
      color: '#ffffff',
      stroke: '#04122d',
      strokeThickness: 4
    });
    panel.add([labelText, valueText]);
    parent.add(panel);
    return { label: labelText, value: valueText };
  }

  layoutHud(layout, animated = false) {
    this.layout = layout;
    const { width, hudTop, hudHeight, boardX, boardWidth, scaleFactor, safeTop } = this.layout;
    const rowY = hudTop + hudHeight / 2;
    const labelSize = Math.max(12, Math.floor(14 * scaleFactor));
    const valueSize = Math.max(20, Math.floor(26 * scaleFactor));
    Object.values(this.panels).forEach((panel) => {
      panel.label.setFontSize(labelSize);
      panel.value.setFontSize(valueSize);
    });

    const targets = [
      { c: this.panelContainers.score, x: boardX, y: rowY },
      { c: this.panelContainers.level, x: boardX + boardWidth / 2 - this.panelContainers.level.width / 2, y: rowY },
      { c: this.panelContainers.moves, x: boardX + boardWidth - this.panelContainers.moves.width, y: rowY }
    ];
    targets.forEach(({ c, x, y }) => (animated ? this.scene.tweens.add({ targets: c, x, y, duration: 350, ease: 'Cubic.Out' }) : c.setPosition(x, y)));
    this.pauseBtn.setPosition(width - 30, safeTop + 30);
  }

  onScoreUpdate({ score, level }) {
    this.panels.level.value.setText(`${level}`);
    const from = this.currentScore;
    this.currentScore = score;
    this.scene.tweens.addCounter({ from, to: score, duration: 280, ease: 'Sine.Out', onUpdate: (tw) => this.panels.score.value.setText(`${Math.floor(tw.getValue())}`) });
  }

  onMovesUpdate({ moves, level }) {
    this.panels.level.value.setText(`${level}`);
    this.currentMoves = moves;
    this.panels.moves.value.setText(`${moves}`);
    this.scene.tweens.add({ targets: this.panels.moves.value, scale: 1.15, duration: 100, yoyo: true, ease: 'Sine.Out' });
  }

  destroy() {
    EventBus.off('score:update', this.onScoreUpdate, this);
    EventBus.off('moves:update', this.onMovesUpdate, this);
  }
}
