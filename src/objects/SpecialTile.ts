import Phaser from 'phaser';
import { Tile, SpecialType } from './Tile';

export class SpecialTile {
  static style(tile: Tile, scene: Phaser.Scene): void {
    if (tile.data.special === SpecialType.None) return;
    const g = scene.add.graphics().setName('special-mark');
    g.fillStyle(0xffffff, 0.75);
    if (tile.data.special === SpecialType.Rainbow) {
      g.fillCircle(0, 0, 13);
    } else if (tile.data.special === SpecialType.Bomb) {
      g.fillRoundedRect(-13, -13, 26, 26, 8);
    } else {
      g.fillRect(-16, -4, 32, 8);
    }
    tile.sprite.add(g);
    scene.tweens.add({
      targets: g,
      alpha: { from: 0.4, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
