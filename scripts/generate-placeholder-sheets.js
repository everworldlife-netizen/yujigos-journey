const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SHEETS_DIR = path.join(ROOT, 'public', 'assets', 'sheets');
const TILE = 128;

const berryNames = ['strawberry', 'blueberry', 'raspberry', 'pink_raspberry', 'blackberry', 'golden_berry', 'moon_berry', 'ice_berry'];
const berryStates = ['normal', 'happy', 'matched', 'frozen'];

const yujigoPoses = [
  'idle', 'whistle', 'sad', 'cry',
  'cheer-left', 'cheer-right', 'point', 'present',
  'nervous', 'pray', 'side', 'determined',
  'wave-left', 'berry-hold', 'celebrate', 'surprised',
  'berry-magic', 'bow', 'berry-pick', 'icon'
];

const mochiPoses = [
  'idle', 'hearts', 'surprised', 'sleep',
  'walk', 'dance', 'curious', 'pray',
  'sit', 'happy', 'sad', 'run',
  'look', 'smile', 'worry', 'dash',
  'wink', 'berry-eat', 'bush-hide', 'mini',
  'with-yujigo'
];

const npcCols = ['hedgehog', 'fox', 'hummingbird', 'porcupine', 'butterfly', 'bunny'];
const npcRows = ['idle', 'action', 'special'];

const uiLabels = [
  'PLAY', 'PAUSE', 'SET', 'BACK', 'SHOP', 'BOOK',
  'SCORE', 'MOVES', 'STARS', 'LEVEL', 'COINS', 'GOAL',
  'STAR0', 'STAR1', 'STAR2', 'STAR3', 'PROG', 'FULL',
  'WIN', 'LOSE', 'DIALOG', 'CLOSE', 'OK', 'INFO'
];

const powerupLabels = [
  'H-LINE', 'V-LINE', 'CROSS', 'X', 'ALL',
  'BOMB', 'RAINBOW', 'FREEZE', 'MAGNET', 'X2',
  '+5', 'SHUFFLE', 'HINT', 'DROP', 'SPLASH'
];

const mapLabels = [
  'LOCK', 'OPEN', '1 STAR', '2 STAR', '3 STAR',
  'DOT', 'CURVE', 'STEPS', 'BRIDGE', 'THORNS',
  'PILLOW', 'FROST', 'SUN', 'BRAMBLE', 'MOON',
  'TREES', 'POND', 'BUSH', 'CLOUD', 'COMPASS'
];

const effectLabels = ['SPARK', 'HEART', 'GLOW', 'RING', 'BURST'];

function escapeXml(text) {
  return text.replace(/[<>&"']/g, (ch) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
    return map[ch] ?? ch;
  });
}

function svgTile({ bg = '#202030', shape = '', label = '', labelSize = 16, overlay = '' }) {
  const safeLabel = escapeXml(label);
  return Buffer.from(`
    <svg width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${TILE}" height="${TILE}" fill="${bg}"/>
      <rect x="0" y="0" width="${TILE}" height="${TILE}" fill="url(#bgGrad)"/>
      ${shape}
      ${overlay}
      <rect x="8" y="102" width="112" height="18" rx="9" fill="rgba(0,0,0,0.35)"/>
      <text x="64" y="116" text-anchor="middle" font-family="Arial" font-size="${labelSize}" font-weight="700" fill="#ffffff">${safeLabel}</text>
    </svg>
  `);
}

function starPath(cx, cy, outer, inner, points = 5) {
  const parts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    parts.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return parts.join(' ');
}

async function writeSheet(fileName, cols, rows, renderCell) {
  const width = cols * TILE;
  const height = rows * TILE;
  const composites = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const buffer = renderCell(row, col);
      if (!buffer) continue;
      composites.push({ input: buffer, top: row * TILE, left: col * TILE });
    }
  }

  const image = sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  });

  await image.composite(composites).png().toFile(path.join(SHEETS_DIR, fileName));
  console.log(`[generate] ${fileName}`);
}

function berryShape(color, state, berry) {
  const core = `<circle cx="64" cy="58" r="38" fill="${color}" stroke="rgba(255,255,255,0.8)" stroke-width="4"/>`;
  const eyes = `<circle cx="50" cy="52" r="4" fill="#ffffff"/><circle cx="78" cy="52" r="4" fill="#ffffff"/>`;
  const smile = `<path d="M46 70 Q64 84 82 70" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const star = `<polygon points="${starPath(64, 62, 18, 8, 5)}" fill="#ffffff" opacity="0.92"/>`;
  const snow = `
    <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.95">
      <line x1="64" y1="42" x2="64" y2="82"/>
      <line x1="44" y1="62" x2="84" y2="62"/>
      <line x1="50" y1="48" x2="78" y2="76"/>
      <line x1="78" y1="48" x2="50" y2="76"/>
    </g>`;
  const decorations = {
    normal: '',
    happy: `${eyes}${smile}`,
    matched: star,
    frozen: snow
  };
  return svgTile({ bg: '#1a223f', shape: `${core}${decorations[state] ?? ''}`, label: `${berry}\n${state}`, labelSize: 12 });
}

function makeCharacterTile(color, label, variant) {
  const bodyBase = `<circle cx="64" cy="52" r="22" fill="${color}"/><rect x="40" y="72" width="48" height="26" rx="10" fill="${color}"/>`;
  const poseVariants = [
    '<line x1="44" y1="82" x2="24" y2="70" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>',
    '<line x1="84" y1="82" x2="104" y2="70" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>',
    '<line x1="46" y1="78" x2="28" y2="90" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>',
    '<line x1="82" y1="78" x2="100" y2="90" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>',
    '<line x1="44" y1="84" x2="40" y2="104" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><line x1="84" y1="84" x2="88" y2="104" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>'
  ];

  return svgTile({
    bg: '#2e2a4f',
    shape: `${bodyBase}${poseVariants[variant % poseVariants.length]}`,
    overlay: '<circle cx="56" cy="48" r="3" fill="#ffffff"/><circle cx="72" cy="48" r="3" fill="#ffffff"/>',
    label,
    labelSize: 12
  });
}

async function generateSheets() {
  await fs.mkdir(SHEETS_DIR, { recursive: true });

  const berryColors = {
    strawberry: '#FF3344', blueberry: '#4488FF', raspberry: '#FF44AA', pink_raspberry: '#FF88CC',
    blackberry: '#6622AA', golden_berry: '#FFD700', moon_berry: '#8888FF', ice_berry: '#88EEFF'
  };

  await writeSheet('berry-tiles.png', 8, 5, (row, col) => {
    if (row < 4) {
      const berry = berryNames[col];
      const state = berryStates[row];
      return berryShape(berryColors[berry], state, berry);
    }

    const specials = [
      svgTile({
        bg: '#2c2347',
        shape: '<defs><radialGradient id="rg" cx="50%" cy="50%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#ff00ff"/></radialGradient></defs><circle cx="64" cy="58" r="38" fill="url(#rg)"/>',
        label: 'rainbow'
      }),
      svgTile({ bg: '#2c2347', shape: '<polygon points="64,20 98,58 64,96 30,58" fill="#5ad8ff" stroke="#fff" stroke-width="4"/>', label: 'bow' }),
      svgTile({ bg: '#2c2347', shape: '<path d="M64 26 C96 26 96 58 64 58 C42 58 42 78 64 78 C78 78 80 66 72 62" fill="none" stroke="#ffd96f" stroke-width="8" stroke-linecap="round"/>', label: 'swirl' }),
      svgTile({ bg: '#2c2347', shape: `<polygon points="${starPath(64, 58, 36, 16, 5)}" fill="#ffd700" stroke="#fff" stroke-width="3"/>`, label: 'star' }),
      svgTile({ bg: '#2c2347', shape: '<path d="M64 92 C24 64 24 34 46 34 C58 34 64 44 64 44 C64 44 70 34 82 34 C104 34 104 64 64 92 Z" fill="#ff5f8a" stroke="#fff" stroke-width="3"/>', label: 'heart' }),
      svgTile({ bg: '#2c2347', shape: '<circle cx="64" cy="58" r="34" fill="#3a3a3a" stroke="#fff" stroke-width="4"/><line x1="42" y1="36" x2="86" y2="80" stroke="#ff5252" stroke-width="6"/><line x1="86" y1="36" x2="42" y2="80" stroke="#ff5252" stroke-width="6"/>', label: 'bomb' })
    ];
    return specials[col] ?? null;
  });

  await writeSheet('yujigo-poses.png', 4, 5, (row, col) => {
    const index = row * 4 + col;
    return makeCharacterTile('#FF6B9D', yujigoPoses[index], index);
  });

  await writeSheet('mochi-poses.png', 4, 6, (row, col) => {
    const index = row * 4 + col;
    if (index >= mochiPoses.length) return null;
    return makeCharacterTile('#AADDFF', mochiPoses[index], index + 2);
  });

  const npcPalette = ['#7AC943', '#FF914D', '#66D9EF', '#A06CD5', '#FF66C4', '#FFD166'];
  await writeSheet('npc-sprites.png', 6, 3, (row, col) => {
    const name = `${npcCols[col]} ${npcRows[row]}`;
    const rowShape = [
      '<circle cx="64" cy="58" r="28" fill="rgba(255,255,255,0.35)"/>',
      '<rect x="36" y="32" width="56" height="52" rx="14" fill="rgba(255,255,255,0.35)"/>',
      `<polygon points="${starPath(64, 58, 30, 13, 6)}" fill="rgba(255,255,255,0.35)"/>`
    ][row];
    return svgTile({ bg: '#203044', shape: `<circle cx="64" cy="58" r="36" fill="${npcPalette[col]}"/>${rowShape}`, label: name, labelSize: 11 });
  });

  const uiPalette = ['#4466CC', '#4466CC', '#4466CC', '#4466CC', '#4466CC', '#4466CC', '#223355', '#223355', '#223355', '#223355', '#223355', '#223355', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#44BB44', '#44BB44', '#884422', '#884422', '#FFFFFF', '#4466CC', '#4466CC', '#4466CC'];
  await writeSheet('ui-elements.png', 6, 4, (row, col) => {
    const index = row * 6 + col;
    const color = uiPalette[index];
    return svgTile({
      bg: '#152036',
      shape: `<rect x="18" y="24" width="92" height="70" rx="14" fill="${color}" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>`,
      label: uiLabels[index],
      labelSize: 14
    });
  });

  const powerupPalette = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#F15BB5', '#00BBF9', '#9B5DE5', '#00F5D4', '#FEE440', '#FF924C', '#B8F2E6', '#C77DFF', '#4CC9F0', '#FB5607'];
  await writeSheet('powerups.png', 5, 3, (row, col) => {
    const index = row * 5 + col;
    return svgTile({
      bg: '#2a243f',
      shape: `<circle cx="64" cy="56" r="34" fill="${powerupPalette[index]}" stroke="#fff" stroke-width="4"/>`,
      label: powerupLabels[index],
      labelSize: 13
    });
  });

  await writeSheet('map-elements.png', 5, 4, (row, col) => {
    const index = row * 5 + col;
    const shapes = [
      '<circle cx="64" cy="56" r="32" fill="#7aa36a"/>',
      '<rect x="34" y="28" width="60" height="56" rx="12" fill="#a2b78f"/>',
      '<polygon points="64,22 98,56 64,90 30,56" fill="#8fb6c8"/>',
      `<polygon points="${starPath(64, 56, 34, 15, 5)}" fill="#f7d56b"/>`
    ];
    return svgTile({ bg: '#223028', shape: shapes[index % shapes.length], label: mapLabels[index], labelSize: 12 });
  });

  const effectPalette = ['#FFEA00', '#FF4D8D', '#7DF9FF', '#C77DFF', '#FFFFFF'];
  await writeSheet('effects.png', 5, 1, (row, col) => svgTile({
    bg: '#100f1d',
    shape: `<polygon points="${starPath(64, 56, 34, 10, 8)}" fill="${effectPalette[col]}" opacity="0.95"/>`,
    label: effectLabels[col],
    labelSize: 13
  }));

  const backgroundDefs = [
    ['board-frame.png', 512, 512, ['#5f3b1f', '#a36a3c']],
    ['title-bg.png', 540, 960, ['#2b1046', '#4f1f86']],
    ['sunberry-meadow.png', 540, 960, ['#cde76a', '#4fa85f']],
    ['frostberry-falls.png', 540, 960, ['#8ed8ff', '#3f7ccd']],
    ['enchanted-forest.png', 540, 960, ['#0f3f24', '#1f6b3e']],
    ['cosmic-island.png', 540, 960, ['#120d3a', '#29408f']],
    ['sunberry-desert.png', 540, 960, ['#ffd17d', '#d78f4a']],
    ['world-map.png', 540, 960, ['#d8bf8b', '#b99b63']]
  ];

  await Promise.all(backgroundDefs.map(async ([name, width, height, colors]) => {
    let image = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png();

    const gradient = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${colors[0]}"/>
            <stop offset="100%" stop-color="${colors[1]}"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
      </svg>
    `);

    image = image.composite([{ input: gradient, top: 0, left: 0 }]);

    if (name === 'cosmic-island.png') {
      const stars = Array.from({ length: 80 }, () => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        r: 1 + Math.random() * 2
      }));
      const starsSvg = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          ${stars.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r.toFixed(2)}" fill="rgba(255,255,255,0.65)"/>`).join('')}
        </svg>
      `);
      image = image.composite([{ input: starsSvg, top: 0, left: 0 }]);
    }

    await image.toFile(path.join(SHEETS_DIR, name));
    console.log(`[generate] ${name}`);
  }));
}

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { cwd: ROOT, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script failed with exit code ${code}: ${scriptPath}`));
    });
  });
}

async function verifyOutputs() {
  const required = [
    'assets/tiles/strawberry_normal.png',
    'assets/tiles/ice_berry_frozen.png',
    'assets/tiles/special_bomb.png',
    'assets/characters/yujigo/idle.png',
    'assets/characters/mochi/with-yujigo.png',
    'assets/characters/npcs/bunny_special.png',
    'assets/ui/btn-play.png',
    'assets/powerups/rainbow.png',
    'assets/map/node-3star.png',
    'assets/effects/sparkle-burst.png',
    'assets/board/board-frame.png',
    'assets/backgrounds/title-bg.png',
    'assets/backgrounds/world-map.png'
  ].map((rel) => path.join(ROOT, 'public', rel));

  const missing = [];
  await Promise.all(required.map(async (filePath) => {
    try {
      await fs.access(filePath);
    } catch {
      missing.push(path.relative(ROOT, filePath));
    }
  }));

  if (missing.length) {
    throw new Error(`Missing expected output files:\n${missing.join('\n')}`);
  }

  console.log(`[verify] ${required.length} output files verified`);
}

async function main() {
  await generateSheets();
  await runNodeScript(path.join(ROOT, 'scripts', 'slice-sprites.js'));
  await verifyOutputs();
}

main().catch((error) => {
  console.error('[generate-placeholder-sheets] Failed:', error);
  process.exit(1);
});
