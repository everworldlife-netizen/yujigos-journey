import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';
import { UIScene } from './scenes/UIScene';
import { WorldMapScene } from './scenes/WorldMapScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: '#120d24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, TitleScene, WorldMapScene, GameScene, UIScene],
});
