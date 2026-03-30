import Phaser from 'phaser';
import { ASSET_ENTRIES, ASSET_MANIFEST } from '../config/AssetManifest.js';

const TILE_FILL = {
  red: 0xff5d5d,
  blue: 0x4f8fff,
  green: 0x52db67,
  yellow: 0xffdf57,
  purple: 0xc06bff,
  orange: 0xffa24f
};

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
    this.failedAssetKeys = new Set();
  }

  preload() {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 240, 30, 0x223355, 1);
    const bar = this.add.image(width / 2 - 110, height / 2, 'boot-bar').setOrigin(0, 0.5).setScale(0, 1);
    this.load.on('progress', (value) => bar.setScale(value, 1));
    this.load.on('complete', () => barBg.destroy());

    this.load.on('loaderror', (file) => {
      this.failedAssetKeys.add(file.key);
      console.warn(`[assets] Failed to load '${file.key}' from '${file.src}'. Using placeholder texture.`);
    });

    Object.values(ASSET_MANIFEST).forEach((group) => {
      Object.values(group).forEach(({ key, path }) => this.load.image(key, path));
    });
  }

  create() {
    this.ensureFallbackAssets();
    this.scene.start('MainMenuScene');
  }

  ensureFallbackAssets() {
    ASSET_ENTRIES.forEach((entry) => {
      if (this.textures.exists(entry.key) && !this.failedAssetKeys.has(entry.key)) return;
      this.generatePlaceholder(entry);
    });
  }

  generatePlaceholder(entry) {
    const { key, group, name } = entry;

    if (group === 'tiles') {
      this.generateTilePlaceholder(key, name, TILE_FILL[name] ?? 0x888888);
      return;
    }

    if (group === 'specials') {
      this.generateSpecialPlaceholder(key, name);
      return;
    }

    if (group === 'ui') {
      if (name === 'panel') return this.generateLabeledPanel(key, 160, 66, 0x2d4b8f, 'UI PANEL');
      if (name === 'button') return this.generateLabeledPanel(key, 220, 66, 0x24324f, 'BUTTON');
      if (name === 'pauseIcon') return this.generatePauseIcon(key);
      if (name === 'star') return this.generateStar(key, true);
    }

    if (group === 'board') {
      if (name === 'frame') return this.generateBoardFrame(key);
      if (name === 'background') return this.generateBoardBackground(key);
    }

    if (group === 'backgrounds') {
      if (name === 'mainMenu') return this.generateBackground(key, 0x223b82, 0x101b45, 'MENU BG');
      if (name === 'game') return this.generateBackground(key, 0x1d2d62, 0x0a1235, 'GAME BG');
    }

    if (group === 'fx') {
      if (name === 'sparkle' || name === 'matchBurst') return this.generateSparkle(key);
      if (name === 'specialGlow') return this.generateSpecialGlow(key);
    }

    this.generateMissingAssetFallback(key, entry.width ?? 96, entry.height ?? 96);
  }

  generateTilePlaceholder(key, label, fillColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(fillColor, fillColor, 0xffffff, 0xffffff, 1, 1, 0.2, 0.2);
    graphics.fillRoundedRect(0, 0, 64, 64, 14);
    graphics.lineStyle(2, 0xffffff, 0.45);
    graphics.strokeRoundedRect(1, 1, 62, 62, 14);

    const text = this.make.text({
      x: 32,
      y: 32,
      text: label.toUpperCase(),
      style: { fontFamily: 'Arial Black', fontSize: '12px', color: '#1a1a1a' },
      add: false
    });
    text.setOrigin(0.5);

    this.commitTexture(key, 64, 64, [
      { obj: graphics, x: 0, y: 0 },
      { obj: text, x: 32, y: 32 }
    ]);
  }

  generateSpecialPlaceholder(key, type) {
    const baseColor = type === 'striped' ? 0xffd166 : type === 'bomb' ? 0xff8fab : 0x9b6bff;
    this.generateTilePlaceholder(key, type, baseColor);

    const overlay = this.make.graphics({ x: 0, y: 0, add: false });
    if (type === 'striped') {
      overlay.lineStyle(4, 0xffffff, 0.9);
      for (let y = -8; y <= 72; y += 12) {
        overlay.strokeLineShape(new Phaser.Geom.Line(-4, y, 68, y + 36));
      }
    } else if (type === 'bomb') {
      overlay.fillStyle(0x1e1e1e, 0.9);
      overlay.fillCircle(32, 32, 12);
      overlay.lineStyle(3, 0xffd166, 1);
      overlay.strokeCircle(32, 32, 14);
    } else {
      this.drawStarShape(overlay, 32, 32, 20, 10, 5, 0xffffff, 0.95);
    }

    const rt = this.make.renderTexture({ width: 64, height: 64, add: false });
    rt.drawFrame(key, undefined, 32, 32);
    rt.draw(overlay, 0, 0);
    rt.saveTexture(`${key}-tmp`);
    this.textures.remove(key);
    this.textures.renameTexture(`${key}-tmp`, key);

    overlay.destroy();
    rt.destroy();
  }

  generateLabeledPanel(key, width, height, fill, label) {
    const panel = this.make.graphics({ x: 0, y: 0, add: false });
    panel.fillStyle(fill, 0.95);
    panel.fillRoundedRect(0, 0, width, height, 12);
    panel.lineStyle(2, 0xffffff, 0.4);
    panel.strokeRoundedRect(0, 0, width, height, 12);

    const text = this.make.text({
      x: width / 2,
      y: height / 2,
      text: label,
      style: { fontFamily: 'Arial Black', fontSize: '14px', color: '#ffffff' },
      add: false
    });
    text.setOrigin(0.5);

    this.commitTexture(key, width, height, [
      { obj: panel, x: 0, y: 0 },
      { obj: text, x: width / 2, y: height / 2 }
    ]);
  }

  generatePauseIcon(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(4, 2, 6, 16);
    g.fillRect(14, 2, 6, 16);
    g.generateTexture(key, 24, 20);
    g.destroy();
  }

  generateHighlight(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(4, 0xffffff, 0.95);
    g.strokeCircle(32, 32, 30);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  generateStar(key, filled) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    this.drawStarShape(g, 16, 16, 13, 6, 5, filled ? 0xffe066 : 0x000000, filled ? 1 : 0);
    g.lineStyle(2, 0xffe066, 1);
    this.drawStarPath(g, 16, 16, 13, 6, 5);
    g.generateTexture(key, 32, 32);
    g.destroy();
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

  generateBoardFrame(key) {
    const w = 560;
    const h = 560;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2d2010, 0.95);
    g.fillRoundedRect(0, 0, w, h, 24);
    g.lineStyle(10, 0xd6b06b, 1);
    g.strokeRoundedRect(5, 5, w - 10, h - 10, 22);
    g.lineStyle(3, 0xffe7b0, 0.75);
    g.strokeRoundedRect(14, 14, w - 28, h - 28, 18);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  generateBoardBackground(key) {
    const w = 520;
    const h = 520;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillGradientStyle(0x0f1a3d, 0x0f1a3d, 0x1f346a, 0x1f346a, 1);
    g.fillRoundedRect(0, 0, w, h, 16);
    g.lineStyle(2, 0xffffff, 0.08);
    for (let i = 1; i < 8; i += 1) {
      const p = (w / 8) * i;
      g.strokeLineShape(new Phaser.Geom.Line(p, 0, p, h));
      g.strokeLineShape(new Phaser.Geom.Line(0, p, w, p));
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  generateBackground(key, topColor, bottomColor, label) {
    const w = 1280;
    const h = 720;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(2, 0xffffff, 0.05);
    for (let y = 0; y < h; y += 48) {
      g.strokeLineShape(new Phaser.Geom.Line(0, y, w, y));
    }

    const text = this.make.text({
      x: w / 2,
      y: h / 2,
      text: label,
      style: { fontFamily: 'Arial Black', fontSize: '64px', color: '#ffffff33' },
      add: false
    });
    text.setOrigin(0.5);

    this.commitTexture(key, w, h, [
      { obj: g, x: 0, y: 0 },
      { obj: text, x: w / 2, y: h / 2 }
    ]);
  }

  generateBokeh(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 20);
    g.generateTexture(key, 40, 40);
    g.destroy();
  }

  generateSparkle(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture(key, 12, 12);
    g.destroy();
  }

  generateSpecialGlow(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(40, 40, 34);
    g.lineStyle(3, 0xffffff, 0.6);
    g.strokeCircle(40, 40, 36);
    g.generateTexture(key, 80, 80);
    g.destroy();
  }

  generateMissingAssetFallback(key, width, height) {
    const panel = this.make.graphics({ x: 0, y: 0, add: false });
    panel.fillStyle(0x983737, 1);
    panel.fillRect(0, 0, width, height);
    panel.lineStyle(3, 0xffffff, 0.85);
    panel.strokeRect(0, 0, width, height);

    const label = this.make.text({
      x: width / 2,
      y: height / 2,
      text: key,
      style: { fontFamily: 'Arial Black', fontSize: '12px', color: '#ffffff', align: 'center', wordWrap: { width: width - 6 } },
      add: false
    });
    label.setOrigin(0.5);

    this.commitTexture(key, width, height, [
      { obj: panel, x: 0, y: 0 },
      { obj: label, x: width / 2, y: height / 2 }
    ]);
  }

  commitTexture(key, width, height, layers) {
    const rt = this.make.renderTexture({ width, height, add: false });
    layers.forEach(({ obj, x, y }) => rt.draw(obj, x, y));

    const tempKey = `${key}-rt`;
    rt.saveTexture(tempKey);
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.renameTexture(tempKey, key);

    layers.forEach(({ obj }) => obj.destroy());
    rt.destroy();
  }
}
