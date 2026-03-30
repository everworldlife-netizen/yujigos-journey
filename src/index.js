import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import ResultsScene from './scenes/ResultsScene.js';

const game = new Phaser.Game({
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
});

const resizeGame = () => {
  game.scale.refresh();
};

window.addEventListener('resize', resizeGame, { passive: true });
window.addEventListener('orientationchange', resizeGame, { passive: true });
