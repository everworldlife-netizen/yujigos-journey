# Yujigo's Journey

A clean Phaser 3 match-3 game built with Webpack.

## Scripts

- `npm start` — run webpack-dev-server
- `npm run build` — create production build in `dist/`

## Asset pipeline and custom art swapping

All game art is now loaded from a centralized manifest (`src/config/AssetManifest.js`) and expected under `public/assets/`:

- `public/assets/tiles/` — base tiles + special tile variants
- `public/assets/ui/` — panels, buttons, pause icon, stars, and UI highlights
- `public/assets/board/` — board frame + board background
- `public/assets/backgrounds/` — scene backgrounds (menu/game)
- `public/assets/effects/` — particle/effect sprites (bokeh, sparkle, glow)
- `public/assets/audio/` — placeholder folder for future SFX/music

### How to swap assets

1. Keep the existing filenames from `src/config/AssetManifest.js`.
2. Replace the PNG file at the matching `path` (for example `assets/tiles/tile-red.png`).
3. Restart the dev server if needed.

No code changes are required when replacing art at the same manifest paths.

### Naming conventions and dimensions

- **Tiles / specials:** `64x64` PNG recommended.
- **UI panel:** `160x66`, **UI button:** `220x66`, **pause icon:** `24x20`.
- **Star icons:** `32x32`.
- **Board frame/background:** designed around `560x560` and `520x520`.
- **Backgrounds:** `1280x720` (they are scaled to viewport at runtime).
- **Effects:** bokeh `40x40`, sparkle `12x12`, special glow `80x80`.

### Fallback behavior

If a file is missing or fails to load, `PreloadScene` generates a labeled placeholder texture at runtime so gameplay continues without breaking.
