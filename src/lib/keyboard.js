/**
 * Keyboard geometry and palette.
 *
 * Kept separate from the component so the same numbers drive rendering, hit
 * testing and PNG export.
 */

import { keyRangeMidi, pitchClass } from './theory.js';
import { COLORS } from './layout.js';

/** Pitch classes that get a white key; the rest are black. */
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];

export const isBlackKey = (midi) => !WHITE_PCS.includes(pitchClass(midi));

/**
 * A black key does not sit centred on the seam between two white keys. Each is
 * nudged so the group of two and the group of three stay visually even, the way
 * a real keyboard is cut. Values are the fraction of a black key left of the seam.
 */
const BLACK_SHIFT = { 1: 0.55, 3: 0.45, 6: 0.6, 8: 0.5, 10: 0.4 };

/** Piano names for the shared pentatonic-diagram palette. */
export const KEY_COLORS = {
  white: COLORS.board,
  whiteEdge: COLORS.boardEdge,
  black: COLORS.fret,
  blackEdge: COLORS.nut,
  label: COLORS.fretNumber,
  noteText: COLORS.noteText,
  rootRing: COLORS.rootRing,
};

const WHITE_WIDTH = 32;
const WHITE_HEIGHT = 150;
const BLACK_WIDTH_RATIO = 0.62;
const BLACK_HEIGHT_RATIO = 0.62;
const PAD_TOP = 14;
const PAD_SIDE = 10;
const PAD_BOTTOM = 28;

/**
 * @param {{keyCount:number}} options
 */
export function computeKeyboardLayout({ keyCount }) {
  const { lowMidi, highMidi } = keyRangeMidi(keyCount);
  const blackWidth = WHITE_WIDTH * BLACK_WIDTH_RATIO;
  const blackHeight = WHITE_HEIGHT * BLACK_HEIGHT_RATIO;
  const noteRadius = Math.min(10, blackWidth / 2 - 0.4);

  const keys = [];
  let whiteIndex = 0;

  for (let midi = lowMidi; midi <= highMidi; midi += 1) {
    /* Left edge of this white key, or the seam to its left for a black one. */
    const seam = PAD_SIDE + whiteIndex * WHITE_WIDTH;

    if (isBlackKey(midi)) {
      const x = seam - BLACK_SHIFT[pitchClass(midi)] * blackWidth;
      keys.push({
        midi,
        black: true,
        x,
        y: PAD_TOP,
        w: blackWidth,
        h: blackHeight,
        cx: x + blackWidth / 2,
        cy: PAD_TOP + blackHeight - noteRadius - 10,
      });
    } else {
      keys.push({
        midi,
        black: false,
        x: seam,
        y: PAD_TOP,
        w: WHITE_WIDTH,
        h: WHITE_HEIGHT,
        cx: seam + WHITE_WIDTH / 2,
        cy: PAD_TOP + WHITE_HEIGHT - noteRadius - 12,
      });
      whiteIndex += 1;
    }
  }

  return {
    lowMidi,
    highMidi,
    whiteWidth: WHITE_WIDTH,
    whiteHeight: WHITE_HEIGHT,
    blackWidth,
    blackHeight,
    noteRadius,
    keys,
    whites: keys.filter((k) => !k.black),
    blacks: keys.filter((k) => k.black),
    width: PAD_SIDE * 2 + whiteIndex * WHITE_WIDTH,
    height: PAD_TOP + WHITE_HEIGHT + PAD_BOTTOM,
    labelY: PAD_TOP + WHITE_HEIGHT + 14,
  };
}
