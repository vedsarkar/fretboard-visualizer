/**
 * Pitch, scale, chord and instrument-tuning data.
 * Pitch classes are 0..11 starting at C. MIDI numbers use C4 = 60.
 */

export const PITCH_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const PITCH_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Degree label for a semitone distance above the root. */
export const DEGREE_LABEL = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

/**
 * Labels for the custom-interval toggles. Only the perfect/minor/major spelling
 * is shown; the tritone has no such name, so semitone 6 stays diminished.
 */
export const INTERVAL_LABEL = [
  'P1', 'm2', 'M2', 'm3', 'M3', 'P4',
  'd5', 'P5', 'm6', 'M6', 'm7', 'M7',
];

/** Spoken names for the toggles above, carrying the enharmonic they drop. */
export const INTERVAL_NAME = [
  'perfect unison',
  'minor second / augmented unison',
  'major second / diminished third',
  'minor third / augmented second',
  'major third / diminished fourth',
  'perfect fourth / augmented third',
  'diminished fifth / augmented fourth (tritone)',
  'perfect fifth / diminished sixth',
  'minor sixth / augmented fifth',
  'major sixth / diminished seventh',
  'minor seventh / augmented sixth',
  'major seventh / diminished octave',
];

const LETTER_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const pitchClass = (midi) => ((midi % 12) + 12) % 12;
export const noteName = (midi, flats) => (flats ? PITCH_FLAT : PITCH_SHARP)[pitchClass(midi)];
export const octaveOf = (midi) => Math.floor(midi / 12) - 1;
export const noteNameOctave = (midi, flats) => noteName(midi, flats) + octaveOf(midi);
export const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** Parse scientific pitch notation ("F#1", "Eb3") into a MIDI number. */
export function nameToMidi(text) {
  const m = /^([A-G])([#b]?)(-?\d+)$/.exec(String(text).trim());
  if (!m) throw new Error(`Unrecognised note name: ${text}`);
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (parseInt(m[3], 10) + 1) * 12 + LETTER_SEMITONE[m[1]] + accidental;
}

/* ------------------------------------------------------------------ scales */

export const SCALE_GROUPS = [
  {
    id: 'major',
    label: 'Major + Modes',
    scales: [
      { id: 'ionian', name: 'Major (default)', intervals: [0, 2, 4, 5, 7, 9, 11] },
      { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
      { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
      { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
      { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
      { id: 'aeolian', name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
      { id: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
    ],
  },
  {
    id: 'melodic',
    label: 'Melodic Minor',
    scales: [
      { id: 'melodic-minor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
      { id: 'dorian-b2', name: 'Dorian b2', intervals: [0, 1, 3, 5, 7, 9, 10] },
      { id: 'lydian-augmented', name: 'Lydian Augmented', intervals: [0, 2, 4, 6, 8, 9, 11] },
      { id: 'lydian-dominant', name: 'Lydian Dominant', intervals: [0, 2, 4, 6, 7, 9, 10] },
      { id: 'mixolydian-b6', name: 'Mixolydian b6', intervals: [0, 2, 4, 5, 7, 8, 10] },
      { id: 'locrian-sharp2', name: 'Locrian #2', intervals: [0, 2, 3, 5, 6, 8, 10] },
      { id: 'altered', name: 'Altered', intervals: [0, 1, 3, 4, 6, 8, 10] },
    ],
  },
  {
    id: 'harmonic',
    label: 'Harmonic Minor',
    scales: [
      { id: 'harmonic-minor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
      { id: 'locrian-nat6', name: 'Locrian Natural 6', intervals: [0, 1, 3, 5, 6, 9, 10] },
      { id: 'ionian-augmented', name: 'Ionian Augmented', intervals: [0, 2, 4, 5, 8, 9, 11] },
      { id: 'dorian-sharp4', name: 'Dorian #4', intervals: [0, 2, 3, 6, 7, 9, 10] },
      { id: 'phrygian-dominant', name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10] },
      { id: 'lydian-sharp2', name: 'Lydian #2', intervals: [0, 3, 4, 6, 7, 9, 11] },
      { id: 'ultralocrian', name: 'Ultralocrian', intervals: [0, 1, 3, 4, 6, 8, 9] },
    ],
  },
  {
    id: 'pentatonic',
    label: 'Pentatonic',
    scales: [
      { id: 'minor-pentatonic', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
      { id: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
      { id: 'major-pentatonic', name: 'Maj. Pentatonic', intervals: [0, 2, 4, 7, 9] },
      { id: 'whole-tone', name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
      { id: 'diminished', name: 'Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
      { id: 'augmented', name: 'Augmented', intervals: [0, 3, 4, 7, 8, 11] },
    ],
  },
  {
    id: 'exotic',
    label: 'Exotic',
    scales: [
      { id: 'hungarian-gypsy-minor', name: 'Hungarian Gypsy Minor', intervals: [0, 2, 3, 6, 7, 8, 11] },
      { id: 'javanese', name: 'Javanese', intervals: [0, 1, 3, 5, 7, 9, 10] },
      { id: 'neapolitan', name: 'Neapolitan', intervals: [0, 1, 3, 5, 7, 8, 11] },
      { id: 'arabian', name: 'Arabian', intervals: [0, 2, 4, 5, 6, 8, 10] },
      { id: 'oriental', name: 'Oriental', intervals: [0, 1, 4, 5, 6, 9, 10] },
      { id: 'koromogae', name: 'Koromogae', intervals: [0, 2, 5, 7, 9] },
      { id: 'chinese', name: 'Chinese', intervals: [0, 4, 6, 7, 11] },
      { id: 'persian', name: 'Persian', intervals: [0, 1, 4, 5, 6, 8, 11] },
      { id: 'spanish-gypsy', name: 'Spanish Gypsy', intervals: [0, 1, 4, 5, 7, 8, 10] },
      { id: 'egyptian', name: 'Egyptian', intervals: [0, 2, 5, 7, 10] },
      { id: 'hungarian-gypsy', name: 'Hungarian Gypsy', intervals: [0, 3, 4, 6, 7, 9, 10] },
      { id: 'byzantine', name: 'Byzantine', intervals: [0, 1, 4, 5, 7, 8, 11] },
      { id: 'hindu', name: 'Hindu', intervals: [0, 2, 4, 5, 7, 8, 10] },
    ],
  },
];

/* ------------------------------------------------------------------ chords */

export const CHORD_GROUPS = [
  {
    id: 'common',
    label: null,
    chords: [
      { id: 'major', name: 'Major', intervals: [0, 4, 7] },
      { id: 'minor', name: 'Minor', intervals: [0, 3, 7] },
      { id: 'dim', name: 'Dim', intervals: [0, 3, 6] },
      { id: 'aug', name: 'Aug', intervals: [0, 4, 8] },
      { id: 'maj7', name: 'Maj7', intervals: [0, 4, 7, 11] },
      { id: 'min7', name: 'Min7', intervals: [0, 3, 7, 10] },
      { id: 'dom7', name: '7', intervals: [0, 4, 7, 10] },
      { id: 'm7b5', name: 'm7b5', intervals: [0, 3, 6, 10] },
      { id: 'dim7', name: 'Dim7', intervals: [0, 3, 6, 9] },
    ],
  },
  {
    id: 'extended',
    label: 'More',
    chords: [
      { id: '9', name: '9', intervals: [0, 2, 4, 7, 10] },
      { id: 'maj9', name: 'Maj9', intervals: [0, 2, 4, 7, 11] },
      { id: 'min9', name: 'Min9', intervals: [0, 2, 3, 7, 10] },
      { id: '7sharp5', name: '7#5', intervals: [0, 4, 8, 10] },
      { id: '7flat5', name: '7b5', intervals: [0, 4, 6, 10] },
      { id: '7sharp9', name: '7#9', intervals: [0, 3, 4, 7, 10] },
      { id: '7flat9', name: '7b9', intervals: [0, 1, 4, 7, 10] },
      { id: 'aug7', name: 'Aug7', intervals: [0, 4, 8, 11] },
      { id: 'sus2', name: 'Sus2', intervals: [0, 2, 7] },
      { id: 'sus4', name: 'Sus4', intervals: [0, 5, 7] },
      { id: '7sus4', name: '7Sus4', intervals: [0, 5, 7, 10] },
    ],
  },
];

/** Voicing spread used when the sequencer arpeggiates an extended chord. */
export const CHORD_VOICING = {
  '9': [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  '7sharp9': [0, 4, 7, 10, 15],
  '7flat9': [0, 4, 7, 10, 13],
};

/* --------------------------------------------------------------- tunings */

const tuning = (id, name, notes) => ({ id, name, notes: notes.split('-') });

export const INSTRUMENT_GROUPS = [
  {
    id: 'guitars',
    label: 'Guitar (6 string tunings)',
    tunings: [
      tuning('standard', 'Standard', 'E2-A2-D3-G3-B3-E4'),
      tuning('drop-d', 'Drop D', 'D2-A2-D3-G3-B3-E4'),
      tuning('drop-c', 'Drop C', 'C2-G2-C3-F3-A3-D4'),
      tuning('double-drop-d', 'Double Drop D', 'D2-A2-D3-G3-B3-D4'),
      tuning('dadgad', 'DADGAD', 'D2-A2-D3-G3-A3-D4'),
      tuning('open-e', 'Open E', 'E2-B2-E3-G#3-B3-E4'),
      tuning('open-g', 'Open G', 'D2-G2-D3-G3-B3-D4'),
      tuning('baritone', 'Baritone Guitar - 6-String', 'B1-E2-A2-D3-F#3-B3'),
      tuning('guitar-7', 'Guitar - 7-String', 'B1-E2-A2-D3-G3-B3-E4'),
      tuning('guitar-8', 'Guitar - 8-String', 'F#1-B1-E2-A2-D3-G3-B3-E4'),
    ],
  },
  {
    id: 'bass',
    label: 'Bass guitars',
    tunings: [
      tuning('bass-4', 'Bass Guitar - 4-String', 'E1-A1-D2-G2'),
      tuning('bass-5', 'Bass Guitar - 5-String', 'B0-E1-A1-D2-G2'),
      tuning('bass-6', 'Bass Guitar - 6-String', 'B0-E1-A1-D2-G2-C3'),
    ],
  },
  {
    id: 'folk',
    label: 'Banjos & folk',
    tunings: [
      tuning('banjo-4', 'Banjo, 4-string', 'C3-G3-D4-A4'),
      tuning('banjo-5', 'Banjo, 5-string', 'D3-G3-B3-D4-G4'),
      tuning('dulcimer', 'Dulcimer, appalachian', 'D3-A3-D4'),
      tuning('guitalele', 'Guitalele', 'A2-D3-G3-C4-E4-A4'),
      tuning('bouzouki', 'Irish Bouzouki', 'G2-D3-A3-D4'),
    ],
  },
  {
    id: 'mandolins',
    label: 'Mandolins',
    tunings: [
      tuning('mandocello', 'Mandocello', 'C2-G2-D3-A3'),
      tuning('mandola', 'Mandola', 'C3-G3-D4-A4'),
      tuning('mandolin', 'Mandolin', 'G3-D4-A4-E5'),
    ],
  },
  {
    id: 'ukuleles',
    label: 'Ukuleles',
    tunings: [
      tuning('ukulele', 'Ukulele', 'G4-C4-E4-A4'),
      tuning('ukulele-baritone', 'Ukulele, baritone', 'D3-G3-B3-E4'),
    ],
  },
  {
    id: 'ouds',
    label: 'Ouds',
    tunings: [
      tuning('oud-arabic', 'Oud, Arabic', 'C2-F2-A2-D3-G3-C4'),
      tuning('oud-turkish', 'Oud, Turkish', 'D2-G2-B2-E3-A3-D4'),
    ],
  },
];

export const ALL_TUNINGS = INSTRUMENT_GROUPS.flatMap((g) => g.tunings);
export const ALL_SCALES = SCALE_GROUPS.flatMap((g) => g.scales);
export const ALL_CHORDS = CHORD_GROUPS.flatMap((g) => g.chords);

export const findTuning = (id) => ALL_TUNINGS.find((t) => t.id === id);
export const findScale = (id) => ALL_SCALES.find((s) => s.id === id);
export const findChord = (id) => ALL_CHORDS.find((c) => c.id === id);

/** Group label shown on the collapsed scale dropdown button. */
export const scaleGroupOf = (id) => SCALE_GROUPS.find((g) => g.scales.some((s) => s.id === id));

/** MIDI number of every open string, lowest string position first. */
export const tuningMidi = (t, transpose = 0) => t.notes.map((n) => nameToMidi(n) + transpose);

/** Most strings on any tuning we ship, extras included. */
export const MAX_STRINGS = 8;

const PERFECT_FOURTH = 5;
const LOWEST_MIDI = 12; // C0 — below this the pitch is more rumble than note.

/**
 * The interval an extra string should sit below the current lowest one: whichever
 * gap the tuning already uses most, with ties going to the perfect fourth. For
 * guitar and bass tunings that works out to a fourth, which is exactly how real
 * extended-range instruments are strung (E2 -> B1 -> F#1).
 */
function dominantGap(midis) {
  const counts = new Map();
  for (let i = 1; i < midis.length; i += 1) {
    const gap = midis[i] - midis[i - 1];
    if (gap > 0) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  }
  let best = PERFECT_FOURTH;
  let bestCount = 0;
  for (const [gap, count] of counts) {
    if (count > bestCount || (count === bestCount && gap === PERFECT_FOURTH)) {
      best = gap;
      bestCount = count;
    }
  }
  return best;
}

/** Open strings for a tuning plus `extra` added below its lowest string. */
export function extendedTuningMidi(t, transpose = 0, extra = 0) {
  const base = tuningMidi(t, transpose);
  if (extra <= 0) return base;

  const step = dominantGap(base);
  const added = [];
  let pitch = Math.min(...base);
  for (let i = 0; i < extra; i += 1) {
    pitch -= step;
    if (pitch < LOWEST_MIDI) break;
    added.unshift(pitch);
  }
  return [...added, ...base];
}

/** Frets whose inlay markers are drawn, with 12/24 doubled. */
export const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
export const DOUBLE_INLAY_FRETS = [12, 24];
