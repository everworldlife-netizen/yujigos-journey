export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const BOARD_COLS = 7;
export const BOARD_ROWS = 9;
export const TILE_SIZE = 86;
export const BOARD_X = (GAME_WIDTH - BOARD_COLS * TILE_SIZE) / 2;
export const BOARD_Y = 280;

export const BERRY_TYPES = 6;

export const ANIM = {
  SWAP_MS: 180,
  FALL_MS: 260,
  SPAWN_MS: 300,
  CLEAR_MS: 220,
  CASCADE_DELAY_MS: 55,
  SPECIAL_IDLE_MS: 1500,
};

export const SCORE = {
  BASE_CLEAR: 60,
  SPECIAL_BONUS: 220,
  COMBO_STEP: 0.5,
};

export const STARS = {
  ONE: 0.55,
  TWO: 0.85,
  THREE: 1.2,
};
