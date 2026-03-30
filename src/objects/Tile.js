export default class Tile {
  constructor(scene, row, col, type, x, y) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.type = type;
    this.sprite = scene.add.image(x, y, `tile-${type}`);
    this.sprite.setData('tile', this);
    this.sprite.setInteractive({ useHandCursor: true });
  }

  setType(type) {
    this.type = type;
    this.sprite.setTexture(`tile-${type}`);
  }

  setGridPosition(row, col) {
    this.row = row;
    this.col = col;
  }

  destroy() {
    this.sprite.destroy();
  }
}
