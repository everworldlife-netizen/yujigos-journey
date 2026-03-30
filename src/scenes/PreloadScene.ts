import Phaser from 'phaser';

const GEM_SIZE = 48;
const GEM_COLORS = [
  { name: 'red', color: '#ff4d5a' },
  { name: 'blue', color: '#3f7cff' },
  { name: 'green', color: '#35d16f' },
  { name: 'yellow', color: '#ffd84a' },
  { name: 'purple', color: '#a45bff' },
  { name: 'orange', color: '#ff9a3d' },
  { name: 'cyan', color: '#37d9ff' },
  { name: 'pink', color: '#ff65c5' },
] as const;

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height * 0.8, width * 0.55, 20, 0x3d2658).setOrigin(0.5);
    const bar = this.add.rectangle(barBg.x - barBg.width / 2, barBg.y, 2, 14, 0xfaf4ff).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = Math.max(2, (barBg.width - 6) * v); });
    this.load.on('complete', () => {
      this.generateTextures();
      this.scene.start('LevelSelect');
    });

    // Explicitly complete load flow so procedural textures are generated before any gameplay scene starts.
    this.load.start();
  }

  private generateTextures(): void {
    GEM_COLORS.forEach((gem, index) => {
      this.createGemTexture(`gem-${index}`, gem.color);
      this.createSpecialGemTexture(`gem-${index}-lineH`, gem.color, 'lineH');
      this.createSpecialGemTexture(`gem-${index}-lineV`, gem.color, 'lineV');
      this.createSpecialGemTexture(`gem-${index}-bomb`, gem.color, 'bomb');
      this.createSpecialGemTexture(`gem-${index}-color`, gem.color, 'color');
    });

    this.createFxTextures();
  }

  private createGemTexture(key: string, colorHex: string): void {
    const canvas = this.textures.createCanvas(key, GEM_SIZE, GEM_SIZE);
    if (!canvas) return;

    const ctx = canvas.context;
    const center = GEM_SIZE / 2;
    const radius = center - 2;

    ctx.clearRect(0, 0, GEM_SIZE, GEM_SIZE);

    const gradient = ctx.createRadialGradient(center - 8, center - 8, 4, center, center, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.22, this.mix('#ffffff', colorHex, 0.48));
    gradient.addColorStop(0.75, colorHex);
    gradient.addColorStop(1, this.darken(colorHex, 0.38));

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, radius - 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.drawHighlight(ctx);
    canvas.refresh();
  }

  private createSpecialGemTexture(key: string, colorHex: string, special: 'lineH' | 'lineV' | 'bomb' | 'color'): void {
    const canvas = this.textures.createCanvas(key, GEM_SIZE, GEM_SIZE);
    if (!canvas) return;

    const ctx = canvas.context;
    const center = GEM_SIZE / 2;
    const radius = center - 2;

    ctx.clearRect(0, 0, GEM_SIZE, GEM_SIZE);

    const gradient = ctx.createRadialGradient(center - 8, center - 8, 4, center, center, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.25, this.mix('#ffffff', colorHex, 0.55));
    gradient.addColorStop(0.72, colorHex);
    gradient.addColorStop(1, this.darken(colorHex, 0.45));

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, radius - 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    if (special === 'lineH') {
      ctx.fillRect(10, center - 3, GEM_SIZE - 20, 6);
    } else if (special === 'lineV') {
      ctx.fillRect(center - 3, 10, 6, GEM_SIZE - 20);
    } else if (special === 'bomb') {
      ctx.beginPath();
      ctx.arc(center, center + 1, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(center + 6, center - 10, 4, 6);
    } else {
      const colors = ['#ff4d5a', '#ff9a3d', '#ffd84a', '#35d16f', '#37d9ff', '#3f7cff', '#ff65c5'];
      ctx.lineWidth = 4;
      const segment = (Math.PI * 2) / colors.length;
      colors.forEach((ringColor, i) => {
        ctx.strokeStyle = ringColor;
        ctx.beginPath();
        ctx.arc(center, center, 10, i * segment, (i + 1) * segment);
        ctx.stroke();
      });
    }
    ctx.restore();

    this.drawHighlight(ctx);
    canvas.refresh();
  }

  private drawHighlight(ctx: CanvasRenderingContext2D): void {
    const shine = ctx.createRadialGradient(16, 14, 0, 16, 14, 11);
    shine.addColorStop(0, 'rgba(255,255,255,0.95)');
    shine.addColorStop(0.55, 'rgba(255,255,255,0.45)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(16, 14, 11, 0, Math.PI * 2);
    ctx.fillStyle = shine;
    ctx.fill();
  }


  private mix(fromHex: string, toHex: string, t: number): string {
    const from = Phaser.Display.Color.HexStringToColor(fromHex);
    const to = Phaser.Display.Color.HexStringToColor(toHex);
    const r = Math.round(from.red + (to.red - from.red) * t);
    const g = Math.round(from.green + (to.green - from.green) * t);
    const b = Math.round(from.blue + (to.blue - from.blue) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private darken(hex: string, amount: number): string {
    const c = Phaser.Display.Color.HexStringToColor(hex);
    const r = Math.max(0, Math.floor(c.red * (1 - amount)));
    const g = Math.max(0, Math.floor(c.green * (1 - amount)));
    const b = Math.max(0, Math.floor(c.blue * (1 - amount)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  private createFxTextures(): void {
    const fx = this.add.graphics();
    fx.fillStyle(0xffffff, 1);
    fx.fillCircle(6, 6, 5);
    fx.generateTexture('spark', 12, 12);
    fx.clear();
    fx.fillStyle(0xffffff, 0.65);
    fx.fillRect(0, 0, 8, 32);
    fx.generateTexture('ray', 8, 32);
    fx.clear();
    fx.fillStyle(0x273042, 1);
    fx.fillRoundedRect(0, 0, 60, 60, 12);
    fx.lineStyle(2, 0x8ec7ff, 0.5);
    fx.strokeRoundedRect(2, 2, 56, 56, 11);
    fx.generateTexture('stone', 60, 60);
    fx.destroy();
  }
}
