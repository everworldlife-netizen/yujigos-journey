const BERRY_COLORS = {
  strawberry: '#FF3344',
  blueberry: '#4488FF',
  raspberry: '#FF44AA',
  pink_raspberry: '#FF88CC',
  blackberry: '#6622AA',
  golden_berry: '#FFD700',
  moon_berry: '#8888FF',
  ice_berry: '#88EEFF'
};

const BERRIES = Object.keys(BERRY_COLORS);
const STATES = ['normal', 'happy', 'matched', 'frozen'];

const BACKGROUNDS = {
  bg_sunberry_meadow: ['#6bc96e', '#ffe67a'],
  bg_frostberry_falls: ['#9ed8ff', '#dff4ff'],
  bg_enchanted_forest: ['#0d3a26', '#1b5f3c'],
  bg_cosmic_island: ['#2c1356', '#1b3f9e'],
  bg_sunberry_desert: ['#ffb463', '#f4db9b'],
  bg_title: ['#221045', '#3a1f6f'],
  bg_world_map: ['#f3d7a3', '#d9b57e']
};

const UI_BUTTONS = [
  'ui_btn_play', 'ui_btn_pause', 'ui_btn_settings', 'ui_btn_back', 'ui_btn_shop', 'ui_btn_collection',
  'ui_btn_close', 'ui_btn_confirm', 'ui_btn_info'
];

const UI_DISPLAYS = [
  'ui_display_score', 'ui_display_moves', 'ui_display_level', 'ui_display_stars', 'ui_display_coins', 'ui_display_berry_goal'
];

const UI_BANNERS = ['ui_banner_victory', 'ui_banner_defeat'];
const SPECIALS = ['rainbow', 'bow', 'swirl', 'star', 'heart', 'bomb'];

function parseHex(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function tint(hex, amount) {
  const { r, g, b } = parseHex(hex);
  const apply = (v) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)));
  return `rgb(${apply(r)}, ${apply(g)}, ${apply(b)})`;
}

function shade(hex, amount) {
  const { r, g, b } = parseHex(hex);
  const apply = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  return `rgb(${apply(r)}, ${apply(g)}, ${apply(b)})`;
}

export default class SpriteGenerator {
  static generateAll(scene) {
    this.generateBerryTiles(scene);
    this.generateSpecialTiles(scene);
    this.generateBackgrounds(scene);
    this.generateBoard(scene);
    this.generateUi(scene);
    this.generateEffects(scene);
  }

  static generateBerryTiles(scene) {
    BERRIES.forEach((berry) => {
      STATES.forEach((state) => {
        const key = `tile_${berry}_${state}`;
        if (scene.textures.exists(key)) return;
        this.generateBerryTile(scene, key, BERRY_COLORS[berry], state);
      });
    });
  }

  static generateBerryTile(scene, key, color, state) {
    const size = 128;
    const center = size / 2;
    const radius = 46;
    const texture = scene.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();

    ctx.clearRect(0, 0, size, size);

    const fill = ctx.createRadialGradient(center - 20, center - 22, 12, center, center, radius);
    fill.addColorStop(0, tint(color, 0.45));
    fill.addColorStop(0.65, color);
    fill.addColorStop(1, shade(color, 0.45));

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, radius - 1, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = shade(color, 0.5);
    ctx.stroke();

    const gloss = ctx.createRadialGradient(center - 18, center - 22, 2, center - 18, center - 22, 26);
    gloss.addColorStop(0, 'rgba(255,255,255,0.95)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(center - 18, center - 22, 26, 0, Math.PI * 2);
    ctx.fill();

    if (state === 'happy') {
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(center - 14, center - 8, 4.5, 0, Math.PI * 2);
      ctx.arc(center + 14, center - 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(center, center + 8, 14, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    if (state === 'matched') {
      this.drawCanvasStar(ctx, center + 14, center - 14, 14, 6, 5, 'rgba(255,255,255,0.95)');
    }

    if (state === 'frozen') {
      ctx.fillStyle = 'rgba(110, 180, 255, 0.34)';
      ctx.beginPath();
      ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(235, 250, 255, 0.86)';
      ctx.lineWidth = 2;
      [[-24, -4, 18, 12], [-18, 20, 20, -16], [-8, -24, 10, 28]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(center + x1, center + y1);
        ctx.lineTo(center + x2, center + y2);
        ctx.stroke();
      });
    }

    texture.refresh();
  }

  static generateSpecialTiles(scene) {
    SPECIALS.forEach((name) => {
      const key = `tile_special_${name}`;
      if (scene.textures.exists(key)) return;
      this.generateBerryTile(scene, key, BERRY_COLORS.golden_berry, 'normal');
      const texture = scene.textures.get(key);
      const ctx = texture.getContext();
      const c = 64;

      if (name === 'rainbow') {
        ['#ff4f73', '#ffce4c', '#73d86f', '#6db9ff', '#b28aff'].forEach((stroke, i) => {
          ctx.beginPath();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 4;
          ctx.arc(c, c + 6, 22 - i * 3.5, Math.PI * 1.05, Math.PI * 1.95);
          ctx.stroke();
        });
      } else if (name === 'bow') {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.ellipse(c - 12, c + 2, 14, 10, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c + 12, c + 2, 14, 10, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(c - 4, c - 8, 8, 20);
      } else if (name === 'swirl') {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 5;
        for (let r = 6; r <= 26; r += 6) {
          ctx.beginPath();
          ctx.arc(c, c, r, 0.4, Math.PI * 1.65);
          ctx.stroke();
        }
      } else if (name === 'star') {
        this.drawCanvasStar(ctx, c, c, 24, 10, 5, 'rgba(255,255,255,0.98)');
      } else if (name === 'heart') {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(c - 9, c - 2, 9, 0, Math.PI * 2);
        ctx.arc(c + 9, c - 2, 9, 0, Math.PI * 2);
        ctx.lineTo(c, c + 24);
        ctx.closePath();
        ctx.fill();
      } else if (name === 'bomb') {
        ctx.fillStyle = 'rgba(40,30,40,0.95)';
        ctx.beginPath();
        ctx.arc(c, c + 6, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd56b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(c + 10, c - 11);
        ctx.quadraticCurveTo(c + 20, c - 24, c + 24, c - 34);
        ctx.stroke();
      }

      texture.refresh();
    });
  }

  static generateBackgrounds(scene) {
    Object.entries(BACKGROUNDS).forEach(([key, [top, bottom]]) => {
      if (scene.textures.exists(key)) return;
      const width = 540;
      const height = 960;
      const texture = scene.textures.createCanvas(key, width, height);
      const ctx = texture.getContext();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (key === 'bg_title') {
        for (let i = 0; i < 70; i += 1) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const a = Math.random() * 0.8 + 0.2;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * 1.6 + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      texture.refresh();
    });
  }

  static generateBoard(scene) {
    if (!scene.textures.exists('board_frame')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillGradientStyle(0x5d3a1f, 0x7a4f2c, 0x3f2715, 0x5d3a1f, 1);
      g.fillRoundedRect(0, 0, 512, 512, 28);
      g.lineStyle(8, 0x8b5f36, 0.9);
      g.strokeRoundedRect(8, 8, 496, 496, 24);
      g.generateTexture('board_frame', 512, 512);
      g.destroy();
    }

    if (!scene.textures.exists('board_background')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillGradientStyle(0x0f1e4b, 0x102a58, 0x070f2d, 0x0b1638, 1);
      g.fillRoundedRect(0, 0, 512, 512, 18);
      g.generateTexture('board_background', 512, 512);
      g.destroy();
    }
  }

  static generateUi(scene) {
    UI_BUTTONS.forEach((key) => {
      if (scene.textures.exists(key)) return;
      const isPause = key === 'ui_btn_pause';
      const width = isPause ? 72 : 240;
      const height = 72;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillGradientStyle(0x416bc8, 0x4b7ad8, 0x1f3f8f, 0x173271, 1);
      g.fillRoundedRect(0, 0, width, height, 18);
      g.lineStyle(3, 0xc3dbff, 0.7);
      g.strokeRoundedRect(2, 2, width - 4, height - 4, 16);
      g.generateTexture(key, width, height);
      g.destroy();
    });

    UI_DISPLAYS.forEach((key) => {
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillGradientStyle(0x0f1a3d, 0x132554, 0x0a1232, 0x0a1232, 0.9);
      g.fillRoundedRect(0, 0, 196, 82, 14);
      g.lineStyle(2, 0x94b8ff, 0.4);
      g.strokeRoundedRect(1, 1, 194, 80, 14);
      g.generateTexture(key, 196, 82);
      g.destroy();
    });

    if (!scene.textures.exists('ui_star_empty')) this.generateUiStar(scene, 'ui_star_empty', 0x7a7f9c);
    if (!scene.textures.exists('ui_star_gold')) this.generateUiStar(scene, 'ui_star_gold', 0xffd34d);
    if (!scene.textures.exists('ui_star_bronze')) this.generateUiStar(scene, 'ui_star_bronze', 0xcd7f32);
    if (!scene.textures.exists('ui_star_silver')) this.generateUiStar(scene, 'ui_star_silver', 0xc0c8d8);

    UI_BANNERS.forEach((key) => {
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      const win = key.includes('victory');
      g.fillGradientStyle(win ? 0x2d7f40 : 0x813340, win ? 0x3f9f54 : 0x9e4352, 0x1f2538, 0x1f2538, 1);
      g.fillRoundedRect(0, 0, 380, 124, 18);
      g.generateTexture(key, 380, 124);
      g.destroy();
    });
  }

  static generateUiStar(scene, key, color) {
    const size = 48;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    this.drawGraphicsStar(g, size / 2, size / 2, 21, 9, 5, color, 1);
    g.lineStyle(2, 0xffffff, 0.4);
    this.drawGraphicsStar(g, size / 2, size / 2, 21, 9, 5, null, 0, true);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  static generateEffects(scene) {
    if (!scene.textures.exists('fx_sparkle')) this.generateFxCircle(scene, 'fx_sparkle');
    if (!scene.textures.exists('fx_sparkle_star')) this.generateFxStar(scene, 'fx_sparkle_star');
    if (!scene.textures.exists('fx_sparkle_heart')) this.generateFxHeart(scene, 'fx_sparkle_heart');
    if (!scene.textures.exists('fx_sparkle_burst')) this.generateFxCircle(scene, 'fx_sparkle_burst', 18);
    if (!scene.textures.exists('fx_sparkle_glow')) this.generateFxCircle(scene, 'fx_sparkle_glow', 24);
    if (!scene.textures.exists('fx_sparkle_ring')) this.generateFxRing(scene, 'fx_sparkle_ring');
  }

  static generateFxCircle(scene, key, size = 20) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size / 2, size / 2, size * 0.3);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  static generateFxStar(scene, key) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    this.drawGraphicsStar(g, 12, 12, 10, 4, 5, 0xffffff, 1);
    g.generateTexture(key, 24, 24);
    g.destroy();
  }

  static generateFxHeart(scene, key) {
    const size = 24;
    const texture = scene.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    const c = size / 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c - 4, c - 2, 4, 0, Math.PI * 2);
    ctx.arc(c + 4, c - 2, 4, 0, Math.PI * 2);
    ctx.lineTo(c, c + 8);
    ctx.closePath();
    ctx.fill();
    texture.refresh();
  }

  static generateFxRing(scene, key) {
    const size = 24;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(size / 2, size / 2, size * 0.34);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  static drawCanvasStar(ctx, cx, cy, outer, inner, points, fillStyle) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  static drawGraphicsStar(graphics, cx, cy, outer, inner, points, color, alpha, strokeOnly = false) {
    graphics.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.closePath();
    if (!strokeOnly) {
      graphics.fillStyle(color, alpha);
      graphics.fillPath();
    } else {
      graphics.strokePath();
    }
  }
}
