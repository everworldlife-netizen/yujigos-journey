import Phaser from 'phaser';

export type ObstacleType = 'ice' | 'chain' | 'stone' | 'honey' | 'chocolate' | 'bubble' | 'void';

export type ObstacleConfig = {
  row: number;
  col: number;
  type: ObstacleType;
  hp: number;
};

export class Obstacle extends Phaser.GameObjects.Sprite {
  public obstacleType: ObstacleType;
  public hp: number;
  public row: number;
  public col: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ObstacleConfig) {
    super(scene, x, y, 'obstacles_tiles', Obstacle.frameFor(config.type, config.hp));
    this.obstacleType = config.type;
    this.hp = config.hp;
    this.row = config.row;
    this.col = config.col;
    this.setDisplaySize(82, 82);
    this.setDepth(25);
    scene.add.existing(this);
    this.setAlpha(this.obstacleType === 'bubble' ? 0.88 : 1);
  }

  static frameFor(type: ObstacleType, hp: number): number {
    switch (type) {
      case 'ice':
        return Phaser.Math.Clamp(2 - hp, 0, 2);
      case 'chain':
        return hp >= 2 ? 9 : 8;
      case 'stone':
        return 17;
      case 'honey':
        return 24;
      case 'chocolate':
        return 25;
      case 'bubble':
        return 27;
      case 'void':
        return 31;
      default:
        return 32;
    }
  }

  setGridPosition(row: number, col: number): void {
    this.row = row;
    this.col = col;
  }

  isDestructible(): boolean {
    return this.obstacleType !== 'stone';
  }

  async damage(scene: Phaser.Scene, amount = 1): Promise<boolean> {
    if (!this.isDestructible()) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.setFrame(Obstacle.frameFor(this.obstacleType, this.hp));

    await new Promise<void>((resolve) => {
      scene.tweens.add({
        targets: this,
        x: this.x + 4,
        duration: 50,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        onStart: () => {
          scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, duration: 90, repeat: 1 });
        },
        onComplete: () => {
          this.setAlpha(this.obstacleType === 'bubble' ? 0.88 : 1);
          resolve();
        },
      });
    });

    return this.hp <= 0;
  }

  async destroyAnimated(scene: Phaser.Scene): Promise<void> {
    const particles = scene.add.particles(this.x, this.y, 'particle_sheet', {
      frame: [48, 49, 50, 51, 52],
      speed: { min: 90, max: 260 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 260, max: 520 },
      quantity: 16,
      tint: [0xffffff, 0xb8d9ff, 0x9d8a6a],
      emitting: false,
      gravityY: 200,
    });
    particles.explode();

    await new Promise<void>((resolve) => {
      scene.tweens.add({
        targets: this,
        scale: 1.22,
        alpha: 0,
        angle: Phaser.Math.Between(-15, 15),
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => resolve(),
      });
    });

    this.destroy();
    scene.time.delayedCall(700, () => particles.destroy());
  }
}
