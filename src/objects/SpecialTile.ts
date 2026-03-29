import Phaser from 'phaser';
import { Tile, SpecialType } from './Tile';

export class SpecialTile {
  static style(tile: Tile, scene: Phaser.Scene): void {
    if (tile.data.special === SpecialType.None) return;
    tile.refreshSpecialVisual(scene);
    scene.tweens.add({ targets: tile.sprite, scale: { from: 1, to: 1.14 }, duration: 220, yoyo: true, ease: 'Back.easeOut' });
  }
}
