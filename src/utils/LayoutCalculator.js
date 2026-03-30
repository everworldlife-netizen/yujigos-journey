import Phaser from 'phaser';
import GAME_CONFIG from '../config/GameConfig.js';

const DESIGN_WIDTH = 720;
const MIN_TILE_SIZE = 48;
const MAX_TILE_SIZE = 72;
const BOARD_SIDE_PADDING = 16;

export function calculateLayout(width, height) {
  const safeTop = Math.max(16, Math.floor(height * 0.02));
  const safeBottom = Math.max(16, Math.floor(height * 0.02));
  const boardPadding = BOARD_SIDE_PADDING * 2;
  const tileSize = Phaser.Math.Clamp(Math.floor((width - boardPadding) / GAME_CONFIG.BOARD_COLS), MIN_TILE_SIZE, MAX_TILE_SIZE);
  const boardWidth = tileSize * GAME_CONFIG.BOARD_COLS;
  const boardHeight = tileSize * GAME_CONFIG.BOARD_ROWS;
  const boardX = Math.floor((width - boardWidth) / 2);
  const hudHeight = Math.max(72, Math.floor(96 * (width / DESIGN_WIDTH)));
  const hudTop = safeTop + 8;
  const boardY = Math.floor(Phaser.Math.Clamp(height * 0.58 - boardHeight / 2, hudTop + hudHeight + 16, height - safeBottom - boardHeight - 24));

  return {
    width,
    height,
    scaleFactor: Phaser.Math.Clamp(width / DESIGN_WIDTH, 0.8, 1.2),
    tileSize,
    boardX,
    boardY,
    boardWidth,
    boardHeight,
    hudTop,
    hudHeight,
    safeTop,
    safeBottom
  };
}
