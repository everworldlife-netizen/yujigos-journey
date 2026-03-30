import { ASSET_MANIFEST } from './AssetManifest.js';

export const TILE_TYPES = [
  'strawberry',
  'blueberry',
  'raspberry',
  'pink_raspberry',
  'blackberry',
  'golden_berry',
  'moon_berry',
  'ice_berry'
];

export const TILE_STATES = ['normal', 'happy', 'matched', 'frozen'];

export function getTileTextureKey(type, state = 'normal') {
  return ASSET_MANIFEST.tiles[type]?.[state]?.key ?? ASSET_MANIFEST.tiles[type]?.normal?.key;
}

export function getSpecialTextureKey(special) {
  const specialMap = {
    striped: 'bow',
    bomb: 'bomb',
    rainbow: 'rainbow',
    swirl: 'swirl',
    star: 'star',
    heart: 'heart'
  };
  const manifestKey = specialMap[special] ?? special;
  return ASSET_MANIFEST.specialTiles[manifestKey]?.key;
}

export function getBoardTextureKey(element) {
  return ASSET_MANIFEST.board[element]?.key;
}

export function getBackgroundTextureKey(name) {
  return ASSET_MANIFEST.backgrounds[name]?.key;
}

export function getUiTextureKey(name) {
  return ASSET_MANIFEST.ui[name]?.key;
}

export function getCharacterTextureKey(character, pose = 'idle') {
  if (character === 'yujigo') return ASSET_MANIFEST.characters.yujigo[pose]?.key;
  if (character === 'mochi') return ASSET_MANIFEST.characters.mochi[pose]?.key;
  return undefined;
}

export function getFxTextureKey(name) {
  const fxMap = {
    sparkle: 'sparkle-star',
    matchBurst: 'sparkle-burst',
    specialGlow: 'sparkle-glow'
  };
  const manifestKey = fxMap[name] ?? name;
  return ASSET_MANIFEST.effects[manifestKey]?.key;
}

export const TILE_PARTICLE_TINTS = {
  strawberry: 0xff4e6d,
  blueberry: 0x5a86ff,
  raspberry: 0xff5890,
  pink_raspberry: 0xff8bc4,
  blackberry: 0x6f52b8,
  golden_berry: 0xffd25a,
  moon_berry: 0x9fd0ff,
  ice_berry: 0xd7ecff
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
