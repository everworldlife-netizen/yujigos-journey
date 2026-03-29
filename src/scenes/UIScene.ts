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
  private targetMarker!: Phaser.GameObjects.Rectangle;

  constructor() { super('UIScene'); }

  create(): void {
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this.add.image(360, 96, 'panel').setDisplaySize(700, 170);
    this.add.image(160, 84, 'score_plate').setDisplaySize(180, 78);
    this.add.image(540, 84, 'moves_plate').setDisplaySize(180, 78);
    this.add.image(360, 136, 'progress_bar_bg').setDisplaySize(430, 24);
    this.fill = this.add.image(145, 136, 'progress_fill').setDisplaySize(1, 16).setOrigin(0, 0.5);
    this.targetMarker = this.add.rectangle(145 + 420 * 0.83, 136, 4, 28, 0xffffff, 0.9);

    this.levelText = this.add.text(52, 42, 'L1', { fontSize: '36px', color: '#ffd6ff', fontStyle: '900', stroke: '#3a1847', strokeThickness: 6 });
    this.scoreText = this.add.text(132, 66, '0', { fontSize: '32px', color: '#ffffff', fontStyle: '900', stroke: '#2d0f3b', strokeThickness: 6 });
    this.movesText = this.add.text(522, 66, '0', { fontSize: '30px', color: '#ffffff', fontStyle: '800', stroke: '#2d0f3b', strokeThickness: 6 });

    [250, 360, 510].forEach((x) => this.add.image(x, 136, 'star').setDisplaySize(24, 24));

    this.add.image(118, 178, 'obstacles_tiles', 0).setDisplaySize(28, 28);
    this.add.image(278, 178, 'obstacles_tiles', 8).setDisplaySize(28, 28);
    this.objectiveText = this.add.text(140, 162, 'Ice: 0/0  Chain: 0/0', { fontSize: '24px', color: '#fff7cf', fontStyle: '700', stroke: '#402252', strokeThickness: 5 });

    const pauseBtn = this.add.image(664, 100, 'pause_button').setDisplaySize(58, 58).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerover', () => pauseBtn.setScale(1.07));
    pauseBtn.on('pointerout', () => pauseBtn.setScale(1));
    pauseBtn.on('pointerdown', () => pauseBtn.setScale(0.94));
    pauseBtn.on('pointerup', () => {
      pauseBtn.setScale(1);
      const handler = this.registry.get('pauseHandler') as (() => void) | undefined;
      handler?.();
    });
    const muteBtn = this.add.rectangle(650, 178, 100, 34, 0x3e2557, 0.94).setStrokeStyle(2, 0xffdbff, 0.9).setInteractive({ useHandCursor: true });
    this.muteLabel = this.add.text(650, 178, this.audioManager.isMuted() ? 'UNMUTE' : 'MUTE', { fontSize: '16px', color: '#ffffff', fontStyle: '700', stroke: '#2a143c', strokeThickness: 4 }).setOrigin(0.5);
    muteBtn.on('pointerdown', () => {
      this.audioManager.buttonClick();
      const muted = this.audioManager.toggleMute();
      this.muteLabel.setText(muted ? 'UNMUTE' : 'MUTE');
    });

    this.add.text(530, 210, 'VOL', { fontSize: '15px', color: '#fff2ff', fontStyle: '700', stroke: '#2d1a40', strokeThickness: 4 }).setOrigin(1, 0.5);
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off('changedata', this.updateHud, this);
      this.tweens.killAll();
    });
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

    if (moves <= 5) {
      this.movesText.setColor('#ff7070');
      this.tweens.add({ targets: this.movesText, scale: { from: 1, to: 1.16 }, yoyo: true, repeat: 1, duration: 240, ease: 'Back.Out' });
    } else {
      this.movesText.setColor('#ffffff');
    }

    const prevScore = Number(this.scoreText.text.replace(/\D/g, '') || 0);
    this.tweens.addCounter({
      from: prevScore,
      to: score,
      duration: 300,
      ease: 'Cubic.Out',
      onUpdate: (t) => this.scoreText.setText(`${Math.floor(t.getValue() ?? 0)}`),
    });

    const progress = Phaser.Math.Clamp(score / target, 0, 1);
    this.tweens.add({ targets: this.fill, displayWidth: 420 * progress, duration: 280, ease: 'Cubic.Out' });

    const iceTotal = objectiveTargets?.ice ?? 0;
    const chainTotal = objectiveTargets?.chain ?? 0;
    const iceCleared = stats?.ice.cleared ?? 0;
    const chainCleared = stats?.chain.cleared ?? 0;
    this.objectiveText.setText(`Ice: ${iceCleared}/${iceTotal}  Chain: ${chainCleared}/${chainTotal}`);
  }
}
