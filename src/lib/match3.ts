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
    this.gemTypes = Math.min(5, level.gemTypes);
    this.grid = this.createBoard();
    this.ensureNoInitialMatches();

    let regenerationAttempts = 0;
    let validMoves = this.findValidMoves();
    while (validMoves.length === 0 && regenerationAttempts < 50) {
      regenerationAttempts += 1;
      this.grid = this.createBoard();
      this.ensureNoInitialMatches();
      validMoves = this.findValidMoves();
    }
    console.log(`[match3] valid moves on board creation: ${validMoves.length}`);
  }

  private randomType(): number {
    return Math.floor(Math.random() * this.gemTypes);
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

  private ensureNoInitialMatches(): void {
    let matches = this.findMatches();
    let safety = 0;
    while (matches.length > 0 && safety < 200) {
      const rerollSet = new Set(matches.flatMap((m) => m.cells));
      for (const cell of rerollSet) {
        let nextType = this.randomType();
        let guard = 0;
        while (nextType === cell.gemType && guard < 20) {
          nextType = this.randomType();
          guard += 1;
        }
        cell.gemType = nextType;
        cell.special = 'none';
      }
      matches = this.findMatches();
      safety += 1;
    }
  }

  logBoard(label: string): void {
    console.log(`[match3] ${label}`);
    for (let row = 0; row < this.rows; row += 1) {
      console.log(`r${row}: ${this.grid[row].map((cell) => cell.gemType).join(' ')}`);
    }
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

  swapByPosition(aRow: number, aCol: number, bRow: number, bCol: number): { a: GemCell; b: GemCell } {
    const a = this.grid[aRow][aCol];
    const b = this.grid[bRow][bCol];
    this.swap(a, b);
    return { a: this.grid[aRow][aCol], b: this.grid[bRow][bCol] };
  }

  findMatches(): MatchGroup[] {
    const types = this.grid.map((row) => row.map((cell) => cell.gemType));
    const matched = new Set<string>();

    for (let row = 0; row < this.rows; row += 1) {
      let start = 0;
      while (start < this.cols) {
        const type = types[row][start];
        let end = start + 1;
        while (end < this.cols && types[row][end] === type) end += 1;
        if (end - start >= 3) {
          for (let col = start; col < end; col += 1) matched.add(`${row},${col}`);
        }
        start = end;
      }
    }

    for (let col = 0; col < this.cols; col += 1) {
      let start = 0;
      while (start < this.rows) {
        const type = types[start][col];
        let end = start + 1;
        while (end < this.rows && types[end][col] === type) end += 1;
        if (end - start >= 3) {
          for (let row = start; row < end; row += 1) matched.add(`${row},${col}`);
        }
        start = end;
      }
    }

    if (matched.size === 0) return [];

    const merged: GemCell[][] = [];
    const seen = new Set<string>();
    for (const key of matched) {
      if (seen.has(key)) continue;
      const queue = [key];
      const component: GemCell[] = [];

      while (queue.length > 0) {
        const current = queue.pop()!;
        if (seen.has(current)) continue;
        seen.add(current);
        const [row, col] = current.split(',').map(Number);
        component.push(this.grid[row][col]);
        const neighbors = [
          `${row - 1},${col}`,
          `${row + 1},${col}`,
          `${row},${col - 1}`,
          `${row},${col + 1}`,
        ];
        for (const neighbor of neighbors) if (matched.has(neighbor) && !seen.has(neighbor)) queue.push(neighbor);
      }

      merged.push(component);
    }

    const results = merged.map((cells) => {
      const rows = new Set(cells.map((c) => c.row));
      const cols = new Set(cells.map((c) => c.col));
      const orientation: MatchGroup['orientation'] = rows.size > 1 && cols.size > 1 ? 'mixed' : rows.size === 1 ? 'h' : 'v';
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
    return results;
  }

  findValidMoves(): Array<{ a: { row: number; col: number }; b: { row: number; col: number } }> {
    const validMoves: Array<{ a: { row: number; col: number }; b: { row: number; col: number } }> = [];
    const types = this.grid.map((row) => row.map((cell) => cell.gemType));
    const directions = [[0, 1], [1, 0]] as const;

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const first = this.grid[row][col];
        if (!this.canMove(first)) continue;
        for (const [dRow, dCol] of directions) {
          const target = this.getCell(row + dRow, col + dCol);
          if (!target || !this.canMove(target)) continue;

          const targetRow = target.row;
          const targetCol = target.col;
          [types[row][col], types[targetRow][targetCol]] = [types[targetRow][targetCol], types[row][col]];
          const hasMatch = this.hasAnyMatch(types);
          [types[row][col], types[targetRow][targetCol]] = [types[targetRow][targetCol], types[row][col]];

          if (hasMatch) {
            validMoves.push({
              a: { row, col },
              b: { row: targetRow, col: targetCol },
            });
          }
        }
      }
    }

    return validMoves;
  }

  private hasAnyMatch(types: number[][]): boolean {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col <= this.cols - 3; col += 1) {
        const value = types[row][col];
        if (types[row][col + 1] === value && types[row][col + 2] === value) return true;
      }
    }

    for (let col = 0; col < this.cols; col += 1) {
      for (let row = 0; row <= this.rows - 3; row += 1) {
        const value = types[row][col];
        if (types[row + 1][col] === value && types[row + 2][col] === value) return true;
      }
    }

    return false;
  }

  shuffleBoardUntilPlayable(maxAttempts = 250): number {
    let attempts = 0;
    let validMoves = this.findValidMoves();
    while (validMoves.length === 0 && attempts < maxAttempts) {
      this.shuffleMovableCells();
      this.ensureNoInitialMatches();
      validMoves = this.findValidMoves();
      attempts += 1;
    }
    console.log(`[match3] board shuffled ${attempts} time(s), valid moves: ${validMoves.length}`);
    return validMoves.length;
  }

  private shuffleMovableCells(): void {
    const movable = this.grid.flat().filter((cell) => this.canMove(cell));
    const payload = movable.map((cell) => ({ gemType: cell.gemType, special: cell.special }));
    Phaser.Utils.Array.Shuffle(payload);
    movable.forEach((cell, idx) => {
      cell.gemType = payload[idx].gemType;
      cell.special = payload[idx].special;
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
