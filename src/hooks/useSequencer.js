import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../lib/audio.js';
import { Sequencer, notePool } from '../lib/sequencer.js';
import { keyRangeMidi } from '../lib/theory.js';
import { openStrings, selectionIntervals } from '../lib/state.js';

/**
 * Owns the Sequencer instance and keeps it in sync with state.
 *
 * The played-note callback is held in a ref so a changing handler identity
 * never forces the scheduler to be rebuilt mid-playback.
 */
export function useSequencer(state, onNote) {
  const sequencer = useRef(null);
  if (!sequencer.current) sequencer.current = new Sequencer(audio);

  const [isPlaying, setIsPlaying] = useState(false);
  const noteHandler = useRef(onNote);
  noteHandler.current = onNote;

  const notes = useMemo(() => {
    /* The keyboard's range is its key count; the fretboard's is its tuning. */
    const range = () => {
      if (state.board === 'piano') return keyRangeMidi(state.keyCount);
      const strings = openStrings(state);
      return {
        lowMidi: Math.min(...strings),
        highMidi: Math.max(...strings) + state.fretCount,
      };
    };
    const { lowMidi, highMidi } = range();
    return notePool({
      rootPc: state.rootPc,
      intervals: selectionIntervals(state),
      lowMidi,
      highMidi,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.rootPc,
    state.scaleId,
    state.useCustom,
    state.customIntervals,
    state.tuningId,
    state.transpose,
    state.extraStrings,
    state.fretCount,
    state.board,
    state.keyCount,
  ]);

  useEffect(() => {
    const engine = sequencer.current;
    engine.onNote = (event) => noteHandler.current?.(event);
    engine.onStop = () => setIsPlaying(false);
  }, []);

  useEffect(() => {
    const engine = sequencer.current;
    engine.setNotes(notes);
    engine.tempo = state.tempo;
    engine.loop = state.loop;
    engine.metronome = state.metronome;
    engine.clickSound = state.clickSound;
  }, [notes, state.tempo, state.loop, state.metronome, state.clickSound]);

  useEffect(() => () => sequencer.current?.stop(), []);

  const toggle = useCallback(() => {
    const engine = sequencer.current;
    if (engine.playing) engine.stop();
    else engine.start();
    setIsPlaying(engine.playing);
  }, []);

  return { isPlaying, toggle };
}
