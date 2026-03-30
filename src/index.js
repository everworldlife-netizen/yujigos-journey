import Phaser from 'phaser';
import { createPhaserConfig } from './config/GameConfig.js';

const game = new Phaser.Game(createPhaserConfig());

const resizeGame = () => {
  game.scale.refresh();
};

window.addEventListener('resize', resizeGame, { passive: true });
window.addEventListener('orientationchange', resizeGame, { passive: true });
