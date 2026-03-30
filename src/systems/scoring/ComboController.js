import EventBus from '../../utils/EventBus.js';

export default class ComboController {
  constructor() {
    this.depth = 0;
    EventBus.on('cascade:start', this.reset, this);
    EventBus.on('match:clear', this.onMatchClear, this);
  }

  reset() {
    this.depth = 0;
  }

  onMatchClear() {
    this.depth += 1;
    EventBus.emit('combo:update', { depth: this.depth });
  }

  destroy() {
    EventBus.off('cascade:start', this.reset, this);
    EventBus.off('match:clear', this.onMatchClear, this);
  }
}
