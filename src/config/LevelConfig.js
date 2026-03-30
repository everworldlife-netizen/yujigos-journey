export const LEVELS = [
  {
    level: 1,
    targetScore: 1000,
    maxMoves: 20,
    gridRows: 8,
    gridCols: 8,
    tileTypes: 6
    // EXTENSION: Add level-specific goals, blockers, tile restrictions here
  }
];

export function getLevelConfig(level = 1) {
  return LEVELS.find((entry) => entry.level === level) ?? LEVELS[0];
}
