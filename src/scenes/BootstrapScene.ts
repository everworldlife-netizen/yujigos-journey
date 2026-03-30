import Phaser from 'phaser';

export class BootstrapScene extends Phaser.Scene {
  constructor() { super('Bootstrap'); }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 20, "Yujigo's Journey", {
      fontFamily: 'Trebuchet MS',
      fontSize: '54px',
      color: '#fff6ff',
      stroke: '#3c1e5c',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const loading = this.add.text(width / 2, height / 2 + 38, 'Bootstrapping Magic…', {
      fontFamily: 'Trebuchet MS',
      fontSize: '22px',
      color: '#ffe8ff',
    }).setOrigin(0.5);

    this.tweens.add({ targets: loading, alpha: 0.3, yoyo: true, repeat: -1, duration: 500 });
    this.time.delayedCall(550, () => this.scene.start('Preload'));
  }
}
