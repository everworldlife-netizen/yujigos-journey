import { BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS, ROWS, TILE_SIZE } from '../config.js';
import { TILE_TYPES, getTileTextureKey } from '../config/AssetConfig.js';
import MatchFinder from './MatchFinder.js';

export default class Board {
  constructor(scene) {
    this.scene = scene;
    this.grid = [];
    this.tiles = [];
  }

  randomType() {
    return TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
  }

  createInitialGrid() {
    this.grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => this.randomType()));
    let result = MatchFinder.find(this.grid);
    while (result.matches.length) {
      result.matches.forEach(({ row, col }) => {
        this.grid[row][col] = this.randomType();
      });
      result = MatchFinder.find(this.grid);
    }
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
    const sprite = this.scene.add.image(x, y, getTileTextureKey(type)).setDepth(5);
    sprite.setData('row', row);
    sprite.setData('col', col);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      if (this.scene.onTilePointerDown) this.scene.onTilePointerDown(sprite);
      if (!this.scene.onTilePicked) return;
      this.scene.onTilePicked({ row: sprite.getData('row'), col: sprite.getData('col') });
    });
    sprite.on('pointerup', () => {
      if (this.scene.onTilePointerUp) this.scene.onTilePointerUp(sprite);
    });
    sprite.on('pointerout', () => {
      if (this.scene.onTilePointerUp) this.scene.onTilePointerUp(sprite);
    });
    sprite.on('pointermove', (pointer) => {
      if (this.scene.onTileDragged) this.scene.onTileDragged(sprite, pointer);
    });
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
