export const ASSET_MANIFEST = {
  tiles: {
    red: { key: 'tile-red', path: 'assets/tiles/tile-red.png', width: 64, height: 64, placeholder: 'tile-red' },
    blue: { key: 'tile-blue', path: 'assets/tiles/tile-blue.png', width: 64, height: 64, placeholder: 'tile-blue' },
    green: { key: 'tile-green', path: 'assets/tiles/tile-green.png', width: 64, height: 64, placeholder: 'tile-green' },
    yellow: { key: 'tile-yellow', path: 'assets/tiles/tile-yellow.png', width: 64, height: 64, placeholder: 'tile-yellow' },
    purple: { key: 'tile-purple', path: 'assets/tiles/tile-purple.png', width: 64, height: 64, placeholder: 'tile-purple' },
    orange: { key: 'tile-orange', path: 'assets/tiles/tile-orange.png', width: 64, height: 64, placeholder: 'tile-orange' }
  },
  specials: {
    striped: { key: 'special-striped', path: 'assets/tiles/special-striped.png', width: 64, height: 64, placeholder: 'special-striped' },
    bomb: { key: 'special-bomb', path: 'assets/tiles/special-bomb.png', width: 64, height: 64, placeholder: 'special-bomb' },
    rainbow: { key: 'special-rainbow', path: 'assets/tiles/special-rainbow.png', width: 64, height: 64, placeholder: 'special-rainbow' }
  },
  ui: {
    panel: { key: 'ui-panel', path: 'assets/ui/ui-panel.png', width: 160, height: 66, placeholder: 'ui-panel' },
    button: { key: 'ui-button', path: 'assets/ui/ui-button.png', width: 220, height: 66, placeholder: 'ui-button' },
    pauseIcon: { key: 'ui-pause-icon', path: 'assets/ui/ui-pause-icon.png', width: 24, height: 20, placeholder: 'ui-pause-icon' },
    highlight: { key: 'ui-highlight', path: 'assets/ui/ui-highlight.png', width: 64, height: 64, placeholder: 'ui-highlight' },
    starFilled: { key: 'ui-star-filled', path: 'assets/ui/ui-star-filled.png', width: 32, height: 32, placeholder: 'ui-star-filled' },
    starEmpty: { key: 'ui-star-empty', path: 'assets/ui/ui-star-empty.png', width: 32, height: 32, placeholder: 'ui-star-empty' }
  },
  board: {
    frame: { key: 'board-frame', path: 'assets/board/board-frame.png', width: 560, height: 560, placeholder: 'board-frame' },
    background: { key: 'board-background', path: 'assets/board/board-background.png', width: 520, height: 520, placeholder: 'board-background' }
  },
  backgrounds: {
    mainMenu: { key: 'bg-main-menu', path: 'assets/backgrounds/bg-main-menu.png', width: 1280, height: 720, placeholder: 'bg-main-menu' },
    game: { key: 'bg-game', path: 'assets/backgrounds/bg-game.png', width: 1280, height: 720, placeholder: 'bg-game' }
  },
  effects: {
    bokeh: { key: 'effect-bokeh', path: 'assets/effects/effect-bokeh.png', width: 40, height: 40, placeholder: 'effect-bokeh' },
    sparkle: { key: 'effect-sparkle', path: 'assets/effects/effect-sparkle.png', width: 12, height: 12, placeholder: 'effect-sparkle' },
    specialGlow: { key: 'effect-special-glow', path: 'assets/effects/effect-special-glow.png', width: 80, height: 80, placeholder: 'effect-special-glow' }
  }
};

export const ASSET_ENTRIES = Object.values(ASSET_MANIFEST).flatMap((group) => Object.values(group));
