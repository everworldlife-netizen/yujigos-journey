import Phaser from 'phaser';

const PARTICLE_FRAMES = {
  sparkle: [0, 1, 2, 3, 12, 13, 14],
  orb: [48, 49, 50, 51, 52],
  burst: [24, 25, 26, 27, 36, 37],
  ember: [40, 41, 42, 43, 44],
  star: [16, 17, 18, 19, 20, 21],
};

export class ParticleManager {
  constructor(private scene: Phaser.Scene) {}

  sparkle(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_sheet', {
      frame: PARTICLE_FRAMES.sparkle,
      speed: { min: 30, max: 110 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 540,
      quantity: 16,
      tint: [0xffffff, 0xffe98a, 0x9df9ff],
      emitting: false,
      gravityY: 20,
    });
    emitter.explode(16, x, y);
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  burst(x: number, y: number, color: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_sheet', {
      frame: PARTICLE_FRAMES.burst,
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.65, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 380, max: 620 },
      quantity: Phaser.Math.Between(8, 12),
      tint: [color, 0xffffff],
      emitting: false,
      gravityY: 240,
    });
    emitter.explode();
    this.scene.time.delayedCall(750, () => emitter.destroy());
  }

  trail(x: number, y: number, color = 0xffffff): void {
    const emitter = this.scene.add.particles(x, y, 'particle_sheet', {
      frame: PARTICLE_FRAMES.orb,
      speed: { min: 10, max: 30 },
      scale: { start: 0.28, end: 0 },
      alpha: { start: 0.65, end: 0 },
      lifespan: 450,
      frequency: 40,
      tint: [color],
      quantity: 1,
    });
    this.scene.time.delayedCall(500, () => emitter.stop());
    this.scene.time.delayedCall(900, () => emitter.destroy());
  }

  ember(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_sheet', {
      frame: PARTICLE_FRAMES.ember,
      speedX: { min: -24, max: 24 },
      speedY: { min: -120, max: -40 },
      scale: { start: 0.34, end: 0 },
      alpha: { start: 0.85, end: 0 },
      lifespan: 700,
      tint: [0xff8a3d, 0xff4d3a, 0xffde8c],
      quantity: 2,
      frequency: 65,
    });
    this.scene.time.delayedCall(600, () => emitter.stop());
    this.scene.time.delayedCall(1200, () => emitter.destroy());
  }

  firework(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_sheet', {
      frame: PARTICLE_FRAMES.star,
      speed: { min: 120, max: 360 },
      quantity: 42,
      scale: { start: 0.62, end: 0 },
      lifespan: 1000,
      alpha: { start: 0.95, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0xff4da6, 0x85f4ff, 0xffe978, 0xc49bff],
      emitting: false,
      gravityY: 120,
    });
    emitter.explode();
    this.scene.time.delayedCall(1300, () => emitter.destroy());
  }

  boardShake(intensity = 0.003, duration = 220): void {
    this.scene.cameras.main.shake(duration, intensity, true);
  }
}
