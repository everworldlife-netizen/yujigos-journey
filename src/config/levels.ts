export type ObstacleType = 'none' | 'ice' | 'stone' | 'locked' | 'chain';

export interface LevelConfig {
  id: number;
  name: string;
  targetScore: number;
  moves: number;
  gemTypes: number;
  obstacleDensity: number;
  obstaclePool: ObstacleType[];
  stars: [number, number, number];
}

export const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Dawn Meadow', targetScore: 3500, moves: 26, gemTypes: 5, obstacleDensity: 0.03, obstaclePool: ['none'], stars: [2500, 3500, 5000] },
  { id: 2, name: 'Lunar Brook', targetScore: 5200, moves: 24, gemTypes: 5, obstacleDensity: 0.06, obstaclePool: ['ice'], stars: [3600, 5200, 7000] },
  { id: 3, name: 'Glitter Grove', targetScore: 7000, moves: 24, gemTypes: 5, obstacleDensity: 0.08, obstaclePool: ['ice', 'locked'], stars: [5000, 7000, 9000] },
  { id: 4, name: 'Quartz Pass', targetScore: 9000, moves: 22, gemTypes: 5, obstacleDensity: 0.1, obstaclePool: ['ice', 'stone'], stars: [6500, 9000, 12000] },
  { id: 5, name: 'Ruby Ruins', targetScore: 11000, moves: 22, gemTypes: 5, obstacleDensity: 0.13, obstaclePool: ['locked', 'chain'], stars: [8000, 11000, 14000] },
  { id: 6, name: 'Obsidian Vault', targetScore: 13500, moves: 20, gemTypes: 5, obstacleDensity: 0.15, obstaclePool: ['stone', 'chain'], stars: [10000, 13500, 17000] },
  { id: 7, name: 'Celestial Canopy', targetScore: 16000, moves: 20, gemTypes: 5, obstacleDensity: 0.16, obstaclePool: ['ice', 'locked', 'chain'], stars: [12000, 16000, 19500] },
  { id: 8, name: 'Eclipse Falls', targetScore: 19000, moves: 18, gemTypes: 5, obstacleDensity: 0.18, obstaclePool: ['stone', 'locked', 'chain'], stars: [14500, 19000, 23000] },
  { id: 9, name: 'Aurora Spire', targetScore: 22000, moves: 18, gemTypes: 5, obstacleDensity: 0.2, obstaclePool: ['ice', 'stone', 'locked', 'chain'], stars: [17000, 22000, 26000] },
  { id: 10, name: 'Crown of Yujigo', targetScore: 26000, moves: 17, gemTypes: 5, obstacleDensity: 0.24, obstaclePool: ['ice', 'stone', 'locked', 'chain'], stars: [20000, 26000, 31000] },
];
