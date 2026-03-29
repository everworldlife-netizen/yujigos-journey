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
  public gem: Phaser.GameObjects.Sprite;
  public data: TileData;
  private specialLayer?: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, data: TileData) {
    this.data = data;
    this.sprite = scene.add.container(x, y);
    this.gem = scene.add.sprite(0, 0, 'berry_tiles', data.type).setDisplaySize(78, 78);
    this.sprite.add(this.gem);
    this.sprite.setSize(82, 82);
    this.sprite.setInteractive({ useHandCursor: true });

    scene.tweens.add({
      targets: this.sprite,
      y: y - 3,
      duration: 1300 + Phaser.Math.Between(0, 500),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.gem,
      scale: { from: 1, to: 1.08 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.refreshSpecialVisual(scene);
    this.redrawBlockers(scene);
  }

  setGridPosition(row: number, col: number): void {
    this.data.row = row;
    this.data.col = col;
  }

  getTintColor(): number {
    return [0xff4f8f, 0x4f8fff, 0xb45cff, 0xff7a4f, 0x4fe0a0, 0xffd45a][this.data.type] ?? 0xffffff;
  }

  setBaseFrame(): void {
    this.gem.setFrame(this.data.type);
  }

  async playMatchReaction(scene: Phaser.Scene): Promise<void> {
    this.gem.setFrame(this.data.type + 8);
    await new Promise<void>((resolve) => {
      scene.tweens.add({
        targets: this.gem,
        scale: { from: 1, to: 1.22 },
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => resolve(),
      });
    });
  }

  refreshSpecialVisual(scene: Phaser.Scene): void {
    this.specialLayer?.destroy();
    if (this.data.special === SpecialType.None) {
      this.applyFrameByState();
      return;
    }

    this.gem.setFrame(this.data.type + 16);

    const frameMap: Record<SpecialType, number> = {
      [SpecialType.None]: 0,
      [SpecialType.StripedRow]: 0,
      [SpecialType.StripedCol]: 1,
      [SpecialType.Rainbow]: 2,
      [SpecialType.Bomb]: 3,
    };

    const overlay = scene.add.sprite(0, 0, 'power_ups', frameMap[this.data.special]).setDisplaySize(72, 72).setAlpha(0.95);
    this.specialLayer = overlay;
    this.sprite.add(overlay);

    scene.tweens.add({ targets: overlay, angle: 360, duration: 1800, repeat: -1, ease: 'Linear' });
  }

  redrawBlockers(_scene: Phaser.Scene): void {
    this.applyFrameByState();
  }

  private applyFrameByState(): void {
    if (this.data.blockerChain || this.data.blockerIce > 0) {
      this.gem.setFrame(this.data.type + 24);
      return;
    }

    if (this.data.special !== SpecialType.None) {
      this.gem.setFrame(this.data.type + 16);
      return;
    }

    this.gem.setFrame(this.data.type);
  }
}
