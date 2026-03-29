import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private obstacleSheetFailed = false;

  constructor() { super('BootScene'); }

  preload(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.8, 28, 0x3a2a67).setOrigin(0.5);
    const bar = this.add.rectangle(bg.x - bg.width / 2, bg.y, 6, 20, 0xff9af2).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = (bg.width - 8) * v; });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'obstacles_tiles') this.obstacleSheetFailed = true;
    });

    this.load.spritesheet('berry_tiles', 'assets/sprites/berry_tiles.png', { frameWidth: 352, frameHeight: 384, endFrame: 31 });
    this.load.atlas('ui_elements', 'assets/sprites/ui_elements.png', 'assets/sprites/ui_elements_atlas.json');
    this.load.spritesheet('power_ups', 'assets/sprites/power_ups.png', { frameWidth: 352, frameHeight: 384 });
    this.load.spritesheet('yujigo_sprites', 'assets/sprites/yujigo_sprites.png', { frameWidth: 384, frameHeight: 459 });
    this.load.atlas('world_map_elements', 'assets/sprites/world_map_elements.png', 'assets/sprites/world_map_elements_atlas.json');
    this.load.spritesheet('kirumi_sprites', 'assets/sprites/kirumi_sprites.png', { frameWidth: 384, frameHeight: 459 });
    this.load.spritesheet('npc_sprites', 'assets/sprites/npc_sprites.png', { frameWidth: 469, frameHeight: 512 });
    this.load.spritesheet('obstacles_tiles', 'assets/sprites/obstacles_tiles.png', { frameWidth: 128, frameHeight: 205, endFrame: 36 });
  }

  create(): void {
    if (this.obstacleSheetFailed || !this.textures.exists('obstacles_tiles')) {
      this.createObstacleFallbackTexture();
    }
    this.createCharacterAnimations();
    this.scene.start('TitleScene');
  }

  private createObstacleFallbackTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1025;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 1024, 1025);

    for (let i = 0; i < 37; i++) {
      const x = (i % 8) * 128;
      const y = Math.floor(i / 8) * 205;
      context.fillStyle = '#ffffff';
      context.globalAlpha = 0.12;
      context.fillRect(x + 10, y + 10, 108, 185);
      context.globalAlpha = 1;

      if (i < 8) {
        context.fillStyle = '#9ad9ff';
        context.globalAlpha = 0.5;
        context.fillRect(x + 20, y + 20, 88, 165);
      } else if (i < 16) {
        context.strokeStyle = '#9ea4b6';
        context.lineWidth = 6;
        context.strokeRect(x + 28, y + 28, 72, 149);
        context.beginPath();
        context.moveTo(x + 28, y + 28);
        context.lineTo(x + 100, y + 177);
        context.moveTo(x + 100, y + 28);
        context.lineTo(x + 28, y + 177);
        context.stroke();
      } else if (i < 24) {
        context.fillStyle = '#88684a';
        context.fillRect(x + 24, y + 24, 80, 157);
      } else if (i < 32) {
        context.fillStyle = '#cf9f4f';
        context.fillRect(x + 26, y + 26, 76, 153);
      } else {
        context.fillStyle = '#735bff';
        context.beginPath();
        context.arc(x + 64, y + 102, 36, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }

    if (this.textures.exists('obstacles_tiles')) this.textures.remove('obstacles_tiles');
    this.textures.addSpriteSheet('obstacles_tiles', canvas as unknown as HTMLImageElement, {
      frameWidth: 128,
      frameHeight: 205,
      endFrame: 36,
    });
  }

  private createCharacterAnimations(): void {
    if (!this.anims.exists('yujigo-idle')) {
      this.anims.create({ key: 'yujigo-idle', frames: this.anims.generateFrameNumbers('yujigo_sprites', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'yujigo-happy', frames: this.anims.generateFrameNumbers('yujigo_sprites', { start: 6, end: 11 }), frameRate: 10, repeat: 0 });
      this.anims.create({ key: 'yujigo-excited', frames: this.anims.generateFrameNumbers('yujigo_sprites', { start: 12, end: 17 }), frameRate: 12, repeat: 0 });
      this.anims.create({ key: 'kirumi-idle', frames: this.anims.generateFrameNumbers('kirumi_sprites', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'kirumi-happy', frames: this.anims.generateFrameNumbers('kirumi_sprites', { start: 6, end: 11 }), frameRate: 12, repeat: 0 });
    }
  }
}
