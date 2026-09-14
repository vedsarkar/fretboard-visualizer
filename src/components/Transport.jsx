import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Metronome,
  Play,
  Repeat,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Cluster, Hint, PICKED_SOLID } from './Ui.jsx';
import { MetronomePanel } from './MetronomePanel.jsx';
import { CLICK_RHYTHMS, MetronomeClock, findMeter } from '@/lib/sequencer.js';
import { audio } from '@/lib/audio.js';
import { clampTempo, useTapTempo, useTempoScrub } from '@/hooks/useTempo.js';

/** Tempo controls: metronome toggle, tempo display, and stepper. */
export function TempoCluster({ state, dispatch, isPlaying }) {
  const setTempo = (tempo) => dispatch({ type: 'patch', patch: { tempo } });

  // A standalone click track, independent of the note sequencer, so the
  // metronome can be previewed on its own.
  const clickTrack = useRef(null);
  if (!clickTrack.current) clickTrack.current = new MetronomeClock(audio);
  const [clickPlaying, setClickPlaying] = useState(false);

  const meter = findMeter(state.meter);
  const subdivision = CLICK_RHYTHMS.find(([id]) => id === state.rhythm)?.[1] ?? 1;

  const tap = useTapTempo();
  const dragTempo = useTempoScrub(state.tempo, setTempo);

  useEffect(() => {
    clickTrack.current.setTempo(state.tempo);
  }, [state.tempo]);

  // Applied here rather than in the panel so the settings outlive the dialog.
  useEffect(() => {
    clickTrack.current.configure({
      beats: meter.beats,
      accents: meter.accents,
      subdivision,
      sound: state.clickSound,
    });
  }, [meter, subdivision, state.clickSound]);

  useEffect(() => {
    audio.setClickMix({ gainDb: state.clickVolumeDb, pan: state.clickPan });
  }, [state.clickVolumeDb, state.clickPan]);

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
   * The metronome button doubles as a tap-tempo pad: a rhythm of taps sets the
   * tempo, while an isolated click (nothing recent to measure against) just
   * toggles the click sound.
   */
  const handleMetronomeTap = () => {
    const bpm = tap();
    if (bpm === null) dispatch({ type: 'toggle', field: 'metronome' });
    else setTempo(bpm);
  };

  /** The panel's pad is tap-only — it has a play button of its own. */
  const handlePanelTap = () => {
    const bpm = tap();
    if (bpm !== null) setTempo(clampTempo(bpm));
  };

  return (
    <Cluster role="group" aria-label="Tempo">
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
        <Hint label="Tap to set tempo">
          <Toggle
            size="sm"
            aria-label="Metronome (tap repeatedly to set tempo)"
            data-testid="metro-toggle"
            pressed={state.metronome}
            onPressedChange={handleMetronomeTap}
          >
            <Metronome className="size-4" />
          </Toggle>
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
        <MetronomePanel
          state={state}
          dispatch={dispatch}
          clock={clickTrack.current}
          playing={clickPlaying}
          onTogglePlay={toggleClickTrack}
          onTap={handlePanelTap}
        />
      </Cluster>
  );
}

/** Playback controls for placing elsewhere (e.g., footer). */
export function Playback({ isPlaying, onToggle, state, dispatch }) {
  return (
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
      <Hint label="Repeat the sequence until stopped">
        <Toggle
          size="sm"
          aria-label="Loop"
          data-testid="loop-toggle"
          pressed={state.loop}
          onPressedChange={() => dispatch({ type: 'toggle', field: 'loop' })}
          className={PICKED_SOLID}
        >
          <Repeat />
        </Toggle>
      </Hint>
    </Cluster>
  );
}
