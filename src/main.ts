import Phaser from 'phaser';
import { BootstrapScene } from './scenes/BootstrapScene';
import { PreloadScene } from './scenes/PreloadScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { PlayGameScene } from './scenes/PlayGameScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 800,
  height: 720,
  backgroundColor: '#11091a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootstrapScene, PreloadScene, LevelSelectScene, PlayGameScene],
});
