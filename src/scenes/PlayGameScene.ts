import Phaser from 'phaser';
import { LEVELS, type LevelConfig } from '../config/levels';
import { Match3, type GemCell } from '../lib/match3';
import { ProceduralAudio } from '../audio/ProceduralAudio';

interface GemSprite {
  cell: GemCell;
  sprite: Phaser.GameObjects.Image;
  gemTypeLabel: Phaser.GameObjects.Text;
  overlay?: Phaser.GameObjects.Image;
}

export class PlayGameScene extends Phaser.Scene {
  private level!: LevelConfig;
  private model!: Match3;
  private audioFx = new ProceduralAudio();
  private tileSize = 76;
  private boardX = 80;
  private boardY = 140;
  private gems = new Map<string, GemSprite>();
  private selected: GemCell | null = null;
  private dragStart: GemCell | null = null;
  private resolving = false;
  private score = 0;
  private moves = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private starsText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private hintedCells: { a: GemCell; b: GemCell } | null = null;

  constructor() { super('PlayGame'); }

  init(data: { levelId?: number }): void {
    this.level = LEVELS[data.levelId ?? 0] ?? LEVELS[0];
  }

  create(): void {
    this.createBackground();
    this.model = new Match3(this.level);
    this.ensurePlayableBoard();
    this.moves = this.level.moves;
    this.createUI();
    this.renderBoard();
    this.input.on('pointerup', this.handlePointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerup', this.handlePointerUp, this);
    });
    this.audioFx.start();
  }

  private createBackground(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1f1034, 0x1f1034, 0x08172e, 0x08172e, 1);
    bg.fillRect(0, 0, width, height);

    const particles = this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: width }, y: { min: 0, max: height },
      lifespan: 4000, speedY: { min: -10, max: 20 }, speedX: { min: -5, max: 5 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.25, end: 0 }, quantity: 1, frequency: 100,
      tint: [0x7ceeff, 0xf5a7ff, 0xffefaf],
    });
    particles.setDepth(-1);
  }

  private createUI(): void {
    this.add.rectangle(400, 56, 760, 86, 0x120b20, 0.65).setStrokeStyle(2, 0xdab5ff, 0.7);
    this.add.text(36, 35, `Level ${this.level.id}: ${this.level.name}`, { fontSize: '26px', color: '#fff0ff' });
    this.scoreText = this.add.text(38, 72, 'Score: 0', { fontSize: '24px', color: '#b1fffe' });
    this.movesText = this.add.text(300, 72, `Moves: ${this.moves}`, { fontSize: '24px', color: '#ffe09c' });
    this.starsText = this.add.text(530, 72, '☆☆☆', { fontSize: '32px', color: '#ffe887' });
    this.hintText = this.add.text(620, 72, 'Hint', { fontSize: '24px', color: '#ffffff', backgroundColor: '#3b2d5a', padding: { x: 10, y: 6 } }).setInteractive({ useHandCursor: true });
    this.hintText.on('pointerdown', () => {
      if (this.resolving) return;
      this.showHint();
    });
    const back = this.add.text(700, 34, '← Levels', { fontSize: '20px', color: '#fff' }).setInteractive();
    back.on('pointerdown', () => this.scene.start('LevelSelect'));
  }

  private keyFor(cell: GemCell): string { return `${cell.row},${cell.col}`; }

  private pos(row: number, col: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.boardX + col * this.tileSize + this.tileSize / 2, this.boardY + row * this.tileSize + this.tileSize / 2);
  }

  private textureForCell(cell: GemCell): string {
    if (cell.special === 'none') return `gem-${cell.gemType}`;
    return `gem-${cell.gemType}-${cell.special}`;
  }

  private renderBoard(): void {
    this.add.rectangle(this.boardX + 4 * this.tileSize, this.boardY + 4 * this.tileSize, this.tileSize * 8 + 14, this.tileSize * 8 + 14, 0x090c1b, 0.4)
      .setStrokeStyle(3, 0x8ad4ff, 0.4);

    for (let r = 0; r < this.model.rows; r += 1) {
      for (let c = 0; c < this.model.cols; c += 1) this.createGemSprite(this.model.grid[r][c]);
    }
  }

  private createGemSprite(cell: GemCell): void {
    const p = this.pos(cell.row, cell.col);
    const sprite = this.add.image(p.x, p.y, this.textureForCell(cell)).setDisplaySize(62, 62).setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleGemPointerDown(pointer, cell));
    const gemTypeLabel = this.add.text(p.x - 28, p.y - 29, `${cell.gemType}`, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    const entry: GemSprite = { cell, sprite, gemTypeLabel };
    this.gems.set(this.keyFor(cell), entry);
    this.decorateObstacle(entry);
  }

  private decorateObstacle(entry: GemSprite): void {
    entry.overlay?.destroy();
    if (entry.cell.obstacle === 'none') return;
    const texture = entry.cell.obstacle === 'stone' ? 'stone' : 'ray';
    const overlay = this.add.image(entry.sprite.x, entry.sprite.y, texture).setDisplaySize(54, 54).setAlpha(0.65);
    if (entry.cell.obstacle === 'chain') overlay.setTint(0xb26bff);
    if (entry.cell.obstacle === 'locked') overlay.setTint(0xffce5d);
    if (entry.cell.obstacle === 'ice') overlay.setTint(0x8defff);
    entry.overlay = overlay;
  }

  private handleGemPointerDown(pointer: Phaser.Input.Pointer, spriteCell: GemCell): void {
    if (this.resolving) return;
    const pointerCell = this.cellFromWorld(pointer.worldX, pointer.worldY);
    const cell = pointerCell ?? spriteCell;
    console.log('gem clicked', { row: cell.row, col: cell.col, worldX: pointer.worldX, worldY: pointer.worldY });
    this.dragStart = cell;
    this.handleSelect(cell);
  }

  private handleSelect(cell: GemCell): void {
    if (this.resolving) return;
    this.clearHintHighlight();
    if (!this.selected) {
      this.setSelected(cell);
      return;
    }
    if (cell === this.selected) {
      this.setSelected(null);
      return;
    }
    if (!this.model.areAdjacent(this.selected, cell) || !this.model.canMove(this.selected) || !this.model.canMove(cell)) {
      this.audioFx.invalid();
      this.setSelected(cell);
      return;
    }
    const from = this.selected;
    this.setSelected(null);
    void this.trySwap(from, cell);
  }

  private setSelected(cell: GemCell | null): void {
    if (this.selected) {
      const prev = this.gems.get(this.keyFor(this.selected));
      prev?.sprite.setScale(1).clearTint();
    }
    this.selected = cell;
    if (cell) {
      const entry = this.gems.get(this.keyFor(cell));
      entry?.sprite.setScale(1.12).setTint(0xffffaa);
    }
  }

  private cellFromWorld(worldX: number, worldY: number): GemCell | null {
    const col = Math.floor((worldX - this.boardX) / this.tileSize);
    const row = Math.floor((worldY - this.boardY) / this.tileSize);
    if (row < 0 || col < 0 || row >= this.model.rows || col >= this.model.cols) return null;
    return this.model.grid[row][col];
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.resolving || !this.dragStart) return;
    const start = this.dragStart;
    this.dragStart = null;
    const end = this.cellFromWorld(pointer.worldX, pointer.worldY);
    if (!end || end === start || !this.model.areAdjacent(start, end)) return;
    if (!this.model.canMove(start) || !this.model.canMove(end)) {
      this.audioFx.invalid();
      return;
    }
    this.setSelected(null);
    void this.trySwap(start, end);
  }

  private async trySwap(a: GemCell, b: GemCell): Promise<void> {
    this.resolving = true;
    this.clearHintHighlight();
    const from = { row: a.row, col: a.col };
    const to = { row: b.row, col: b.col };
    this.audioFx.swap();
    await this.animateSwap(a, b, 200);
    this.model.swapByPosition(from.row, from.col, to.row, to.col);
    const matches = this.model.findMatches();
    if (matches.length === 0) {
      this.audioFx.invalid();
      await this.animateSwap(this.model.grid[from.row][from.col], this.model.grid[to.row][to.col], 170);
      this.model.swapByPosition(from.row, from.col, to.row, to.col);
      this.resolving = false;
      return;
    }

    this.moves -= 1;
    this.movesText.setText(`Moves: ${this.moves}`);
    const steps = this.model.resolveCascade(matches);
    for (const step of steps) {
      await this.animateStep(step.removed, step.drops, step.chain);
      this.syncGemTextures();
      this.score += step.score;
      this.updateScoreUI(step.chain, step.score);
    }

    if (this.moves <= 0 || this.score >= this.level.targetScore) this.endLevel();
    this.ensurePlayableBoard();
    this.resolving = false;
  }

  private animateSwap(a: GemCell, b: GemCell, duration: number): Promise<void> {
    const aa = this.gems.get(this.keyFor(a));
    const bb = this.gems.get(this.keyFor(b));
    if (!aa || !bb) return Promise.resolve();
    const ap = this.pos(b.row, b.col);
    const bp = this.pos(a.row, a.col);
    return new Promise((resolve) => {
      this.tweens.add({ targets: aa.sprite, x: ap.x, y: ap.y, duration, ease: 'Cubic.easeInOut' });
      this.tweens.add({ targets: aa.gemTypeLabel, x: ap.x - 28, y: ap.y - 29, duration, ease: 'Cubic.easeInOut' });
      this.tweens.add({ targets: bb.gemTypeLabel, x: bp.x - 28, y: bp.y - 29, duration, ease: 'Cubic.easeInOut' });
      this.tweens.add({
        targets: bb.sprite,
        x: bp.x,
        y: bp.y,
        duration,
        ease: 'Cubic.easeInOut',
        onComplete: () => {
          if (aa.overlay) this.tweens.add({ targets: aa.overlay, x: ap.x, y: ap.y, duration: 0 });
          if (bb.overlay) this.tweens.add({ targets: bb.overlay, x: bp.x, y: bp.y, duration: 0 });
          this.gems.delete(this.keyFor(a));
          this.gems.delete(this.keyFor(b));
          this.gems.set(this.keyFor(b), aa);
          this.gems.set(this.keyFor(a), bb);
          resolve();
        },
      });
    });
  }

  private animateStep(removed: GemCell[], drops: { fromRow: number; toRow: number; col: number; cell: GemCell }[], chain: number): Promise<void> {
    return new Promise((resolve) => {
      removed.forEach((cell) => {
        const entry = this.gems.get(this.keyFor(cell));
        if (!entry) return;
        const emitter = this.add.particles(entry.sprite.x, entry.sprite.y, 'spark', {
          speed: { min: 30, max: 190 }, angle: { min: 0, max: 360 }, scale: { start: 0.8, end: 0 }, lifespan: 420, quantity: 18,
          tint: [0xffffff, 0xfff5ad, 0x9be8ff],
        });
        this.time.delayedCall(440, () => emitter.destroy());
        this.tweens.add({ targets: [entry.sprite, entry.overlay], scale: 0.2, alpha: 0, duration: 120, onComplete: () => {
          entry.sprite.destroy();
          entry.gemTypeLabel.destroy();
          entry.overlay?.destroy();
        } });
        this.gems.delete(this.keyFor(cell));
      });

      const moveDuration = Math.max(...drops.map((d) => Math.max(130, (d.toRow - d.fromRow) * 150)), 180);
      for (const d of drops) {
        const key = `${d.fromRow},${d.col}`;
        const entry = this.gems.get(key);
        if (!entry) continue;
        const p = this.pos(d.toRow, d.col);
        this.tweens.add({ targets: [entry.sprite, entry.overlay], x: p.x, y: p.y, duration: Math.max(130, (d.toRow - d.fromRow) * 150), ease: 'Quad.easeIn' });
        this.tweens.add({ targets: entry.gemTypeLabel, x: p.x - 28, y: p.y - 29, duration: Math.max(130, (d.toRow - d.fromRow) * 150), ease: 'Quad.easeIn' });
        this.gems.delete(key);
        this.gems.set(this.keyFor(d.cell), entry);
      }

      for (let r = 0; r < this.model.rows; r += 1) {
        for (let c = 0; c < this.model.cols; c += 1) {
          const cell = this.model.grid[r][c];
          const key = this.keyFor(cell);
          if (!this.gems.has(key)) {
            this.createGemSprite(cell);
            const entry = this.gems.get(key)!;
            const p = this.pos(r, c);
            entry.sprite.y = this.boardY - 90;
            this.tweens.add({ targets: entry.sprite, y: p.y, duration: (r + 1) * 80, ease: 'Quad.easeIn' });
            entry.gemTypeLabel.y = this.boardY - 119;
            this.tweens.add({ targets: entry.gemTypeLabel, y: p.y - 29, duration: (r + 1) * 80, ease: 'Quad.easeIn' });
            if (entry.overlay) {
              entry.overlay.y = this.boardY - 90;
              this.tweens.add({ targets: entry.overlay, y: p.y, duration: (r + 1) * 80, ease: 'Quad.easeIn' });
            }
            this.decorateObstacle(entry);
          }
        }
      }

      this.audioFx.combo(chain);
      if (chain >= 3) this.cameras.main.shake(140, 0.005 * chain);
      this.time.delayedCall(moveDuration + 150, () => resolve());
    });
  }

  private syncGemTextures(): void {
    for (let r = 0; r < this.model.rows; r += 1) {
      for (let c = 0; c < this.model.cols; c += 1) {
        const cell = this.model.grid[r][c];
        const entry = this.gems.get(this.keyFor(cell));
        if (!entry) continue;
        const texture = this.textureForCell(cell);
        if (entry.sprite.texture.key !== texture) entry.sprite.setTexture(texture);
        entry.gemTypeLabel.setText(`${cell.gemType}`);
        this.decorateObstacle(entry);
      }
    }
  }

  private showHint(): void {
    this.clearHintHighlight();
    const validMoves = this.model.findValidMoves();
    console.log(`[match3] hint check valid moves: ${validMoves.length}`);
    if (validMoves.length === 0) {
      this.model.shuffleBoardUntilPlayable();
      this.syncGemTextures();
      this.repositionAllSprites();
      return;
    }
    const hint = validMoves[0];
    const first = this.model.grid[hint.a.row][hint.a.col];
    const second = this.model.grid[hint.b.row][hint.b.col];
    this.hintedCells = { a: first, b: second };
    this.pulseHintCell(first);
    this.pulseHintCell(second);
  }

  private pulseHintCell(cell: GemCell): void {
    const entry = this.gems.get(this.keyFor(cell));
    if (!entry) return;
    this.tweens.add({
      targets: entry.sprite,
      duration: 420,
      scale: 1.15,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: entry.sprite,
      duration: 420,
      alpha: 0.72,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
    });
    entry.sprite.setTint(0xb8fffd);
  }

  private clearHintHighlight(): void {
    if (!this.hintedCells) return;
    const entries = [this.hintedCells.a, this.hintedCells.b]
      .map((cell) => this.gems.get(this.keyFor(cell)))
      .filter(Boolean) as GemSprite[];
    for (const entry of entries) {
      this.tweens.killTweensOf(entry.sprite);
      entry.sprite.setScale(1).setAlpha(1).clearTint();
    }
    this.hintedCells = null;
  }

  private repositionAllSprites(): void {
    for (let r = 0; r < this.model.rows; r += 1) {
      for (let c = 0; c < this.model.cols; c += 1) {
        const cell = this.model.grid[r][c];
        const entry = this.gems.get(this.keyFor(cell));
        if (!entry) continue;
        const p = this.pos(r, c);
        entry.sprite.setPosition(p.x, p.y);
        entry.gemTypeLabel.setPosition(p.x - 28, p.y - 29);
        entry.overlay?.setPosition(p.x, p.y);
      }
    }
  }

  private ensurePlayableBoard(): void {
    const validMoves = this.model.findValidMoves();
    console.log(`[match3] valid moves available: ${validMoves.length}`);
    if (validMoves.length > 0) return;
    this.model.shuffleBoardUntilPlayable();
  }

  private updateScoreUI(chain: number, scoreGain: number): void {
    this.scoreText.setText(`Score: ${this.score}`);
    const stars = this.level.stars.reduce((acc, target) => acc + (this.score >= target ? 1 : 0), 0);
    this.starsText.setText(`${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);
    const t = this.add.text(640, 130, `+${scoreGain} x${chain}`, { fontSize: '28px', color: '#fff2a2', stroke: '#553900', strokeThickness: 5 });
    this.tweens.add({ targets: t, y: 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  private endLevel(): void {
    this.resolving = true;
    const win = this.score >= this.level.targetScore;
    const panel = this.add.rectangle(400, 360, 420, 290, 0x1a1027, 0.95).setStrokeStyle(3, 0xf5cbff);
    const txt = this.add.text(400, 270, win ? 'Level Clear!' : 'Out of Moves', { fontSize: '44px', color: '#fff' }).setOrigin(0.5);
    const stars = this.level.stars.reduce((acc, target) => acc + (this.score >= target ? 1 : 0), 0);
    const starTxt = this.add.text(400, 330, `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, { fontSize: '50px', color: '#ffd96d' }).setOrigin(0.5);
    const next = this.add.text(400, 410, win && this.level.id < LEVELS.length ? 'Next Level' : 'Level Select', { fontSize: '28px', color: '#c7f7ff', backgroundColor: '#2a4f69', padding: { x: 12, y: 8 } }).setOrigin(0.5).setInteractive();
    next.on('pointerdown', () => {
      panel.destroy(); txt.destroy(); starTxt.destroy(); next.destroy();
      if (win && this.level.id < LEVELS.length) this.scene.start('PlayGame', { levelId: this.level.id });
      else this.scene.start('LevelSelect');
    });
  }
}
