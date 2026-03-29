import Phaser from 'phaser';
import { audioManager } from './AudioManager';

export class AnimationManager {
  constructor(private scene: Phaser.Scene) {}

  bounceSpawn(target: Phaser.GameObjects.Components.Transform, delay = 0): void {
    this.scene.tweens.add({
      targets: target,
      scale: { from: 0, to: 1.08 },
      duration: 420,
      delay,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({ targets: target, scale: 1, duration: 180, ease: 'Sine.easeOut' });
      },
    });
  }

  smoothSwap(target: Phaser.GameObjects.Container, x: number, y: number, failed = false): Promise<void> {
    return new Promise((resolve) => {
      const startX = target.x;
      const startY = target.y;
      const ctrlX = (startX + x) * 0.5;
      const ctrlY = (startY + y) * 0.5 - 16;
      const path = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(startX, startY),
        new Phaser.Math.Vector2(ctrlX, ctrlY),
        new Phaser.Math.Vector2(x, y),
      );
      const follower = { t: 0 };
      this.scene.tweens.add({ targets: target, scale: 1.12, duration: 110, yoyo: true, ease: 'Sine.easeInOut' });
      this.scene.tweens.add({
        targets: follower,
        t: 1,
        duration: 220,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const p = path.getPoint(follower.t);
          target.setPosition(p.x, p.y);
        },
        onComplete: () => {
          if (failed) {
            this.scene.tweens.add({
              targets: target,
              x: x + 4,
              duration: 52,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                this.scene.tweens.add({
                  targets: target,
                  angle: { from: -8, to: 8 },
                  duration: 160,
                  yoyo: true,
                  onComplete: () => {
                    target.setAngle(0);
                    resolve();
                  },
                });
              },
            });
            return;
          }

          const glow = this.scene.add.circle(x, y, 44, 0xffffff, 0.4);
          this.scene.tweens.add({ targets: glow, scale: 0, alpha: 0, duration: 220, onComplete: () => glow.destroy() });
          this.scene.tweens.add({ targets: target, scale: { from: 1.05, to: 1 }, duration: 140, ease: 'Back.Out' });
          resolve();
        },
      });
    });
  }

  clear(target: Phaser.GameObjects.Container, delay = 0): Promise<void> {
    return new Promise((resolve) => {
      this.scene.time.delayedCall(delay, () => {
        const flash = this.scene.add.rectangle(target.x, target.y, 94, 94, 0xffffff, 0).setDepth(60);
        const ring = this.scene.add.circle(target.x, target.y, 20, 0xffffff, 0).setStrokeStyle(5, 0xffffff, 1).setDepth(60);

        this.scene.tweens.add({ targets: target, scaleX: 1.3, scaleY: 1.3, duration: 80, ease: 'Back.Out' });
        this.scene.tweens.add({ targets: flash, alpha: { from: 0, to: 1 }, duration: 50, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => flash.destroy() });
        this.scene.tweens.add({
          targets: ring,
          scale: 2.5,
          alpha: 0,
          duration: 220,
          ease: 'Quad.easeOut',
          onComplete: () => ring.destroy(),
        });

        this.scene.tweens.add({
          targets: target,
          alpha: 0,
          scale: 0.25,
          duration: 180,
          ease: 'Cubic.easeIn',
          onComplete: () => resolve(),
        });
      });
    });
  }

  comboPopup(combo: number, x: number, y: number): void {
    const label = `${combo}x COMBO!`;
    const sparkle = this.scene.add.circle(x, y, 140, 0xffef9e, 0.18).setDepth(120);
    this.scene.tweens.add({ targets: sparkle, scale: 1.8, alpha: 0, duration: 420, onComplete: () => sparkle.destroy() });

    const t = this.scene.add.text(x, y, label, {
      fontSize: `${56 + Math.min(combo, 5) * 5}px`,
      color: combo >= 5 ? '#ffffff' : '#ffe38a',
      fontStyle: '900',
      stroke: combo >= 5 ? '#8c46ff' : '#ab6f00',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(121);
    this.scene.tweens.add({
      targets: t,
      y: y - 90,
      alpha: 0,
      angle: { from: -8, to: 8 },
      scale: { from: 0, to: 1.5 },
      duration: 760,
      ease: 'Back.Out',
      onComplete: () => t.destroy(),
    });
    if (combo > 5) audioManager.announce('chain_combo');
  }

  popup(text: string, x: number, y: number, combo = false, color = '#ffffff'): void {
    const t = this.scene.add.text(x, y, text, {
      fontSize: combo ? '48px' : '30px',
      color,
      fontStyle: '700',
      stroke: '#4b2157',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(90);

    const drift = { offset: 0 };
    this.scene.tweens.add({ targets: drift, offset: Math.PI * 2, duration: 800, ease: 'Linear' });
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      scale: { from: 0, to: 1.2 },
      duration: 800,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        t.y -= 0.22;
        t.x = x + Math.sin(drift.offset) * 8;
      },
      onComplete: () => t.destroy(),
    });
    this.scene.tweens.add({ targets: t, scale: { from: 1.2, to: 1 }, duration: 160, delay: 90 });
  }

  landingSquash(target: Phaser.GameObjects.Container): void {
    audioManager.playSfx('berry_land');
    this.scene.tweens.add({
      targets: target,
      scaleX: 1.15,
      scaleY: 0.85,
      duration: 80,
      yoyo: true,
      ease: 'Back.Out',
    });
  }

  screenPulse(color = 0xffffff, alpha = 0.16, duration = 120): void {
    const pulse = this.scene.add.rectangle(360, 640, 720, 1280, color, alpha).setDepth(200);
    this.scene.tweens.add({ targets: pulse, alpha: 0, duration, onComplete: () => pulse.destroy() });
  }
}
