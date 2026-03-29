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

  if (level >= 11 && level <= 20) add('ice', level <= 15 ? 1 : 2, 3 + Math.floor((level - 11) / 3));
  if (level >= 21 && level <= 30) {
    add('ice', 2, 5);
    add('chain', 1 + Math.floor((level - 21) / 5), 2 + Math.floor((level - 21) / 4));
  }
  if (level >= 31 && level <= 40) {
    add('ice', 2, 6);
    add('chain', 2, 5);
    add('honey', 2, 3);
    add('stone', 999, 2);
  }
  if (level >= 41) {
    add('ice', 3, 8);
    add('chain', 2, 6);
    add('stone', 999, 4);
    add('honey', 2, 4);
    add('chocolate', 2, 3);
    add('bubble', 1, 2);
  }

  const uniq = new Map<string, ObstacleConfig>();
  list.forEach((o) => uniq.set(`${o.row}-${o.col}`, o));
  return [...uniq.values()];
}

export const LEVELS: LevelObjective[] = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  const obstacles = patternedObstacleSet(level);

  const objectiveTargets: LevelObjective['objectiveTargets'] = {};
  const iceCount = obstacles.filter((o) => o.type === 'ice').length;
  const chainCount = obstacles.filter((o) => o.type === 'chain').length;
  if (iceCount) objectiveTargets.ice = iceCount;
  if (chainCount) objectiveTargets.chain = chainCount;

  let moves = 26;
  let targetScore = 2800 + level * 450;
  if (level <= 10) {
    moves = 30 - Math.floor(level / 3);
    targetScore = 2200 + level * 330;
  } else if (level <= 30) {
    moves = 26 - Math.floor((level - 11) / 3);
    targetScore = 4200 + level * 500;
  } else {
    moves = 20 - Math.floor((level - 31) / 5);
    targetScore = 8200 + level * 620;
  }

  return {
    id: level,
    moves: Math.max(16, moves),
    targetScore,
    blockers: {
      iceChance: 0,
      chainChance: 0,
    },
    obstacles,
    objectiveTargets,
  };
});
