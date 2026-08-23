/**
 * Plucked-string synthesis and metronome.
 *
 * Notes use a Karplus-Strong delay line rendered into an AudioBuffer once per
 * pitch, then cached. Buffers are the only expensive part of playback, so the
 * cache is capped and evicted oldest-first.
 */

import { midiToFreq } from './theory.js';

const MAX_CACHED_BUFFERS = 64;
const NOTE_SECONDS = 2.4;

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.buffers = new Map();
    this.active = new Set();
  }

  /** Browsers require a user gesture before audio can start. */
  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -8;
      limiter.knee.value = 6;
      limiter.ratio.value = 8;
      this.master.connect(limiter).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  get time() {
    return this.ensure().currentTime;
  }

  buffer(midi) {
    const cached = this.buffers.get(midi);
    if (cached) return cached;

    const ctx = this.ensure();
    const rate = ctx.sampleRate;
    const freq = midiToFreq(midi);
    const period = Math.max(2, Math.round(rate / freq));
    const length = Math.floor(rate * NOTE_SECONDS);
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);

    // Excitation: noise burst softened by a one-pole lowpass so the attack is
    // string-like rather than a click. Higher notes get a brighter burst.
    const line = new Float32Array(period);
    const brightness = Math.min(0.9, 0.25 + (midi - 28) / 90);
    let smooth = 0;
    for (let i = 0; i < period; i += 1) {
      const noise = Math.random() * 2 - 1;
      smooth += (noise - smooth) * brightness;
      line[i] = smooth;
    }

    // Higher pitches decay faster, which keeps chords from turning to mud.
    const damping = Math.max(0.9, 0.9995 - freq / 90000);
    let read = 0;
    for (let i = 0; i < length; i += 1) {
      const current = line[read];
      const next = line[(read + 1) % period];
      line[read] = (current + next) * 0.5 * damping;
      out[i] = current;
      read = (read + 1) % period;
    }

    // Tail fade so a truncated buffer never ends on a discontinuity.
    const fade = Math.floor(rate * 0.25);
    for (let i = 0; i < fade; i += 1) {
      out[length - fade + i] *= 1 - i / fade;
    }

    if (this.buffers.size >= MAX_CACHED_BUFFERS) {
      this.buffers.delete(this.buffers.keys().next().value);
    }
    this.buffers.set(midi, buffer);
    return buffer;
  }

  /**
   * @param {number} midi   pitch to pluck
   * @param {number} when   context time, defaults to now
   * @param {number} gain   0..1
   * @param {number} [duration] seconds before the note is released
   */
  play(midi, when = 0, gain = 0.7, duration = 0) {
    const ctx = this.ensure();
    const at = when || ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.buffer(midi);
    const amp = ctx.createGain();
    amp.gain.value = gain;
    source.connect(amp).connect(this.master);
    source.start(at);
    if (duration > 0) {
      const release = at + duration;
      amp.gain.setValueAtTime(gain, release);
      amp.gain.exponentialRampToValueAtTime(0.0001, release + 0.14);
      source.stop(release + 0.16);
    }
    const voice = { source, amp };
    this.active.add(voice);
    source.onended = () => this.active.delete(voice);
    return voice;
  }

  click(when = 0, accent = false) {
    const ctx = this.ensure();
    const at = when || ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1600 : 1050;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(accent ? 0.28 : 0.16, at + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    osc.connect(amp).connect(this.master);
    osc.start(at);
    osc.stop(at + 0.07);
  }

  stopAll() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.active.forEach(({ source, amp }) => {
      try {
        amp.gain.cancelScheduledValues(now);
        amp.gain.setValueAtTime(amp.gain.value, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        source.stop(now + 0.1);
      } catch {
        /* already stopped */
      }
    });
    this.active.clear();
  }
}

export const audio = new AudioEngine();
