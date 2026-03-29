import Phaser from 'phaser';

export class AnimationManager {
  constructor(private scene: Phaser.Scene) {}

  bounceSpawn(target: Phaser.GameObjects.Components.Transform, delay = 0): void {
    this.scene.tweens.add({ targets: target, scale: { from: 0, to: 1 }, duration: 380, delay, ease: 'Back.easeOut' });
  }

  smoothSwap(target: Phaser.GameObjects.Container, x: number, y: number): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: target,
        x,
        y,
        duration: 240,
        ease: 'Back.easeInOut',
        onStart: () => this.scene.tweens.add({ targets: target, scale: 1.14, yoyo: true, duration: 120 }),
        onComplete: () => {
          this.scene.tweens.add({ targets: target, scale: { from: 1.02, to: 1 }, duration: 140, ease: 'Bounce.easeOut' });
          resolve();
        },
      });
    });
  }

  clear(target: Phaser.GameObjects.Container): Promise<void> {
    return new Promise((resolve) => {
      const flash = this.scene.add.rectangle(target.x, target.y, 86, 86, 0xffffff, 0.95);
      this.scene.tweens.add({ targets: flash, alpha: 0, duration: 140, onComplete: () => flash.destroy() });
      this.scene.tweens.add({ targets: target, scale: 1.26, duration: 130, yoyo: true, ease: 'Sine.easeOut' });
      this.scene.tweens.add({
        targets: target,
        alpha: 0,
        duration: 240,
        ease: 'Quart.easeOut',
        onComplete: () => resolve(),
      });
    });
  }

  comboPopup(combo: number, x: number, y: number): void {
    const label = combo >= 5 ? 'INCREDIBLE!' : combo >= 3 ? 'AMAZING!' : 'SWEET!';
    const t = this.scene.add.text(x, y, label, {
      fontSize: `${54 + Math.min(combo, 5) * 5}px`, color: '#fff7a3', fontStyle: '900', stroke: '#672170', strokeThickness: 8,
    }).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 110, alpha: 0, scale: { from: 0.15, to: 1.18 }, duration: 740, ease: 'Back.easeOut', onComplete: () => t.destroy() });
  }

  popup(text: string, x: number, y: number, combo = false): void {
    const t = this.scene.add.text(x, y, text, {
      fontSize: combo ? '48px' : '28px',
      color: combo ? '#ffd86e' : '#ffffff',
      fontStyle: '700',
      stroke: '#4b2157',
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 80, alpha: 0, scale: { from: 0.8, to: 1.2 }, duration: combo ? 680 : 540, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }
}
