import EventBus from '../../utils/EventBus.js';
import { getLevelConfig } from '../../config/LevelConfig.js';
import GAME_CONFIG from '../../config/GameConfig.js';

export default class GoalController {
  constructor(level = 1) {
    const levelConfig = getLevelConfig(level);
    this.level = levelConfig.level;
    this.score = 0;
    this.moves = levelConfig.moveLimit;
    this.targetScore = levelConfig.targetScore;

    EventBus.on('match:clear', this.onMatchClear, this);
    EventBus.on('moves:consume', this.consumeMove, this);
    EventBus.on('turn:complete', this.evaluate, this);
    EventBus.emit('score:update', { score: this.score, level: this.level });
    EventBus.emit('moves:update', { moves: this.moves, level: this.level });
  }

  onMatchClear({ matchCount, depth }) {
    this.score += Math.round(matchCount * GAME_CONFIG.BASE_SCORE_PER_TILE * Math.max(1, depth));
    EventBus.emit('score:update', { score: this.score, level: this.level });
  }

  consumeMove() {
    this.moves -= 1;
    EventBus.emit('moves:update', { moves: this.moves, level: this.level });
  }

  getState() {
    return { score: this.score, moves: this.moves, level: this.level, targetScore: this.targetScore };
  }

  evaluate() {
    if (this.score >= this.targetScore) EventBus.emit('goal:win', this.getState());
    else if (this.moves <= 0) EventBus.emit('goal:lose', this.getState());
  }

  destroy() {
    EventBus.off('match:clear', this.onMatchClear, this);
    EventBus.off('moves:consume', this.consumeMove, this);
    EventBus.off('turn:complete', this.evaluate, this);
  }
}
