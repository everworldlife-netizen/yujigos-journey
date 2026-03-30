import Phaser from 'phaser';
import { ASSET_ENTRIES } from '../config/AssetManifest.js';

const TILE_COLORS = {
  strawberry: { light: '#ffb0be', base: '#ff5d7a', dark: '#95203e' },
  blueberry: { light: '#b9d2ff', base: '#638fff', dark: '#263d91' },
  raspberry: { light: '#ffb2d2', base: '#ff5d9d', dark: '#8a1f52' },
  pink_raspberry: { light: '#ffd0e5', base: '#ff8fc0', dark: '#9a406f' },
  blackberry: { light: '#d5c7ff', base: '#8f72e6', dark: '#432475' },
  golden_berry: { light: '#ffe6a4', base: '#ffc84f', dark: '#9b671d' },
  moon_berry: { light: '#e5f2ff', base: '#a7d1ff', dark: '#5a759f' },
  ice_berry: { light: '#ffffff', base: '#dff1ff', dark: '#8aa4be' }
};

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
    this.failedAssetKeys = new Set();
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

    this.load.on('loaderror', (fileObj) => {
      if (fileObj?.key) this.failedAssetKeys.add(fileObj.key);
    });

    ASSET_ENTRIES.forEach((entry) => {
      this.load.image(entry.key, entry.path);
    });
  }

  create() {
    this.ensureFallbackAssets();
    this.scene.start('MainMenuScene');
  }

  ensureFallbackAssets() {
    ASSET_ENTRIES.forEach((entry) => {
      if (this.textures.exists(entry.key)) return;
      this.generateTexture(entry);
    });
  }

  generateTexture(entry) {
    const { key, group, name } = entry;

    if (group === 'tiles') {
      const [berry, state] = name.split('.');
      return this.generateBerryTileTexture(key, TILE_COLORS[berry] ?? TILE_COLORS.blueberry, state);
    }

    if (group === 'specialTiles') return this.generateSpecialTexture(key, name);

    if (group === 'ui') {
      if (name === 'btn-pause') return this.generatePauseIconButton(key);
      if (name.startsWith('btn-')) return this.generateGlassButton(key, 240, 72);
      if (name.startsWith('display-')) return this.generateGlassPanel(key, 196, 82);
      if (name.startsWith('star-')) return this.generateSparkle(key, 32, true);
      if (name.startsWith('progress-bar')) return this.generateProgressBar(key, name.endsWith('full'));
      if (name.startsWith('banner-')) return this.generateGlassPanel(key, 380, 124);
      if (name === 'dialog-box') return this.generateGlassPanel(key, 420, 220);
    }

    if (group === 'board') {
      if (name === 'frame') return this.generateBoardFrame(key);
      if (name === 'background') return this.generateBoardBackground(key);
    }

    if (group === 'backgrounds') return this.generateBackground(key, '#0c1232', '#1a1137');
    if (group === 'effects') {
      if (name.includes('burst')) return this.generateSparkle(key, 18, false);
      return this.generateSparkle(key, 20, true);
    }

    this.generateFallback(key, entry.width ?? 96, entry.height ?? 96);
  }

  generateBerryTileTexture(key, palette, state = 'normal') {
    const size = 96;
    const texture = this.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, size, size);

    const isFrozen = state === 'frozen';
    const isMatched = state === 'matched';
    const isHappy = state === 'happy';
    const radius = 18;
    this.drawRoundRectPath(ctx, 8, 8, size - 16, size - 16, radius);

    const radial = ctx.createRadialGradient(34, 26, 6, 48, 52, 54);
    radial.addColorStop(0, isFrozen ? '#f5fbff' : palette.light);
    radial.addColorStop(0.55, isFrozen ? '#cfe8ff' : palette.base);
    radial.addColorStop(1, isFrozen ? '#88a8cf' : palette.dark);
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

    if (isFrozen) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(20 + i * 12, 16);
        ctx.lineTo(10 + i * 18, 84);
        ctx.stroke();
      }
    }

    if (isMatched) {
      ctx.fillStyle = 'rgba(255,255,255,0.26)';
      ctx.beginPath();
      ctx.arc(48, 48, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isHappy) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath();
      ctx.arc(34, 36, 4, 0, Math.PI * 2);
      ctx.arc(62, 36, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(48, 52, 14, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    ctx.restore();
    texture.refresh();
  }

  generateSpecialTexture(key, name) {
    this.generateBerryTileTexture(key, TILE_COLORS.golden_berry, 'normal');
    const rt = this.make.renderTexture({ width: 96, height: 96, add: false });
    rt.drawFrame(key, undefined, 48, 48);
    const overlay = this.make.graphics({ x: 0, y: 0, add: false });

    if (name.includes('bow')) {
      overlay.fillStyle(0xffffff, 0.8);
      overlay.fillTriangle(28, 48, 48, 34, 48, 62);
      overlay.fillTriangle(68, 48, 48, 34, 48, 62);
    } else if (name.includes('bomb')) {
      overlay.fillStyle(0x1b1424, 0.9);
      overlay.fillCircle(48, 52, 18);
      overlay.lineStyle(4, 0xffe38a, 0.95);
      overlay.strokeCircle(48, 52, 21);
    } else if (name.includes('heart')) {
      overlay.fillStyle(0xffffff, 0.9);
      overlay.fillCircle(40, 46, 10);
      overlay.fillCircle(56, 46, 10);
      overlay.fillTriangle(30, 50, 66, 50, 48, 70);
    } else {
      this.drawStarShape(overlay, 48, 50, 24, 11, 6, 0xffffff, 0.9);
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
    g.generateTexture(key, width, height);
    g.destroy();
  }

  generateGlassButton(key, width, height) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillGradientStyle(0x2d4c8f, 0x2d4c8f, 0x152850, 0x152850, 1);
    g.fillRoundedRect(0, 0, width, height, 18);
    g.lineStyle(2, 0x9ed2ff, 0.55);
    g.strokeRoundedRect(2, 2, width - 4, height - 4, 16);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  generatePauseIconButton(key) {
    this.generateGlassButton(key, 72, 72);
  }

  generateProgressBar(key, filled) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(filled ? 0xffd55c : 0x253356, 1);
    g.fillRoundedRect(0, 0, 240, 28, 14);
    g.lineStyle(2, 0xffffff, 0.35);
    g.strokeRoundedRect(1, 1, 238, 26, 14);
    g.generateTexture(key, 240, 28);
    g.destroy();
  }

  generateBoardFrame(key) { const g = this.make.graphics({ x: 0, y: 0, add: false }); g.fillStyle(0x2d1f12, 0.96); g.fillRoundedRect(0, 0, 560, 560, 26); g.generateTexture(key, 560, 560); g.destroy(); }
  generateBoardBackground(key) { const g = this.make.graphics({ x: 0, y: 0, add: false }); g.fillStyle(0x121b3b, 0.9); g.fillRoundedRect(0, 0, 520, 520, 18); g.generateTexture(key, 520, 520); g.destroy(); }

  generateBackground(key, topColor, bottomColor) {
    const w = 1280; const h = 720;
    const texture = this.textures.createCanvas(key, w, h);
    const ctx = texture.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, topColor); grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); texture.refresh();
  }

  generateSparkle(key, size = 16, star = true) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    if (star) this.drawStarShape(g, size / 2, size / 2, size * 0.42, size * 0.2, 5, 0xffffff, 1);
    else { g.fillStyle(0xffffff, 1); g.fillCircle(size / 2, size / 2, size * 0.32); }
    g.generateTexture(key, size, size); g.destroy();
  }

  generateFallback(key, width, height) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff00ff, 0.7);
    g.fillRect(0, 0, width, height);
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
    const path = [];
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      path.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(path[0].x, path[0].y);
    path.forEach((p) => graphics.lineTo(p.x, p.y));
    graphics.closePath();
    graphics.fillPath();
  }
}
