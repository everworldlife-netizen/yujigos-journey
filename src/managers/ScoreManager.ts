import { STARS } from '../config/gameConfig';

export class ScoreManager {
  score = 0;
  combo = 1;

  reset(): void {
    this.score = 0;
    this.combo = 1;
  }

  add(base: number): number {
    const gain = Math.floor(base * this.combo);
    this.score += gain;
    return gain;
  }

  stepCombo(): number {
    this.combo++;
    return this.combo;
  }

  resetCombo(): void {
    this.combo = 1;
  }

  starCount(target: number): number {
    if (this.score >= target * STARS.THREE) return 3;
    if (this.score >= target * STARS.TWO) return 2;
    if (this.score >= target * STARS.ONE) return 1;
    return 0;
  }
}
