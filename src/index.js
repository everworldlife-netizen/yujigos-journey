import Phaser from 'phaser';
import { BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS, ROWS, TILE_SIZE } from './config.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

const width = BOARD_OFFSET_X * 2 + COLS * TILE_SIZE;
const height = BOARD_OFFSET_Y + ROWS * TILE_SIZE + 24;

new Phaser.Game({
  type: Phaser.AUTO,
  width,
  height,
  parent: 'game',
  backgroundColor: '#0b1020',
  scene: [BootScene, GameScene]
});
