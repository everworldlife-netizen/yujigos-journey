export const ASSET_MANIFEST = {
  tiles: {
    red: { key: 'tile_red', path: 'assets/tiles/tile_red.png', width: 64, height: 64, placeholder: 'tile-red' },
    blue: { key: 'tile_blue', path: 'assets/tiles/tile_blue.png', width: 64, height: 64, placeholder: 'tile-blue' },
    green: { key: 'tile_green', path: 'assets/tiles/tile_green.png', width: 64, height: 64, placeholder: 'tile-green' },
    yellow: { key: 'tile_yellow', path: 'assets/tiles/tile_yellow.png', width: 64, height: 64, placeholder: 'tile-yellow' },
    purple: { key: 'tile_purple', path: 'assets/tiles/tile_purple.png', width: 64, height: 64, placeholder: 'tile-purple' },
    orange: { key: 'tile_orange', path: 'assets/tiles/tile_orange.png', width: 64, height: 64, placeholder: 'tile-orange' }
  },
  specials: {
    striped: { key: 'special_striped', path: 'assets/tiles/special_striped.png', width: 64, height: 64, placeholder: 'special-striped' },
    bomb: { key: 'special_bomb', path: 'assets/tiles/special_bomb.png', width: 64, height: 64, placeholder: 'special-bomb' },
    rainbow: { key: 'special_rainbow', path: 'assets/tiles/special_rainbow.png', width: 64, height: 64, placeholder: 'special-rainbow' }
  },
  board: {
    frame: { key: 'board_frame', path: 'assets/board/board_frame.png', width: 560, height: 560, placeholder: 'board-frame' },
    background: { key: 'board_background', path: 'assets/board/board_background.png', width: 520, height: 520, placeholder: 'board-background' }
  },
  backgrounds: {
    mainMenu: { key: 'background_main_menu', path: 'assets/backgrounds/main_menu.png', width: 1280, height: 720, placeholder: 'bg-main-menu' },
    game: { key: 'background_game', path: 'assets/backgrounds/game.png', width: 1280, height: 720, placeholder: 'bg-game' }
  },
  ui: {
    panel: { key: 'ui_panel', path: 'assets/ui/panel.png', width: 160, height: 66, placeholder: 'ui-panel' },
    button: { key: 'ui_button', path: 'assets/ui/button.png', width: 220, height: 66, placeholder: 'ui-button' },
    pauseIcon: { key: 'ui_pause_icon', path: 'assets/ui/pause_icon.png', width: 24, height: 20, placeholder: 'ui-pause-icon' },
    star: { key: 'ui_star', path: 'assets/ui/star.png', width: 32, height: 32, placeholder: 'ui-star' }
  },
  fx: {
    sparkle: { key: 'fx_sparkle', path: 'assets/fx/sparkle.png', width: 12, height: 12, placeholder: 'fx-sparkle' },
    specialGlow: { key: 'fx_special_glow', path: 'assets/fx/special_glow.png', width: 80, height: 80, placeholder: 'fx-special-glow' },
    matchBurst: { key: 'fx_match_burst', path: 'assets/fx/match_burst.png', width: 16, height: 16, placeholder: 'fx-match-burst' }
  }
};

export const ASSET_ENTRIES = Object.entries(ASSET_MANIFEST).flatMap(([group, assets]) =>
  Object.entries(assets).map(([name, entry]) => ({ group, name, ...entry }))
);
