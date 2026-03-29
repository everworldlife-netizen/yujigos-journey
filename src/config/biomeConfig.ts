export type BiomeId = 'berry_meadow' | 'frostberry_falls' | 'sunberry_desert' | 'bramble_forest' | 'starberry_cosmos';

export const BIOME_BACKGROUND_KEYS: Record<BiomeId, string> = {
  berry_meadow: 'bg_berry_meadow',
  frostberry_falls: 'bg_frostberry_falls',
  sunberry_desert: 'bg_sunberry_desert',
  bramble_forest: 'bg_bramble_forest',
  starberry_cosmos: 'bg_starberry_cosmos',
};

const BIOME_ORDER: BiomeId[] = [
  'berry_meadow',
  'frostberry_falls',
  'sunberry_desert',
  'bramble_forest',
  'starberry_cosmos',
];

export function biomeForLevel(level: number): BiomeId {
  const idx = Math.max(0, Math.floor((Math.max(1, level) - 1) / 10));
  return BIOME_ORDER[Math.min(BIOME_ORDER.length - 1, idx)];
}
