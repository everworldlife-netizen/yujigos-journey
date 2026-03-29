import Phaser from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';
import { LevelManager } from '../managers/LevelManager';
import { ScoreManager } from '../managers/ScoreManager';
import { LEVELS } from '../config/levels';
import { Board } from '../objects/Board';
import { ParticleManager } from '../objects/ParticleManager';

export class GameScene extends Phaser.Scene {
  private levelManager = new LevelManager();
  private scoreManager = new ScoreManager();
  private board!: Board;
  private moves = 0;

  constructor() { super('GameScene'); }

  create(data: { level?: number }): void {
    this.levelManager.loadProgress();
    const level = data.level ?? 1;
    this.levelManager.setCurrent(level);
    const config = LEVELS[level - 1];
    this.moves = config.moves;
    this.scoreManager.reset();

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2f1a51, 0x44216d, 0x101427, 0x0a0c1a, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    for (let i = 0; i < 20; i++) {
      const orb = this.add.circle(Phaser.Math.Between(0, 720), Phaser.Math.Between(100, 1280), Phaser.Math.Between(3, 8), 0xffffff, 0.2);
      this.tweens.add({ targets: orb, y: orb.y - Phaser.Math.Between(30, 60), alpha: { from: 0.05, to: 0.35 }, yoyo: true, repeat: -1, duration: Phaser.Math.Between(2500, 4200), ease: 'Sine.easeInOut' });
    }

    const anim = new AnimationManager(this);
    const particles = new ParticleManager(this);
    this.board = new Board(this, anim, particles, (points, x, y, combo) => {
      const gain = this.scoreManager.add(points);
      anim.popup(`+${gain}`, x, y, false);
      if (combo > 1) anim.popup(`x${combo}!`, x, y - 40, true);
      this.registry.set('score', this.scoreManager.score);
      this.registry.set('stars', this.scoreManager.starCount(config.targetScore));
    }, () => {
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

  private endLevel(): void {
    const target = this.registry.get('target') as number;
    const won = this.scoreManager.score >= target;
    if (won) this.levelManager.completeCurrent();

    const panel = this.add.rectangle(360, 640, 580, 460, 0x120c2a, 0.92).setStrokeStyle(4, 0xffffff, 0.6);
    this.add.text(360, 510, won ? 'Level Complete!' : 'Out of Moves', {
      fontSize: '56px', color: won ? '#ffec8e' : '#ffd4ef', fontStyle: '900',
    }).setOrigin(0.5);
    this.add.text(360, 590, `Score ${this.scoreManager.score}\nTarget ${target}`, {
      align: 'center', fontSize: '34px', color: '#ffffff'
    }).setOrigin(0.5);

    const stars = this.scoreManager.starCount(target);
    for (let i = 0; i < stars; i++) {
      const s = this.add.star(280 + i * 80, 700, 5, 18, 36, 0xffd65c).setScale(0);
      this.tweens.add({ targets: s, scale: 1, angle: 360, delay: 220 * i, duration: 450, ease: 'Back.easeOut' });
    }

    const next = this.add.text(360, 780, won ? 'NEXT' : 'MAP', {
      fontSize: '44px', color: '#fff', backgroundColor: '#ff62aa', padding: { left: 34, right: 34, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    next.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('WorldMapScene');
    });
    this.board.busy = true;
    panel.setScale(0);
    this.tweens.add({ targets: panel, scale: 1, duration: 360, ease: 'Back.easeOut' });
  }
}
