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
  public data: TileData;
  private specialLayer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, data: TileData) {
    this.data = data;
    this.sprite = scene.add.container(x, y);
    this.gem = scene.add.image(0, 0, `berry-${data.type}`).setDisplaySize(78, 78);
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
      scale: 1.05,
      duration: 1100,
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

  refreshSpecialVisual(scene: Phaser.Scene): void {
    this.specialLayer?.destroy();
    if (this.data.special === SpecialType.None) return;

    const layer = scene.add.container(0, 0);
    this.specialLayer = layer;
    this.sprite.add(layer);

    if (this.data.special === SpecialType.StripedRow || this.data.special === SpecialType.StripedCol) {
      const stripes = scene.add.image(0, 0, 'special-stripes').setDisplaySize(74, 74).setAlpha(0.6);
      if (this.data.special === SpecialType.StripedCol) stripes.setAngle(90);
      const shimmer = scene.add.rectangle(-36, 0, 12, 80, 0xffffff, 0.35).setAngle(22);
      layer.add([stripes, shimmer]);
      scene.tweens.add({ targets: shimmer, x: 36, duration: 700, repeat: -1, delay: 280, ease: 'Sine.easeInOut', onRepeat: () => shimmer.x = -36 });
    }

    if (this.data.special === SpecialType.Rainbow) {
      const core = scene.add.image(0, 0, 'special-rainbow').setDisplaySize(62, 62).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.72);
      layer.add(core);
      scene.tweens.add({ targets: core, angle: 360, duration: 2200, repeat: -1, ease: 'Linear' });
      for (let i = 0; i < 4; i++) {
        const spark = scene.add.image(0, 0, 'particle-star').setScale(0.42).setTint(0xffffff);
        layer.add(spark);
        scene.tweens.addCounter({
          from: i * 90,
          to: i * 90 + 360,
          duration: 1600 + i * 200,
          repeat: -1,
          onUpdate: (t) => {
            const ang = Phaser.Math.DegToRad(t.getValue());
            spark.x = Math.cos(ang) * 34;
            spark.y = Math.sin(ang) * 34;
          },
        });
      }
    }

    if (this.data.special === SpecialType.Bomb) {
      const core = scene.add.image(0, 0, 'special-bomb').setDisplaySize(68, 68).setAlpha(0.95);
      const glow = scene.add.circle(0, 0, 16, 0xff3a3a, 0.24);
      layer.add([core, glow]);
      scene.tweens.add({ targets: glow, scale: { from: 1, to: 1.8 }, alpha: { from: 0.45, to: 0.12 }, repeat: -1, duration: 820, yoyo: true });
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
