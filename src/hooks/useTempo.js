import { useCallback, useRef } from 'react';

export const TEMPO_MIN = 30;
export const TEMPO_MAX = 300;

export const clampTempo = (bpm) => Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, bpm));

const TAP_TIMEOUT = 2000; // ms of silence before a fresh tap sequence starts
const TAP_HISTORY = 6; // average over the last N gaps for a stable reading

/**
 * Tap tempo.
 *
 * Returns a tap() that yields the averaged BPM once two taps have landed close
 * enough together to measure, or null when a tap opens a new sequence. That
 * null is what lets one button be both a toggle and a tap pad: a lone click
 * does its usual job, a rhythm of clicks sets the tempo.
 */
export function useTapTempo() {
  const taps = useRef([]);

  return useCallback(() => {
    const now = performance.now();
    const times = taps.current;
    if (times.length && now - times[times.length - 1] > TAP_TIMEOUT) times.length = 0;
    times.push(now);
    if (times.length > TAP_HISTORY) times.shift();
    if (times.length < 2) return null;

    const gaps = times.slice(1).map((time, i) => time - times[i]);
    const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    return clampTempo(Math.round(60000 / average));
  }, []);
}

/** Vertical drag as a tempo scrub: 2px of travel per BPM. */
export function useTempoScrub(tempo, setTempo) {
  const latest = useRef(tempo);
  latest.current = tempo;

  return useCallback(
    (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startTempo = latest.current;
      const move = (event) =>
        setTempo(clampTempo(startTempo + Math.round((startY - event.clientY) / 2)));
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [setTempo],
  );
}
