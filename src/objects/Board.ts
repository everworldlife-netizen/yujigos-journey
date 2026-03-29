import Phaser from 'phaser';
import { ANIM, BOARD_COLS, BOARD_ROWS, BOARD_X, BOARD_Y, BERRY_TYPES, SCORE, TILE_SIZE } from '../config/gameConfig';
import { LevelObjective } from '../config/LevelConfig';
import { AnimationManager } from '../managers/AnimationManager';
import { AudioManager } from '../managers/AudioManager';
import { ParticleManager } from '../managers/ParticleManager';
import { Obstacle, ObstacleType } from './Obstacle';
import { SpecialTile } from './SpecialTile';
import { SpecialType, Tile } from './Tile';

type Match = { cells: { row: number; col: number }[]; special?: { row: number; col: number; type: SpecialType } };

type ObstacleStats = Record<'ice' | 'chain', { total: number; cleared: number }>;

export class Board {
  grid: (Tile | null)[][] = [];
  obstacles: (Obstacle | null)[][] = [];
  selected: Tile | null = null;
  private selectionRing: Phaser.GameObjects.Arc | null = null;
  busy = false;
  private audioManager = new AudioManager();

  constructor(
    private scene: Phaser.Scene,
    private anim: AnimationManager,
    private particles: ParticleManager,
    private onScore: (points: number, x: number, y: number, combo: number, colorHex: string) => void,
    private onMove: () => void,
    private levelConfig: LevelObjective,
    private onObstacleUpdate: (stats: ObstacleStats) => void,
  ) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      this.grid[r] = Array(BOARD_COLS).fill(null);
      this.obstacles[r] = Array(BOARD_COLS).fill(null);
    }
  }

  build(): void {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        this.spawnTile(r, c, true, this.generateNonMatchingType(r, c));
      }
    }

    this.levelConfig.obstacles.forEach((cfg) => {
      if (cfg.row < 0 || cfg.row >= BOARD_ROWS || cfg.col < 0 || cfg.col >= BOARD_COLS) return;
      const o = new Obstacle(this.scene, this.toX(cfg.col), this.toY(cfg.row), cfg);
      this.obstacles[cfg.row][cfg.col] = o;
      if (cfg.type === 'stone') {
        this.grid[cfg.row][cfg.col]?.sprite.setAlpha(0);
      }
    });

    this.pushObstacleStats();
    if (!this.hasPossibleMoves()) {
      this.reshuffleBoard();
    }
  }

  private generateNonMatchingType(row: number, col: number): number {
    const blocked = new Set<number>();
    const leftA = this.grid[row]?.[col - 1];
    const leftB = this.grid[row]?.[col - 2];
    if (leftA && leftB && leftA.data.type === leftB.data.type) blocked.add(leftA.data.type);

    const upA = this.grid[row - 1]?.[col];
    const upB = this.grid[row - 2]?.[col];
    if (upA && upB && upA.data.type === upB.data.type) blocked.add(upA.data.type);

    const candidates = Array.from({ length: BERRY_TYPES }, (_, i) => i).filter((type) => !blocked.has(type));
    if (!candidates.length) return Phaser.Math.Between(0, BERRY_TYPES - 1);
    return candidates[Phaser.Math.Between(0, candidates.length - 1)];
  }

  private spawnTile(row: number, col: number, init = false, forcedType?: number): void {
    const type = forcedType ?? Phaser.Math.Between(0, BERRY_TYPES - 1);
    const t = new Tile(this.scene, this.toX(col), this.toY(row) - (init ? 220 : 0), {
      type,
      row,
      col,
      special: SpecialType.None,
      blockerIce: 0,
      blockerChain: false,
    });
    this.grid[row][col] = t;
    t.sprite.on('pointerdown', () => this.trySelect(t));
    t.sprite.setScale(init ? 0 : 1);
    if (init) t.sprite.setAngle(Phaser.Math.Between(-14, 14));
    this.anim.bounceSpawn(t.sprite, col * 36 + row * 12);
    this.scene.tweens.add({
      targets: t.sprite,
      y: this.toY(row),
      angle: 0,
      duration: ANIM.SPAWN_MS + (init ? row * 24 : 0),
      ease: 'Cubic.Out',
      delay: col * 30,
      onComplete: () => {
        this.anim.landingSquash(t.sprite);
        this.particles.landingDust(t.sprite.x, t.sprite.y);
      },
    });
  }

  private toX(col: number): number { return BOARD_X + col * TILE_SIZE + TILE_SIZE / 2; }
  private toY(row: number): number { return BOARD_Y + row * TILE_SIZE + TILE_SIZE / 2; }

  private areAdjacent(a: Tile, b: Tile): boolean {
    return Math.abs(a.data.row - b.data.row) + Math.abs(a.data.col - b.data.col) === 1;
  }

  private isChainLocked(row: number, col: number): boolean {
    const o = this.obstacles[row][col];
    return o?.obstacleType === 'chain';
  }

  private isStoneCell(row: number, col: number): boolean {
    return this.obstacles[row][col]?.obstacleType === 'stone';
  }

  private trySelect(tile: Tile): void {
    if (this.busy) return;
    this.spawnBoardRipple(tile.sprite.x, tile.sprite.y);
    if (!this.selected) {
      this.selected = tile;
      this.selectionRing?.destroy();
      this.selectionRing = this.scene.add.circle(tile.sprite.x, tile.sprite.y, 44, 0xffffff, 0).setStrokeStyle(4, 0xfff4ab, 0.9);
      this.scene.tweens.add({ targets: tile.sprite, scale: { from: 1, to: 1.08 }, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.easeInOut' });
      this.scene.tweens.add({ targets: this.selectionRing, scale: { from: 0.94, to: 1.12 }, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });
      this.shimmerAdjacents(tile);
      return;
    }
    this.scene.tweens.killTweensOf(this.selected.sprite);
    this.selected.sprite.setScale(1);
    this.selectionRing?.destroy();
    this.selectionRing = null;
    const first = this.selected;
    this.selected = null;
    if (first === tile) return;
    if (!this.areAdjacent(first, tile)) return;
    if (this.isChainLocked(first.data.row, first.data.col) || this.isChainLocked(tile.data.row, tile.data.col)) return;
    void this.swapAndResolve(first, tile, true);
  }

  private swapRefs(a: Tile, b: Tile): void {
    const ar = a.data.row, ac = a.data.col, br = b.data.row, bc = b.data.col;
    this.grid[ar][ac] = b;
    this.grid[br][bc] = a;
    a.setGridPosition(br, bc);
    b.setGridPosition(ar, ac);
  }

  private async swapAndResolve(a: Tile, b: Tile, consumeMove: boolean): Promise<void> {
    this.busy = true;
    this.swapRefs(a, b);
    await Promise.all([
      this.anim.smoothSwap(a.sprite, this.toX(a.data.col), this.toY(a.data.row)),
      this.anim.smoothSwap(b.sprite, this.toX(b.data.col), this.toY(b.data.row)),
    ]);

    const specialHandled = await this.handleSpecialSwap(a, b);
    const matches = this.findMatches();
    if (!specialHandled && !matches.length) {
      this.audioManager.swapFail();
      this.particles.boardShake(0.0018, 100);
      this.swapRefs(a, b);
      await Promise.all([
        this.anim.smoothSwap(a.sprite, this.toX(a.data.col), this.toY(a.data.row), true),
        this.anim.smoothSwap(b.sprite, this.toX(b.data.col), this.toY(b.data.row), true),
      ]);
      this.busy = false;
      return;
    }

    if (consumeMove) this.onMove();
    if (!specialHandled) await this.resolveCascadeLoop();
    await this.spreadHoneyAndChocolate();
    this.pushObstacleStats();
    if (!this.hasPossibleMoves()) {
      this.audioManager.levelFail();
      await this.reshuffleBoard();
    }
    this.busy = false;
  }

  private findMatches(): Match[] {
    const marks = new Set<string>();
    const matches: Match[] = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      let streak = 1;
      for (let c = 1; c <= BOARD_COLS; c++) {
        const prev = this.grid[r][c - 1];
        const curr = c < BOARD_COLS ? this.grid[r][c] : null;
        if (prev && curr && prev.data.type === curr.data.type) streak++;
        else {
          if (streak >= 3 && prev) {
            const cells = Array.from({ length: streak }, (_, i) => ({ row: r, col: c - 1 - i }));
            cells.forEach((k) => marks.add(`${k.row}-${k.col}`));
            matches.push({ cells, special: streak >= 5 ? { ...cells[2], type: SpecialType.Rainbow } : streak === 4 ? { ...cells[1], type: Math.random() > 0.5 ? SpecialType.StripedRow : SpecialType.StripedCol } : undefined });
          }
          streak = 1;
        }
      }
    }

    for (let c = 0; c < BOARD_COLS; c++) {
      let streak = 1;
      for (let r = 1; r <= BOARD_ROWS; r++) {
        const prev = this.grid[r - 1]?.[c];
        const curr = r < BOARD_ROWS ? this.grid[r][c] : null;
        if (prev && curr && prev.data.type === curr.data.type) streak++;
        else {
          if (streak >= 3 && prev) {
            const cells = Array.from({ length: streak }, (_, i) => ({ row: r - 1 - i, col: c }));
            const overlap = cells.find((k) => marks.has(`${k.row}-${k.col}`));
            matches.push({
              cells,
              special: overlap && streak >= 3 ? { row: overlap.row, col: overlap.col, type: SpecialType.Bomb } : (streak >= 5 ? { ...cells[2], type: SpecialType.Rainbow } : streak === 4 ? { ...cells[1], type: Math.random() > 0.5 ? SpecialType.StripedRow : SpecialType.StripedCol } : undefined),
            });
          }
          streak = 1;
        }
      }
    }

    return matches;
  }

  private async resolveCascadeLoop(): Promise<void> {
    let combo = 1;
    while (true) {
      const matches = this.findMatches();
      if (!matches.length) break;
      await this.resolveCascade(matches, combo);
      combo += 1;
    }
  }

  private async resolveCascade(matches: Match[], combo: number): Promise<void> {
    if (combo > 1) {
      this.audioManager.cascade(combo);
      this.anim.comboPopup(combo, 360, 330);
      this.anim.screenPulse(0xffef9d, Math.min(0.08 + combo * 0.03, 0.24), 180);
      this.particles.boardShake(0.0018 + combo * 0.0008, 120 + combo * 40);
    }

    const clearSet = new Set<string>();
    const specialsToCreate: Array<{ row: number; col: number; type: SpecialType }> = [];
    matches.forEach((m) => {
      m.cells.forEach((c) => clearSet.add(`${c.row}-${c.col}`));
      if (m.special) specialsToCreate.push(m.special);
    });
    this.expandSpecialClears(clearSet);

    const obstacleHits = new Set<string>();
    const clears: Promise<void>[] = [];
    let clearIndex = 0;
    for (const key of clearSet) {
      const [r, c] = key.split('-').map(Number);
      const tile = this.grid[r][c];
      if (!tile) continue;

      const color = tile.getTintColor();
      this.particles.burst(tile.sprite.x, tile.sprite.y, color);
      clears.push(tile.playMatchReaction(this.scene).then(() => this.anim.clear(tile.sprite, clearIndex * 50)).then(() => tile.sprite.destroy()));
      this.grid[r][c] = null;
      this.onScore(SCORE.BASE_CLEAR * combo, this.toX(c), this.toY(r), combo, Phaser.Display.Color.IntegerToColor(color).rgba);
      clearIndex++;

      for (let rr = r - 1; rr <= r + 1; rr++) {
        for (let cc = c - 1; cc <= c + 1; cc++) {
          if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS || (rr === r && cc === c)) continue;
          obstacleHits.add(`${rr}-${cc}`);
        }
      }
    }

    await Promise.all(clears);
    await this.damageObstacles(obstacleHits);

    specialsToCreate.forEach((s) => {
      const host = this.grid[s.row][s.col];
      if (host) {
        host.data.special = s.type;
        host.refreshSpecialVisual(this.scene);
        this.particles.sparkle(host.sprite.x, host.sprite.y);
        this.animateSpecialCreation(host, s.type);
        SpecialTile.style(host, this.scene);
      }
    });

    await this.collapse();
  }

  private async handleSpecialSwap(a: Tile, b: Tile): Promise<boolean> {
    if (a.data.special === SpecialType.None && b.data.special === SpecialType.None) return false;

    const clearSet = new Set<string>();
    const addRowCol = (row: number, col: number) => {
      for (let rr = row - 1; rr <= row + 1; rr++) {
        for (let cc = col - 1; cc <= col + 1; cc++) {
          if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) continue;
          clearSet.add(`${rr}-${cc}`);
        }
      }
    };

    if (a.data.special !== SpecialType.None && b.data.special !== SpecialType.None) {
      if (a.data.special === SpecialType.Bomb && b.data.special === SpecialType.Bomb) {
        for (let rr = a.data.row - 2; rr <= a.data.row + 2; rr++) {
          for (let cc = a.data.col - 2; cc <= a.data.col + 2; cc++) {
            if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) continue;
            clearSet.add(`${rr}-${cc}`);
          }
        }
        this.particles.boardShake(0.008, 280);
      } else {
        for (let r = 0; r < BOARD_ROWS; r++) {
          for (let c = 0; c < BOARD_COLS; c++) clearSet.add(`${r}-${c}`);
        }
      }
    } else {
      const special = a.data.special !== SpecialType.None ? a : b;
      const normal = special === a ? b : a;
      if (special.data.special === SpecialType.Rainbow) {
        for (let r = 0; r < BOARD_ROWS; r++) {
          for (let c = 0; c < BOARD_COLS; c++) {
            const probe = this.grid[r][c];
            if (probe?.data.type === normal.data.type) clearSet.add(`${r}-${c}`);
          }
        }
        this.audioManager.powerRainbow();
      } else if (special.data.special === SpecialType.Bomb) {
        addRowCol(normal.data.row, normal.data.col);
        this.audioManager.powerBomb();
      } else if (special.data.special === SpecialType.StripedRow) {
        for (let c = 0; c < BOARD_COLS; c++) clearSet.add(`${normal.data.row}-${c}`);
        this.audioManager.powerStripe();
      } else if (special.data.special === SpecialType.StripedCol) {
        for (let r = 0; r < BOARD_ROWS; r++) clearSet.add(`${r}-${normal.data.col}`);
        this.audioManager.powerStripe();
      }
    }

    if (!clearSet.size) return false;

    a.data.special = SpecialType.None;
    b.data.special = SpecialType.None;
    a.refreshSpecialVisual(this.scene);
    b.refreshSpecialVisual(this.scene);

    const fakeMatch: Match = { cells: Array.from(clearSet).map((key) => {
      const [row, col] = key.split('-').map(Number);
      return { row, col };
    }) };
    await this.resolveCascade([fakeMatch], 1);
    await this.resolveCascadeLoop();
    return true;
  }

  hasPossibleMoves(): boolean {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const tile = this.grid[r][c];
        if (!tile || this.isStoneCell(r, c)) continue;
        const dirs = [[0, 1], [1, 0]];
        for (const [dr, dc] of dirs) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= BOARD_ROWS || cc >= BOARD_COLS || this.isStoneCell(rr, cc)) continue;
          const other = this.grid[rr][cc];
          if (!other) continue;
          this.swapRefs(tile, other);
          const hasMatch = this.findMatches().length > 0;
          this.swapRefs(tile, other);
          if (hasMatch) return true;
        }
      }
    }
    return false;
  }

  async reshuffleBoard(): Promise<void> {
    const tiles: Tile[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (this.isStoneCell(r, c)) continue;
        const tile = this.grid[r][c];
        if (tile) tiles.push(tile);
      }
    }

    do {
      Phaser.Utils.Array.Shuffle(tiles);
      let idx = 0;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (this.isStoneCell(r, c)) continue;
          const tile = tiles[idx++];
          this.grid[r][c] = tile;
          tile.setGridPosition(r, c);
          tile.data.special = SpecialType.None;
          tile.refreshSpecialVisual(this.scene);
        }
      }
    } while (this.findMatches().length > 0 || !this.hasPossibleMoves());

    await Promise.all(tiles.map((tile) => this.anim.smoothSwap(tile.sprite, this.toX(tile.data.col), this.toY(tile.data.row))));
  }

  private async damageObstacles(hitSet: Set<string>): Promise<void> {
    const actions: Promise<void>[] = [];
    hitSet.forEach((key) => {
      const [r, c] = key.split('-').map(Number);
      const obstacle = this.obstacles[r][c];
      if (!obstacle || obstacle.obstacleType === 'stone') return;

      actions.push((async () => {
        const shouldDestroy = await obstacle.damage(this.scene, 1);
        if (shouldDestroy) {
          this.audioManager.obstacleBreak();
          await obstacle.destroyAnimated(this.scene);
          this.obstacles[r][c] = null;
        }
      })());
    });
    await Promise.all(actions);
  }

  private async spreadHoneyAndChocolate(): Promise<void> {
    const add: Array<{ row: number; col: number; type: ObstacleType; hp: number }> = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const o = this.obstacles[r][c];
        if (o?.obstacleType === 'honey') {
          const down = this.grid[r + 1]?.[c];
          if (down?.sprite.active) {
            this.scene.tweens.add({ targets: down.sprite, duration: 120, x: down.sprite.x + 3, yoyo: true, repeat: 1 });
          }
        }
        if (o?.obstacleType === 'chocolate') {
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dr, dc] of dirs) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) continue;
            if (!this.obstacles[rr][cc] && !this.isStoneCell(rr, cc)) {
              add.push({ row: rr, col: cc, type: 'chocolate', hp: 1 });
              break;
            }
          }
        }
      }
    }

    add.forEach((cfg) => {
      if (this.obstacles[cfg.row][cfg.col]) return;
      const o = new Obstacle(this.scene, this.toX(cfg.col), this.toY(cfg.row), cfg);
      o.setScale(0.1);
      this.scene.tweens.add({ targets: o, scale: 1, duration: 180, ease: 'Back.Out' });
      this.obstacles[cfg.row][cfg.col] = o;
    });
  }

  private async collapse(): Promise<void> {
    const tweens: Promise<void>[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      let pointer = BOARD_ROWS - 1;
      for (let r = BOARD_ROWS - 1; r >= 0; r--) {
        if (this.isStoneCell(r, c)) {
          pointer = r - 1;
          continue;
        }

        const tile = this.grid[r][c];
        if (!tile) continue;
        while (pointer >= 0 && this.isStoneCell(pointer, c)) pointer--;
        if (pointer < 0) break;

        if (r !== pointer) {
          const fallDistance = pointer - r;
          this.grid[pointer][c] = tile;
          this.grid[r][c] = null;
          tile.setGridPosition(pointer, c);
          tweens.push(new Promise((resolve) => {
            this.scene.tweens.add({
              targets: tile.sprite,
              y: this.toY(pointer),
              duration: ANIM.FALL_MS + c * 10 + fallDistance * 34,
              ease: 'Cubic.Out',
              delay: c * ANIM.CASCADE_DELAY_MS,
              onComplete: () => {
                this.anim.landingSquash(tile.sprite);
                this.particles.landingDust(tile.sprite.x, tile.sprite.y);
                resolve();
              },
            });
          }));
        }
        pointer--;
      }
      for (let r = pointer; r >= 0; r--) {
        if (this.isStoneCell(r, c)) continue;
        this.spawnTile(r, c, false, this.generateNonMatchingType(r, c));
      }
    }
    await Promise.all(tweens);
  }

  private spawnBoardRipple(x: number, y: number): void {
    const ripple = this.scene.add.circle(x, y, 12, 0xffffff, 0.18);
    this.scene.tweens.add({
      targets: ripple,
      scale: 2.4,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => ripple.destroy(),
    });
  }

  private expandSpecialClears(clearSet: Set<string>): void {
    Array.from(clearSet).forEach((key) => {
      const [r, c] = key.split('-').map(Number);
      const tile = this.grid[r][c];
      if (!tile || tile.data.special === SpecialType.None) return;
      if (tile.data.special === SpecialType.StripedRow) {
        this.audioManager.powerStripe();
        this.anim.screenPulse(0xc5ecff, 0.16, 140);
        for (let cc = 0; cc < BOARD_COLS; cc++) {
          clearSet.add(`${r}-${cc}`);
          this.scene.time.delayedCall(cc * 30, () => this.particles.lightning(tile.sprite.x, tile.sprite.y, this.toX(cc), this.toY(r)));
        }
      } else if (tile.data.special === SpecialType.StripedCol) {
        this.audioManager.powerStripe();
        this.anim.screenPulse(0xc5ecff, 0.16, 140);
        for (let rr = 0; rr < BOARD_ROWS; rr++) {
          clearSet.add(`${rr}-${c}`);
          this.scene.time.delayedCall(rr * 30, () => this.particles.lightning(tile.sprite.x, tile.sprite.y, this.toX(c), this.toY(rr)));
        }
      } else if (tile.data.special === SpecialType.Rainbow) {
        this.audioManager.powerRainbow();
        this.anim.screenPulse(0xff8de9, 0.2, 220);
        this.particles.sparkle(tile.sprite.x, tile.sprite.y, 42, 1100);
        const targetType = Phaser.Math.Between(0, BERRY_TYPES - 1);
        for (let rr = 0; rr < BOARD_ROWS; rr++) {
          for (let cc = 0; cc < BOARD_COLS; cc++) {
            const probe = this.grid[rr][cc];
            if (probe?.data.type === targetType) {
              clearSet.add(`${rr}-${cc}`);
              this.scene.tweens.add({ targets: probe.sprite, y: probe.sprite.y - 18, angle: 24, duration: 200, yoyo: true });
            }
          }
        }
      } else if (tile.data.special === SpecialType.Bomb) {
        this.audioManager.powerBomb();
        this.anim.screenPulse(0xffcf8a, 0.18, 160);
        this.particles.boardShake(0.0032, 180);
        for (let rr = r - 1; rr <= r + 1; rr++) {
          for (let cc = c - 1; cc <= c + 1; cc++) {
            if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) continue;
            clearSet.add(`${rr}-${cc}`);
          }
        }
      }
    });
  }

  private animateSpecialCreation(tile: Tile, specialType: SpecialType): void {
    if (specialType === SpecialType.StripedRow || specialType === SpecialType.StripedCol) {
      this.anim.screenPulse(0xd9f2ff, 0.12, 90);
      this.particles.lightning(tile.sprite.x - 64, tile.sprite.y, tile.sprite.x + 64, tile.sprite.y);
      return;
    }
    if (specialType === SpecialType.Rainbow) {
      const ring = this.scene.add.circle(tile.sprite.x, tile.sprite.y, 12, 0xffffff, 0).setStrokeStyle(6, 0xff7cff, 0.95);
      this.scene.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 360, onComplete: () => ring.destroy() });
      this.anim.screenPulse(0xf6a5ff, 0.15, 130);
      return;
    }
    if (specialType === SpecialType.Bomb) {
      const aura = this.scene.add.circle(tile.sprite.x, tile.sprite.y, 48, 0xffb24e, 0.2);
      this.scene.tweens.add({ targets: aura, scale: 1.6, alpha: 0, duration: 420, onComplete: () => aura.destroy() });
      this.scene.tweens.add({ targets: tile.sprite, scale: { from: 1, to: 1.14 }, yoyo: true, repeat: 1, duration: 130 });
    }
  }

  private shimmerAdjacents(tile: Tile): void {
    const { row, col } = tile.data;
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    neighbors.forEach(([r, c]) => {
      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return;
      const n = this.grid[r][c];
      if (!n) return;
      const glow = this.scene.add.circle(n.sprite.x, n.sprite.y, 18, 0xffffff, 0.26);
      this.scene.tweens.add({ targets: glow, scale: 2, alpha: 0, duration: 260, onComplete: () => glow.destroy() });
    });
  }

  private pushObstacleStats(): void {
    const stats: ObstacleStats = {
      ice: { total: this.levelConfig.objectiveTargets.ice ?? 0, cleared: 0 },
      chain: { total: this.levelConfig.objectiveTargets.chain ?? 0, cleared: 0 },
    };

    const currentIce = this.obstacles.flat().filter((o) => o?.obstacleType === 'ice').length;
    const currentChain = this.obstacles.flat().filter((o) => o?.obstacleType === 'chain').length;

    stats.ice.cleared = Math.max(0, stats.ice.total - currentIce);
    stats.chain.cleared = Math.max(0, stats.chain.total - currentChain);

    this.onObstacleUpdate(stats);
  }

  destroy(): void {
    this.selectionRing?.destroy();
    this.grid.flat().forEach((tile) => {
      tile?.sprite.removeAllListeners();
      tile?.sprite.destroy();
    });
    this.obstacles.flat().forEach((obstacle) => obstacle?.destroy());
    this.grid = [];
    this.obstacles = [];
  }
}
