import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fill!: Phaser.GameObjects.Image;
  private objectiveText!: Phaser.GameObjects.Text;
  private audioManager = new AudioManager();
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private muteLabel!: Phaser.GameObjects.Text;

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

    this.add.image(118, 178, 'obstacles_tiles', 0).setDisplaySize(28, 28);
    this.add.image(278, 178, 'obstacles_tiles', 8).setDisplaySize(28, 28);
    this.objectiveText = this.add.text(140, 162, 'Ice: 0/0  Chain: 0/0', { fontSize: '24px', color: '#fff7cf', fontStyle: '700' });

    const pauseBtn = this.add.image(664, 100, 'ui_elements', 'pause_button').setDisplaySize(58, 58).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.scene.pause('GameScene'));
    const muteBtn = this.add.rectangle(650, 178, 100, 34, 0x3e2557, 0.94).setStrokeStyle(2, 0xffdbff, 0.9).setInteractive({ useHandCursor: true });
    this.muteLabel = this.add.text(650, 178, this.audioManager.isMuted() ? 'UNMUTE' : 'MUTE', { fontSize: '16px', color: '#ffffff', fontStyle: '700' }).setOrigin(0.5);
    muteBtn.on('pointerdown', () => {
      this.audioManager.buttonClick();
      const muted = this.audioManager.toggleMute();
      this.muteLabel.setText(muted ? 'UNMUTE' : 'MUTE');
    });

    this.add.text(530, 210, 'VOL', { fontSize: '15px', color: '#fff2ff', fontStyle: '700' }).setOrigin(1, 0.5);
    const sliderBg = this.add.rectangle(610, 210, 140, 10, 0x271834, 0.9).setOrigin(0.5).setStrokeStyle(1, 0xffffff, 0.35);
    this.volumeFill = this.add.rectangle(540, 210, 140 * this.audioManager.getVolume(), 8, 0xff9cee, 0.95).setOrigin(0, 0.5);
    const knob = this.add.circle(540 + 140 * this.audioManager.getVolume(), 210, 8, 0xffffff, 1).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(knob);
    knob.on('drag', (_p: Phaser.Input.Pointer, dragX: number) => {
      const x = Phaser.Math.Clamp(dragX, 540, 680);
      const volume = (x - 540) / 140;
      knob.x = x;
      this.volumeFill.width = Math.max(2, 140 * volume);
      this.audioManager.setVolume(volume);
    });
    sliderBg.setInteractive({ useHandCursor: true }).on('pointerdown', (p: Phaser.Input.Pointer) => {
      const local = Phaser.Math.Clamp(p.x, 540, 680);
      const volume = (local - 540) / 140;
      knob.x = local;
      this.volumeFill.width = Math.max(2, 140 * volume);
      this.audioManager.setVolume(volume);
    });

    this.registry.events.on('changedata', this.updateHud, this);
    this.updateHud();
  }

  private updateHud(): void {
    const score = Number(this.registry.get('score') ?? 0);
    const moves = Number(this.registry.get('moves') ?? 0);
    const level = Number(this.registry.get('level') ?? 1);
    const target = Number(this.registry.get('target') ?? 1);
    const objectiveTargets = this.registry.get('objectiveTargets') as { ice?: number; chain?: number } | undefined;
    const stats = this.registry.get('obstacleStats') as { ice: { total: number; cleared: number }; chain: { total: number; cleared: number } } | undefined;

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

    const iceTotal = objectiveTargets?.ice ?? 0;
    const chainTotal = objectiveTargets?.chain ?? 0;
    const iceCleared = stats?.ice.cleared ?? 0;
    const chainCleared = stats?.chain.cleared ?? 0;
    this.objectiveText.setText(`Ice: ${iceCleared}/${iceTotal}  Chain: ${chainCleared}/${chainTotal}`);
  }
}
