import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PITCH_FLAT, PITCH_SHARP, noteName, pitchClass } from '@/lib/theory.js';
import { svgToPng } from '@/lib/layout.js';
import { audio } from '@/lib/audio.js';
import {
  extraStringsAllowed,
  initialState,
  loadState,
  openStrings,
  pitchMap,
  positionsFor,
  reducer,
  saveState,
  selectionIntervals,
  selectionName,
  stringCount,
  stringEnabled,
} from '@/lib/state.js';
import { useSequencer } from '@/hooks/useSequencer.js';
import { Fretboard } from './components/Fretboard.jsx';
import { Playback } from './components/Transport.jsx';
import { SelectionPanel } from './components/SelectionPanel.jsx';
import { BoardControls } from './components/BoardControls.jsx';
import { Hint } from './components/Ui.jsx';

const NO_FLASH = { key: '', id: 0 };

/** Saved settings are folded in before the first render, not after. */
const restore = (base) => ({ ...base, ...(loadState() || {}) });

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, restore);
  const [flash, setFlash] = useState(NO_FLASH);
  const svgRef = useRef(null);
  const flashId = useRef(0);

  useEffect(() => {
    saveState(state);
  }, [state]);

  /* ---- derived, memoised so playback highlights stay cheap ---- */
  const strings = useMemo(
    () => openStrings(state),
    [state.tuningId, state.transpose, state.extraStrings],
  );
  const totalStrings = useMemo(() => stringCount(state), [state.tuningId, state.extraStrings]);
  const extraAllowed = useMemo(() => extraStringsAllowed(state), [state.tuningId]);
  const enabled = useMemo(
    () => stringEnabled(state),
    [state.tuningId, state.extraStrings, state.stringsOff],
  );
  const intervals = useMemo(
    () => selectionIntervals(state),
    [state.mode, state.scaleId, state.chordId, state.useCustom, state.customIntervals],
  );
  const pitches = useMemo(() => pitchMap(state), [state.rootPc, intervals]);
  const name = useMemo(
    () => selectionName(state),
    [state.mode, state.scaleId, state.chordId, state.useCustom],
  );

  const view = useMemo(
    () => ({
      strings,
      fretCount: state.fretCount,
      leftHanded: state.leftHanded,
      flats: state.flats,
      showDegrees: state.showDegrees,
      stringEnabled: enabled,
      pitches,
      painted: state.painted,
      spotlight: state.spotlight,
    }),
    [
      strings,
      state.fretCount,
      state.leftHanded,
      state.flats,
      state.showDegrees,
      enabled,
      pitches,
      state.painted,
      state.spotlight,
    ],
  );

  const highlight = useCallback((key) => {
    flashId.current += 1;
    setFlash({ key, id: flashId.current });
  }, []);

  const onPlayedNote = useCallback(
    ({ midi }) => {
      const [best] = positionsFor(state, midi);
      if (best) highlight(`${best.string}:${best.fret}`);
    },
    [state, highlight],
  );

  const { notes, isPlaying, toggle } = useSequencer(state, onPlayedNote);

  const onSelect = useCallback(
    (note) => {
      if (state.paintColor) {
        dispatch({ type: 'paint', key: note.key, color: state.paintColor });
      }
      audio.play(note.midi, 0, 0.7);
      highlight(note.key);
    },
    [state.paintColor, highlight],
  );

  const onSpotlight = useCallback((note) => {
    dispatch({ type: 'toggleSpotlight', pc: pitchClass(note.midi) });
  }, []);

  /* Space toggles playback unless the user is typing. */
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const names = state.flats ? PITCH_FLAT : PITCH_SHARP;
  const exportName = `${names[state.rootPc]} ${name}`;

  const onExport = async () => {
    const blob = await svgToPng(svgRef.current, { title: exportName });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportName.replace(/[^\w\-. ]+/g, '_')}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider delayDuration={350}>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 pb-10">
        <SelectionPanel
          state={state}
          dispatch={dispatch}
          intervals={intervals}
          isPlaying={isPlaying}
        />

        <section className="flex flex-col gap-2">
          <BoardControls
            state={state}
            dispatch={dispatch}
            stringCount={totalStrings}
            extraAllowed={extraAllowed}
          />

          {state.board === 'guitar' ? (
            <div
              className="overflow-x-auto rounded-xl border border-border bg-card p-2"
              data-testid="fretboard"
            >
              <Fretboard
                ref={svgRef}
                view={view}
                flash={flash}
                onSelect={onSelect}
                onSpotlight={onSpotlight}
              />
            </div>
          ) : (
            <div
              className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              data-testid="keyboard"
            >
              Keyboard diagram lands in the next step
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Playback isPlaying={isPlaying} onToggle={toggle} state={state} dispatch={dispatch} />
            <p className="text-xs text-muted-foreground" data-testid="summary">
              <span className="font-semibold text-foreground">
                {names[state.rootPc]} {name}
              </span>
              {'  '}
              {intervals.map((semi) => names[(state.rootPc + semi) % 12]).join(' \u00b7 ')}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <Hint label="Download the diagram as a PNG">
                <Button variant="outline" size="sm" data-testid="export-btn" onClick={onExport}>
                  <Download />
                  Download
                </Button>
              </Hint>
            </div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}
