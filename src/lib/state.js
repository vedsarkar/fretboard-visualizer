/**
 * Application state: initial values, reducer and derived selectors.
 */

import { MAX_STRINGS, extendedTuningMidi, findScale, findTuning } from './theory.js';

export const initialState = {
  board: 'guitar',
  scaleId: 'ionian',
  useCustom: false,
  customIntervals: [0, 2, 4, 5, 7, 9, 11],
  rootPc: 0,
  tuningId: 'standard',
  extraStrings: 0,
  transpose: 0,
  fretCount: 24,
  keyCount: 61,
  leftHanded: false,
  flats: false,
  showDegrees: false,
  spotlight: null,
  tempo: 90,
  loop: false,
  metronome: false,
  meter: '4/4',
  rhythm: '1/4',
  clickSound: 'blip',
  clickVolumeDb: 0,
};

export function reducer(state, action) {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };

    case 'setBoard':
      return { ...state, board: action.board };

    case 'setKeyCount':
      return { ...state, keyCount: action.count };

    case 'selectScale':
      return { ...state, scaleId: action.id, useCustom: false };

    case 'enableCustom':
      return { ...state, useCustom: true, customIntervals: selectionIntervals(state) };

    // ToggleGroup reports the whole selection, not the item that changed.
    case 'setIntervals': {
      const next = [...action.semitones].sort((a, b) => a - b);
      return {
        ...state,
        useCustom: true,
        customIntervals: next.length ? next : [0],
      };
    }

    case 'setRoot':
      return { ...state, rootPc: action.pc, spotlight: null };

    case 'setTuning':
      return { ...state, tuningId: action.id, extraStrings: 0, transpose: 0 };

    case 'setExtraStrings': {
      const base = findTuning(state.tuningId)?.notes.length ?? 6;
      const extra = Math.min(Math.max(0, action.extra), Math.max(0, MAX_STRINGS - base));
      if (extra === state.extraStrings) return state;
      return { ...state, extraStrings: extra };
    }

    case 'toggleSpotlight':
      return { ...state, spotlight: state.spotlight === action.pc ? null : action.pc };

    case 'clamp': {
      const { field, delta, min, max } = action;
      return { ...state, [field]: Math.min(max, Math.max(min, state[field] + delta)) };
    }

    case 'toggle':
      return { ...state, [action.field]: !state[action.field] };

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

export function selectionIntervals(state) {
  if (state.useCustom) {
    return state.customIntervals.length ? [...state.customIntervals].sort((a, b) => a - b) : [0];
  }
  return findScale(state.scaleId).intervals;
}

export const selectionName = (state) =>
  state.useCustom ? 'Custom' : findScale(state.scaleId).name;

/** pitch class -> { degree, semitones } */
export function pitchMap(state) {
  const map = new Map();
  selectionIntervals(state).forEach((semitones, degree) => {
    map.set((state.rootPc + semitones) % 12, { degree, semitones });
  });
  return map;
}

/** Playable positions for a pitch, lowest fret first. */
export function positionsFor(state, midi) {
  const found = [];
  openStrings(state).forEach((open, i) => {
    const fret = midi - open;
    if (fret >= 0 && fret <= state.fretCount) found.push({ string: i, fret });
  });
  found.sort((a, b) => a.fret - b.fret || b.string - a.string);
  return found;
}
