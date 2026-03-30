import EventBus from '../core/EventBus.js';
import { getLevelConfig } from '../config/LevelConfig.js';

export default class GoalController {
  constructor(level = 1) {
    const levelConfig = getLevelConfig(level);
    this.level = levelConfig.level;
    this.score = 0;
    this.moves = levelConfig.moveLimit;
    this.targetScore = levelConfig.targetScore;
  }

  addScore(base, multiplier = 1) {
    this.score += Math.round(base * multiplier);
    EventBus.emit('ui:update', this.getState());
  }

  consumeMove() {
    this.moves -= 1;
    EventBus.emit('moves:changed', this.moves);
    EventBus.emit('ui:update', this.getState());
  }

  getState() {
    return { score: this.score, moves: this.moves, level: this.level, targetScore: this.targetScore };
  }

  evaluate() {
    if (this.score >= this.targetScore) {
      EventBus.emit('goal:win', this.getState());
      return 'win';
    }
    if (this.moves <= 0) {
      EventBus.emit('goal:lose', this.getState());
      return 'lose';
    }
    return 'active';
  }
}
