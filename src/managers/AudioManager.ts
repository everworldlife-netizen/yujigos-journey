import { audioManager } from '../audio/AudioManager';

export class AudioManager {
  async unlock(): Promise<void> {
    await audioManager.unlock();
  }

  startMusic(level: number): void {
    audioManager.startMusic(level);
  }

  stopMusic(): void {
    audioManager.stopMusic();
  }

  isMuted(): boolean {
    return audioManager.isMuted();
  }

  getVolume(): number {
    return audioManager.getVolume();
  }

  toggleMute(): boolean {
    return audioManager.toggleMute();
  }

  setVolume(value: number): void {
    audioManager.setVolume(value);
  }

  swap(): void {
    audioManager.playSfx('swap_success');
  }

  match(): void {
    audioManager.playSfx('berry_pop');
  }

  cascade(chainLevel = 2): void {
    audioManager.playSfx('chain_combo', 0.8 + chainLevel * 0.08);
  }

  combo(level = 3): void {
    if (level >= 5) {
      audioManager.playSfx('combo_5');
      audioManager.announce('combo_5');
      return;
    }
    if (level >= 4) {
      audioManager.playSfx('combo_4');
      audioManager.announce('combo_4');
      return;
    }
    audioManager.playSfx('combo_3');
    audioManager.announce('combo_3');
  }

  levelComplete(): void {
    audioManager.playSfx('level_complete');
    audioManager.announce('level_complete');
  }

  levelFail(): void {
    audioManager.playSfx('board_shuffle');
  }

  levelLose(): void {
    audioManager.playSfx('board_shuffle');
  }

  specialCreated(): void {
    audioManager.playSfx('combo_3');
  }

  specialActivated(): void {
    audioManager.playSfx('power_rainbow');
  }

  comboCallout(level = 2): void {
    if (level >= 3) this.combo(level);
  }

  buttonClick(): void {
    audioManager.playSfx('button_click');
  }

  berryLand(): void {
    audioManager.playSfx('berry_land');
  }

  swapFail(): void {
    audioManager.playSfx('swap_fail');
  }

  obstacleBreak(): void {
    audioManager.playSfx('obstacle_break');
  }

  powerStripe(): void {
    audioManager.playSfx('power_stripe');
    audioManager.announce('power_up');
  }

  powerBomb(): void {
    audioManager.playSfx('power_bomb');
    audioManager.announce('power_up');
  }

  powerRainbow(): void {
    audioManager.playSfx('power_rainbow');
    audioManager.announce('power_up');
  }
}

export { audioManager };
