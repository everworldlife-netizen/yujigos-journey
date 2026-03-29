import { createCanvas } from 'canvas';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const backgroundsDir = path.join(ROOT, 'public/assets/backgrounds');
const uiDir = path.join(ROOT, 'public/assets/ui');

fs.mkdirSync(backgroundsDir, { recursive: true });
fs.mkdirSync(uiDir, { recursive: true });

const WIDTH = 720;
const HEIGHT = 1280;

function saveCanvas(canvas, destination) {
  fs.writeFileSync(destination, canvas.toBuffer('image/png'));
}

function addStars(ctx, count, palette) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT * 0.7;
    const r = Math.random() * 2.8 + 0.3;
    const color = palette[Math.floor(Math.random() * palette.length)];
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.random() * 0.75 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 50 * s, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x + 55 * s, y - 30 * s, 45 * s, Math.PI, Math.PI * 2);
  ctx.arc(x + 110 * s, y - 15 * s, 35 * s, Math.PI * 1.2, Math.PI * 0.2);
  ctx.arc(x + 140 * s, y + 10 * s, 50 * s, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
}

function berryMeadow() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#fef2ff');
  sky.addColorStop(0.4, '#c4f8ff');
  sky.addColorStop(1, '#90e6a7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawCloud(ctx, 80, 180, 1.2, 'rgba(255,255,255,0.5)');
  drawCloud(ctx, 420, 260, 1.7, 'rgba(255,255,255,0.55)');

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ['#78c87f', '#62b46b', '#55a35d', '#4f9255'][i];
    ctx.beginPath();
    ctx.moveTo(-40, HEIGHT - 260 + i * 90);
    for (let x = -40; x <= WIDTH + 50; x += 22) {
      ctx.lineTo(x, HEIGHT - 260 + i * 90 - Math.sin(x / 120 + i) * (42 - i * 4));
    }
    ctx.lineTo(WIDTH + 40, HEIGHT + 40);
    ctx.lineTo(-40, HEIGHT + 40);
    ctx.closePath();
    ctx.fill();
  }

  const flowerColors = ['#ffe57a', '#ff8ac2', '#cda0ff', '#ffffff'];
  for (let i = 0; i < 280; i++) {
    const x = Math.random() * WIDTH;
    const y = HEIGHT * 0.58 + Math.random() * HEIGHT * 0.35;
    const size = Math.random() * 5 + 2;
    ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    for (let p = 0; p < 5; p++) {
      const angle = (Math.PI * 2 * p) / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * size, y + Math.sin(angle) * size, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffdf5f';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const sun = ctx.createRadialGradient(570, 180, 12, 570, 180, 170);
  sun.addColorStop(0, 'rgba(255,245,180,0.95)');
  sun.addColorStop(1, 'rgba(255,245,180,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(380, 0, 340, 420);

  return c;
}

function frostberryFalls() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#2a2368');
  sky.addColorStop(0.45, '#4f66b6');
  sky.addColorStop(1, '#daf5ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const aurora = ctx.createLinearGradient(0, 180, WIDTH, 380);
  aurora.addColorStop(0, 'rgba(129,209,255,0.0)');
  aurora.addColorStop(0.35, 'rgba(177,153,255,0.38)');
  aurora.addColorStop(0.75, 'rgba(113,255,221,0.28)');
  aurora.addColorStop(1, 'rgba(129,209,255,0.0)');
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 120, WIDTH, 350);

  addStars(ctx, 180, ['#ffffff', '#d6f4ff', '#d8ccff']);

  ctx.fillStyle = '#8cb0da';
  ctx.beginPath();
  ctx.moveTo(0, 620);
  ctx.lineTo(130, 380);
  ctx.lineTo(230, 640);
  ctx.lineTo(350, 430);
  ctx.lineTo(540, 620);
  ctx.lineTo(720, 420);
  ctx.lineTo(720, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();

  const falls = ctx.createLinearGradient(0, 0, 0, 720);
  falls.addColorStop(0, 'rgba(236,248,255,0.95)');
  falls.addColorStop(1, 'rgba(180,232,255,0.4)');
  ctx.fillStyle = falls;
  ctx.beginPath();
  ctx.moveTo(280, 220);
  ctx.bezierCurveTo(280, 360, 250, 520, 300, 700);
  ctx.bezierCurveTo(360, 760, 420, 760, 470, 700);
  ctx.bezierCurveTo(500, 560, 450, 360, 440, 220);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 220; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    const len = Math.random() * 20 + 6;
    ctx.strokeStyle = 'rgba(230,249,255,0.55)';
    ctx.lineWidth = Math.random() * 1.8 + 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * 0.5, y + len);
    ctx.stroke();
  }

  return c;
}

function sunberryDesert() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#ffbf7a');
  sky.addColorStop(0.45, '#ff9359');
  sky.addColorStop(1, '#ffd596');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const sun = ctx.createRadialGradient(550, 260, 20, 550, 260, 230);
  sun.addColorStop(0, 'rgba(255,253,212,0.95)');
  sun.addColorStop(1, 'rgba(255,216,119,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(300, 0, 420, 500);

  const duneColors = ['#f2c66f', '#e7b35d', '#da9b4f', '#c9863f'];
  duneColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-20, 520 + i * 150);
    for (let x = -20; x <= WIDTH + 30; x += 18) {
      ctx.lineTo(x, 580 + i * 150 + Math.sin(x / 90 + i * 2.2) * (54 - i * 5));
    }
    ctx.lineTo(WIDTH + 20, HEIGHT + 10);
    ctx.lineTo(-20, HEIGHT + 10);
    ctx.closePath();
    ctx.fill();
  });

  for (let i = 0; i < 6; i++) {
    const x = 140 + i * 90 + Math.sin(i) * 20;
    const y = 700 + (i % 2) * 35;
    ctx.strokeStyle = '#7a4d2c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 15, y - 80, x + 5, y - 180);
    ctx.stroke();
    ctx.fillStyle = '#4a9d5a';
    for (let p = 0; p < 6; p++) {
      ctx.beginPath();
      ctx.ellipse(x + 5, y - 180, 48, 18, (Math.PI * p) / 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return c;
}

function brambleForest() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#102338');
  sky.addColorStop(0.4, '#1f4b4d');
  sky.addColorStop(1, '#2c6f4f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 26; i++) {
    const x = i * 32 + Math.sin(i * 2) * 10;
    const h = 500 + Math.random() * 500;
    ctx.fillStyle = 'rgba(20,45,34,0.8)';
    ctx.fillRect(x, HEIGHT - h, 28, h);
    ctx.fillStyle = 'rgba(32,88,54,0.8)';
    ctx.beginPath();
    ctx.arc(x + 14, HEIGHT - h, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 18; i++) {
    const x = 60 + i * 36;
    const y = 790 + (i % 4) * 24;
    ctx.fillStyle = ['#e79dff', '#bf7dff', '#fbc8ff'][i % 3];
    ctx.beginPath();
    ctx.ellipse(x, y, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7f5ff';
    ctx.beginPath();
    ctx.arc(x, y - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f5a4a';
    ctx.fillRect(x - 6, y + 6, 12, 38);
  }

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    ctx.fillStyle = ['rgba(255,236,135,0.9)', 'rgba(138,245,183,0.82)', 'rgba(190,173,255,0.86)'][i % 3];
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const fog = ctx.createLinearGradient(0, 680, 0, HEIGHT);
  fog.addColorStop(0, 'rgba(192,255,238,0)');
  fog.addColorStop(1, 'rgba(192,255,238,0.4)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 640, WIDTH, HEIGHT - 640);

  return c;
}

function starberryCosmos() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#170b43');
  sky.addColorStop(0.4, '#512572');
  sky.addColorStop(1, '#36165f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const nebula = ctx.createRadialGradient(360, 540, 90, 360, 540, 520);
  nebula.addColorStop(0, 'rgba(255,155,244,0.65)');
  nebula.addColorStop(0.4, 'rgba(177,120,255,0.45)');
  nebula.addColorStop(1, 'rgba(130,89,255,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 120, WIDTH, HEIGHT - 120);

  addStars(ctx, 260, ['#ffffff', '#ffd6ff', '#a7d1ff', '#ffe89e']);

  for (let i = 0; i < 8; i++) {
    const x = 90 + i * 82 + Math.sin(i * 3) * 18;
    const y = 520 + (i % 3) * 110;
    ctx.fillStyle = ['#9f5dcb', '#6f48bb', '#bf74d7'][i % 3];
    ctx.beginPath();
    ctx.ellipse(x, y, 70, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ad68f';
    ctx.beginPath();
    ctx.arc(x - 18, y - 28, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 22, y - 22, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

function titleScreen() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#ffeffc');
  sky.addColorStop(0.45, '#e4d6ff');
  sky.addColorStop(1, '#89d5f4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const pathGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  pathGrad.addColorStop(0, '#ffe3a6');
  pathGrad.addColorStop(1, '#f8b76d');
  ctx.fillStyle = pathGrad;
  ctx.beginPath();
  ctx.moveTo(310, HEIGHT);
  ctx.lineTo(410, HEIGHT);
  ctx.lineTo(490, 620);
  ctx.lineTo(230, 620);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffcef0';
  ctx.fillRect(220, 350, 280, 280);
  ctx.fillStyle = '#ffd8a8';
  ctx.fillRect(270, 420, 180, 210);
  ctx.fillStyle = '#c58cff';
  ctx.beginPath();
  ctx.moveTo(190, 350);
  ctx.lineTo(530, 350);
  ctx.lineTo(360, 210);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 7; i++) {
    const x = 150 + i * 85;
    ctx.fillStyle = '#70b86f';
    ctx.beginPath();
    ctx.arc(x, 670 + Math.sin(i) * 15, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d34282';
    ctx.beginPath();
    ctx.arc(x + 8, 674 + Math.sin(i) * 15, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  addStars(ctx, 120, ['#ffffff', '#fff1a7', '#ffe3ff']);
  return c;
}

function worldMap() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  base.addColorStop(0, '#c6f1ff');
  base.addColorStop(1, '#88d7b0');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const biomes = [
    { x: 180, y: 240, r: 180, color: '#7fd68d' },
    { x: 520, y: 250, r: 170, color: '#9fd0ff' },
    { x: 560, y: 740, r: 180, color: '#f5c170' },
    { x: 210, y: 740, r: 170, color: '#4f9864' },
    { x: 360, y: 510, r: 210, color: '#b589ff' },
  ];

  biomes.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 8;
    ctx.stroke();
  });

  ctx.strokeStyle = '#ffe89c';
  ctx.lineCap = 'round';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(180, 240);
  ctx.bezierCurveTo(280, 260, 320, 420, 360, 510);
  ctx.bezierCurveTo(390, 580, 450, 650, 560, 740);
  ctx.moveTo(360, 510);
  ctx.bezierCurveTo(290, 620, 230, 690, 210, 740);
  ctx.moveTo(360, 510);
  ctx.bezierCurveTo(430, 410, 490, 320, 520, 250);
  ctx.stroke();

  addStars(ctx, 100, ['rgba(255,255,255,0.4)', 'rgba(255,240,180,0.45)']);
  return c;
}

function boardFrame() {
  const c = createCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const outerGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  outerGrad.addColorStop(0, 'rgba(255,139,205,0.95)');
  outerGrad.addColorStop(0.5, 'rgba(255,231,156,0.96)');
  outerGrad.addColorStop(1, 'rgba(144,181,255,0.95)');

  const frameX = 34;
  const frameY = 236;
  const frameW = WIDTH - frameX * 2;
  const frameH = 850;
  const cutX = 62;
  const cutY = 272;
  const cutW = WIDTH - cutX * 2;
  const cutH = 790;

  const roundedRect = (x, y, w, h, r) => {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  };

  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  roundedRect(frameX, frameY, frameW, frameH, 42);
  roundedRect(cutX, cutY, cutW, cutH, 28);
  ctx.fill('evenodd');

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(255,220,240,0.8)';
    const x = frameX + 20 + (i % 10) * 66;
    const y = frameY + 18 + Math.floor(i / 10) * 200;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

function particleSheet() {
  const c = createCanvas(512, 512);
  const ctx = c.getContext('2d');
  const cell = 64;
  const draw = (index, fn) => {
    const x = (index % 8) * cell;
    const y = Math.floor(index / 8) * cell;
    ctx.save();
    ctx.translate(x + cell / 2, y + cell / 2);
    fn();
    ctx.restore();
  };

  for (let i = 0; i < 64; i++) {
    draw(i, () => {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = ['#fff7b3', '#ffffff', '#ffc5ef', '#9ee8ff', '#ff9ab1'][i % 5];
      if (i < 12) {
        for (let p = 0; p < 5; p++) {
          const a = (Math.PI * 2 * p) / 5;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 12, Math.sin(a) * 12, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (i < 24) {
        ctx.beginPath();
        for (let p = 0; p < 10; p++) {
          const r = p % 2 ? 20 : 9;
          const a = (Math.PI * 2 * p) / 10;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (i < 36) {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.bezierCurveTo(-18, -4, -24, -12, -10, -20);
        ctx.bezierCurveTo(-2, -26, 10, -18, 0, -6);
        ctx.bezierCurveTo(10, -18, 22, -26, 30, -20);
        ctx.bezierCurveTo(44, -12, 38, -4, 20, 16);
        ctx.closePath();
        ctx.fill();
      } else if (i < 48) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  return c;
}

const generators = [
  ['bg_berry_meadow.png', berryMeadow],
  ['bg_frostberry_falls.png', frostberryFalls],
  ['bg_sunberry_desert.png', sunberryDesert],
  ['bg_bramble_forest.png', brambleForest],
  ['bg_starberry_cosmos.png', starberryCosmos],
  ['bg_title_screen.png', titleScreen],
  ['bg_world_map.png', worldMap],
];

generators.forEach(([name, fn]) => saveCanvas(fn(), path.join(backgroundsDir, name)));
saveCanvas(boardFrame(), path.join(uiDir, 'board_frame.png'));
saveCanvas(particleSheet(), path.join(uiDir, 'particle_sheet.png'));

console.log(`Generated ${generators.length + 2} assets.`);
