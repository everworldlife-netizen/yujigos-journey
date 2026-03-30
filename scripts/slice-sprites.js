const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SHEETS_DIR = path.join(ROOT, 'public', 'assets', 'sheets');

const berryNames = ['strawberry', 'blueberry', 'raspberry', 'pink_raspberry', 'blackberry', 'golden_berry', 'moon_berry', 'ice_berry'];
const berryStates = ['normal', 'happy', 'matched', 'frozen'];

const configs = [
  {
    type: 'slice',
    input: 'berry-tiles.png',
    rows: 5,
    cols: 8,
    outputDir: path.join(ROOT, 'public', 'assets', 'tiles'),
    names: [
      ...berryStates.flatMap((state) => berryNames.map((berry) => `${berry}_${state}`)),
      'special_rainbow',
      'special_bow',
      'special_swirl',
      'special_star',
      'special_heart',
      'special_bomb'
    ]
  },
  {
    type: 'slice',
    input: 'yujigo-poses.png',
    rows: 5,
    cols: 4,
    outputDir: path.join(ROOT, 'public', 'assets', 'characters', 'yujigo'),
    names: [
      'idle', 'whistle', 'sad', 'cry',
      'cheer-left', 'cheer-right', 'point', 'present',
      'nervous', 'pray', 'side', 'determined',
      'wave-left', 'berry-hold', 'celebrate', 'surprised',
      'berry-magic', 'bow', 'berry-pick', 'icon'
    ]
  },
  {
    type: 'slice',
    input: 'mochi-poses.png',
    rows: 6,
    cols: 4,
    outputDir: path.join(ROOT, 'public', 'assets', 'characters', 'mochi'),
    names: [
      'idle', 'hearts', 'surprised', 'sleep',
      'walk', 'dance', 'curious', 'pray',
      'sit', 'happy', 'sad', 'run',
      'look', 'smile', 'worry', 'dash',
      'wink', 'berry-eat', 'bush-hide', 'mini',
      'with-yujigo'
    ]
  },
  {
    type: 'slice',
    input: 'npc-sprites.png',
    rows: 3,
    cols: 6,
    outputDir: path.join(ROOT, 'public', 'assets', 'characters', 'npcs'),
    names: ['idle', 'action', 'special'].flatMap((row) => ['hedgehog', 'fox', 'hummingbird', 'porcupine', 'butterfly', 'bunny'].map((col) => `${col}_${row}`))
  },
  {
    type: 'slice',
    input: 'ui-elements.png',
    rows: 4,
    cols: 6,
    outputDir: path.join(ROOT, 'public', 'assets', 'ui'),
    names: [
      'btn-play', 'btn-pause', 'btn-settings', 'btn-back', 'btn-shop', 'btn-collection',
      'display-score', 'display-moves', 'display-stars', 'display-level', 'display-coins', 'display-berry-goal',
      'star-empty', 'star-bronze', 'star-silver', 'star-gold', 'progress-bar', 'progress-bar-full',
      'banner-victory', 'banner-defeat', 'dialog-box', 'btn-close', 'btn-confirm', 'btn-info'
    ]
  },
  {
    type: 'slice',
    input: 'powerups.png',
    rows: 3,
    cols: 5,
    outputDir: path.join(ROOT, 'public', 'assets', 'powerups'),
    names: [
      'strawberry-horizontal', 'blueberry-vertical', 'raspberry-cross', 'blackberry-x', 'cloudberry-all',
      'bomb', 'rainbow', 'freeze', 'magnet', 'x2',
      'plus5', 'shuffle', 'hint', 'berry-drop', 'splash'
    ]
  },
  {
    type: 'slice',
    input: 'map-elements.png',
    rows: 4,
    cols: 5,
    outputDir: path.join(ROOT, 'public', 'assets', 'map'),
    names: [
      'node-locked', 'node-available', 'node-1star', 'node-2star', 'node-3star',
      'path-dotted', 'path-curved', 'path-footprints', 'bridge', 'path-thorns',
      'landmark-pillow-patch', 'landmark-frostberry', 'landmark-sunberry', 'landmark-bramble', 'landmark-moonberry',
      'deco-trees', 'deco-pond', 'deco-berry-bush', 'deco-cloud', 'deco-compass'
    ]
  },
  {
    type: 'slice',
    input: 'effects.png',
    rows: 1,
    cols: 5,
    outputDir: path.join(ROOT, 'public', 'assets', 'effects'),
    names: ['sparkle-star', 'sparkle-heart', 'sparkle-glow', 'sparkle-ring', 'sparkle-burst']
  },
  {
    type: 'copy',
    input: 'board-frame.png',
    output: path.join(ROOT, 'public', 'assets', 'board', 'board-frame.png')
  },
  {
    type: 'copy',
    input: 'title-bg.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'title-bg.png')
  },
  {
    type: 'copy',
    input: 'sunberry-meadow.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'sunberry-meadow.png')
  },
  {
    type: 'copy',
    input: 'frostberry-falls.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'frostberry-falls.png')
  },
  {
    type: 'copy',
    input: 'enchanted-forest.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'enchanted-forest.png')
  },
  {
    type: 'copy',
    input: 'cosmic-island.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'cosmic-island.png')
  },
  {
    type: 'copy',
    input: 'sunberry-desert.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'sunberry-desert.png')
  },
  {
    type: 'copy',
    input: 'world-map.png',
    output: path.join(ROOT, 'public', 'assets', 'backgrounds', 'world-map.png')
  }
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runSlice(config) {
  const inputPath = path.join(SHEETS_DIR, config.input);
  const exists = await pathExists(inputPath);
  if (!exists) {
    console.log(`[skip] Missing sheet: ${path.relative(ROOT, inputPath)}`);
    return;
  }

  await fs.mkdir(config.outputDir, { recursive: true });

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    console.log(`[skip] Invalid image metadata: ${path.relative(ROOT, inputPath)}`);
    return;
  }

  const tileWidth = Math.floor(metadata.width / config.cols);
  const tileHeight = Math.floor(metadata.height / config.rows);

  if (tileWidth === 0 || tileHeight === 0) {
    console.log(`[skip] Sheet too small for grid: ${path.relative(ROOT, inputPath)}`);
    return;
  }

  console.log(`[slice] ${path.relative(ROOT, inputPath)} -> ${path.relative(ROOT, config.outputDir)}`);

  let written = 0;
  await Promise.all(
    config.names.map(async (name, index) => {
      const row = Math.floor(index / config.cols);
      const col = index % config.cols;
      if (row >= config.rows) {
        return;
      }

      const left = col * tileWidth;
      const top = row * tileHeight;
      const outputPath = path.join(config.outputDir, `${name}.png`);

      await sharp(inputPath)
        .extract({ left, top, width: tileWidth, height: tileHeight })
        .png()
        .toFile(outputPath);

      written += 1;
    })
  );

  console.log(`  [done] wrote ${written} sprite(s)`);
}

async function runCopy(config) {
  const inputPath = path.join(SHEETS_DIR, config.input);
  const exists = await pathExists(inputPath);
  if (!exists) {
    console.log(`[skip] Missing sheet: ${path.relative(ROOT, inputPath)}`);
    return;
  }

  await fs.mkdir(path.dirname(config.output), { recursive: true });
  await fs.copyFile(inputPath, config.output);

  console.log(`[copy] ${path.relative(ROOT, inputPath)} -> ${path.relative(ROOT, config.output)}`);
}

async function main() {
  console.log('[slice-sprites] Starting sprite sheet processing...');

  for (const config of configs) {
    if (config.type === 'slice') {
      await runSlice(config);
    } else {
      await runCopy(config);
    }
  }

  console.log('[slice-sprites] Complete.');
}

main().catch((error) => {
  console.error('[slice-sprites] Failed:', error);
  process.exit(1);
});
