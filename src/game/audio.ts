// Tiny WebAudio synth — no assets, created lazily on first user gesture.
export class Sound {
  muted = false;
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    freq: number,
    opts: {
      type?: OscillatorType;
      dur?: number;
      gain?: number;
      sweep?: number;
      delay?: number;
    } = {},
  ) {
    const ctx = this.ensure();
    if (!ctx) return;
    const { type = "sine", dur = 0.12, gain = 0.14, sweep = 0, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweep) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freq + sweep),
        t0 + dur,
      );
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  private noise(opts: {
    dur?: number;
    gain?: number;
    filterFreq?: number;
    delay?: number;
  } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const { dur = 0.15, gain = 0.18, filterFreq = 1000, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filterFreq;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
  }

  flap() {
    this.tone(430, { type: "sine", dur: 0.1, gain: 0.11, sweep: 230 });
    this.noise({ dur: 0.06, gain: 0.05, filterFreq: 2600 });
  }

  score() {
    this.tone(880, { type: "triangle", dur: 0.09, gain: 0.13 });
    this.tone(1320, { type: "triangle", dur: 0.11, gain: 0.11, delay: 0.08 });
  }

  hit() {
    this.noise({ dur: 0.13, gain: 0.24, filterFreq: 760 });
    this.tone(170, { type: "sine", dur: 0.18, gain: 0.2, sweep: -90 });
  }

  land() {
    this.noise({ dur: 0.12, gain: 0.14, filterFreq: 520 });
  }

  die() {
    this.tone(420, { type: "sine", dur: 0.5, gain: 0.15, sweep: -320, delay: 0.04 });
  }
}
