import { LEVELS } from '../config/levels';

export class LevelManager {
  private unlocked = 1;
  currentLevel = 1;

  loadProgress(): void {
    const saved = Number(localStorage.getItem('yj_unlocked') ?? '1');
    this.unlocked = Math.max(1, saved);
  }

  setCurrent(level: number): void {
    this.currentLevel = Math.min(level, LEVELS.length);
  }

  getCurrent() {
    return LEVELS[this.currentLevel - 1];
  }

  isUnlocked(level: number): boolean {
    return level <= this.unlocked;
  }

  completeCurrent(): void {
    this.unlocked = Math.max(this.unlocked, this.currentLevel + 1);
    localStorage.setItem('yj_unlocked', String(this.unlocked));
  }
}
