import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fill!: Phaser.GameObjects.Rectangle;

  constructor() { super('UIScene'); }

  create(): void {
    this.add.rectangle(360, 90, 680, 140, 0x1a2040, 0.75).setStrokeStyle(3, 0xffffff, 0.4);
    this.levelText = this.add.text(70, 45, 'L1', { fontSize: '34px', color: '#ffd6ff', fontStyle: '700' });
    this.scoreText = this.add.text(240, 45, 'Score 0', { fontSize: '30px', color: '#ffffff', fontStyle: '700' });
    this.movesText = this.add.text(560, 45, 'Moves 0', { fontSize: '30px', color: '#ffffff', fontStyle: '700' });

    this.add.rectangle(360, 120, 420, 22, 0x4e577f, 0.8).setOrigin(0.5);
    this.fill = this.add.rectangle(150, 120, 0, 14, 0x77f8b2).setOrigin(0, 0.5);
    [250, 360, 510].forEach((x) => this.add.star(x, 120, 5, 6, 10, 0xffd976, 0.85));

    const pause = this.add.text(654, 103, 'II', {
      fontSize: '36px', color: '#fff', backgroundColor: '#ff68b1', padding: { left: 14, right: 14, top: 4, bottom: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => this.scene.pause('GameScene'));

    this.registry.events.on('changedata', this.updateHud, this);
    this.updateHud();
  }

  private updateHud(): void {
    const score = this.registry.get('score') ?? 0;
    const moves = this.registry.get('moves') ?? 0;
    const level = this.registry.get('level') ?? 1;
    const target = this.registry.get('target') ?? 1;

    this.levelText.setText(`L${level}`);
    this.movesText.setText(`Moves ${moves}`);

    this.tweens.addCounter({
      from: Number(this.scoreText.text.replace(/\D/g, '') || 0),
      to: score,
      duration: 250,
      ease: 'Sine.easeOut',
      onUpdate: (t) => this.scoreText.setText(`Score ${Math.floor(t.getValue())}`),
    });

    const progress = Phaser.Math.Clamp(score / (target * 1.2), 0, 1);
    this.tweens.add({ targets: this.fill, width: 420 * progress, duration: 220, ease: 'Cubic.easeOut' });
  }
}
