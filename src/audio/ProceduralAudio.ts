export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private started = false;

  start(): void {
    if (this.started) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.2;
    this.master.connect(this.ctx.destination);
    this.started = true;
    this.startMusicLoop();
  }

  private beep(freq: number, duration = 0.08, type: OscillatorType = 'sine', when = 0): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  swap(): void { this.beep(320, 0.07, 'triangle'); }
  invalid(): void { this.beep(160, 0.1, 'sawtooth'); }
  special(): void { this.beep(780, 0.18, 'square'); this.beep(1040, 0.2, 'triangle', 0.05); }
  combo(chain: number): void {
    this.beep(440 + chain * 60, 0.1, 'triangle');
    if (chain >= 2) this.beep(620 + chain * 70, 0.12, 'triangle', 0.04);
  }

  private startMusicLoop(): void {
    const notes = [220, 277, 330, 392, 440, 392, 330, 277];
    let index = 0;
    const play = () => {
      this.beep(notes[index % notes.length], 0.25, 'sine');
      index += 1;
      setTimeout(play, 400);
    };
    play();
  }
}
