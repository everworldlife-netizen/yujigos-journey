import { ASSET_MANIFEST } from './AssetManifest.js';

export const TILE_TEXTURES = {
  red: ASSET_MANIFEST.tiles.red.key,
  blue: ASSET_MANIFEST.tiles.blue.key,
  green: ASSET_MANIFEST.tiles.green.key,
  yellow: ASSET_MANIFEST.tiles.yellow.key,
  purple: ASSET_MANIFEST.tiles.purple.key,
  orange: ASSET_MANIFEST.tiles.orange.key
};

export const SPECIAL_TEXTURES = {
  striped: ASSET_MANIFEST.specials.striped.key,
  bomb: ASSET_MANIFEST.specials.bomb.key,
  rainbow: ASSET_MANIFEST.specials.rainbow.key
};

export const UI_TEXTURES = {
  panel: ASSET_MANIFEST.ui.panel.key,
  button: ASSET_MANIFEST.ui.button.key,
  pauseIcon: ASSET_MANIFEST.ui.pauseIcon.key,
  highlight: ASSET_MANIFEST.ui.highlight.key,
  starFilled: ASSET_MANIFEST.ui.starFilled.key,
  starEmpty: ASSET_MANIFEST.ui.starEmpty.key,
  bokeh: ASSET_MANIFEST.effects.bokeh.key,
  sparkle: ASSET_MANIFEST.effects.sparkle.key,
  boardFrame: ASSET_MANIFEST.board.frame.key,
  boardBackground: ASSET_MANIFEST.board.background.key,
  specialGlow: ASSET_MANIFEST.effects.specialGlow.key,
  mainMenuBackground: ASSET_MANIFEST.backgrounds.mainMenu.key,
  gameBackground: ASSET_MANIFEST.backgrounds.game.key
};

export const PARTICLE_CONFIG = {
  matchBurst: {
    lifespan: 350,
    speed: { min: 35, max: 120 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 40,
    quantity: 10,
    emitting: false
  },
  specialGlow: {
    scale: { from: 0.2, to: 1.1 },
    alpha: { from: 0.95, to: 0 },
    duration: 260
  }
};

export const TILE_KEYS = [
  TILE_TEXTURES.red,
  TILE_TEXTURES.blue,
  TILE_TEXTURES.green,
  TILE_TEXTURES.yellow,
  TILE_TEXTURES.purple,
  TILE_TEXTURES.orange
];
