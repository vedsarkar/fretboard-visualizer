import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../lib/audio.js';
import { Sequencer, buildSequence, notePool, permutations } from '../lib/sequencer.js';
import { openStrings, playbackIntervals } from '../lib/state.js';

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

  const permutationList = useMemo(() => permutations(state.groupLength), [state.groupLength]);
  const permutation = permutationList[Math.min(state.permIndex, permutationList.length - 1)];

  const notes = useMemo(() => {
    const strings = openStrings(state);
    const pool = notePool({
      rootPc: state.rootPc,
      intervals: playbackIntervals(state),
      lowMidi: Math.min(...strings),
      highMidi: Math.max(...strings) + state.fretCount,
      octaves: state.octaves,
    });
    return buildSequence(pool, {
      length: state.groupLength,
      jump: state.jump,
      perm: permutation,
      direction: state.direction,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.rootPc,
    state.mode,
    state.scaleId,
    state.chordId,
    state.useCustom,
    state.customIntervals,
    state.tuningId,
    state.transpose,
    state.fretCount,
    state.octaves,
    state.groupLength,
    state.jump,
    state.direction,
    permutation,
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
    engine.notesPerBeat = state.notesPerBeat;
    engine.loop = state.loop;
    engine.countIn = state.countIn;
    engine.metronome = state.metronome;
  }, [notes, state.tempo, state.notesPerBeat, state.loop, state.countIn, state.metronome]);

  useEffect(() => () => sequencer.current?.stop(), []);

  const toggle = useCallback(() => {
    const engine = sequencer.current;
    if (engine.playing) engine.stop();
    else engine.start();
    setIsPlaying(engine.playing);
  }, []);

  return { notes, permutation, permutationCount: permutationList.length, isPlaying, toggle };
}
