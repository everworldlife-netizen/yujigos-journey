import Phaser from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';
import { LevelManager } from '../managers/LevelManager';
import { ScoreManager } from '../managers/ScoreManager';
import { LEVELS } from '../config/levels';
import { Board } from '../objects/Board';
import { ParticleManager } from '../managers/ParticleManager';
import { AudioManager } from '../managers/AudioManager';

export class GameScene extends Phaser.Scene {
  private levelManager = new LevelManager();
  private scoreManager = new ScoreManager();
  private board!: Board;
  private moves = 0;
  private particles!: ParticleManager;
  private audioManager = new AudioManager();

  constructor() { super('GameScene'); }

  create(data: { level?: number }): void {
    this.cameras.main.fadeIn(350, 10, 8, 22);
    this.levelManager.loadProgress();
    const level = data.level ?? 1;
    this.levelManager.setCurrent(level);
    const config = LEVELS[level - 1];
    this.moves = config.moves;
    this.scoreManager.reset();

    this.drawBackground();
    const anim = new AnimationManager(this);
    this.particles = new ParticleManager(this);

    this.board = new Board(this, anim, this.particles, (points, x, y, combo) => {
      const gain = this.scoreManager.add(points);
      anim.popup(`+${gain}`, x, y, false);
      if (combo > 1) {
        this.audioManager.combo();
      } else {
        this.audioManager.match();
      }
      this.registry.set('score', this.scoreManager.score);
      this.registry.set('stars', this.scoreManager.starCount(config.targetScore));
    }, () => {
      this.audioManager.swap();
      this.moves--;
      this.registry.set('moves', this.moves);
      if (this.moves <= 0) this.endLevel();
    }, config.blockers);

    this.board.build();
    this.registry.set('level', level);
    this.registry.set('score', 0);
    this.registry.set('moves', this.moves);
    this.registry.set('target', config.targetScore);
    this.registry.set('stars', 0);

    this.scene.launch('UIScene');
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x4c1b7a, 0x281c66, 0x111e45, 0x090d23, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x9f74ff, 0.18);
    for (let x = 50; x < this.scale.width; x += 44) grid.lineBetween(x, 200, x, 1220);
    for (let y = 220; y < 1220; y += 44) grid.lineBetween(40, y, this.scale.width - 40, y);

    for (let i = 0; i < 36; i++) {
      const orb = this.add.circle(Phaser.Math.Between(0, 720), Phaser.Math.Between(100, 1280), Phaser.Math.Between(8, 24), 0xffffff, 0.08);
      this.tweens.add({ targets: orb, y: orb.y - Phaser.Math.Between(40, 120), x: orb.x + Phaser.Math.Between(-25, 25), alpha: { from: 0.04, to: 0.2 }, yoyo: true, repeat: -1, duration: Phaser.Math.Between(3200, 5600), ease: 'Sine.easeInOut' });
    }
  }

  private endLevel(): void {
    const target = this.registry.get('target') as number;
    const won = this.scoreManager.score >= target;
    if (won) this.levelManager.completeCurrent();

    if (won) {
      this.audioManager.levelComplete();
      for (let i = 0; i < 4; i++) this.time.delayedCall(i * 180, () => this.particles.firework(120 + i * 160, 220 + (i % 2) * 60));
    } else {
      this.audioManager.levelFail();
      const dim = this.add.rectangle(360, 640, 720, 1280, 0x090711, 0).setDepth(1000);
      this.tweens.add({ targets: dim, alpha: 0.65, duration: 380 });
      this.particles.boardShake(0.006, 460);
    }

    const panel = this.add.rectangle(360, 640, 580, 460, 0x120c2a, 0.92).setStrokeStyle(4, 0xffffff, 0.6).setDepth(1001);
    this.add.text(360, 510, won ? 'Level Complete!' : 'Out of Moves', {
      fontSize: '56px', color: won ? '#ffec8e' : '#ffd4ef', fontStyle: '900',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(360, 590, `Score ${this.scoreManager.score}\nTarget ${target}`, {
      align: 'center', fontSize: '34px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001);

    const stars = this.scoreManager.starCount(target);
    for (let i = 0; i < stars; i++) {
      const s = this.add.star(280 + i * 80, 700, 5, 18, 36, 0xffd65c).setScale(0).setDepth(1001);
      this.tweens.add({ targets: s, scale: 1, angle: 360, delay: 260 * i, duration: 480, ease: 'Back.easeOut' });
    }

    const next = this.add.text(360, 780, won ? 'NEXT' : 'MAP', {
      fontSize: '44px', color: '#fff', backgroundColor: '#ff62aa', padding: { left: 34, right: 34, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1001);

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
