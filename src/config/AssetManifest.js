const mk = (key, path, width = 96, height = 96) => ({ key, path, width, height });

const BERRY_TYPES = ['strawberry', 'blueberry', 'raspberry', 'pink_raspberry', 'blackberry', 'golden_berry', 'moon_berry', 'ice_berry'];
const TILE_STATES = ['normal', 'happy', 'matched', 'frozen'];

const tileStateAssets = BERRY_TYPES.reduce((acc, berry) => {
  acc[berry] = TILE_STATES.reduce((stateAcc, state) => {
    stateAcc[state] = mk(`tile_${berry}_${state}`, `assets/tiles/${berry}_${state}.png`, 96, 96);
    return stateAcc;
  }, {});
  return acc;
}, {});

const specialTiles = {
  rainbow: mk('special_rainbow', 'assets/tiles/special_rainbow.png'),
  bow: mk('special_bow', 'assets/tiles/special_bow.png'),
  swirl: mk('special_swirl', 'assets/tiles/special_swirl.png'),
  star: mk('special_star', 'assets/tiles/special_star.png'),
  heart: mk('special_heart', 'assets/tiles/special_heart.png'),
  bomb: mk('special_bomb', 'assets/tiles/special_bomb.png')
};

const backgrounds = {
  titleBg: mk('bg_title', 'assets/backgrounds/title-bg.png', 1280, 720),
  sunberryMeadow: mk('bg_sunberry_meadow', 'assets/backgrounds/sunberry-meadow.png', 1280, 720),
  frostberryFalls: mk('bg_frostberry_falls', 'assets/backgrounds/frostberry-falls.png', 1280, 720),
  enchantedForest: mk('bg_enchanted_forest', 'assets/backgrounds/enchanted-forest.png', 1280, 720),
  cosmicIsland: mk('bg_cosmic_island', 'assets/backgrounds/cosmic-island.png', 1280, 720),
  sunberryDesert: mk('bg_sunberry_desert', 'assets/backgrounds/sunberry-desert.png', 1280, 720),
  worldMap: mk('bg_world_map', 'assets/backgrounds/world-map.png', 1280, 720)
};

const uiNames = [
  'btn-play', 'btn-pause', 'btn-settings', 'btn-back', 'btn-shop', 'btn-collection', 'display-score', 'display-moves',
  'display-stars', 'display-level', 'display-coins', 'display-berry-goal', 'star-empty', 'star-bronze', 'star-silver', 'star-gold',
  'progress-bar', 'progress-bar-full', 'banner-victory', 'banner-defeat', 'dialog-box', 'btn-close', 'btn-confirm', 'btn-info'
];

const ui = uiNames.reduce((acc, name) => {
  const key = `ui_${name.replace(/-/g, '_')}`;
  acc[name] = mk(key, `assets/ui/${name}.png`, 256, 96);
  return acc;
}, {});

const yujigoPoses = [
  'idle', 'whistle', 'sad', 'cry', 'cheer-left', 'cheer-right', 'point', 'present', 'nervous', 'pray',
  'side', 'determined', 'wave-left', 'berry-hold', 'celebrate', 'surprised', 'berry-magic', 'bow', 'berry-pick', 'icon'
];
const mochiPoses = [
  'idle', 'hearts', 'surprised', 'sleep', 'walk', 'dance', 'curious', 'pray', 'sit', 'happy',
  'sad', 'run', 'look', 'smile', 'worry', 'dash', 'wink', 'berry-eat', 'bush-hide', 'mini', 'with-yujigo'
];

const characters = {
  yujigo: yujigoPoses.reduce((acc, pose) => {
    acc[pose] = mk(`char_yujigo_${pose.replace(/-/g, '_')}`, `assets/characters/yujigo/${pose}.png`, 512, 512);
    return acc;
  }, {}),
  mochi: mochiPoses.reduce((acc, pose) => {
    acc[pose] = mk(`char_mochi_${pose.replace(/-/g, '_')}`, `assets/characters/mochi/${pose}.png`, 384, 384);
    return acc;
  }, {}),
  npcs: ['hedgehog', 'fox', 'hummingbird', 'porcupine', 'butterfly', 'bunny'].reduce((acc, npc) => {
    acc[npc] = {
      idle: mk(`char_${npc}_idle`, `assets/characters/npcs/${npc}_idle.png`, 256, 256),
      action: mk(`char_${npc}_action`, `assets/characters/npcs/${npc}_action.png`, 256, 256),
      special: mk(`char_${npc}_special`, `assets/characters/npcs/${npc}_special.png`, 256, 256)
    };
    return acc;
  }, {})
};

const powerups = [
  'strawberry-horizontal', 'blueberry-vertical', 'raspberry-cross', 'blackberry-x', 'cloudberry-all', 'bomb', 'rainbow', 'freeze',
  'magnet', 'x2', 'plus5', 'shuffle', 'hint', 'berry-drop', 'splash'
].reduce((acc, name) => {
  acc[name] = mk(`powerup_${name.replace(/-/g, '_')}`, `assets/powerups/${name}.png`);
  return acc;
}, {});

const obstacles = [
  'ice-block-full', 'ice-block-cracked', 'ice-block-shattered', 'vine-left', 'vine-right', 'mossy-rock', 'dark-cloud', 'honey-drip',
  'cage', 'rubble', 'spider', 'bubble'
].reduce((acc, name) => {
  acc[name] = mk(`obstacle_${name.replace(/-/g, '_')}`, `assets/obstacles/${name}.png`);
  return acc;
}, {});

const map = [
  'node-locked', 'node-available', 'node-1star', 'node-2star', 'node-3star', 'path-dotted', 'path-curved', 'path-footprints', 'bridge',
  'path-thorns', 'landmark-pillow-patch', 'landmark-frostberry', 'landmark-sunberry', 'landmark-bramble', 'landmark-moonberry',
  'deco-trees', 'deco-pond', 'deco-berry-bush', 'deco-cloud', 'deco-compass'
].reduce((acc, name) => {
  acc[name] = mk(`map_${name.replace(/-/g, '_')}`, `assets/map/${name}.png`);
  return acc;
}, {});

const effects = ['sparkle-star', 'sparkle-heart', 'sparkle-glow', 'sparkle-ring', 'sparkle-burst'].reduce((acc, name) => {
  acc[name] = mk(`fx_${name.replace(/-/g, '_')}`, `assets/effects/${name}.png`, 64, 64);
  return acc;
}, {});

export const ASSET_MANIFEST = {
  tiles: tileStateAssets,
  specialTiles,
  board: {
    frame: mk('board_frame', 'assets/board/board-frame.png', 560, 560),
    background: mk('board_background', 'assets/board/board-background.png', 520, 520)
  },
  backgrounds,
  ui,
  characters,
  powerups,
  obstacles,
  map,
  effects
};

const flattenEntries = (group, value, path = []) => {
  if (!value || typeof value !== 'object') return [];
  if ('key' in value && 'path' in value) return [{ group, name: path.join('.'), ...value }];
  return Object.entries(value).flatMap(([k, v]) => flattenEntries(group, v, [...path, k]));
};

export const ASSET_ENTRIES = Object.entries(ASSET_MANIFEST).flatMap(([group, entry]) => flattenEntries(group, entry));
