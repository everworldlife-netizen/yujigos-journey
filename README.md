# Yujigo's Journey

A polished mobile-first match-3 game built with **Phaser 3.90+**, **TypeScript**, and **Vite**.

## Features
- 7x9 match-3 board with swap, gravity, cascades, combos, and refill.
- 50-level world map with unlock progression.
- Special berries:
  - 4-match: striped (row/column clears)
  - 5-match: rainbow (type clear)
  - L/T overlap: bomb (3x3 explosion)
- Blockers:
  - Ice (1-2 layers)
  - Chains (tile lock)
- Candy-style juicy animations, particle bursts, popups, and star progression.
- Touch + mouse support and responsive fit at 720x1280 design resolution.

## Project Structure
- `src/main.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/TitleScene.ts`
- `src/scenes/WorldMapScene.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/UIScene.ts`
- `src/objects/Board.ts`
- `src/objects/Tile.ts`
- `src/objects/ParticleManager.ts`
- `src/objects/SpecialTile.ts`
- `src/managers/ScoreManager.ts`
- `src/managers/LevelManager.ts`
- `src/managers/AnimationManager.ts`
- `src/config/levels.ts`
- `src/config/gameConfig.ts`

## Asset Setup
Add your production assets to:
- `public/assets/sprites/berry_tiles.png` (spritesheet 352x384 per frame, 8x4 sheet)
- `public/assets/sprites/ui.png`
- `public/assets/sprites/ui.json`
- `public/assets/audio/*`
- `public/assets/fonts/*`

When berry sprites are absent, the game uses generated fallback visuals for development.

## Development
```bash
npm install
npm run dev
```

## Build (Vercel-ready static export)
```bash
npm run build
```
Output is written to `dist/` and can be deployed directly on Vercel as a static site.

## Controls
- Tap/click two adjacent tiles to swap.
- Match 3+ to clear.
- Reach target score before moves run out.
