import Phaser from 'phaser';
import { LEVELS, type LevelConfig } from '../config/levels';
import { Match3, type GemCell } from '../lib/match3';
import { ProceduralAudio } from '../audio/ProceduralAudio';

interface GemSprite {
  cell: GemCell;
  sprite: Phaser.GameObjects.Image;
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
  private resolving = false;
  private score = 0;
  private moves = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private starsText!: Phaser.GameObjects.Text;

  constructor() { super('PlayGame'); }

  init(data: { levelId?: number }): void {
    this.level = LEVELS[data.levelId ?? 0] ?? LEVELS[0];
  }

  create(): void {
    this.createBackground();
    this.model = new Match3(this.level);
    this.moves = this.level.moves;
    this.createUI();
    this.renderBoard();
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
    const sprite = this.add.image(p.x, p.y, this.textureForCell(cell)).setDisplaySize(62, 62).setInteractive();
    sprite.on('pointerdown', () => this.handleSelect(cell));
    const entry: GemSprite = { cell, sprite };
    this.gems.set(this.keyFor(cell), entry);
    this.decorateObstacle(entry);
    this.tweens.add({ targets: sprite, scale: 1.04, yoyo: true, repeat: -1, duration: 1200 + Phaser.Math.Between(0, 500) });
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

  private handleSelect(cell: GemCell): void {
    if (this.resolving) return;
    if (!this.selected) {
      this.selected = cell;
      this.flashCell(cell, 0xffffaa);
      return;
    }
    if (cell === this.selected) {
      this.selected = null;
      return;
    }
    if (!this.model.areAdjacent(this.selected, cell) || !this.model.canMove(this.selected) || !this.model.canMove(cell)) {
      this.audioFx.invalid();
      this.selected = null;
      return;
    }
    this.trySwap(this.selected, cell);
    this.selected = null;
  }

  private flashCell(cell: GemCell, tint: number): void {
    const item = this.gems.get(this.keyFor(cell));
    if (!item) return;
    item.sprite.setTint(tint);
    this.time.delayedCall(120, () => item.sprite.clearTint());
  }

  private async trySwap(a: GemCell, b: GemCell): Promise<void> {
    this.resolving = true;
    this.audioFx.swap();
    await this.animateSwap(a, b, 200);
    this.model.swap(a, b);
    const matches = this.model.findMatches();
    if (matches.length === 0) {
      this.audioFx.invalid();
      await this.animateSwap(this.model.grid[a.row][a.col], this.model.grid[b.row][b.col], 170);
      this.model.swap(this.model.grid[a.row][a.col], this.model.grid[b.row][b.col]);
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
        this.decorateObstacle(entry);
      }
    }
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
