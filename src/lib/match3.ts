import Phaser from 'phaser';
import type { LevelConfig, ObstacleType } from '../config/levels';

export type SpecialType = 'none' | 'lineH' | 'lineV' | 'bomb' | 'color';

export interface GemCell {
  row: number;
  col: number;
  gemType: number;
  special: SpecialType;
  obstacle: ObstacleType;
  obstacleHP: number;
}

export interface MatchGroup {
  cells: GemCell[];
  orientation: 'h' | 'v' | 'mixed';
  createsSpecial?: { row: number; col: number; special: SpecialType; gemType: number };
}

export interface ResolveStep {
  removed: GemCell[];
  drops: { fromRow: number; toRow: number; col: number; cell: GemCell }[];
  spawns: GemCell[];
  score: number;
  chain: number;
}

export class Match3 {
  readonly rows = 8;
  readonly cols = 8;
  grid: GemCell[][] = [];
  gemTypes: number;
  chain = 0;

  constructor(private level: LevelConfig, seed = Date.now()) {
    this.gemTypes = level.gemTypes;
    Phaser.Math.RND.sow([`${seed}`]);
    this.grid = this.createBoard();
  }

  private randomType(): number {
    return Phaser.Math.Between(0, this.gemTypes - 1);
  }

  private randomObstacle(): { obstacle: ObstacleType; hp: number } {
    if (Math.random() > this.level.obstacleDensity) return { obstacle: 'none', hp: 0 };
    const obstacle = Phaser.Utils.Array.GetRandom(this.level.obstaclePool);
    if (!obstacle || obstacle === 'none') return { obstacle: 'none', hp: 0 };
    if (obstacle === 'chain') return { obstacle, hp: 2 };
    return { obstacle, hp: 1 };
  }

  private createBoard(): GemCell[][] {
    const board: GemCell[][] = [];
    for (let row = 0; row < this.rows; row += 1) {
      board[row] = [];
      for (let col = 0; col < this.cols; col += 1) {
        let gemType = this.randomType();
        while (
          (col >= 2 && board[row][col - 1].gemType === gemType && board[row][col - 2].gemType === gemType) ||
          (row >= 2 && board[row - 1][col].gemType === gemType && board[row - 2][col].gemType === gemType)
        ) gemType = this.randomType();
        const obs = this.randomObstacle();
        board[row][col] = { row, col, gemType, special: 'none', obstacle: obs.obstacle, obstacleHP: obs.hp };
      }
    }
    return board;
  }

  getCell(row: number, col: number): GemCell | null {
    if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) return null;
    return this.grid[row][col];
  }

  canMove(cell: GemCell): boolean {
    return cell.obstacle !== 'stone' && cell.obstacle !== 'locked';
  }

  areAdjacent(a: GemCell, b: GemCell): boolean {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  swap(a: GemCell, b: GemCell): void {
    const ar = a.row;
    const ac = a.col;
    const br = b.row;
    const bc = b.col;
    const tmp = this.grid[ar][ac];
    this.grid[ar][ac] = this.grid[br][bc];
    this.grid[br][bc] = tmp;
    this.grid[ar][ac].row = ar;
    this.grid[ar][ac].col = ac;
    this.grid[br][bc].row = br;
    this.grid[br][bc].col = bc;
  }

  findMatches(): MatchGroup[] {
    const groups: GemCell[][] = [];

    for (let r = 0; r < this.rows; r += 1) {
      let count = 1;
      for (let c = 1; c <= this.cols; c += 1) {
        const prev = this.grid[r][c - 1];
        const cur = c < this.cols ? this.grid[r][c] : null;
        if (cur && cur.gemType === prev.gemType) count += 1;
        else {
          if (count >= 3) {
            const run: GemCell[] = [];
            for (let i = c - count; i < c; i += 1) run.push(this.grid[r][i]);
            groups.push(run);
          }
          count = 1;
        }
      }
    }

    for (let c = 0; c < this.cols; c += 1) {
      let count = 1;
      for (let r = 1; r <= this.rows; r += 1) {
        const prev = this.grid[r - 1][c];
        const cur = r < this.rows ? this.grid[r][c] : null;
        if (cur && cur.gemType === prev.gemType) count += 1;
        else {
          if (count >= 3) {
            const run: GemCell[] = [];
            for (let i = r - count; i < r; i += 1) run.push(this.grid[i][c]);
            groups.push(run);
          }
          count = 1;
        }
      }
    }

    if (groups.length === 0) return [];
    const merged: GemCell[][] = [];
    for (const g of groups) {
      const overlap = merged.find((m) => g.some((cell) => m.includes(cell)));
      if (overlap) for (const cell of g) if (!overlap.includes(cell)) overlap.push(cell);
      else merged.push([...g]);
    }

    return merged.map((cells) => {
      const rows = new Set(cells.map((c) => c.row));
      const cols = new Set(cells.map((c) => c.col));
      const orientation = rows.size > 1 && cols.size > 1 ? 'mixed' : rows.size === 1 ? 'h' : 'v';
      let createsSpecial: MatchGroup['createsSpecial'];
      if (orientation === 'mixed' && cells.length >= 5) {
        const anchor = cells[0];
        createsSpecial = { row: anchor.row, col: anchor.col, special: 'bomb', gemType: anchor.gemType };
      } else if (cells.length >= 5) {
        const anchor = cells[2];
        createsSpecial = { row: anchor.row, col: anchor.col, special: 'color', gemType: anchor.gemType };
      } else if (cells.length === 4) {
        const anchor = cells[1];
        createsSpecial = { row: anchor.row, col: anchor.col, special: orientation === 'h' ? 'lineH' : 'lineV', gemType: anchor.gemType };
      }
      return { cells, orientation, createsSpecial };
    });
  }

  private breakObstaclesAround(cells: GemCell[]): void {
    for (const cell of cells) {
      const neighbors = [
        this.getCell(cell.row - 1, cell.col),
        this.getCell(cell.row + 1, cell.col),
        this.getCell(cell.row, cell.col - 1),
        this.getCell(cell.row, cell.col + 1),
        cell,
      ].filter(Boolean) as GemCell[];

      for (const n of neighbors) {
        if (n.obstacle === 'ice' || n.obstacle === 'locked' || n.obstacle === 'chain') {
          n.obstacleHP -= 1;
          if (n.obstacleHP <= 0) {
            n.obstacle = 'none';
            n.obstacleHP = 0;
          }
        }
      }
    }
  }

  resolveCascade(initialMatches?: MatchGroup[]): ResolveStep[] {
    const steps: ResolveStep[] = [];
    let matches = initialMatches ?? this.findMatches();
    this.chain = 0;

    while (matches.length > 0) {
      this.chain += 1;
      const removeSet = new Set<GemCell>();
      for (const m of matches) for (const c of m.cells) removeSet.add(c);

      for (const m of matches) {
        if (m.createsSpecial) {
          const anchor = this.grid[m.createsSpecial.row][m.createsSpecial.col];
          anchor.special = m.createsSpecial.special;
          anchor.gemType = m.createsSpecial.gemType;
          removeSet.delete(anchor);
        }
      }

      const removed = [...removeSet];
      this.breakObstaclesAround(removed);

      const removedRefs = new Set(removed);
      const drops: ResolveStep['drops'] = [];
      const spawns: GemCell[] = [];

      for (let col = 0; col < this.cols; col += 1) {
        let writeRow = this.rows - 1;
        for (let readRow = this.rows - 1; readRow >= 0; readRow -= 1) {
          const cell = this.grid[readRow][col];
          if (cell.obstacle === 'stone') {
            writeRow = readRow - 1;
            continue;
          }
          if (removedRefs.has(cell)) continue;
          if (writeRow !== readRow) {
            this.grid[writeRow][col] = cell;
            drops.push({ fromRow: readRow, toRow: writeRow, col, cell });
            cell.row = writeRow;
            cell.col = col;
          }
          writeRow -= 1;
        }

        while (writeRow >= 0) {
          if (this.grid[writeRow][col].obstacle === 'stone') {
            writeRow -= 1;
            continue;
          }
          const newCell: GemCell = {
            row: writeRow,
            col,
            gemType: this.randomType(),
            special: 'none',
            obstacle: 'none',
            obstacleHP: 0,
          };
          this.grid[writeRow][col] = newCell;
          spawns.push(newCell);
          writeRow -= 1;
        }
      }

      const removedCount = removed.length;
      const score = Math.floor(removedCount * 100 * (1 + (this.chain - 1) * 0.4));
      steps.push({ removed, drops, spawns, score, chain: this.chain });
      matches = this.findMatches();
    }

    return steps;
  }
}
