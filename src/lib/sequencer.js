/**
 * Pattern generator and playback scheduler.
 *
 * Notes are scheduled ahead of time on the audio clock (a timer alone drifts
 * audibly), while a requestAnimationFrame loop drains a parallel queue so the
 * fretboard highlight lands on the same beat the listener hears.
 */

const LOOKAHEAD_SECONDS = 0.18;
const TICK_MS = 25;

/** All orderings of [0..n-1], lexicographic. */
export function permutations(n) {
  if (n <= 1) return [[0]];
  const out = [];
  const walk = (prefix, rest) => {
    if (!rest.length) {
      out.push(prefix);
      return;
    }
    rest.forEach((value, i) => {
      walk([...prefix, value], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    });
  };
  walk([], Array.from({ length: n }, (_, i) => i));
  return out;
}

export const permutationLabel = (perm) => perm.map((i) => i + 1).join('');

/**
 * Every note of the selection, ascending, within the instrument's range.
 *
 * @param {object} o
 * @param {number} o.rootPc        root pitch class
 * @param {number[]} o.intervals   semitones above the root
 * @param {number} o.lowMidi       lowest note on the instrument
 * @param {number} o.highMidi      highest note on the instrument
 * @param {number} o.octaves       how many octaves to span
 */
export function notePool({ rootPc, intervals, lowMidi, highMidi, octaves }) {
  let start = lowMidi;
  while (((start % 12) + 12) % 12 !== rootPc) start += 1;
  // Prefer starting an octave lower when the instrument allows it, so a
  // one-octave run sits in a comfortable register rather than up at the top.
  if (start - 12 >= lowMidi && start + octaves * 12 > highMidi) start -= 12;

  const pool = [];
  for (let octave = 0; octave < octaves; octave += 1) {
    for (const semitones of intervals) {
      const midi = start + octave * 12 + semitones;
      if (midi <= highMidi) pool.push(midi);
    }
  }
  pool.push(start + octaves * 12 <= highMidi ? start + octaves * 12 : pool[pool.length - 1]);
  return [...new Set(pool)].sort((a, b) => a - b);
}

/**
 * Turn a pool into a melodic pattern.
 *
 * @param {number[]} pool
 * @param {object} o
 * @param {number} o.length     notes per group
 * @param {number} o.jump       scale steps between notes inside a group
 * @param {number[]} o.perm     ordering applied within each group
 * @param {'up'|'down'|'updown'|'downup'|'random'} o.direction
 */
export function buildSequence(pool, { length = 1, jump = 1, perm = [0], direction = 'up' }) {
  if (!pool.length) return [];
  const span = (length - 1) * jump;
  const order = perm.length === length ? perm : Array.from({ length }, (_, i) => i);

  const ascending = [];
  for (let start = 0; start + span < pool.length; start += 1) {
    const group = Array.from({ length }, (_, k) => pool[start + k * jump]);
    ascending.push(order.map((i) => group[i]));
  }
  if (!ascending.length) ascending.push([pool[0]]);

  const descending = [];
  for (let start = pool.length - 1; start - span >= 0; start -= 1) {
    const group = Array.from({ length }, (_, k) => pool[start - k * jump]);
    descending.push(order.map((i) => group[i]));
  }

  switch (direction) {
    case 'down':
      return descending.flat();
    case 'updown':
      return [...ascending, ...descending.slice(1)].flat();
    case 'downup':
      return [...descending, ...ascending.slice(1)].flat();
    case 'random': {
      const shuffled = [...ascending];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.flat();
    }
    default:
      return ascending.flat();
  }
}

export class Sequencer {
  constructor(audio) {
    this.audio = audio;
    this.playing = false;
    this.notes = [];
    this.tempo = 90;
    this.notesPerBeat = 2;
    this.loop = false;
    this.countIn = false;
    this.metronome = false;
    this.onNote = () => {};
    this.onStop = () => {};
    this._timer = null;
    this._tailTimer = null;
    this._frame = null;
    this._queue = [];
  }

  /** @param {number[]} notes MIDI numbers in playback order */
  setNotes(notes) {
    this.notes = notes;
  }

  start() {
    if (this.playing) return;
    if (!this.notes.length) return;
    this.audio.ensure();
    this.playing = true;
    this._index = 0;
    this._queue = [];

    const beat = 60 / this.tempo;
    this._noteDuration = beat / this.notesPerBeat;
    this._nextNoteTime = this.audio.time + 0.12;

    if (this.countIn) {
      for (let i = 0; i < 4; i += 1) {
        this.audio.click(this._nextNoteTime + i * beat, i === 0);
      }
      this._nextNoteTime += 4 * beat;
    }
    this._nextBeatTime = this._nextNoteTime;

    this._timer = window.setInterval(() => this._schedule(), TICK_MS);
    this._schedule();
    this._drain();
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    window.clearInterval(this._timer);
    window.clearTimeout(this._tailTimer);
    window.cancelAnimationFrame(this._frame);
    this._timer = null;
    this._tailTimer = null;
    this._frame = null;
    this._queue = [];
    this.audio.stopAll();
    this.onStop();
  }

  _schedule() {
    if (!this.playing) return;
    const horizon = this.audio.time + LOOKAHEAD_SECONDS;
    const beat = 60 / this.tempo;

    while (this._nextNoteTime < horizon) {
      if (this._index >= this.notes.length) {
        if (!this.loop) {
          // Let the tail ring out, then tear down.
          const endsAt = this._nextNoteTime;
          window.clearInterval(this._timer);
          this._timer = null;
          const remaining = Math.max(0, (endsAt - this.audio.time) * 1000);
          this._tailTimer = window.setTimeout(() => this.stop(), remaining + 400);
          return;
        }
        this._index = 0;
      }

      const midi = this.notes[this._index];
      this.audio.play(midi, this._nextNoteTime, 0.62, this._noteDuration * 1.9);
      this._queue.push({ midi, index: this._index, time: this._nextNoteTime });

      if (this.metronome) {
        while (this._nextBeatTime <= this._nextNoteTime + 1e-6) {
          this.audio.click(this._nextBeatTime, false);
          this._nextBeatTime += beat;
        }
      }

      this._index += 1;
      this._nextNoteTime += this._noteDuration;
    }
  }

  _drain() {
    const step = () => {
      if (!this.playing) return;
      const now = this.audio.time;
      while (this._queue.length && this._queue[0].time <= now) {
        this.onNote(this._queue.shift());
      }
      this._frame = window.requestAnimationFrame(step);
    };
    this._frame = window.requestAnimationFrame(step);
  }
}
