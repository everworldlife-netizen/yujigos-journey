import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';

export class TitleScene extends Phaser.Scene {
  private audioManager = new AudioManager();

  constructor() { super('TitleScene'); }

  create(): void {
    this.audioManager.stopMusic();
    void this.audioManager.unlock();
    this.cameras.main.fadeIn(450, 8, 6, 20);
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'bg_title_screen').setDisplaySize(width, height);
    this.add.image(width / 2, 220, 'title_banner').setDisplaySize(620, 220);

    for (let i = 0; i < 24; i++) {
      const b = this.add.sprite(Phaser.Math.Between(40, width - 40), Phaser.Math.Between(330, height - 140), 'berry_tiles', Phaser.Math.Between(0, 7)).setScale(0.22);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(14, 44), x: b.x + Phaser.Math.Between(-20, 20), angle: Phaser.Math.Between(-18, 18), repeat: -1, yoyo: true, duration: Phaser.Math.Between(1600, 3000), ease: 'Sine.easeInOut' });
    }

    this.add.sprite(width / 2, 590, 'yujigo_sprites', 0).setScale(0.42).play('yujigo-idle');

    const playBg = this.add.image(width / 2, height - 190, 'play_button').setDisplaySize(420, 132).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: playBg, scale: { from: 1, to: 1.05 }, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    playBg.on('pointerover', () => playBg.setScale(1.06));
    playBg.on('pointerout', () => playBg.setScale(1));
    playBg.on('pointerdown', () => {
      this.audioManager.buttonClick();
      playBg.setScale(0.94);
      this.cameras.main.fadeOut(350, 20, 8, 36);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        try {
          this.scene.start('WorldMapScene');
        } catch (error) {
          console.error('Title->WorldMap transition failed', error);
        }
      });
    });
  }
}
