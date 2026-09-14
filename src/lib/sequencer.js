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

/** Click subdivisions: label plus how many clicks fall on each beat. */
export const CLICK_RHYTHMS = [
  ['1/4', 1],
  ['1/8', 2],
  ['1/8T', 3],
  ['1/16', 4],
];

/**
 * Meters the metronome can count. `beats` is clicks per bar; `accents` marks
 * the group starts inside the bar. Beat 0 is always the downbeat, so it isn't
 * listed. The grouped odd meters are where this matters: 7/8 (3+2+2) leans on
 * beats 4 and 6, which is what makes it sound like 7 rather than seven 1s.
 */
export const METERS = [
  { id: '2/4', beats: 2, accents: [], group: 'Simple' },
  { id: '3/4', beats: 3, accents: [], group: 'Simple' },
  { id: '4/4', beats: 4, accents: [], group: 'Simple' },
  { id: '5/4', beats: 5, accents: [3], group: 'Simple' },
  { id: '6/4', beats: 6, accents: [3], group: 'Simple' },
  { id: '7/4', beats: 7, accents: [4], group: 'Simple' },
  { id: '6/8', beats: 6, accents: [3], group: 'Compound' },
  { id: '9/8', beats: 9, accents: [3, 6], group: 'Compound' },
  { id: '12/8', beats: 12, accents: [3, 6, 9], group: 'Compound' },
  { id: '5/8 (3+2)', beats: 5, accents: [3], group: 'Grouped' },
  { id: '5/8 (2+3)', beats: 5, accents: [2], group: 'Grouped' },
  { id: '7/8 (3+2+2)', beats: 7, accents: [3, 5], group: 'Grouped' },
  { id: '7/8 (2+3+2)', beats: 7, accents: [2, 5], group: 'Grouped' },
  { id: '7/8 (2+2+3)', beats: 7, accents: [2, 4], group: 'Grouped' },
];

export const METER_GROUPS = ['Simple', 'Compound', 'Grouped'];

export const findMeter = (id) => METERS.find((m) => m.id === id) ?? METERS[2];

/**
 * Standalone click track: just the metronome, no notes.
 *
 * Clicks are scheduled on the audio clock like the sequencer's are, and the
 * beat callback is drained on a frame loop so the indicator lights land on the
 * beat the listener hears rather than when the click was queued.
 */
export class MetronomeClock {
  constructor(audio) {
    this.audio = audio;
    this.playing = false;
    this.tempo = 90;
    this.beats = 4;
    this.accents = [];
    this.subdivision = 1;
    this.sound = 'blip';
    this.onBeat = () => {};
    this._timer = null;
    this._frame = null;
    this._queue = [];
    this._step = 0;
  }

  setTempo(tempo) {
    this.tempo = tempo;
  }

  /** Meter and subdivision changes restart the bar so the accents stay put. */
  configure(patch) {
    const regrid = 'beats' in patch || 'subdivision' in patch;
    const changed =
      (patch.beats !== undefined && patch.beats !== this.beats) ||
      (patch.subdivision !== undefined && patch.subdivision !== this.subdivision);
    Object.assign(this, patch);
    if (regrid && changed) this._step = 0;
  }

  start(tempo = this.tempo) {
    if (this.playing) return;
    this.tempo = tempo;
    this.audio.ensure();
    this.playing = true;
    this._step = 0;
    this._queue = [];
    this._nextStepTime = this.audio.time + 0.1;
    this._timer = window.setInterval(() => this._schedule(), TICK_MS);
    this._schedule();
    this._drain();
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    window.clearInterval(this._timer);
    window.cancelAnimationFrame(this._frame);
    this._timer = null;
    this._frame = null;
    this._queue = [];
  }

  level(beat, isSub) {
    if (isSub) return 'sub';
    if (beat === 0) return 'accent';
    return this.accents.includes(beat) ? 'group' : 'beat';
  }

  _schedule() {
    if (!this.playing) return;
    const horizon = this.audio.time + LOOKAHEAD_SECONDS;
    while (this._nextStepTime < horizon) {
      const position = this._step % (this.beats * this.subdivision);
      const beat = Math.floor(position / this.subdivision);
      const isSub = position % this.subdivision !== 0;
      const level = this.level(beat, isSub);
      this.audio.click(this._nextStepTime, level, this.sound);
      this._queue.push({ beat, isSub, level, time: this._nextStepTime });
      this._step += 1;
      this._nextStepTime += 60 / this.tempo / this.subdivision;
    }
  }

  _drain() {
    const step = () => {
      if (!this.playing) return;
      const now = this.audio.time;
      while (this._queue.length && this._queue[0].time <= now) this.onBeat(this._queue.shift());
      this._frame = window.requestAnimationFrame(step);
    };
    this._frame = window.requestAnimationFrame(step);
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
    this.clickSound = 'blip';
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
        this.audio.click(this._nextNoteTime + i * beat, i === 0 ? 'accent' : 'beat', this.clickSound);
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
          this.audio.click(this._nextBeatTime, 'beat', this.clickSound);
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
