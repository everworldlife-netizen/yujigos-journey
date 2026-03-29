import Phaser from 'phaser';
import { ANIM, BOARD_COLS, BOARD_ROWS, BOARD_X, BOARD_Y, BERRY_TYPES, SCORE, TILE_SIZE } from '../config/gameConfig';
import { AnimationManager } from '../managers/AnimationManager';
import { ParticleManager } from '../managers/ParticleManager';
import { SpecialTile } from './SpecialTile';
import { SpecialType, Tile } from './Tile';

type Match = { cells: { row: number; col: number }[]; special?: { row: number; col: number; type: SpecialType } };

export class Board {
  grid: (Tile | null)[][] = [];
  selected: Tile | null = null;
  busy = false;

  constructor(
    private scene: Phaser.Scene,
    private anim: AnimationManager,
    private particles: ParticleManager,
    private onScore: (points: number, x: number, y: number, combo: number) => void,
    private onMove: () => void,
    private blockerConfig: { iceChance: number; chainChance: number },
  ) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      this.grid[r] = Array(BOARD_COLS).fill(null);
    }
  }

  build(): void {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        this.spawnTile(r, c, true);
      }
    }
  }

  private spawnTile(row: number, col: number, init = false): void {
    const type = Phaser.Math.Between(0, BERRY_TYPES - 1);
    const t = new Tile(this.scene, this.toX(col), this.toY(row) - (init ? 220 : 0), {
      type,
      row,
      col,
      special: SpecialType.None,
      blockerIce: Math.random() < this.blockerConfig.iceChance ? Phaser.Math.Between(1, 2) : 0,
      blockerChain: Math.random() < this.blockerConfig.chainChance,
    });
    this.grid[row][col] = t;
    t.sprite.on('pointerdown', () => this.trySelect(t));
    t.sprite.setScale(init ? 0 : 1);
    this.anim.bounceSpawn(t.sprite, col * 36 + row * 12);
    this.scene.tweens.add({ targets: t.sprite, y: this.toY(row), duration: ANIM.SPAWN_MS, ease: 'Back.easeOut', delay: col * 30 });
  }

  private toX(col: number): number { return BOARD_X + col * TILE_SIZE + TILE_SIZE / 2; }
  private toY(row: number): number { return BOARD_Y + row * TILE_SIZE + TILE_SIZE / 2; }

  private areAdjacent(a: Tile, b: Tile): boolean {
    return Math.abs(a.data.row - b.data.row) + Math.abs(a.data.col - b.data.col) === 1;
  }

  private trySelect(tile: Tile): void {
    if (this.busy) return;
    if (!this.selected) {
      this.selected = tile;
      this.scene.tweens.add({ targets: tile.sprite, scale: { from: 1, to: 1.15 }, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.easeInOut' });
      return;
    }
    this.scene.tweens.killTweensOf(this.selected.sprite);
    this.selected.sprite.setScale(1);
    const first = this.selected;
    this.selected = null;
    if (first === tile) return;
    if (!this.areAdjacent(first, tile)) return;
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

    if (this.triggerSpecialCombo(a, b)) {
      if (consumeMove) this.onMove();
      await this.collapse();
      await this.resolveCascade(1);
      this.busy = false;
      return;
    }

    const matches = this.findMatches();
    if (!matches.length) {
      this.swapRefs(a, b);
      await Promise.all([
        this.anim.smoothSwap(a.sprite, this.toX(a.data.col), this.toY(a.data.row)),
        this.anim.smoothSwap(b.sprite, this.toX(b.data.col), this.toY(b.data.row)),
      ]);
      this.busy = false;
      return;
    }

    if (consumeMove) this.onMove();
    await this.resolveCascade(1);
    this.busy = false;
  }

  private triggerSpecialCombo(a: Tile, b: Tile): boolean {
    if (a.data.special === SpecialType.None && b.data.special === SpecialType.None) return false;

    const blast: Array<{ row: number; col: number }> = [];
    if (a.data.special === SpecialType.StripedRow && b.data.special === SpecialType.StripedCol ||
      a.data.special === SpecialType.StripedCol && b.data.special === SpecialType.StripedRow) {
      for (let c = 0; c < BOARD_COLS; c++) blast.push({ row: a.data.row, col: c });
      for (let r = 0; r < BOARD_ROWS; r++) blast.push({ row: r, col: a.data.col });
    } else if (
      [a.data.special, b.data.special].includes(SpecialType.StripedRow) &&
      [a.data.special, b.data.special].includes(SpecialType.Bomb)
    ) {
      for (let r = Math.max(0, a.data.row - 1); r <= Math.min(BOARD_ROWS - 1, a.data.row + 1); r++) {
        for (let c = 0; c < BOARD_COLS; c++) blast.push({ row: r, col: c });
      }
    } else if (a.data.special === SpecialType.Rainbow || b.data.special === SpecialType.Rainbow) {
      const targetType = a.data.special === SpecialType.Rainbow ? b.data.type : a.data.type;
      for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) {
        if (this.grid[r][c]?.data.type === targetType) blast.push({ row: r, col: c });
      }
    } else {
      return false;
    }

    const uniq = new Set(blast.map((b) => `${b.row}-${b.col}`));
    uniq.forEach((key) => {
      const [r, c] = key.split('-').map(Number);
      const tile = this.grid[r][c];
      if (!tile) return;
      const color = tile.getTintColor();
      this.particles.burst(tile.sprite.x, tile.sprite.y, color);
      if (tile.data.special === SpecialType.Bomb) this.particles.boardShake(0.005, 260);
      void this.anim.clear(tile.sprite).then(() => tile.sprite.destroy());
      this.onScore(SCORE.BASE_CLEAR * 2, this.toX(c), this.toY(r), 2);
      this.grid[r][c] = null;
    });

    a.data.special = SpecialType.None;
    b.data.special = SpecialType.None;
    return true;
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

  private async resolveCascade(combo: number): Promise<void> {
    const matches = this.findMatches();
    if (!matches.length) return;

    const clearSet = new Set<string>();
    const specialsToCreate: Array<{ row: number; col: number; type: SpecialType }> = [];
    matches.forEach((m) => {
      m.cells.forEach((c) => clearSet.add(`${c.row}-${c.col}`));
      if (m.special) specialsToCreate.push(m.special);
    });

    const clears: Promise<void>[] = [];
    for (const key of clearSet) {
      const [r, c] = key.split('-').map(Number);
      const tile = this.grid[r][c];
      if (!tile) continue;
      if (tile.data.blockerChain) { tile.data.blockerChain = false; tile.redrawBlockers(this.scene); continue; }
      if (tile.data.blockerIce > 0) { tile.data.blockerIce--; tile.redrawBlockers(this.scene); continue; }

      const color = tile.getTintColor();
      this.particles.burst(tile.sprite.x, tile.sprite.y, color);
      if (tile.data.special === SpecialType.Bomb) this.particles.ember(tile.sprite.x, tile.sprite.y);
      clears.push(tile.playMatchReaction(this.scene).then(() => this.anim.clear(tile.sprite)).then(() => tile.sprite.destroy()));
      this.grid[r][c] = null;
      this.onScore(SCORE.BASE_CLEAR * combo, this.toX(c), this.toY(r), combo);
    }

    await Promise.all(clears);

    if (clearSet.size >= 4) this.particles.boardShake(0.004 + Math.min(clearSet.size, 8) * 0.0002, 180 + clearSet.size * 20);
    if (combo > 1) this.anim.comboPopup(combo, this.scene.scale.width / 2, 240);

    specialsToCreate.forEach((s) => {
      const host = this.grid[s.row][s.col];
      if (host) {
        host.data.special = s.type;
        host.refreshSpecialVisual(this.scene);
        const flash = this.scene.add.rectangle(host.sprite.x, host.sprite.y, 82, 82, 0xffffff, 0.9);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
        this.particles.sparkle(host.sprite.x, host.sprite.y);
        SpecialTile.style(host, this.scene);
      }
    });

    await this.collapse();
    await this.resolveCascade(combo + 1);
  }

  private async collapse(): Promise<void> {
    const tweens: Promise<void>[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      let pointer = BOARD_ROWS - 1;
      for (let r = BOARD_ROWS - 1; r >= 0; r--) {
        const tile = this.grid[r][c];
        if (!tile) continue;
        if (r !== pointer) {
          this.grid[pointer][c] = tile;
          this.grid[r][c] = null;
          tile.setGridPosition(pointer, c);
          tweens.push(new Promise((resolve) => {
            this.scene.tweens.add({ targets: tile.sprite, y: this.toY(pointer), duration: ANIM.FALL_MS + c * 10, ease: 'Quad.easeIn', delay: c * ANIM.CASCADE_DELAY_MS, onComplete: () => {
              this.scene.tweens.add({ targets: tile.sprite, y: tile.sprite.y - 8, yoyo: true, duration: 140, ease: 'Bounce.easeOut', onComplete: () => resolve() });
            } });
          }));
        }
        pointer--;
      }
      for (let r = pointer; r >= 0; r--) {
        this.spawnTile(r, c);
      }
    }
    await Promise.all(tweens);
  }
}
