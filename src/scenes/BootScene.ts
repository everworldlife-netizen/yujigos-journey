import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.8, 28, 0x3a2a67).setOrigin(0.5);
    const bar = this.add.rectangle(bg.x - bg.width / 2, bg.y, 6, 20, 0xff9af2).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = (bg.width - 8) * v; });

    this.load.spritesheet('berry_tiles', 'assets/sprites/berry_tiles.png', { frameWidth: 352, frameHeight: 384, endFrame: 31 });
    this.load.atlas('ui_elements', 'assets/sprites/ui_elements.png', 'assets/sprites/ui_elements_atlas.json');
    this.load.spritesheet('power_ups', 'assets/sprites/power_ups.png', { frameWidth: 352, frameHeight: 384 });
    this.load.spritesheet('yujigo_sprites', 'assets/sprites/yujigo_sprites.png', { frameWidth: 384, frameHeight: 459 });
    this.load.atlas('world_map_elements', 'assets/sprites/world_map_elements.png', 'assets/sprites/world_map_elements_atlas.json');
    this.load.spritesheet('kirumi_sprites', 'assets/sprites/kirumi_sprites.png', { frameWidth: 384, frameHeight: 459 });
    this.load.spritesheet('npc_sprites', 'assets/sprites/npc_sprites.png', { frameWidth: 469, frameHeight: 512 });
  }

  create(): void {
    this.createCharacterAnimations();
    this.scene.start('TitleScene');
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
