const SPECIAL_TINTS = {
  striped: 0xfff1a8,
  bomb: 0xffc1d9,
  rainbow: 0xb6fff6
};

export default class Tile {
  constructor(scene, row, col, type, x, y) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.type = type;
    this.specialType = null;
    this.sprite = scene.add.image(x, y, `tile-${type}`);
    this.sprite.setData('tile', this);
    this.sprite.setInteractive({ useHandCursor: true });
  }

  setType(type) {
    this.type = type;
    this.sprite.setTexture(`tile-${type}`);
  }

  setSpecial(type) {
    this.specialType = type;
    this.sprite.setTint(SPECIAL_TINTS[type] ?? 0xffffff);
  }

  clearSpecial() {
    this.specialType = null;
    this.sprite.clearTint();
  }

  setGridPosition(row, col) {
    this.row = row;
    this.col = col;
  }

  destroy() {
    this.sprite.destroy();
  }
}
