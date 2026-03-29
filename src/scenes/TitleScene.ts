import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    this.cameras.main.fadeIn(450, 8, 6, 20);
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'world_map_elements', 'biome_twilight').setDisplaySize(width, height);
    this.add.image(width / 2, 220, 'world_map_elements', 'title_banner').setDisplaySize(620, 220);

    for (let i = 0; i < 24; i++) {
      const b = this.add.sprite(Phaser.Math.Between(40, width - 40), Phaser.Math.Between(330, height - 140), 'berry_tiles', Phaser.Math.Between(0, 5)).setScale(0.22);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(14, 44), x: b.x + Phaser.Math.Between(-20, 20), angle: Phaser.Math.Between(-18, 18), repeat: -1, yoyo: true, duration: Phaser.Math.Between(1600, 3000), ease: 'Sine.easeInOut' });
    }

    this.add.sprite(width / 2, 590, 'yujigo_sprites', 0).setScale(0.42).play('yujigo-idle');

    const playBg = this.add.image(width / 2, height - 190, 'ui_elements', 'play_button').setDisplaySize(420, 132).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: playBg, scale: { from: 1, to: 1.05 }, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    playBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(350, 20, 8, 36);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMapScene'));
    });
  }
}
