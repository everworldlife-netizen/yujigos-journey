import Phaser from 'phaser';

export class AnimationManager {
  constructor(private scene: Phaser.Scene) {}

  bounceSpawn(target: Phaser.GameObjects.Components.Transform, delay = 0): void {
    this.scene.tweens.add({
      targets: target,
      scale: { from: 0, to: 1 },
      duration: 320,
      delay,
      ease: 'Back.easeOut',
    });
  }

  smoothSwap(target: Phaser.GameObjects.Container, x: number, y: number): Promise<void> {
    return new Promise((resolve) => {
      const startY = target.y;
      this.scene.tweens.add({
        targets: target,
        x,
        y,
        duration: 180,
        ease: 'Cubic.easeInOut',
        onUpdate: (tw) => {
          const t = tw.progress;
          target.y = Phaser.Math.Interpolation.CubicBezier([startY, startY - 12, y - 12, y], t);
        },
        onComplete: () => resolve(),
      });
    });
  }

  clear(target: Phaser.GameObjects.Container): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: target,
        scale: 1.3,
        alpha: 0,
        duration: 220,
        ease: 'Quart.easeOut',
        onComplete: () => resolve(),
      });
    });
  }

  popup(text: string, x: number, y: number, combo = false): void {
    const t = this.scene.add.text(x, y, text, {
      fontSize: combo ? '42px' : '28px',
      color: combo ? '#ffd86e' : '#ffffff',
      fontStyle: '700',
      stroke: '#4b2157',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: t,
      y: y - 80,
      alpha: 0,
      scale: { from: 0.8, to: 1.2 },
      duration: combo ? 680 : 540,
      ease: combo ? 'Elastic.easeOut' : 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
