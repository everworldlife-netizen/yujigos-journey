import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fill!: Phaser.GameObjects.Image;
  private maxMoves = 1;

  constructor() { super('UIScene'); }

  create(): void {
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this.add.image(360, 96, 'ui_elements', 'panel').setDisplaySize(700, 170);
    this.add.image(160, 84, 'ui_elements', 'score_plate').setDisplaySize(180, 78);
    this.add.image(540, 84, 'ui_elements', 'moves_plate').setDisplaySize(180, 78);
    this.add.image(360, 136, 'ui_elements', 'progress_bar_bg').setDisplaySize(430, 24);
    this.fill = this.add.image(145, 136, 'ui_elements', 'progress_fill').setDisplaySize(1, 16).setOrigin(0, 0.5);

    this.levelText = this.add.text(58, 46, 'L1', { fontSize: '36px', color: '#ffd6ff', fontStyle: '900' });
    this.scoreText = this.add.text(132, 66, '0', { fontSize: '32px', color: '#ffffff', fontStyle: '900' });
    this.movesText = this.add.text(522, 66, '0', { fontSize: '30px', color: '#ffffff', fontStyle: '800' });

    [250, 360, 510].forEach((x) => this.add.image(x, 136, 'ui_elements', 'star').setDisplaySize(24, 24));

    const pauseBtn = this.add.image(664, 100, 'ui_elements', 'pause_button').setDisplaySize(58, 58).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.scene.pause('GameScene'));

    this.registry.events.on('changedata', this.updateHud, this);
    this.maxMoves = this.registry.get('moves') ?? 1;
    this.updateHud();
  }

  private updateHud(): void {
    const score = Number(this.registry.get('score') ?? 0);
    const moves = Number(this.registry.get('moves') ?? 0);
    const level = Number(this.registry.get('level') ?? 1);
    const target = Number(this.registry.get('target') ?? 1);

    this.levelText.setText(`L${level}`);
    this.movesText.setText(`${moves}`);

    const prevScore = Number(this.scoreText.text.replace(/\D/g, '') || 0);
    this.tweens.addCounter({
      from: prevScore,
      to: score,
      duration: 300,
      ease: 'Sine.easeOut',
      onUpdate: (t) => this.scoreText.setText(`${Math.floor(t.getValue() ?? 0)}`),
    });

    const progress = Phaser.Math.Clamp(score / (target * 1.2), 0, 1);
    this.tweens.add({ targets: this.fill, displayWidth: 420 * progress, duration: 280, ease: 'Cubic.easeOut' });
  }
}
