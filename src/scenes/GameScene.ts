import Phaser from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';
import { LevelManager } from '../managers/LevelManager';
import { ScoreManager } from '../managers/ScoreManager';
import { LEVELS } from '../config/levels';
import { Board } from '../objects/Board';
import { ParticleManager } from '../managers/ParticleManager';
import { AudioManager } from '../managers/AudioManager';
import { BIOME_BACKGROUND_KEYS, biomeForLevel } from '../config/biomeConfig';

export class GameScene extends Phaser.Scene {
  private levelManager = new LevelManager();
  private scoreManager = new ScoreManager();
  private board!: Board;
  private moves = 0;
  private particles!: ParticleManager;
  private audioManager = new AudioManager();
  private yujigo!: Phaser.GameObjects.Sprite;
  private kirumi!: Phaser.GameObjects.Sprite;
  private vignette!: Phaser.GameObjects.Rectangle;

  constructor() { super('GameScene'); }

  create(data: { level?: number }): void {
    void this.audioManager.unlock();
    this.cameras.main.fadeIn(350, 10, 8, 22);
    this.levelManager.loadProgress();
    const level = data.level ?? 1;
    this.levelManager.setCurrent(level);
    const config = LEVELS[level - 1];
    this.audioManager.startMusic(level);
    this.moves = config.moves;
    this.scoreManager.reset();

    this.drawBackground(level);
    this.addCharacters();

    const anim = new AnimationManager(this);
    this.particles = new ParticleManager(this);

    this.board = new Board(this, anim, this.particles, (points, x, y, combo, colorHex) => {
      const gain = this.scoreManager.add(points);
      anim.popup(`+${gain}`, x, y, false, colorHex);
      if (combo > 1) {
        this.audioManager.combo(combo);
        this.yujigo.play('yujigo-excited');
        this.kirumi.play('kirumi-happy');
        anim.comboPopup(combo, 360, 250);
      } else {
        this.audioManager.match();
        this.yujigo.play('yujigo-happy');
      }
      this.registry.set('score', this.scoreManager.score);
      this.registry.set('stars', this.scoreManager.starCount(config.targetScore));
    }, () => {
      this.audioManager.swap();
      this.moves--;
      this.registry.set('moves', this.moves);
      if (this.moves <= 0) this.endLevel();
    }, config, (stats) => {
      this.registry.set('obstacleStats', stats);
      const totalRemaining = (stats.ice.total - stats.ice.cleared) + (stats.chain.total - stats.chain.cleared);
      this.registry.set('obstaclesRemaining', totalRemaining);
    });

    this.board.build();
    this.add.image(360, 640, 'board_frame').setDisplaySize(720, 1280).setDepth(40).setAlpha(0.95);
    this.registry.set('level', level);
    this.registry.set('score', 0);
    this.registry.set('moves', this.moves);
    this.registry.set('target', config.targetScore);
    this.registry.set('stars', 0);
    this.registry.set('objectiveTargets', config.objectiveTargets);

    this.scene.launch('UIScene');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioManager.stopMusic();
    });
  }

  private drawBackground(level: number): void {
    const biome = biomeForLevel(level);
    const textureKey = BIOME_BACKGROUND_KEYS[biome];
    this.add.image(360, 640, textureKey).setDisplaySize(720, 1280);

    this.add.rectangle(360, 640, 720, 1280, 0x120d24, 0.16);
    this.add.image(360, 230, 'world_map_elements', 'landmark').setDisplaySize(460, 180).setAlpha(0.25);
    this.vignette = this.add.rectangle(360, 640, 720, 1280, 0x100616, 0.2).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(5);
    this.addFloatingBackgroundParticles();
  }

  private addFloatingBackgroundParticles(): void {
    const emitter = this.add.particles(360, 640, 'particle_sheet', {
      frame: [0, 1, 2, 12, 48, 50],
      x: { min: 30, max: 690 },
      y: { min: 40, max: 1240 },
      lifespan: 5000,
      speedY: { min: -15, max: -4 },
      speedX: { min: -5, max: 5 },
      alpha: { start: 0.45, end: 0 },
      scale: { start: 0.2, end: 0.05 },
      quantity: 1,
      frequency: 140,
      tint: [0xfff2b6, 0x9de2ff, 0xffbdd8],
      blendMode: 'ADD',
    }).setDepth(4);
    this.tweens.add({ targets: this.vignette, alpha: { from: 0.18, to: 0.26 }, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => emitter.destroy());
  }

  private addCharacters(): void {
    this.yujigo = this.add.sprite(84, 180, 'yujigo_sprites', 0).setScale(0.32).play('yujigo-idle').setDepth(20);
    this.kirumi = this.add.sprite(632, 180, 'kirumi_sprites', 0).setScale(0.26).play('kirumi-idle').setDepth(20);
    this.yujigo.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.yujigo.play('yujigo-idle'));
    this.kirumi.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.kirumi.play('kirumi-idle'));
  }

  private endLevel(): void {
    const target = this.registry.get('target') as number;
    const objectives = this.registry.get('objectiveTargets') as { ice?: number; chain?: number } | undefined;
    const stats = this.registry.get('obstacleStats') as { ice: { total: number; cleared: number }; chain: { total: number; cleared: number } } | undefined;
    const objectivesMet = !objectives || ((objectives.ice ?? 0) <= (stats?.ice.cleared ?? 0) && (objectives.chain ?? 0) <= (stats?.chain.cleared ?? 0));
    const won = this.scoreManager.score >= target && objectivesMet;
    if (won) this.levelManager.completeCurrent();

    if (won) {
      this.audioManager.levelComplete();
      for (let i = 0; i < 4; i++) this.time.delayedCall(i * 180, () => this.particles.firework(120 + i * 160, 220 + (i % 2) * 60));
    } else {
      this.audioManager.levelFail();
      this.particles.boardShake(0.006, 460);
    }

    const panel = this.add.image(360, 640, 'ui_elements', 'dialog_box').setDisplaySize(600, 480).setDepth(1001);
    this.add.image(360, 470, 'ui_elements', won ? 'victory_banner' : 'defeat_banner').setDisplaySize(500, 140).setDepth(1002);
    this.add.text(360, 620, `Score ${this.scoreManager.score}\nTarget ${target}`, {
      align: 'center', fontSize: '34px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(1002);

    const next = this.add.image(360, 790, 'ui_elements', 'button_primary').setDisplaySize(260, 90).setInteractive({ useHandCursor: true }).setDepth(1002);
    this.add.text(360, 790, won ? 'NEXT' : 'MAP', { fontSize: '40px', color: '#fff', fontStyle: '900' }).setOrigin(0.5).setDepth(1003);

    next.on('pointerdown', () => {
      this.audioManager.buttonClick();
      this.scene.stop('UIScene');
      this.cameras.main.fadeOut(300, 10, 8, 22);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMapScene'));
    });
    this.board.busy = true;
    panel.setScale(0);
    this.tweens.add({ targets: panel, scale: 1, duration: 360, ease: 'Back.easeOut' });
  }
}
