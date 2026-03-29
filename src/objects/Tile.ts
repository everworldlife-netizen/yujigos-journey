import Phaser from 'phaser';

export enum SpecialType {
  None = 'none',
  StripedRow = 'stripedRow',
  StripedCol = 'stripedCol',
  Rainbow = 'rainbow',
  Bomb = 'bomb',
}

export type TileData = {
  type: number;
  row: number;
  col: number;
  blockerIce: number;
  blockerChain: boolean;
  special: SpecialType;
};

export class Tile {
  public sprite: Phaser.GameObjects.Container;
  public gem: Phaser.GameObjects.Image;
  public overlay?: Phaser.GameObjects.Text;
  public data: TileData;

  constructor(scene: Phaser.Scene, x: number, y: number, data: TileData, frame?: number) {
    this.data = data;
    this.sprite = scene.add.container(x, y);
    const texture = scene.textures.get('berry_tiles');
    const candidate = frame ?? data.type;
    const useFrame = texture && texture.has(candidate);
    this.gem = scene.add.image(0, 0, 'berry_tiles', useFrame ? candidate : undefined);
    this.gem.setDisplaySize(78, 78);
    this.sprite.add(this.gem);
    this.sprite.setSize(82, 82);
    this.sprite.setInteractive({ useHandCursor: true });

    this.updateFaceFallback(scene);
    this.redrawBlockers(scene);
  }

  setGridPosition(row: number, col: number): void {
    this.data.row = row;
    this.data.col = col;
  }

  updateFaceFallback(scene: Phaser.Scene): void {
    const texture = scene.textures.get('berry_tiles');
    const hasFrames = texture && texture.has(this.data.type);
    if (!hasFrames) {
      if (!this.overlay) {
        this.overlay = scene.add.text(0, 0, ['🍓', '🫐', '🍇', '🍒', '🍑', '🍏'][this.data.type], {
          fontSize: '36px',
        }).setOrigin(0.5);
        this.sprite.add(this.overlay);
      }
    }
  }

  redrawBlockers(scene: Phaser.Scene): void {
    const existing = this.sprite.getByName('blocker') as Phaser.GameObjects.Graphics | null;
    existing?.destroy();
    const g = scene.add.graphics().setName('blocker');
    if (this.data.blockerIce > 0) {
      g.lineStyle(3, 0xb7f4ff, 0.85).strokeRoundedRect(-39, -39, 78, 78, 16);
      g.fillStyle(0xb7f4ff, 0.2 + this.data.blockerIce * 0.14).fillRoundedRect(-39, -39, 78, 78, 16);
    }
    if (this.data.blockerChain) {
      g.lineStyle(4, 0xadb3c0, 0.9);
      g.beginPath();
      g.moveTo(-30, -30);
      g.lineTo(30, 30);
      g.moveTo(30, -30);
      g.lineTo(-30, 30);
      g.strokePath();
    }
    this.sprite.add(g);
  }
}
