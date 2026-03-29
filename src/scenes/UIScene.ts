import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fill!: Phaser.GameObjects.Rectangle;
  private fillGlow!: Phaser.GameObjects.Rectangle;
  private movesRing!: Phaser.GameObjects.Graphics;
  private maxMoves = 1;

  constructor() { super('UIScene'); }

  create(): void {
    this.cameras.main.fadeIn(220, 0, 0, 0);
    const frame = this.add.graphics();
    frame.fillStyle(0x1a2040, 0.75).fillRoundedRect(20, 24, 680, 150, 28);
    frame.lineStyle(4, 0xffffff, 0.35).strokeRoundedRect(20, 24, 680, 150, 28);
    frame.lineStyle(2, 0x7dd2ff, 0.35).strokeRoundedRect(32, 36, 656, 126, 22);

    this.levelText = this.add.text(58, 46, 'L1', { fontSize: '36px', color: '#ffd6ff', fontStyle: '900' });
    this.scoreText = this.add.text(186, 48, 'Score 0', { fontSize: '32px', color: '#ffffff', fontStyle: '900' });
    this.movesText = this.add.text(518, 48, 'Moves 0', { fontSize: '30px', color: '#ffffff', fontStyle: '800' });

    this.movesRing = this.add.graphics();
    this.movesRing.x = 626;
    this.movesRing.y = 100;

    this.add.rectangle(150, 128, 420, 24, 0x4e577f, 0.7).setOrigin(0, 0.5);
    this.fillGlow = this.add.rectangle(150, 128, 0, 20, 0x86ffe6, 0.25).setOrigin(0, 0.5);
    this.fill = this.add.rectangle(150, 128, 0, 14, 0x77f8b2).setOrigin(0, 0.5);

    [250, 360, 510].forEach((x) => this.add.star(x, 128, 5, 6, 10, 0xffd976, 0.85));

    const pauseBtn = this.add.circle(664, 100, 28, 0xff68b1).setStrokeStyle(3, 0xffffff, 0.8).setInteractive({ useHandCursor: true });
    const gear = this.add.graphics({ x: 664, y: 100 });
    gear.lineStyle(3, 0xffffff, 1).strokeCircle(0, 0, 8);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      gear.lineStyle(3, 0xffffff, 1).lineBetween(Math.cos(a) * 10, Math.sin(a) * 10, Math.cos(a) * 15, Math.sin(a) * 15);
    }

    pauseBtn.on('pointerdown', () => this.scene.pause('GameScene'));

    this.registry.events.on('changedata', this.updateHud, this);
    this.maxMoves = this.registry.get('moves') ?? 1;
    this.updateHud();
  }

  private updateHud(): void {
    const score = this.registry.get('score') ?? 0;
    const moves = this.registry.get('moves') ?? 0;
    const level = this.registry.get('level') ?? 1;
    const target = this.registry.get('target') ?? 1;

    this.levelText.setText(`L${level}`);
    this.movesText.setText(`Moves ${moves}`);

    const prevScore = Number(this.scoreText.text.replace(/\D/g, '') || 0);
    this.tweens.addCounter({
      from: prevScore,
      to: score,
      duration: 300,
      ease: 'Sine.easeOut',
      onUpdate: (t) => this.scoreText.setText(`Score ${Math.floor(t.getValue())}`),
      onComplete: () => this.tweens.add({ targets: this.scoreText, scale: { from: 1.2, to: 1 }, duration: 180, ease: 'Back.easeOut' }),
    });

    const progress = Phaser.Math.Clamp(score / (target * 1.2), 0, 1);
    this.tweens.add({ targets: [this.fill, this.fillGlow], width: 420 * progress, duration: 280, ease: 'Cubic.easeOut' });

    const ratio = Phaser.Math.Clamp(moves / Math.max(this.maxMoves, 1), 0, 1);
    this.movesRing.clear();
    this.movesRing.lineStyle(6, 0x33406e, 1).strokeCircle(0, 0, 22);
    this.movesRing.lineStyle(6, ratio > 0.3 ? 0x8dffcc : 0xff7272, 1);
    this.movesRing.beginPath();
    this.movesRing.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * ratio));
    this.movesRing.strokePath();
  }
}
