import Phaser from 'phaser';

export class ParticleManager {
  constructor(private scene: Phaser.Scene) {}

  burst(x: number, y: number, color: number): void {
    for (let i = 0; i < Phaser.Math.Between(8, 12); i++) {
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), color, 0.9);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(120, 260);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(320, 520),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  sparkle(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const p = this.scene.add.star(x, y, 4, 3, 8, 0xffffff, 0.9);
      this.scene.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-30, 30),
        scale: 0,
        alpha: 0,
        duration: Phaser.Math.Between(260, 460),
        ease: 'Back.easeIn',
        onComplete: () => p.destroy(),
      });
    }
  }

  bombShake(): void {
    this.scene.cameras.main.shake(200, 0.002, true);
  }
}
