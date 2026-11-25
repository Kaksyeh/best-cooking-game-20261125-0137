// audio.js — synthesized WebAudio sound effects. No audio files, no network.
// One job: every sound the kitchen makes, and the mute switch.

let ctx = null;
let master = null;
let sizzleNodes = null;

export const sfx = {
  muted: false,

  ensure() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch {
      // No audio available; the game plays silent.
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (master) master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!ctx || this.muted) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Ignore audio errors.
    }
  },

  noise(dur, vol, filterFreq) {
    if (!ctx || this.muted) return;
    try {
      const t0 = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq || 1200;
      const gain = ctx.createGain();
      gain.gain.value = vol || 0.25;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
    } catch {
      // Ignore audio errors.
    }
  },

  click() {
    this.tone(660, 0.07, 'triangle', 0.15);
  },

  chop() {
    this.noise(0.09, 0.35, 900);
    this.tone(140, 0.09, 'sine', 0.3, 0, 70);
  },

  pickup() {
    this.tone(520, 0.08, 'triangle', 0.14);
  },

  place() {
    this.tone(300, 0.1, 'triangle', 0.16, 0, 220);
  },

  bell() {
    this.tone(880, 0.5, 'sine', 0.22);
    this.tone(1318, 0.4, 'sine', 0.14, 0.05);
  },

  chime() {
    this.tone(523, 0.16, 'sine', 0.2);
    this.tone(659, 0.16, 'sine', 0.2, 0.09);
    this.tone(784, 0.3, 'sine', 0.22, 0.18);
  },

  buzz() {
    this.tone(180, 0.3, 'sawtooth', 0.14, 0, 110);
  },

  tick() {
    this.tone(980, 0.05, 'square', 0.06);
  },

  sizzle(on) {
    if (!ctx) return;
    try {
      if (on && !sizzleNodes) {
        const len = ctx.sampleRate;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2500;
        const gain = ctx.createGain();
        gain.gain.value = this.muted ? 0 : 0.045;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        src.start();
        sizzleNodes = { src, gain };
      } else if (!on && sizzleNodes) {
        sizzleNodes.src.stop();
        sizzleNodes = null;
      } else if (sizzleNodes) {
        sizzleNodes.gain.gain.value = this.muted ? 0 : 0.045;
      }
    } catch {
      // Ignore audio errors.
    }
  },
};
