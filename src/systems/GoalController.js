import { START_MOVES, TARGET_SCORE } from '../config.js';
import EventBus from '../core/EventBus.js';

export default class GoalController {
  constructor() {
    this.level = 1;
    this.score = 0;
    this.moves = START_MOVES;
    this.targetScore = TARGET_SCORE;
  }

  addScore(base, multiplier = 1) {
    this.score += Math.round(base * multiplier);
    EventBus.emit('ui:update', this.getState());
  }

  consumeMove() {
    this.moves -= 1;
    EventBus.emit('ui:update', this.getState());
  }

  getState() {
    return { score: this.score, moves: this.moves, level: this.level, targetScore: this.targetScore };
  }

  evaluate(hasValidMoves) {
    if (this.score >= this.targetScore) {
      EventBus.emit('goal:win', this.getState());
      return 'win';
    }
    if (this.moves <= 0 || !hasValidMoves) {
      EventBus.emit('goal:lose', this.getState());
      return 'lose';
    }
    return 'active';
  }
}
