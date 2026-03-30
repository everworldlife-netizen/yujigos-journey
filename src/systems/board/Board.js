import Phaser from 'phaser';
import GAME_CONFIG from '../../config/GameConfig.js';
import { TILE_TYPES } from '../../config/AssetConfig.js';
import MatchFinder from '../match/MatchFinder.js';
import Tile from './Tile.js';
import EventBus from '../../utils/EventBus.js';

export default class Board {
  constructor(scene) {
    this.scene = scene;
    this.grid = [];
    this.tiles = [];
  }

  getLayout() {
    return this.scene.layout;
  }

  randomType() {
    return TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
  }

  createInitialGrid() {
    this.grid = Array.from({ length: GAME_CONFIG.BOARD_ROWS }, () => Array.from({ length: GAME_CONFIG.BOARD_COLS }, () => this.randomType()));
    let result = MatchFinder.find(this.grid);
    while (result.matches.length) {
      result.matches.forEach(({ row, col }) => {
        this.grid[row][col] = this.randomType();
      });
      result = MatchFinder.find(this.grid);
    }
    this.tiles = Array.from({ length: GAME_CONFIG.BOARD_ROWS }, () => Array.from({ length: GAME_CONFIG.BOARD_COLS }, () => null));
  }

  gridToWorld(row, col) {
    const { boardX, boardY, tileSize } = this.getLayout();
    return { x: boardX + col * tileSize + tileSize / 2, y: boardY + row * tileSize + tileSize / 2 };
  }

  createTileAt(row, col, type, initialWorld = null) {
    const { tileSize } = this.getLayout();
    const { x, y } = initialWorld ?? this.gridToWorld(row, col);
    const sprite = Tile.createSprite(this.scene, type, x, y, tileSize);
    sprite.setData('row', row);
    sprite.setData('col', col);
    const hitSize = Math.max(44, tileSize);
    sprite.setInteractive(new Phaser.Geom.Rectangle(-hitSize / 2, -hitSize / 2, hitSize, hitSize), Phaser.Geom.Rectangle.Contains);
    sprite.on('pointerdown', (pointer) => EventBus.emit('input:tileDown', { row: sprite.getData('row'), col: sprite.getData('col'), pointer, sprite }));
    sprite.on('pointerup', (pointer) => EventBus.emit('input:tileUp', { row: sprite.getData('row'), col: sprite.getData('col'), pointer, sprite }));
    sprite.on('pointerout', () => EventBus.emit('input:tileUp', { row: sprite.getData('row'), col: sprite.getData('col'), sprite }));
    sprite.on('pointermove', (pointer) => EventBus.emit('input:tileMove', { row: sprite.getData('row'), col: sprite.getData('col'), pointer, sprite }));

    const tile = new Tile(this.scene, { type, row, col, sprite });
    this.tiles[row][col] = tile;
    this.grid[row][col] = type;
    return tile;
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
    const tile = this.tiles[toRow][toCol];
    if (tile) {
      tile.row = toRow;
      tile.col = toCol;
      tile.sprite.setData('row', toRow).setData('col', toCol);
    }
  }

  swapCells(r1, c1, r2, c2) {
    [this.tiles[r1][c1], this.tiles[r2][c2]] = [this.tiles[r2][c2], this.tiles[r1][c1]];
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
    const a = this.tiles[r1][c1];
    const b = this.tiles[r2][c2];
    if (a) {
      a.row = r1;
      a.col = c1;
      a.sprite.setData('row', r1).setData('col', c1);
    }
    if (b) {
      b.row = r2;
      b.col = c2;
      b.sprite.setData('row', r2).setData('col', c2);
    }
  }

  // EXTENSION: Add blocker tile types here
}
