import Phaser from 'phaser';
import { calculateLayout } from '../utils/LayoutCalculator.js';
import HudManager from '../ui/HudManager.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.layout = calculateLayout(this.scale.width, this.scale.height);
    this.hudManager = new HudManager(this, this.layout);
    this.hudManager.layoutHud(this.layout, false);

    this.hudManager.panelContainers.score.x -= 100;
    this.hudManager.panelContainers.level.y -= 80;
    this.hudManager.panelContainers.moves.x += 100;
    this.hudManager.layoutHud(this.layout, true);

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.hudManager.destroy();
    });
  }

  onResize(gameSize) {
    this.layout = calculateLayout(gameSize.width, gameSize.height);
    this.hudManager.layoutHud(this.layout, false);
  }
}
