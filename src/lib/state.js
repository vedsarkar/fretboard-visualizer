/**
 * Application state: initial values, reducer, derived selectors and storage.
 */

import {
  CHORD_VOICING,
  MAX_STRINGS,
  extendedTuningMidi,
  findChord,
  findScale,
  findTuning,
} from './theory.js';

export const STORAGE_KEY = 'freetboard.react.v1';

export const DIRECTIONS = [
  ['up', 'Up'],
  ['down', 'Down'],
  ['updown', 'Up-Down'],
  ['downup', 'Down-Up'],
  ['random', 'Random'],
];

/** Fields the user can opt into carrying across reloads. */
export const PERSIST_FIELDS = [
  ['tempo', 'Tempo'],
  ['countIn', 'Count-in'],
  ['loop', 'Loop'],
  ['notesPerBeat', 'Notes per beat'],
  ['octaves', 'Octave range'],
  ['direction', 'Direction'],
  ['groupLength', 'Group length'],
  ['jump', 'Degree step'],
  ['permIndex', 'Permutation'],
  ['leftHanded', 'Left-handed'],
  ['tuningId', 'Alternate tuning'],
  ['transpose', 'Tuning offset'],
  ['fretCount', 'Fret count'],
  ['flats', 'Sharps / flats'],
  ['showDegrees', 'Note / degree'],
];

export const initialState = {
  mode: 'scales',
  scaleId: 'ionian',
  chordId: 'major',
  useCustom: false,
  customIntervals: [0, 2, 4, 5, 7, 9, 11],
  rootPc: 0,
  tuningId: 'standard',
  extraStrings: 0,
  transpose: 0,
  fretCount: 24,
  leftHanded: false,
  flats: false,
  showDegrees: false,
  degreeFilter: [],
  stringsOff: [],
  painted: {},
  paintColor: null,
  spotlight: null,
  title: '',
  tempo: 90,
  notesPerBeat: 2,
  octaves: 1,
  direction: 'up',
  groupLength: 1,
  jump: 1,
  permIndex: 0,
  loop: false,
  countIn: false,
  metronome: false,
  defaults: { instrument: 'standard', root: 0, scale: 'ionian' },
  persist: Object.fromEntries(PERSIST_FIELDS.map(([key]) => [key, false])),
};

export function reducer(state, action) {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };

    case 'setMode':
      return { ...state, mode: action.mode, useCustom: false, degreeFilter: [] };

    case 'selectScale':
      return { ...state, mode: 'scales', scaleId: action.id, useCustom: false, degreeFilter: [] };

    case 'selectChord':
      return { ...state, mode: 'chords', chordId: action.id, useCustom: false, degreeFilter: [] };

    case 'enableCustom':
      return { ...state, useCustom: true, customIntervals: selectionIntervals(state) };

    // ToggleGroup reports the whole selection, not the item that changed.
    case 'setIntervals': {
      const next = [...action.semitones].sort((a, b) => a - b);
      return {
        ...state,
        useCustom: true,
        customIntervals: next.length ? next : [0],
        degreeFilter: [],
      };
    }

    case 'setRoot':
      return { ...state, rootPc: action.pc, painted: {}, spotlight: null };

    case 'setTuning':
      return {
        ...state,
        tuningId: action.id,
        extraStrings: 0,
        transpose: 0,
        stringsOff: [],
        painted: {},
      };

    // Extra strings shift every string index, so mutes and marks can't carry over.
    case 'setExtraStrings': {
      const base = findTuning(state.tuningId)?.notes.length ?? 6;
      const extra = Math.min(Math.max(0, action.extra), Math.max(0, MAX_STRINGS - base));
      if (extra === state.extraStrings) return state;
      return { ...state, extraStrings: extra, stringsOff: [], painted: {} };
    }

    case 'setDegrees': {
      const next = [...action.indices].sort((a, b) => a - b);
      // Every degree selected means no filter at all.
      const total = selectionIntervals(state).length;
      return { ...state, degreeFilter: next.length === total ? [] : next };
    }

    case 'clearDegrees':
      return { ...state, degreeFilter: [] };

    case 'setStrings': {
      const on = new Set(action.on);
      const off = Array.from({ length: action.total }, (_, i) => i).filter((i) => !on.has(i));
      return { ...state, stringsOff: off };
    }

    case 'clearStrings':
      return { ...state, stringsOff: [] };

    case 'setPaintColor':
      return { ...state, paintColor: state.paintColor === action.color ? null : action.color };

    case 'paint': {
      const painted = { ...state.painted };
      if (painted[action.key] === action.color) delete painted[action.key];
      else painted[action.key] = action.color;
      return { ...state, painted };
    }

    case 'clearPaint':
      return { ...state, painted: {}, spotlight: null, paintColor: null };

    case 'toggleSpotlight':
      return { ...state, spotlight: state.spotlight === action.pc ? null : action.pc };

    case 'cycle': {
      const { field, values, step = 1 } = action;
      const index = values.indexOf(state[field]);
      const value = values[(index + step + values.length) % values.length];
      const patch = { [field]: value };
      if (field === 'groupLength') patch.permIndex = 0;
      return { ...state, ...patch };
    }

    case 'clamp': {
      const { field, delta, min, max } = action;
      return { ...state, [field]: Math.min(max, Math.max(min, state[field] + delta)) };
    }

    case 'toggle':
      return { ...state, [action.field]: !state[action.field] };

    case 'setDefault':
      return { ...state, defaults: { ...state.defaults, [action.field]: action.value } };

    case 'setPersist':
      return { ...state, persist: { ...state.persist, [action.field]: action.value } };

    default:
      return state;
  }
}

/* --------------------------------------------------------------- selectors */

export const currentTuning = (state) => findTuning(state.tuningId) ?? findTuning('standard');

export const openStrings = (state) =>
  extendedTuningMidi(currentTuning(state), state.transpose, state.extraStrings);

export const stringCount = (state) => openStrings(state).length;

/** Extra strings this tuning can still take before hitting the 8-string ceiling. */
export const extraStringsAllowed = (state) =>
  Math.max(0, MAX_STRINGS - currentTuning(state).notes.length);

export const stringEnabled = (state) =>
  Array.from({ length: stringCount(state) }, (_, i) => !state.stringsOff.includes(i));

export function selectionIntervals(state) {
  if (state.useCustom) {
    return state.customIntervals.length ? [...state.customIntervals].sort((a, b) => a - b) : [0];
  }
  if (state.mode === 'chords') return findChord(state.chordId).intervals;
  return findScale(state.scaleId).intervals;
}

export function playbackIntervals(state) {
  if (!state.useCustom && state.mode === 'chords') {
    return CHORD_VOICING[state.chordId] ?? findChord(state.chordId).intervals;
  }
  return selectionIntervals(state);
}

export function selectionName(state) {
  if (state.useCustom) return 'Custom';
  return state.mode === 'chords' ? findChord(state.chordId).name : findScale(state.scaleId).name;
}

/** pitch class -> { degree, semitones } */
export function pitchMap(state) {
  const map = new Map();
  selectionIntervals(state).forEach((semitones, degree) => {
    map.set((state.rootPc + semitones) % 12, { degree, semitones });
  });
  return map;
}

/** Playable positions for a pitch, best (enabled string, lowest fret) first. */
export function positionsFor(state, midi) {
  const strings = openStrings(state);
  const enabled = stringEnabled(state);
  const found = [];
  strings.forEach((open, i) => {
    const fret = midi - open;
    if (fret >= 0 && fret <= state.fretCount) found.push({ string: i, fret, enabled: enabled[i] });
  });
  found.sort(
    (a, b) => Number(b.enabled) - Number(a.enabled) || a.fret - b.fret || b.string - a.string,
  );
  return found;
}

/* ----------------------------------------------------------------- storage */

export function saveState(state) {
  const payload = { defaults: state.defaults, persist: state.persist, title: state.title };
  for (const [key] of PERSIST_FIELDS) {
    if (state.persist[key]) payload[key] = state[key];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private browsing */
  }
}

export function loadState() {
  let payload;
  try {
    payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    payload = null;
  }
  if (!payload) return null;

  const defaults = { ...initialState.defaults, ...(payload.defaults || {}) };
  const persist = { ...initialState.persist, ...(payload.persist || {}) };
  const patch = {
    defaults,
    persist,
    tuningId: defaults.instrument,
    rootPc: defaults.root,
    scaleId: defaults.scale,
    title: typeof payload.title === 'string' ? payload.title : '',
  };
  for (const [key] of PERSIST_FIELDS) {
    if (persist[key] && payload[key] !== undefined) patch[key] = payload[key];
  }
  if (!findTuning(patch.tuningId)) patch.tuningId = 'standard';
  if (!findScale(patch.scaleId)) patch.scaleId = 'ionian';
  return patch;
}
