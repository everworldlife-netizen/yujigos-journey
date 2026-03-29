import { ObstacleConfig, ObstacleType } from '../objects/Obstacle';

export type ObstacleObjective = 'ice' | 'chain';

export type LevelObjective = {
  id: number;
  moves: number;
  targetScore: number;
  blockers: {
    iceChance: number;
    chainChance: number;
  };
  obstacles: ObstacleConfig[];
  objectiveTargets: Partial<Record<ObstacleObjective, number>>;
};

const baseCells = [
  { row: 2, col: 2 },
  { row: 2, col: 4 },
  { row: 3, col: 3 },
  { row: 4, col: 2 },
  { row: 4, col: 4 },
  { row: 5, col: 3 },
  { row: 1, col: 3 },
  { row: 6, col: 3 },
  { row: 3, col: 1 },
  { row: 3, col: 5 },
  { row: 5, col: 1 },
  { row: 5, col: 5 },
  { row: 0, col: 0 },
  { row: 0, col: 6 },
  { row: 8, col: 0 },
  { row: 8, col: 6 },
];

function patternedObstacleSet(level: number): ObstacleConfig[] {
  const cells = baseCells.slice(0, Math.min(baseCells.length, 3 + Math.floor(level / 4)));
  const list: ObstacleConfig[] = [];

  const add = (type: ObstacleType, hp: number, count: number) => {
    cells.slice(0, count).forEach(({ row, col }, idx) => {
      list.push({ row: (row + idx) % 9, col, type, hp });
    });
  };

  if (level >= 6 && level <= 10) add('ice', 1, 4);
  if (level >= 11 && level <= 15) {
    add('ice', 2, 5);
    add('chain', 1, 3);
  }
  if (level >= 16 && level <= 20) {
    add('ice', 2, 5);
    add('chain', 2, 4);
    add('stone', 999, 3);
  }
  if (level >= 21 && level <= 30) {
    add('ice', 2, 5);
    add('chain', 2, 4);
    add('stone', 999, 3);
    add('honey', 2, 3);
    add('chocolate', 2, 2);
  }
  if (level >= 31 && level <= 40) {
    add('ice', 3, 6);
    add('chain', 2, 5);
    add('stone', 999, 3);
    add('honey', 2, 4);
    add('chocolate', 2, 3);
    add('bubble', 1, 3);
  }
  if (level >= 41) {
    add('ice', 3, 8);
    add('chain', 2, 6);
    add('stone', 999, 6);
    add('honey', 2, 5);
    add('chocolate', 2, 5);
    add('bubble', 1, 4);
    add('void', 3, 2);
  }

  const uniq = new Map<string, ObstacleConfig>();
  list.forEach((o) => uniq.set(`${o.row}-${o.col}`, o));
  return [...uniq.values()];
}

export const LEVELS: LevelObjective[] = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  const difficulty = Math.floor(i / 10);
  const obstacles = patternedObstacleSet(level);

  const objectiveTargets: LevelObjective['objectiveTargets'] = {};
  const iceCount = obstacles.filter((o) => o.type === 'ice').length;
  const chainCount = obstacles.filter((o) => o.type === 'chain').length;
  if (iceCount) objectiveTargets.ice = iceCount;
  if (chainCount) objectiveTargets.chain = chainCount;

  return {
    id: level,
    moves: Math.max(18, 30 - Math.floor(level / 4)),
    targetScore: 3500 + level * 600 + difficulty * 1200,
    blockers: {
      iceChance: 0,
      chainChance: 0,
    },
    obstacles,
    objectiveTargets,
  };
});
