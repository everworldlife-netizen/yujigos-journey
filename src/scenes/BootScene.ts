import Phaser from 'phaser';

const TILE = 64;

const BERRY_PALETTES = [
  ['#ff6a8d', '#b1003f'],
  ['#5da6ff', '#113a9e'],
  ['#58e37d', '#0e7d3e'],
  ['#ffe56a', '#b28a00'],
  ['#be81ff', '#5522ad'],
  ['#ffa35a', '#bf4c08'],
  ['#ff93d4', '#b21872'],
  ['#ffffff', '#b8cadc'],
] as const;

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;

  constructor() { super('BootScene'); }

  preload(): void {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width * 0.78, 28, 0x291d4f).setOrigin(0.5);
    this.progressBar = this.add.rectangle(bg.x - bg.width / 2 + 4, bg.y, 6, 20, 0xff8de7).setOrigin(0, 0.5);
    this.loadingText = this.add.text(width / 2, bg.y - 52, 'Preparing Berry Engine...', {
      fontSize: '36px', color: '#ffe9ff', fontStyle: '800', stroke: '#2d1248', strokeThickness: 6,
    }).setOrigin(0.5);

    let progress = 0;
    this.time.addEvent({
      delay: 40,
      repeat: 24,
      callback: () => {
        progress = Math.min(1, progress + 0.04);
        this.progressBar.width = (bg.width - 8) * progress;
      },
    });
  }

  create(): void {
    this.updateLoading('Generating Berry Magic...');
    this.generateBerryTiles();
    this.generatePowerUps();
    this.generateObstacles();

    this.updateLoading('Crafting UI charms...');
    this.generateUiTextures();

    this.updateLoading('Creating worlds...');
    this.generateBackgrounds();

    this.updateLoading('Breathing life into characters...');
    this.generateCharacterSheets();
    this.generateNpcAndWorldMapSheets();
    this.generateBoardFrame();
    this.generateParticles();

    this.createCharacterAnimations();
    this.progressBar.width = this.scale.width * 0.78 - 8;
    this.time.delayedCall(150, () => this.scene.start('TitleScene'));
  }

  private updateLoading(message: string): void {
    this.loadingText.setText(message);
  }

  private addSheetTexture(key: string, canvas: HTMLCanvasElement, frameWidth: number, frameHeight: number, endFrame: number): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, { frameWidth, frameHeight, endFrame });
  }

  private addImageTexture(key: string, canvas: HTMLCanvasElement): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addImage(key, canvas as unknown as HTMLImageElement);
  }

  private makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas2D unavailable');
    return [canvas, ctx];
  }

  private generateBerryTiles(): void {
    const frames = 32;
    const [canvas, ctx] = this.makeCanvas(TILE * 8, TILE * 4);

    for (let frame = 0; frame < frames; frame++) {
      const berryType = Math.floor(frame / 4);
      const phase = frame % 4;
      const x = (frame % 8) * TILE;
      const y = Math.floor(frame / 8) * TILE;
      const [light, dark] = BERRY_PALETTES[berryType];

      const pulse = [0.95, 1, 1.04, 1][phase];
      const r = 22 * pulse;
      ctx.save();
      ctx.translate(x + TILE / 2, y + TILE / 2);

      ctx.shadowColor = 'rgba(10, 5, 25, 0.55)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      const grad = ctx.createRadialGradient(-10, -12, 4, 0, 0, r + 2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.22, light);
      grad.addColorStop(1, dark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const innerGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, r - 7);
      innerGlow.addColorStop(0, 'rgba(255,255,255,0.5)');
      innerGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(-8, -10, 8 + phase, 5 + phase * 0.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.addSheetTexture('berry_tiles', canvas, TILE, TILE, 31);
  }

  private generatePowerUps(): void {
    const [canvas, ctx] = this.makeCanvas(TILE * 4, TILE * 4);

    for (let frame = 0; frame < 16; frame++) {
      const type = Math.floor(frame / 4);
      const phase = frame % 4;
      const x = (frame % 4) * TILE;
      const y = Math.floor(frame / 4) * TILE;
      const cx = x + TILE / 2;
      const cy = y + TILE / 2;
      const pulse = 21 + phase;

      ctx.save();
      const gem = ctx.createRadialGradient(cx - 10, cy - 10, 3, cx, cy, pulse + 4);
      gem.addColorStop(0, '#fff9d0');
      gem.addColorStop(0.2, '#ffd0ff');
      gem.addColorStop(1, '#572277');
      ctx.fillStyle = gem;
      ctx.beginPath();
      ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
      ctx.fill();

      if (type === 0 || type === 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 4;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          if (type === 0) {
            ctx.moveTo(cx - 16, cy + i * 7);
            ctx.lineTo(cx + 16, cy + i * 7);
          } else {
            ctx.moveTo(cx + i * 7, cy - 16);
            ctx.lineTo(cx + i * 7, cy + 16);
          }
          ctx.stroke();
        }
      } else if (type === 2) {
        ctx.fillStyle = '#101422';
        ctx.beginPath();
        ctx.arc(cx, cy, pulse - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7b889f';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = '#d67a33';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - 12);
        ctx.lineTo(cx + 14, cy - 22);
        ctx.stroke();
        ctx.fillStyle = phase % 2 ? '#ffd27a' : '#fff7be';
        ctx.beginPath();
        ctx.arc(cx + 16, cy - 24, 4 + phase * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2 + phase * 0.25;
          ctx.strokeStyle = `hsl(${(i * 28 + phase * 30) % 360} 95% 70%)`;
          ctx.beginPath();
          ctx.arc(cx, cy, 6 + i * 0.7, a, a + 0.25);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    this.addSheetTexture('power_ups', canvas, TILE, TILE, 15);
  }

  private generateObstacles(): void {
    const [canvas, ctx] = this.makeCanvas(TILE * 5, TILE * 4);

    for (let frame = 0; frame < 20; frame++) {
      const type = Math.floor(frame / 4);
      const state = frame % 4;
      const x = (frame % 5) * TILE;
      const y = Math.floor(frame / 5) * TILE;
      const cx = x + 32;
      const cy = y + 32;

      if (state === 3) continue;
      if (type === 0) {
        ctx.fillStyle = `rgba(170,220,255,${0.45 - state * 0.1})`;
        ctx.fillRect(x + 6, y + 6, 52, 52);
        ctx.strokeStyle = '#dff5ff';
      } else if (type === 1) {
        ctx.fillStyle = 'rgba(88,95,126,0.35)';
        ctx.fillRect(x + 7, y + 7, 50, 50);
        ctx.strokeStyle = '#d4d7e5';
      } else if (type === 2) {
        ctx.fillStyle = '#8d643f';
        ctx.fillRect(x + 8, y + 8, 48, 48);
        ctx.strokeStyle = '#c09460';
      } else if (type === 3) {
        ctx.fillStyle = '#6d7788';
        ctx.fillRect(x + 7, y + 7, 50, 50);
        ctx.strokeStyle = '#9aa8b8';
      } else {
        ctx.fillStyle = '#2b1f38';
        ctx.fillRect(x + 8, y + 8, 48, 48);
        ctx.strokeStyle = '#7c4abf';
      }

      ctx.lineWidth = 3;
      ctx.strokeRect(x + 8, y + 8, 48, 48);
      if (state > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < state + 1; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 12 + i * 8, y + 12);
          ctx.lineTo(x + 36 + i * 4, y + 52);
          ctx.stroke();
        }
      }
    }

    this.addSheetTexture('obstacles_tiles', canvas, TILE, TILE, 19);
  }

  private generateUiTextures(): void {
    this.addImageTexture('play_button', this.drawButton(420, 132, '#ff8cf5', '#a83bca', 'PLAY'));
    this.addImageTexture('button_bg', this.drawButton(300, 100, '#8d7dff', '#5237c3'));
    this.addImageTexture('button_primary', this.drawButton(300, 100, '#ff8ed8', '#8b3fc6'));
    this.addImageTexture('dialog_box', this.drawPanel(620, 520, '#2a1a4e'));
    this.addImageTexture('victory_banner', this.drawRibbon(500, 150, '#ffd76d', '#b86d00', 'VICTORY'));
    this.addImageTexture('defeat_banner', this.drawRibbon(500, 150, '#8b9bb7', '#3d4960', 'TRY AGAIN'));
    this.addImageTexture('panel', this.drawPanel(700, 180, '#28164d'));
    this.addImageTexture('score_plate', this.drawPanel(200, 90, '#40245f'));
    this.addImageTexture('moves_plate', this.drawPanel(200, 90, '#40245f'));
    this.addImageTexture('progress_bar_bg', this.drawProgress(430, 24, '#28183c'));
    this.addImageTexture('progress_fill', this.drawProgress(420, 16, '#ff79c8', '#ffe57a'));
    this.addImageTexture('pause_button', this.drawPauseButton(96, 96));
    this.addImageTexture('star_full', this.drawStar(80, 80, '#ffe16d', true));
    this.addImageTexture('star_empty', this.drawStar(80, 80, '#8f97a9', false));
    this.addImageTexture('star', this.drawStar(80, 80, '#ffe16d', true));
    this.addImageTexture('title_banner', this.drawRibbon(620, 220, '#ff8ce6', '#6a2c9a', 'OF COURSE YOU WIN'));
    this.addImageTexture('score_bar_bg', this.drawProgress(430, 24, '#271835'));
    this.addImageTexture('score_bar_fill', this.drawProgress(420, 16, '#7cf4ff', '#95ff8f'));
  }

  private generateBackgrounds(): void {
    const { width, height } = this.scale;
    this.addImageTexture('bg_berry_meadow', this.drawBackground(width, height, ['#11361e', '#2b8d3e', '#9ce27f'], 'flowers'));
    this.addImageTexture('bg_frostberry_falls', this.drawBackground(width, height, ['#0e2944', '#2f6faa', '#9ce5ff'], 'snow'));
    this.addImageTexture('bg_sunberry_desert', this.drawBackground(width, height, ['#5d2a16', '#c56f1b', '#ffd17f'], 'dunes'));
    this.addImageTexture('bg_bramble_forest', this.drawBackground(width, height, ['#0e1d12', '#1f4a2f', '#3f7e4f'], 'leaves'));
    this.addImageTexture('bg_starberry_cosmos', this.drawBackground(width, height, ['#190b34', '#46237f', '#a04cdd'], 'stars'));
    this.addImageTexture('bg_title_screen', this.drawBackground(width, height, ['#140c29', '#4c2070', '#ff74da'], 'sparkles'));
    this.addImageTexture('bg_world_map', this.drawBackground(width, 4400, ['#483321', '#8e6c43', '#dac08f'], 'parchment'));
  }

  private generateBoardFrame(): void {
    const [canvas, ctx] = this.makeCanvas(720, 1280);
    ctx.strokeStyle = '#eac56b';
    ctx.lineWidth = 18;
    ctx.strokeRect(112, 336, 496, 496);
    ctx.strokeStyle = '#7f5312';
    ctx.lineWidth = 4;
    ctx.strokeRect(124, 348, 472, 472);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#ffd47a' : '#b57820';
      ctx.beginPath();
      ctx.arc(112 + (i % 6) * 99, i < 6 ? 336 : 832, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    this.addImageTexture('board_frame', canvas);
  }

  private generateParticles(): void {
    const [canvas, ctx] = this.makeCanvas(64 * 8, 64 * 8);
    for (let i = 0; i < 64; i++) {
      const x = (i % 8) * 64 + 32;
      const y = Math.floor(i / 8) * 64 + 32;
      const type = i % 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i % 12) * 0.4);
      if (type === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, 10 - (i % 8), 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 1) {
        ctx.fillStyle = 'rgba(255,245,120,0.9)';
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
          ctx.lineTo(Math.cos(a + 0.4) * 5, Math.sin(a + 0.4) * 5);
        }
        ctx.closePath();
        ctx.fill();
      } else if (type === 2) {
        ctx.strokeStyle = 'rgba(173,255,255,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
        g.addColorStop(0, 'rgba(255,158,220,0.9)'); g.addColorStop(1, 'rgba(255,158,220,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    this.addSheetTexture('particle_sheet', canvas, 64, 64, 63);
  }

  private generateCharacterSheets(): void {
    this.addSheetTexture('yujigo_sprites', this.drawCharacterSheet('#ffcc7a', '#4f2a17'), 64, 64, 17);
    this.addSheetTexture('kirumi_sprites', this.drawCharacterSheet('#9de0ff', '#263059'), 64, 64, 17);
  }

  private generateNpcAndWorldMapSheets(): void {
    const [npc, npcCtx] = this.makeCanvas(64 * 6, 64 * 3);
    for (let i = 0; i < 18; i++) {
      const x = (i % 6) * 64;
      const y = Math.floor(i / 6) * 64;
      npcCtx.fillStyle = '#4a2f1e';
      npcCtx.fillRect(x + 24, y + 18, 16, 30);
      npcCtx.fillStyle = '#f8dcb4';
      npcCtx.fillRect(x + 22, y + 8, 20, 14);
      npcCtx.fillStyle = `hsl(${(i * 18) % 360} 70% 62%)`;
      npcCtx.fillRect(x + 20, y + 22, 24, 18);
    }
    this.addSheetTexture('npc_sprites', npc, 64, 64, 17);

    const [wm, ctx] = this.makeCanvas(64 * 4, 64);
    this.drawMapNode(ctx, 32, 32, '#ffd66f');
    this.drawPathTile(ctx, 96, 32);
    this.drawLandmark(ctx, 160, 32);
    this.drawRibbonIcon(ctx, 224, 32);
    this.addSheetTexture('world_map_elements', wm, 64, 64, 3);
    this.addImageTexture('level_node', this.cropFrame(wm, 0));
    this.addImageTexture('path_tile', this.cropFrame(wm, 1));
    this.addImageTexture('landmark', this.cropFrame(wm, 2));
  }

  private cropFrame(sheet: HTMLCanvasElement, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(64, 64);
    ctx.drawImage(sheet, frame * 64, 0, 64, 64, 0, 0, 64, 64);
    return canvas;
  }

  private drawCharacterSheet(skin: string, hair: string): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(64 * 6, 64 * 3);
    for (let f = 0; f < 18; f++) {
      const x = (f % 6) * 64;
      const y = Math.floor(f / 6) * 64;
      const bob = Math.sin(f * 0.8) * 2;
      ctx.fillStyle = hair;
      ctx.fillRect(x + 20, y + 10 + bob, 24, 14);
      ctx.fillStyle = skin;
      ctx.fillRect(x + 22, y + 16 + bob, 20, 14);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 27, y + 22 + bob, 3, 3); ctx.fillRect(x + 34, y + 22 + bob, 3, 3);
      ctx.fillStyle = '#41231a';
      const mouthY = y + 29 + bob + (f >= 6 && f < 12 ? 1 : f >= 12 ? -1 : 0);
      ctx.fillRect(x + 29, mouthY, 8, 2);
      ctx.fillStyle = `hsl(${(f * 9) % 360} 76% 62%)`;
      ctx.fillRect(x + 20, y + 32 + bob, 24, 18);
      ctx.fillStyle = '#2b2243'; ctx.fillRect(x + 21, y + 50 + bob, 8, 8); ctx.fillRect(x + 35, y + 50 + bob, 8, 8);
    }
    return canvas;
  }

  private drawMapNode(ctx: CanvasRenderingContext2D, x: number, y: number, c: string): void {
    const g = ctx.createRadialGradient(x - 8, y - 8, 3, x, y, 24);
    g.addColorStop(0, '#fff7c6'); g.addColorStop(1, c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7f4f0a'; ctx.lineWidth = 4; ctx.stroke();
  }

  private drawPathTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = '#d0ad6f'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(x - 20, y + 10); ctx.quadraticCurveTo(x, y - 10, x + 20, y + 8); ctx.stroke();
  }

  private drawLandmark(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#4b6ccf'; ctx.fillRect(x - 18, y - 18, 36, 36);
    ctx.fillStyle = '#8ba7ff'; ctx.fillRect(x - 8, y - 28, 16, 10);
  }

  private drawRibbonIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#ff98e6'; ctx.fillRect(x - 22, y - 10, 44, 20);
  }

  private drawButton(width: number, height: number, top: string, bottom: string, label?: string): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(width, height);
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(8, 8, width - 16, height - 16, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.stroke();
    if (label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, width / 2, height / 2 + 2);
    }
    return canvas;
  }

  private drawPanel(width: number, height: number, color: string): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(width, height);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(12, 12, width - 24, height - 24, 28);
    ctx.fill();
    ctx.strokeStyle = '#d3a7ff'; ctx.lineWidth = 4; ctx.stroke();
    return canvas;
  }

  private drawRibbon(width: number, height: number, top: string, bottom: string, text: string): HTMLCanvasElement {
    const c = this.drawButton(width, height, top, bottom);
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.floor(height * 0.25)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }
    return c;
  }

  private drawProgress(width: number, height: number, left: string, right?: string): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(width, height);
    const g = ctx.createLinearGradient(0, 0, width, 0);
    g.addColorStop(0, left); g.addColorStop(1, right ?? left);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 10);
    ctx.fill();
    return canvas;
  }

  private drawPauseButton(width: number, height: number): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(width, height);
    const g = ctx.createRadialGradient(width * 0.35, height * 0.3, 6, width / 2, height / 2, width * 0.5);
    g.addColorStop(0, '#fff7b8'); g.addColorStop(1, '#ff9cf0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(width / 2, height / 2, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#532174';
    ctx.fillRect(width / 2 - 14, height / 2 - 16, 8, 32);
    ctx.fillRect(width / 2 + 6, height / 2 - 16, 8, 32);
    return canvas;
  }

  private drawStar(width: number, height: number, color: string, filled: boolean): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(width, height);
    ctx.translate(width / 2, height / 2);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 26 : 12;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    return canvas;
  }

  private drawBackground(width: number, height: number, colors: [string, string, string], style: string): HTMLCanvasElement {
    const [canvas, ctx] = this.makeCanvas(width, height);
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, colors[0]); g.addColorStop(0.55, colors[1]); g.addColorStop(1, colors[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    for (let i = 0; i < 120; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      if (style === 'flowers') {
        ctx.fillStyle = 'rgba(255,214,236,0.55)';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      } else if (style === 'snow') {
        ctx.strokeStyle = 'rgba(235,249,255,0.65)';
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
      } else if (style === 'stars' || style === 'sparkles') {
        ctx.fillStyle = 'rgba(255,255,220,0.8)';
        ctx.fillRect(x, y, 2, 2);
      } else if (style === 'parchment') {
        ctx.fillStyle = 'rgba(120,80,30,0.12)';
        ctx.fillRect(x, y, 20, 2);
      }
    }

    return canvas;
  }

  private createCharacterAnimations(): void {
    if (!this.anims.exists('yujigo-idle')) {
      this.anims.create({ key: 'yujigo-idle', frames: this.anims.generateFrameNumbers('yujigo_sprites', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'yujigo-happy', frames: this.anims.generateFrameNumbers('yujigo_sprites', { start: 6, end: 11 }), frameRate: 10, repeat: 0 });
      this.anims.create({ key: 'yujigo-excited', frames: this.anims.generateFrameNumbers('yujigo_sprites', { start: 12, end: 17 }), frameRate: 12, repeat: 0 });
      this.anims.create({ key: 'kirumi-idle', frames: this.anims.generateFrameNumbers('kirumi_sprites', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'kirumi-happy', frames: this.anims.generateFrameNumbers('kirumi_sprites', { start: 6, end: 11 }), frameRate: 12, repeat: 0 });
    }
  }
}
