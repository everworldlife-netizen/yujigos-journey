import EventBus from '../core/EventBus.js';

export default class ComboController {
  constructor() {
    this.depth = 0;
  }

  reset() {
    this.depth = 0;
  }

  bump() {
    this.depth += 1;
    if (this.depth > 1) {
      EventBus.emit('combo:changed', { depth: this.depth });
    }
    return this.depth;
  }

  getMultiplier() {
    return 1 + Math.max(0, this.depth - 1) * 0.25;
  }
}
