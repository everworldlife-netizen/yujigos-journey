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
      score: this.makePanel(this.panelContainers.score, 'SCORE', '0'),
      level: this.makePanel(this.panelContainers.level, 'LEVEL', '1'),
      moves: this.makePanel(this.panelContainers.moves, 'MOVES', '20')
    };

    const pauseSize = 44;
    this.pauseBtn = scene.add.container(0, 0).setDepth(50).setSize(pauseSize, pauseSize).setInteractive();
    const pauseBg = scene.add.rectangle(0, 0, pauseSize, pauseSize, 0x1f355f, 0.9).setStrokeStyle(2, 0xffffff, 0.3);
    const pauseIconKey = getUiTextureKey('pauseIcon');
    const pauseIcon = scene.textures.exists(pauseIconKey) ? scene.add.image(0, 0, pauseIconKey).setDisplaySize(24, 20) : scene.add.rectangle(0, 0, 22, 18, 0xffffff, 0.95);
    this.pauseBtn.add([pauseBg, pauseIcon]);
    this.pauseBtn.on('pointerdown', () => EventBus.emit('game:pause'));

    EventBus.on('score:update', this.onScoreUpdate, this);
    EventBus.on('moves:update', this.onMovesUpdate, this);
  }

  makePanel(parent, label, value) {
    const panel = this.scene.add.container(0, 0).setDepth(50);
    const panelKey = getUiTextureKey('panel');
    if (this.scene.textures.exists(panelKey)) panel.add(this.scene.add.image(0, 0, panelKey).setOrigin(0));
    else panel.add(this.scene.add.rectangle(74, 32, 148, 64, 0x2d4b8f, 0.95).setStrokeStyle(2, 0xffffff, 0.4));
    const labelText = this.scene.add.text(12, 6, label, { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px', color: '#cfe0ff' });
    const valueText = this.scene.add.text(12, 24, value, { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '24px', fontStyle: '700', color: '#ffffff' });
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
    Object.values(this.panels).forEach((panel) => { panel.label.setFontSize(labelSize); panel.value.setFontSize(valueSize); });

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
