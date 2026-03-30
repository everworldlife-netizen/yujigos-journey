import { getTileTextureKey, TILE_STATES } from '../../config/AssetConfig.js';

export default class Tile {
  constructor(scene, { type, row, col, sprite, special = null }) {
    this.scene = scene;
    this.type = type;
    this.row = row;
    this.col = col;
    this.special = special;
    this.sprite = sprite;
  }

  static createSprite(scene, type, x, y, tileSize) {
    const baseKey = getTileTextureKey(type, 'normal');
    const textureKey = scene.textures.exists(baseKey) ? baseKey : '__MISSING';
    const sprite = scene.add.image(x, y, textureKey).setDepth(5).setDisplaySize(tileSize, tileSize);
    sprite.setData('type', type);
    sprite.setData('state', 'normal');
    sprite.setData('frozen', false);
    return sprite;
  }

  setState(state = 'normal') {
    const nextState = this.sprite.getData('frozen') ? 'frozen' : (TILE_STATES.includes(state) ? state : 'normal');
    const key = getTileTextureKey(this.type, nextState);
    if (key && this.scene.textures.exists(key)) this.sprite.setTexture(key);
    this.sprite.setData('state', nextState);
  }

  setFrozen(isFrozen) {
    this.sprite.setData('frozen', Boolean(isFrozen));
    this.setState(isFrozen ? 'frozen' : 'normal');
  }

  setPosition(row, col, x, y) {
    this.row = row;
    this.col = col;
    this.sprite.setPosition(x, y);
  }

  playIdleTween() {
    const tween = this.scene.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 2600,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        const baseY = this.sprite.getData('baseY') ?? this.sprite.y;
        const phase = this.sprite.getData('idlePhase') ?? 0;
        const rotPhase = this.sprite.getData('idleRotPhase') ?? 0;
        const amplitude = this.sprite.getData('idleAmplitude') ?? 1.8;
        const rotAmplitude = this.sprite.getData('idleRotAmplitude') ?? 1;
        this.sprite.y = baseY + Math.sin(t + phase) * amplitude;
        this.sprite.angle = Math.sin(t * 0.5 + rotPhase) * rotAmplitude;
      }
    });
    this.sprite.setData('idleTween', tween);
  }

  pauseIdle() {
    const tween = this.sprite.getData('idleTween');
    if (tween) {
      tween.stop();
      this.sprite.setData('idleTween', null);
    }
  }

  resumeIdle() {
    this.pauseIdle();
    this.playIdleTween();
  }

  destroy() {
    const specialSprite = this.sprite.getData('specialSprite');
    if (specialSprite) specialSprite.destroy();
    this.sprite.destroy();
  }
}
