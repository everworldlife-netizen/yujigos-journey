import Phaser from 'phaser';
import { getBackgroundTextureKey, getCharacterTextureKey, getFxTextureKey, getUiTextureKey } from '../config/AssetConfig.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const scaleFactor = Phaser.Math.Clamp(this.scale.width / 720, 0.8, 1.2);
    this.createAmbience();

    this.add
      .text(this.scale.width / 2, this.scale.height * 0.18, "Yujigo's Journey", {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: `${Math.floor(52 * scaleFactor)}px`,
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#1f2d4f',
        strokeThickness: Math.max(4, Math.floor(6 * scaleFactor))
      })
      .setOrigin(0.5);

    const yujigoKey = getCharacterTextureKey('yujigo', 'idle');
    if (yujigoKey && this.textures.exists(yujigoKey)) {
      this.add.image(this.scale.width * 0.5, this.scale.height * 0.42, yujigoKey).setDisplaySize(260, 260).setAlpha(0.98);
    }

    const buttonKey = getUiTextureKey('btn-play');
    const buttonY = this.scale.height * 0.68;
    const button = this.textures.exists(buttonKey)
      ? this.add.image(this.scale.width / 2, buttonY, buttonKey).setDisplaySize(Math.min(320, this.scale.width * 0.46), 88)
      : this.add.rectangle(this.scale.width / 2, buttonY, 220, 72, 0x24324f, 0.95).setStrokeStyle(2, 0xffffff, 0.4);
    button.setInteractive({ useHandCursor: true });
    const text = this.add
      .text(button.x, button.y, 'Play', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: `${Math.floor(38 * scaleFactor)}px`,
        fontStyle: '700',
        color: '#ffdd44'
      })
      .setOrigin(0.5);

    button.on('pointerover', () => button.setScale(1.03));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('GameScene', { level: 1 }));
    });

    this.tweens.add({ targets: [button, text], scale: 1.04, duration: 900, yoyo: true, repeat: -1 });
  }

  createAmbience() {
    const { width, height } = this.scale;
    const menuBgKey = getBackgroundTextureKey('titleBg');
    if (this.textures.exists(menuBgKey)) this.add.image(width / 2, height / 2, menuBgKey).setDisplaySize(width, height);
    else this.add.rectangle(width / 2, height / 2, width, height, 0x1a2d5a, 1);

    for (let i = 0; i < 12; i += 1) {
      const light = this.add
        .image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), getFxTextureKey('sparkle'))
        .setTint(Phaser.Display.Color.GetColor(200 + Phaser.Math.Between(0, 40), 180, 255))
        .setAlpha(Phaser.Math.FloatBetween(0.08, 0.2))
        .setScale(Phaser.Math.FloatBetween(1.2, 3));
      this.tweens.add({
        targets: light,
        x: light.x + Phaser.Math.Between(-40, 40),
        y: light.y + Phaser.Math.Between(-70, 70),
        alpha: Phaser.Math.FloatBetween(0.06, 0.16),
        duration: Phaser.Math.Between(7000, 14000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }
}
