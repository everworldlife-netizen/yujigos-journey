export type LevelObjective = {
  id: number;
  moves: number;
  targetScore: number;
  blockers: {
    iceChance: number;
    chainChance: number;
  };
};

export const LEVELS: LevelObjective[] = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  const difficulty = Math.floor(i / 10);
  return {
    id: level,
    moves: Math.max(18, 30 - Math.floor(level / 4)),
    targetScore: 3500 + level * 600 + difficulty * 1200,
    blockers: {
      iceChance: Math.min(0.24, 0.04 + level * 0.004),
      chainChance: Math.min(0.18, 0.03 + level * 0.003),
    },
  };
});
