import { ASSET_MANIFEST } from './AssetManifest.js';

export const TILE_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const TILE_TEXTURE_MAP = {
  red: 'tile_red',
  blue: 'tile_blue',
  green: 'tile_green',
  yellow: 'tile_yellow',
  purple: 'tile_purple',
  orange: 'tile_orange'
};

export function getTileTextureKey(type) {
  return TILE_TEXTURE_MAP[type];
}

export function getSpecialTextureKey(special) {
  return ASSET_MANIFEST.specials[special].key;
}

export function getBoardTextureKey(element) {
  return ASSET_MANIFEST.board[element].key;
}

export function getBackgroundTextureKey(name) {
  return ASSET_MANIFEST.backgrounds[name].key;
}

export function getUiTextureKey(name) {
  return ASSET_MANIFEST.ui[name].key;
}

export function getFxTextureKey(name) {
  return ASSET_MANIFEST.fx[name].key;
}

export const TILE_PARTICLE_TINTS = {
  red: 0xff4444,
  blue: 0x4488ff,
  green: 0x44dd44,
  yellow: 0xffdd44,
  purple: 0xbb44ff,
  orange: 0xff8844
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
