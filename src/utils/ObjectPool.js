export default class ObjectPool {
  constructor(createFn, resetFn = null) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
  }

  acquire() {
    return this.pool.pop() ?? this.createFn();
  }

  release(item) {
    if (this.resetFn) this.resetFn(item);
    this.pool.push(item);
  }
}
