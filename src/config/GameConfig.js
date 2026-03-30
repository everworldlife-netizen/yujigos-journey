import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import PreloadScene from '../scenes/PreloadScene.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import GameScene from '../scenes/GameScene.js';
import UIScene from '../scenes/UIScene.js';
import PauseScene from '../scenes/PauseScene.js';
import ResultsScene from '../scenes/ResultsScene.js';

export const GAME_CONFIG = {
  BOARD_COLS: 8,
  BOARD_ROWS: 8,
  TILE_TYPES: 6,
  BASE_SCORE_PER_TILE: 10,
  SWAP_DURATION: 200,
  SWAP_INVALID_DURATION: 150,
  FALL_DURATION_PER_ROW: 80,
  FALL_DURATION_MIN: 120,
  MATCH_POP_DURATION: 100,
  MATCH_POP_DELAY_STEP: 20,
  SPAWN_SCALE_DURATION: 260,
  TURN_BUFFER_DELAY: 80,
  MAX_PARTICLES: 200,
  MIN_SWIPE_DISTANCE: 20
};

export function createPhaserConfig() {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#05070f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 720,
      height: 1280
    },
    scene: [BootScene, PreloadScene, MainMenuScene, GameScene, UIScene, PauseScene, ResultsScene]
  };
}

export default GAME_CONFIG;
