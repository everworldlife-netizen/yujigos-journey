import Phaser from 'phaser';

const BERRY_COLORS = ['#ff4f8f', '#4f8fff', '#b45cff', '#ff7a4f', '#4fe0a0', '#ffd45a'];

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.8, 28, 0x3a2a67).setOrigin(0.5);
    const bar = this.add.rectangle(bg.x - bg.width / 2, bg.y, 6, 20, 0xff9af2).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = (bg.width - 8) * v; });
  }

  create(): void {
    this.generateBerryTextures();
    this.generateSpecialTextures();
    this.generateParticleTextures();
    this.scene.start('TitleScene');
  }

  private generateBerryTextures(): void {
    const size = 128;
    for (let i = 0; i < 6; i++) {
      const key = `berry-${i}`;
      if (this.textures.exists(key)) continue;
      const texture = this.textures.createCanvas(key, size, size);
      const ctx = texture.context;
      const color = BERRY_COLORS[i];

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      this.traceShape(ctx, i, size);
      ctx.clip();

      const g = ctx.createRadialGradient(size * 0.36, size * 0.3, size * 10 / 100, size * 0.62, size * 0.7, size * 0.64);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.08, '#fff6ff');
      g.addColorStop(0.22, Phaser.Display.Color.ValueToColor(color).brighten(55).rgba);
      g.addColorStop(1, Phaser.Display.Color.ValueToColor(color).darken(50).rgba);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      const innerShadow = ctx.createRadialGradient(size * 0.6, size * 0.7, size * 0.08, size * 0.62, size * 0.68, size * 0.58);
      innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
      innerShadow.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = innerShadow;
      ctx.fillRect(0, 0, size, size);

      const gloss = ctx.createLinearGradient(0, 0, 0, size * 0.65);
      gloss.addColorStop(0, 'rgba(255,255,255,0.78)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.ellipse(size * 0.42, size * 0.3, size * 0.28, size * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      this.traceShape(ctx, i, size);
      ctx.stroke();
      texture.refresh();
    }
  }

  private traceShape(ctx: CanvasRenderingContext2D, idx: number, size: number): void {
    const c = size / 2;
    const r = size * 0.38;
    ctx.beginPath();
    if (idx === 0) ctx.arc(c, c, r, 0, Math.PI * 2);
    if (idx === 1) {
      ctx.moveTo(c, size * 0.12); ctx.lineTo(size * 0.88, c); ctx.lineTo(c, size * 0.88); ctx.lineTo(size * 0.12, c); ctx.closePath();
    }
    if (idx === 2) ctx.roundRect(size * 0.16, size * 0.16, size * 0.68, size * 0.68, size * 0.13);
    if (idx === 3) { ctx.moveTo(c, size * 0.16); ctx.lineTo(size * 0.84, size * 0.82); ctx.lineTo(size * 0.16, size * 0.82); ctx.closePath(); }
    if (idx === 4) {
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI / 5);
        const rr = i % 2 === 0 ? r : r * 0.5;
        const x = c + Math.cos(ang) * rr;
        const y = c + Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
    if (idx === 5) {
      for (let i = 0; i < 6; i++) {
        const ang = Math.PI / 6 + (i * Math.PI / 3);
        const x = c + Math.cos(ang) * r;
        const y = c + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
  }

  private generateSpecialTextures(): void {
    if (!this.textures.exists('special-stripes')) {
      const t = this.textures.createCanvas('special-stripes', 128, 128);
      const ctx = t.context;
      ctx.clearRect(0, 0, 128, 128);
      for (let i = -128; i < 256; i += 20) {
        ctx.strokeStyle = i % 40 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 128, 128);
        ctx.stroke();
      }
      t.refresh();
    }

    if (!this.textures.exists('special-rainbow')) {
      const t = this.textures.createCanvas('special-rainbow', 128, 128);
      const ctx = t.context;
      const g = ctx.createLinearGradient(0, 0, 128, 128);
      ['#ff4a6e', '#ffb74d', '#fff176', '#70f0b4', '#6bb6ff', '#c688ff'].forEach((c, i) => g.addColorStop(i / 5, c));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 42, 0, Math.PI * 2);
      ctx.fill();
      t.refresh();
    }

    if (!this.textures.exists('special-bomb')) {
      const t = this.textures.createCanvas('special-bomb', 128, 128);
      const ctx = t.context;
      const g = ctx.createRadialGradient(54, 46, 10, 64, 64, 54);
      g.addColorStop(0, '#6a1f1f');
      g.addColorStop(0.4, '#2e2022');
      g.addColorStop(1, '#08090f');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 44, 0, Math.PI * 2);
      ctx.fill();
      t.refresh();
    }
  }

  private generateParticleTextures(): void {
    if (!this.textures.exists('particle-circle')) {
      const t = this.textures.createCanvas('particle-circle', 24, 24);
      const ctx = t.context;
      const g = ctx.createRadialGradient(12, 12, 2, 12, 12, 12);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 24, 24);
      t.refresh();
    }
    if (!this.textures.exists('particle-star')) {
      const t = this.textures.createCanvas('particle-star', 24, 24);
      const ctx = t.context;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI / 5);
        const rr = i % 2 === 0 ? 10 : 5;
        const x = 12 + Math.cos(a) * rr;
        const y = 12 + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      t.refresh();
    }
  }
}
