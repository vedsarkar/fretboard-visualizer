import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Metronome,
  Play,
  Repeat,
  Settings,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Cap, Cluster, Hint } from './Ui.jsx';
import { DIRECTIONS } from '@/lib/state.js';
import { MetronomeClock, permutationLabel } from '@/lib/sequencer.js';
import { audio } from '@/lib/audio.js';

/** Cycling control: shows its current value, advances on click. */
function Cycle({ hint, value, onClick, testId }) {
  return (
    <Hint label={hint}>
      <Button variant="ghost" size="sm" onClick={onClick} data-testid={testId}>
        {value}
      </Button>
    </Hint>
  );
}

const TAP_TIMEOUT = 2000; // ms of silence before a fresh tap sequence starts
const TAP_HISTORY = 6; // average over the last N gaps for a stable reading

export function Transport({ state, dispatch, isPlaying, onToggle, permutation, permutationCount }) {
  const cycle = (field, values) => () => dispatch({ type: 'cycle', field, values });
  const tapTimes = useRef([]);

  // A standalone click track, independent of the note sequencer, so the
  // metronome can be previewed on its own.
  const clickTrack = useRef(null);
  if (!clickTrack.current) clickTrack.current = new MetronomeClock(audio);
  const [clickPlaying, setClickPlaying] = useState(false);

  useEffect(() => {
    clickTrack.current.setTempo(state.tempo);
  }, [state.tempo]);

  useEffect(() => {
    // Don't let the standalone click and the sequencer's own metronome clash.
    if (isPlaying && clickTrack.current.playing) {
      clickTrack.current.stop();
      setClickPlaying(false);
    }
  }, [isPlaying]);

  useEffect(() => () => clickTrack.current.stop(), []);

  const toggleClickTrack = () => {
    const clock = clickTrack.current;
    if (clock.playing) clock.stop();
    else clock.start(state.tempo);
    setClickPlaying(clock.playing);
  };

  /**
   * The metronome button doubles as a tap-tempo pad: taps within TAP_TIMEOUT
   * of each other set the tempo from their average interval. An isolated
   * click (nothing recent to compare against) just toggles the click sound.
   */
  const handleMetronomeTap = () => {
    const now = performance.now();
    const times = tapTimes.current;
    if (times.length && now - times[times.length - 1] > TAP_TIMEOUT) times.length = 0;
    times.push(now);
    if (times.length > TAP_HISTORY) times.shift();

    if (times.length < 2) {
      dispatch({ type: 'toggle', field: 'metronome' });
      return;
    }
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const bpm = Math.round(60000 / avgGap);
    dispatch({ type: 'patch', patch: { tempo: Math.min(300, Math.max(30, bpm)) } });
  };

  /** Drag up/down on the handle to scrub tempo; 2px of mouse travel per BPM. */
  const dragTempo = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTempo = state.tempo;
    const move = (moveEvent) => {
      const delta = Math.round((startY - moveEvent.clientY) / 2);
      const next = Math.min(300, Math.max(30, startTempo + delta));
      dispatch({ type: 'patch', patch: { tempo: next } });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Cluster role="group" aria-label="Tempo">
        <Hint label="Click to toggle · tap repeatedly to set tempo">
          <Toggle
            size="sm"
            aria-label="Metronome (tap repeatedly to set tempo)"
            data-testid="metro-toggle"
            pressed={state.metronome}
            onPressedChange={handleMetronomeTap}
          >
            <Metronome />
          </Toggle>
        </Hint>
        <Hint label={clickPlaying ? 'Stop the click' : 'Play just the metronome click'}>
          <Button
            variant={clickPlaying ? 'default' : 'ghost'}
            size="icon-sm"
            aria-label={clickPlaying ? 'Stop metronome click' : 'Play metronome click'}
            aria-pressed={clickPlaying}
            data-testid="metronome-play"
            onClick={toggleClickTrack}
          >
            {clickPlaying ? <Square /> : <Play />}
          </Button>
        </Hint>
        <Separator orientation="vertical" className="mx-0.5 !h-5" />
        <span
          className="min-w-8 text-center text-xs font-semibold tabular-nums text-primary"
          data-testid="tempo-value"
        >
          {state.tempo}
        </span>
        <div
          className="flex cursor-ns-resize touch-none flex-col select-none"
          onPointerDown={dragTempo}
          data-testid="tempo-stepper"
        >
          <Hint label="Faster (drag up/down to scrub)">
            <button
              type="button"
              aria-label="Increase tempo"
              data-testid="tempo-inc"
              className="flex h-3 w-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => dispatch({ type: 'clamp', field: 'tempo', delta: 1, min: 30, max: 300 })}
            >
              <ChevronUp className="size-3" />
            </button>
          </Hint>
          <Hint label="Slower (drag up/down to scrub)">
            <button
              type="button"
              aria-label="Decrease tempo"
              data-testid="tempo-dec"
              className="flex h-3 w-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => dispatch({ type: 'clamp', field: 'tempo', delta: -1, min: 30, max: 300 })}
            >
              <ChevronDown className="size-3" />
            </button>
          </Hint>
        </div>
        <Separator orientation="vertical" className="mx-0.5 !h-5" />
        <Hint label="Tempo settings">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tempo settings"
            data-testid="tempo-settings"
          >
            <Settings />
          </Button>
        </Hint>
      </Cluster>

      <Cluster role="group" aria-label="Playback">
        <Hint label={isPlaying ? 'Stop (Space)' : 'Play (Space)'}>
          <Button
            size="sm"
            variant={isPlaying ? 'default' : 'outline'}
            onClick={onToggle}
            data-testid="play-btn"
          >
            {isPlaying ? <Square /> : <Play />}
            {isPlaying ? 'Stop' : 'Play'}
          </Button>
        </Hint>
        <Hint label="Four beats of clicks before the notes start">
          <Toggle
            size="sm"
            aria-label="Count-in"
            data-testid="countin-toggle"
            pressed={state.countIn}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'countIn' })}
          >
            Count&#8209;in
          </Toggle>
        </Hint>
        <Hint label="Repeat the sequence until stopped">
          <Toggle
            size="sm"
            aria-label="Loop"
            data-testid="loop-toggle"
            pressed={state.loop}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'loop' })}
          >
            <Repeat />
          </Toggle>
        </Hint>
      </Cluster>

      <Cluster role="group" aria-label="Pattern">
        <Cap>Pattern</Cap>
        <Cycle
          hint="Notes played per beat"
          value={`${state.notesPerBeat}/beat`}
          testId="npb-cycle"
          onClick={cycle('notesPerBeat', [1, 2, 3, 4])}
        />
        <Cycle
          hint="How many octaves the run spans"
          value={`${state.octaves} oct`}
          testId="oct-cycle"
          onClick={cycle('octaves', [1, 2, 3, 4])}
        />
        <Cycle
          hint="Which way the sequence travels"
          value={DIRECTIONS.find(([id]) => id === state.direction)[1]}
          testId="dir-cycle"
          onClick={cycle('direction', DIRECTIONS.map(([id]) => id))}
        />
        <Cycle
          hint="Notes per repeating group. Group 4 gives the classic 1234-2345 drill"
          value={`Group ${state.groupLength}`}
          testId="group-cycle"
          onClick={cycle('groupLength', [1, 2, 3, 4, 5, 6])}
        />
        <Cycle
          hint="Scale steps between notes inside a group. Step 2 plays in thirds"
          value={`Step ${state.jump}`}
          testId="step-cycle"
          onClick={cycle('jump', [1, 2, 3, 4])}
        />
        <Separator orientation="vertical" className="mx-0.5 !h-5" />
        <Hint label="Reorder the notes within each group">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous permutation"
            data-testid="perm-prev"
            onClick={() =>
              dispatch({
                type: 'patch',
                patch: { permIndex: (state.permIndex - 1 + permutationCount) % permutationCount },
              })
            }
          >
            <ChevronLeft />
          </Button>
        </Hint>
        <span
          className="min-w-10 text-center text-xs font-semibold tabular-nums text-primary"
          data-testid="perm-value"
        >
          {permutationLabel(permutation)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next permutation"
          data-testid="perm-next"
          onClick={() =>
            dispatch({
              type: 'patch',
              patch: { permIndex: (state.permIndex + 1) % permutationCount },
            })
          }
        >
          <ChevronRight />
        </Button>
      </Cluster>
    </div>
  );
}
