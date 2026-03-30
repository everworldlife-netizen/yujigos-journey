import Phaser from 'phaser';
import { ASSET_ENTRIES } from '../config/AssetManifest.js';

const TILE_COLORS = {
  red: { light: '#ff9b9b', base: '#ff5d5d', dark: '#8f1f2a' },
  blue: { light: '#9ed3ff', base: '#4f8fff', dark: '#1f3b8f' },
  green: { light: '#a7f7b3', base: '#52db67', dark: '#1f7a4a' },
  yellow: { light: '#fff4a4', base: '#ffdf57', dark: '#9b6d1d' },
  purple: { light: '#deb1ff', base: '#c06bff', dark: '#5a2d8f' },
  orange: { light: '#ffd0a1', base: '#ff9b3d', dark: '#9a4a1c' }
};

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 240, 30, 0x223355, 1);
    const bar = this.add.image(width / 2 - 110, height / 2, 'boot-bar').setOrigin(0, 0.5).setScale(1, 1);
    this.tweens.add({ targets: bar, scaleX: 0, duration: 350, ease: 'Quad.Out', yoyo: true });
    this.time.delayedCall(380, () => {
      barBg.destroy();
      bar.destroy();
    });
  }

  create() {
    this.generateAllAssets();
    this.scene.start('MainMenuScene');
  }

  generateAllAssets() {
    ASSET_ENTRIES.forEach((entry) => this.generateTexture(entry));
  }

  generateTexture(entry) {
    const { key, group, name } = entry;
    if (this.textures.exists(key)) this.textures.remove(key);

    if (group === 'tiles') return this.generateGemTileTexture(key, TILE_COLORS[name] ?? TILE_COLORS.blue);
    if (group === 'specials') return this.generateSpecialTexture(key, name);

    if (group === 'ui') {
      if (name === 'panel') return this.generateGlassPanel(key, 176, 72);
      if (name === 'button') return this.generateGlassButton(key, 240, 72);
      if (name === 'pauseIcon') return this.generatePauseIcon(key);
      if (name === 'star') return this.generateSparkle(key, 32, true);
    }

    if (group === 'board') {
      if (name === 'frame') return this.generateBoardFrame(key);
      if (name === 'background') return this.generateBoardBackground(key);
    }

    if (group === 'backgrounds') {
      if (name === 'mainMenu') return this.generateBackground(key, '#17173a', '#0a1028');
      if (name === 'game') return this.generateBackground(key, '#0c1232', '#1a1137');
    }

    if (group === 'fx') {
      if (name === 'sparkle') return this.generateSparkle(key, 20, true);
      if (name === 'matchBurst') return this.generateSparkle(key, 18, false);
      if (name === 'specialGlow') return this.generateSpecialGlow(key);
    }

    this.generateFallback(key, entry.width ?? 96, entry.height ?? 96);
  }

  generateGemTileTexture(key, palette) {
    const size = 96;
    const texture = this.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, size, size);

    const radius = 18;
    this.drawRoundRectPath(ctx, 8, 8, size - 16, size - 16, radius);
    const radial = ctx.createRadialGradient(34, 26, 6, 48, 52, 54);
    radial.addColorStop(0, palette.light);
    radial.addColorStop(0.55, palette.base);
    radial.addColorStop(1, palette.dark);
    ctx.fillStyle = radial;
    ctx.fill();

    ctx.save();
    this.drawRoundRectPath(ctx, 8, 8, size - 16, size - 16, radius);
    ctx.clip();
    const sheen = ctx.createLinearGradient(0, 8, 0, size * 0.65);
    sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(8, 8, size - 16, size * 0.52);
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(32, 28, 17, 10, -0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.66)';
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    this.drawRoundRectPath(ctx, 10, 10, size - 20, size - 20, radius - 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(20,14,35,0.45)';
    this.drawRoundRectPath(ctx, 7, 7, size - 14, size - 14, radius + 1);
    ctx.stroke();

    texture.refresh();
  }

  generateSpecialTexture(key, name) {
    this.generateGemTileTexture(key, TILE_COLORS.purple);
    const rt = this.make.renderTexture({ width: 96, height: 96, add: false });
    rt.drawFrame(key, undefined, 48, 48);
    const overlay = this.make.graphics({ x: 0, y: 0, add: false });

    if (name === 'striped') {
      overlay.lineStyle(6, 0xffffff, 0.62);
      for (let y = -16; y <= 110; y += 16) overlay.strokeLineShape(new Phaser.Geom.Line(-6, y, 108, y + 52));
    } else if (name === 'bomb') {
      overlay.fillStyle(0x201427, 0.9);
      overlay.fillCircle(48, 52, 18);
      overlay.lineStyle(4, 0xffe38a, 0.95);
      overlay.strokeCircle(48, 52, 21);
    } else {
      this.drawStarShape(overlay, 48, 50, 24, 11, 6, 0xffffff, 0.9);
      overlay.lineStyle(2, 0xffffff, 0.85);
      this.drawStarPath(overlay, 48, 50, 24, 11, 6);
    }

    rt.draw(overlay, 0, 0);
    rt.saveTexture(`${key}_rt`);
    this.textures.remove(key);
    this.textures.renameTexture(`${key}_rt`, key);
    overlay.destroy();
    rt.destroy();
  }

  generateGlassPanel(key, width, height) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0f1730, 0.58);
    g.fillRoundedRect(0, 0, width, height, 16);
    g.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.14, 0.14, 0.03, 0.03);
    g.fillRoundedRect(6, 6, width - 12, height * 0.42, 10);
    g.lineStyle(2, 0x8bc2ff, 0.32);
    g.strokeRoundedRect(1, 1, width - 2, height - 2, 16);
    g.lineStyle(1, 0xffffff, 0.24);
    g.strokeRoundedRect(4, 4, width - 8, height - 8, 12);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  generateGlassButton(key, width, height) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillGradientStyle(0x2d4c8f, 0x2d4c8f, 0x152850, 0x152850, 1);
    g.fillRoundedRect(0, 0, width, height, 18);
    g.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.18, 0.18, 0.02, 0.02);
    g.fillRoundedRect(6, 6, width - 12, height * 0.4, 12);
    g.lineStyle(2, 0x9ed2ff, 0.55);
    g.strokeRoundedRect(2, 2, width - 4, height - 4, 16);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  generatePauseIcon(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.92);
    g.fillRoundedRect(3, 2, 6, 16, 2);
    g.fillRoundedRect(14, 2, 6, 16, 2);
    g.generateTexture(key, 24, 20);
    g.destroy();
  }

  generateBoardFrame(key) {
    const w = 560;
    const h = 560;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2d1f12, 0.96);
    g.fillRoundedRect(0, 0, w, h, 26);
    g.lineStyle(14, 0x8c5e28, 1);
    g.strokeRoundedRect(7, 7, w - 14, h - 14, 24);
    g.lineStyle(8, 0xd8b36d, 0.85);
    g.strokeRoundedRect(14, 14, w - 28, h - 28, 20);
    g.lineStyle(2, 0xfff0bc, 0.5);
    g.strokeRoundedRect(20, 20, w - 40, h - 40, 18);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  generateBoardBackground(key) {
    const w = 520;
    const h = 520;
    const texture = this.textures.createCanvas(key, w, h);
    const ctx = texture.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(19,28,59,0.95)');
    grad.addColorStop(1, 'rgba(8,12,29,0.95)');
    ctx.fillStyle = grad;
    this.drawRoundRectPath(ctx, 0, 0, w, h, 18);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i += 1) {
      const p = (w / 8) * i;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(w, p);
      ctx.stroke();
    }
    texture.refresh();
  }

  generateBackground(key, topColor, bottomColor) {
    const w = 1280;
    const h = 720;
    const texture = this.textures.createCanvas(key, w, h);
    const ctx = texture.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4; i += 1) {
      const cx = w * (0.15 + i * 0.24);
      const cy = h * (0.22 + (i % 2) * 0.2);
      const r = h * 0.28;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      glow.addColorStop(0, 'rgba(120,160,255,0.12)');
      glow.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    texture.refresh();
  }

  generateSparkle(key, size = 16, star = true) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    if (star) {
      this.drawStarShape(g, size / 2, size / 2, size * 0.42, size * 0.2, 5, 0xffffff, 1);
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(size / 2, size / 2, size * 0.32);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(size / 2, size / 2, size * 0.18);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  generateSpecialGlow(key) {
    const size = 96;
    const texture = this.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.35, 'rgba(185,210,255,0.7)');
    grad.addColorStop(1, 'rgba(185,210,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }

  generateFallback(key, width, height) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff00ff, 0.7);
    g.fillRect(0, 0, width, height);
    g.lineStyle(3, 0x000000, 1);
    g.strokeLineShape(new Phaser.Geom.Line(0, 0, width, height));
    g.strokeLineShape(new Phaser.Geom.Line(width, 0, 0, height));
    g.generateTexture(key, width, height);
    g.destroy();
  }

  drawRoundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  drawStarShape(graphics, cx, cy, outerRadius, innerRadius, points, fillColor, fillAlpha) {
    const path = this.getStarPoints(cx, cy, outerRadius, innerRadius, points);
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(path[0].x, path[0].y);
    path.forEach((p) => graphics.lineTo(p.x, p.y));
    graphics.closePath();
    graphics.fillPath();
  }

  drawStarPath(graphics, cx, cy, outerRadius, innerRadius, points) {
    const path = this.getStarPoints(cx, cy, outerRadius, innerRadius, points);
    graphics.beginPath();
    graphics.moveTo(path[0].x, path[0].y);
    path.forEach((p) => graphics.lineTo(p.x, p.y));
    graphics.closePath();
    graphics.strokePath();
  }

  getStarPoints(cx, cy, outerRadius, innerRadius, points) {
    const coords = [];
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      coords.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    coords.push(coords[0]);
    return coords;
  }
}
