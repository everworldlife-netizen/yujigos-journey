import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    const { width, height } = this.scale;
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x502873, 0x7634a5, 0x151331, 0x090517, 1);
    grad.fillRect(0, 0, width, height);

    for (let i = 0; i < 55; i++) {
      const star = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.Between(1, 3), 0xffffff, 0.8);
      this.tweens.add({ targets: star, alpha: { from: 0.2, to: 1 }, duration: Phaser.Math.Between(1200, 2200), repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
    }

    const title = this.add.text(width / 2, 260, "Yujigo's Journey", {
      fontSize: '72px', color: '#fff1fa', fontStyle: '900', stroke: '#6f2f87', strokeThickness: 10,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 275, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });

    for (let i = 0; i < 16; i++) {
      const b = this.add.image(Phaser.Math.Between(40, width - 40), Phaser.Math.Between(350, height - 140), 'berry_tiles', Phaser.Math.Between(0, 5)).setScale(0.18);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(14, 34), x: b.x + Phaser.Math.Between(-20, 20), repeat: -1, yoyo: true, duration: Phaser.Math.Between(1600, 2600), ease: 'Sine.easeInOut' });
    }

    const play = this.add.text(width / 2, height - 200, 'PLAY', {
      fontSize: '64px', color: '#fff', backgroundColor: '#ff5ea2', padding: { left: 38, right: 38, top: 15, bottom: 15 },
      stroke: '#8c2d66', strokeThickness: 8,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: play, scale: { from: 1, to: 1.09 }, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.easeInOut' });
    play.on('pointerdown', () => {
      this.cameras.main.fadeOut(350, 20, 8, 36);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMapScene'));
    });
  }
}
