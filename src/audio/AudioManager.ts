import { biomeForLevel, type BiomeId } from '../config/biomeConfig';

type SoundKey =
  | 'berry_pop'
  | 'berry_land'
  | 'swap_success'
  | 'swap_fail'
  | 'combo_3'
  | 'combo_4'
  | 'combo_5'
  | 'power_stripe'
  | 'power_bomb'
  | 'power_rainbow'
  | 'chain_combo'
  | 'level_complete'
  | 'button_click'
  | 'board_shuffle'
  | 'obstacle_break';

type VoiceKey =
  | 'combo_3'
  | 'combo_4'
  | 'combo_5'
  | 'chain_combo'
  | 'power_up'
  | 'level_complete'
  | 'high_score';

export class AudioManager {
  private static instance: AudioManager;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private beatSec = 0.5;
  private currentBiome: BiomeId = 'berry_meadow';

  private muted = false;
  private volume = 0.85;
  private speechEnabled = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', () => this.unlock(), { once: true });
      window.addEventListener('keydown', () => this.unlock(), { once: true });
    }
  }

  initializeUnlockListeners(): void {
    // Intentionally empty: constructor hooks listeners; this makes call sites explicit.
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.musicBus = this.context.createGain();

      this.sfxGain.gain.value = 0.88;
      this.musicGain.gain.value = 0.45;
      this.musicBus.gain.value = 0;

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.musicBus.connect(this.musicGain);
      this.refreshMasterVolume();
    }

    if (this.context.state === 'suspended') await this.context.resume();
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.refreshMasterVolume();
    if (muted) window.speechSynthesis?.cancel();
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    this.refreshMasterVolume();
  }

  playSfx(sound: SoundKey, intensity = 1): void {
    if (!this.context || !this.sfxGain || this.muted) return;
    const now = this.context.currentTime;
    const clampIntensity = Math.max(0.5, Math.min(2, intensity));

    switch (sound) {
      case 'berry_pop':
        this.pitchSweep('sine', 800, 200, 0.1, 0.22 * clampIntensity, now);
        this.noiseBurst('bandpass', 1500, 0.05, 0.12 * clampIntensity, now);
        break;
      case 'berry_land':
        this.oneShot('sine', 150, 0.05, 0.09 * clampIntensity, now, 20);
        break;
      case 'swap_success':
        this.oneShot('sine', 523.25, 0.08, 0.14 * clampIntensity, now);
        this.oneShot('sine', 659.25, 0.08, 0.14 * clampIntensity, now + 0.08);
        break;
      case 'swap_fail':
        this.pitchSweep('sine', 400, 300, 0.2, 0.16 * clampIntensity, now, 24);
        break;
      case 'combo_3':
        this.comboNotes([523.25, 659.25, 783.99], now, 0.06, 0.2 * clampIntensity, false);
        break;
      case 'combo_4':
        this.comboNotes([523.25, 659.25, 783.99, 1046.5], now, 0.065, 0.22 * clampIntensity, true);
        break;
      case 'combo_5':
        this.comboNotes([523.25, 659.25, 783.99, 1046.5, 1318.51], now, 0.07, 0.25 * clampIntensity, true);
        this.noiseBurst('highpass', 4200, 0.25, 0.07 * clampIntensity, now);
        break;
      case 'power_stripe':
        this.noiseBurst('highpass', 2800, 0.15, 0.14 * clampIntensity, now);
        this.pitchSweep('sine', 2000, 500, 0.15, 0.12 * clampIntensity, now);
        break;
      case 'power_bomb':
        this.pitchSweep('sine', 80, 40, 0.3, 0.34 * clampIntensity, now);
        this.noiseBurst('lowpass', 600, 0.28, 0.26 * clampIntensity, now);
        this.distortedThump(52, 0.26, 0.18 * clampIntensity, now);
        break;
      case 'power_rainbow':
        this.pitchSweep('sine', 300, 1200, 0.5, 0.2 * clampIntensity, now, 7, 0.012);
        this.noiseBurst('bandpass', 2600, 0.28, 0.06 * clampIntensity, now + 0.1);
        break;
      case 'chain_combo':
        for (let i = 0; i < 4; i++) this.oneShot('triangle', 320 + i * 80, 0.05, 0.1 * clampIntensity, now + i * 0.06);
        break;
      case 'level_complete':
        this.comboNotes([523.25, 659.25, 783.99, 1046.5], now, 0.2, 0.22 * clampIntensity, true);
        break;
      case 'button_click':
        this.oneShot('triangle', 1000, 0.03, 0.1, now);
        break;
      case 'board_shuffle':
        this.noiseBurst('bandpass', 1000, 0.3, 0.16 * clampIntensity, now, 400, 2100);
        break;
      case 'obstacle_break':
        this.noiseBurst('highpass', 1800, 0.2, 0.2 * clampIntensity, now, 600, 4200);
        break;
      default:
        break;
    }
  }

  announce(event: VoiceKey): void {
    if (!this.speechEnabled || this.muted || typeof window === 'undefined' || !window.speechSynthesis) return;
    const mapping: Record<VoiceKey, string> = {
      combo_3: 'Sweet!',
      combo_4: 'Amazing!',
      combo_5: 'Berry Blast!',
      chain_combo: 'Incredible!',
      power_up: 'Combo!',
      level_complete: 'Level Complete!',
      high_score: 'Fantastic!',
    };

    const utterance = new SpeechSynthesisUtterance(mapping[event]);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => /female|zira|samantha|karen|moira|aria/i.test(v.name));
    if (voice) utterance.voice = voice;
    utterance.pitch = 1.5;
    utterance.rate = 1.2;
    utterance.volume = this.muted ? 0 : Math.max(0.3, this.volume);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  startMusic(level: number): void {
    if (!this.context || !this.musicBus) return;
    this.currentBiome = biomeForLevel(level);
    this.configureTheme(this.currentBiome);
    this.stopMusic();
    this.musicStep = 0;
    this.musicBus.gain.cancelScheduledValues(this.context.currentTime);
    this.musicBus.gain.setValueAtTime(0, this.context.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(1, this.context.currentTime + 0.3);
    this.musicTimer = window.setInterval(() => this.scheduleMusicStep(), this.beatSec * 1000);
    this.scheduleMusicStep();
  }

  stopMusic(): void {
    if (!this.context || !this.musicBus) return;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicBus.gain.cancelScheduledValues(this.context.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);
  }

  private configureTheme(biome: BiomeId): void {
    const settings: Record<BiomeId, { bpm: number }> = {
      berry_meadow: { bpm: 120 },
      frostberry_falls: { bpm: 110 },
      sunberry_desert: { bpm: 124 },
      bramble_forest: { bpm: 116 },
      starberry_cosmos: { bpm: 128 },
    };
    this.beatSec = 60 / settings[biome].bpm;
  }

  private scheduleMusicStep(): void {
    if (!this.context || !this.musicBus || this.muted) return;
    const t = this.context.currentTime + 0.02;
    const keys: Record<BiomeId, number> = {
      berry_meadow: 261.63,
      frostberry_falls: 246.94,
      sunberry_desert: 293.66,
      bramble_forest: 220,
      starberry_cosmos: 329.63,
    };
    const root = keys[this.currentBiome];
    const pentatonic = [0, 2, 4, 7, 9, 12];
    const melody = pentatonic[(this.musicStep * 2) % pentatonic.length];
    const bass = [0, 0, 7, 5][this.musicStep % 4];
    const chordOffsets = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [4, 7, 11]][this.musicStep % 4];

    this.noteWithGain('triangle', this.freq(root, melody), 0.18, 0.1, t, this.musicBus);
    this.noteWithGain('sine', this.freq(root / 2, bass), 0.35, 0.11, t, this.musicBus);
    chordOffsets.forEach((n, idx) => this.padNote(this.freq(root / 2, n), 0.52, 0.028, t + idx * 0.01));

    this.musicStep = (this.musicStep + 1) % 16;
  }

  private refreshMasterVolume(): void {
    if (!this.masterGain || !this.context) return;
    const target = this.muted ? 0 : this.volume;
    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(target, this.context.currentTime + 0.05);
  }

  private comboNotes(notes: number[], start: number, dur: number, gain: number, harmonics: boolean): void {
    notes.forEach((freq, idx) => {
      const t = start + idx * dur;
      this.oneShot('sine', freq, dur, gain, t);
      this.oneShot('triangle', freq * 2, dur * 0.7, gain * 0.3, t);
      if (harmonics) this.oneShot('sine', freq * 1.5, dur * 0.65, gain * 0.22, t);
    });
  }

  private oneShot(type: OscillatorType, freq: number, duration: number, gainAmount: number, when: number, vibratoHz = 0): void {
    if (!this.context || !this.sfxGain) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    if (vibratoHz > 0) {
      const vibrato = this.context.createOscillator();
      const vibratoDepth = this.context.createGain();
      vibrato.frequency.value = vibratoHz;
      vibratoDepth.gain.value = 12;
      vibrato.connect(vibratoDepth).connect(osc.frequency);
      vibrato.start(when);
      vibrato.stop(when + duration);
    }

    gain.gain.setValueAtTime(gainAmount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    osc.connect(gain).connect(this.sfxGain);
    osc.start(when);
    osc.stop(when + duration);
  }

  private pitchSweep(type: OscillatorType, startFreq: number, endFreq: number, duration: number, gainAmount: number, when: number, vibratoHz = 0, chorusDelay = 0): void {
    if (!this.context || !this.sfxGain) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), when + duration);

    gain.gain.setValueAtTime(gainAmount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    if (vibratoHz > 0) {
      const lfo = this.context.createOscillator();
      const lfoGain = this.context.createGain();
      lfo.frequency.value = vibratoHz;
      lfoGain.gain.value = 10;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(when);
      lfo.stop(when + duration);
    }

    if (chorusDelay > 0) {
      const delay = this.context.createDelay();
      delay.delayTime.value = chorusDelay;
      osc.connect(gain);
      gain.connect(delay);
      delay.connect(this.sfxGain);
      gain.connect(this.sfxGain);
    } else {
      osc.connect(gain).connect(this.sfxGain);
    }

    osc.start(when);
    osc.stop(when + duration);
  }

  private noiseBurst(filterType: BiquadFilterType, baseFreq: number, duration: number, gainAmount: number, when: number, startSweep?: number, endSweep?: number): void {
    if (!this.context || !this.sfxGain) return;
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;

    const src = this.context.createBufferSource();
    src.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(startSweep ?? baseFreq, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, endSweep ?? baseFreq), when + duration);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(gainAmount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    src.connect(filter).connect(gain).connect(this.sfxGain);
    src.start(when);
    src.stop(when + duration);
  }

  private distortedThump(freq: number, duration: number, gainAmount: number, when: number): void {
    if (!this.context || !this.sfxGain) return;
    const osc = this.context.createOscillator();
    const drive = this.context.createWaveShaper();
    const gain = this.context.createGain();
    const curve = new Float32Array(512);
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1;
      curve[i] = ((Math.PI + 8) * x) / (Math.PI + 8 * Math.abs(x));
    }
    drive.curve = curve;

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(gainAmount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    osc.connect(drive).connect(gain).connect(this.sfxGain);
    osc.start(when);
    osc.stop(when + duration);
  }

  private noteWithGain(type: OscillatorType, freq: number, duration: number, gainAmount: number, when: number, target: AudioNode): void {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainAmount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(target);
    osc.start(when);
    osc.stop(when + duration);
  }

  private padNote(freq: number, duration: number, gainAmount: number, when: number): void {
    if (!this.context || !this.musicBus) return;
    const osc = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(gainAmount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(filter).connect(gain).connect(this.musicBus);
    osc.start(when);
    osc.stop(when + duration);
  }

  private freq(root: number, semitones: number): number {
    return root * 2 ** (semitones / 12);
  }
}

export const audioManager = AudioManager.getInstance();
