import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    this.cameras.main.fadeIn(450, 8, 6, 20);
    const { width, height } = this.scale;
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x5f2b95, 0x7438a8, 0x151331, 0x090517, 1);
    grad.fillRect(0, 0, width, height);

    for (let i = 0; i < 80; i++) {
      const star = this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'particle-star').setScale(Phaser.Math.FloatBetween(0.1, 0.35)).setAlpha(0.25);
      this.tweens.add({ targets: star, alpha: { from: 0.12, to: 0.9 }, duration: Phaser.Math.Between(1200, 2400), repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
    }

    const titleShadow = this.add.text(width / 2 + 6, 246, "YUJIGO'S JOURNEY", {
      fontSize: '74px', color: '#2b0f47', fontStyle: '900', align: 'center',
    }).setOrigin(0.5);
    const title = this.add.text(width / 2, 240, "YUJIGO'S JOURNEY", {
      fontSize: '74px', color: '#ffffff', fontStyle: '900', stroke: '#8d2fa5', strokeThickness: 10,
    }).setOrigin(0.5);
    title.setTint(0xfff0ff, 0xffc8ff, 0xffea9d, 0x9de0ff);

    this.tweens.add({ targets: [title, titleShadow], y: 258, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });

    for (let i = 0; i < 24; i++) {
      const b = this.add.image(Phaser.Math.Between(40, width - 40), Phaser.Math.Between(330, height - 140), `berry-${Phaser.Math.Between(0, 5)}`).setScale(0.26);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(14, 44), x: b.x + Phaser.Math.Between(-20, 20), angle: Phaser.Math.Between(-18, 18), repeat: -1, yoyo: true, duration: Phaser.Math.Between(1600, 3000), ease: 'Sine.easeInOut' });
    }

    const playBg = this.add.rectangle(width / 2, height - 190, 390, 110, 0xff5ea2).setStrokeStyle(6, 0xffffff, 0.75).setInteractive({ useHandCursor: true });
    const play = this.add.text(width / 2, height - 190, 'TAP TO PLAY', {
      fontSize: '54px', color: '#fff', fontStyle: '900', stroke: '#8c2d66', strokeThickness: 8,
    }).setOrigin(0.5);

    this.tweens.add({ targets: [play, playBg], scale: { from: 1, to: 1.05 }, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    playBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(350, 20, 8, 36);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMapScene'));
    });
  }
}
