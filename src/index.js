import Phaser from 'phaser';
import { BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS, ROWS, TILE_SIZE } from './config.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import ResultsScene from './scenes/ResultsScene.js';

const width = BOARD_OFFSET_X * 2 + COLS * TILE_SIZE;
const height = BOARD_OFFSET_Y + ROWS * TILE_SIZE + 24;

new Phaser.Game({
  type: Phaser.AUTO,
  width,
  height,
  parent: 'game',
  backgroundColor: '#0b1020',
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene, UIScene, PauseScene, ResultsScene]
});
