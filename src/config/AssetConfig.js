export const TILE_TEXTURES = {
  red: 'tile-0',
  blue: 'tile-1',
  green: 'tile-2',
  yellow: 'tile-3',
  purple: 'tile-4',
  orange: 'tile-5'
};

export const SPECIAL_TEXTURES = {
  striped: 'special-striped',
  bomb: 'special-bomb',
  rainbow: 'special-rainbow'
};

export const UI_TEXTURES = {
  panel: 'ui-panel',
  button: 'ui-button',
  pauseIcon: 'ui-pause-icon',
  highlight: 'highlight',
  bokeh: 'bokeh',
  sparkle: 'sparkle',
  boardFrame: 'board-frame',
  specialGlow: 'special-glow'
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

export const TILE_KEYS = Object.values(TILE_TEXTURES);
