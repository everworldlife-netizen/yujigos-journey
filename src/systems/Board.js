import { BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS, ROWS, TILE_SIZE, TILE_TYPES } from '../config.js';
import { TILE_KEYS } from '../config/AssetConfig.js';

export default class Board {
  constructor(scene) {
    this.scene = scene;
    this.grid = [];
    this.tiles = [];
  }

  randomType() {
    return Math.floor(Math.random() * TILE_TYPES);
  }

  createInitialGrid() {
    this.grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => this.randomType()));
    this.tiles = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  }

  gridToWorld(row, col) {
    return {
      x: BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2,
      y: BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2
    };
  }

  worldToGrid(x, y) {
    return {
      row: Math.floor((y - BOARD_OFFSET_Y) / TILE_SIZE),
      col: Math.floor((x - BOARD_OFFSET_X) / TILE_SIZE)
    };
  }

  createTileSprite(row, col, type, x, y) {
    const sprite = this.scene.add.image(x, y, TILE_KEYS[type]).setDepth(5);
    sprite.setData('row', row);
    sprite.setData('col', col);
    this.tiles[row][col] = sprite;
    this.grid[row][col] = type;
    return sprite;
  }

  createTileAt(row, col, type) {
    const { x, y } = this.gridToWorld(row, col);
    return this.createTileSprite(row, col, type, x, y);
  }

  destroyTile(row, col) {
    const tile = this.tiles[row][col];
    if (tile) tile.destroy();
    this.tiles[row][col] = null;
    this.grid[row][col] = -1;
  }

  moveTile(fromRow, fromCol, toRow, toCol) {
    this.tiles[toRow][toCol] = this.tiles[fromRow][fromCol];
    this.tiles[fromRow][fromCol] = null;

    this.grid[toRow][toCol] = this.grid[fromRow][fromCol];
    this.grid[fromRow][fromCol] = -1;

    if (this.tiles[toRow][toCol]) {
      this.tiles[toRow][toCol].setData('row', toRow);
      this.tiles[toRow][toCol].setData('col', toCol);
    }
  }

  swapCells(r1, c1, r2, c2) {
    [this.tiles[r1][c1], this.tiles[r2][c2]] = [this.tiles[r2][c2], this.tiles[r1][c1]];
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];

    const a = this.tiles[r1][c1];
    const b = this.tiles[r2][c2];
    if (a) {
      a.setData('row', r1);
      a.setData('col', c1);
    }
    if (b) {
      b.setData('row', r2);
      b.setData('col', c2);
    }
  }
}
