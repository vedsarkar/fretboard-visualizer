import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PITCH_FLAT, PITCH_SHARP, noteName } from '@/lib/theory.js';
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
import { Transport } from './components/Transport.jsx';
import { SelectionPanel } from './components/SelectionPanel.jsx';
import { BoardControls } from './components/BoardControls.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { AboutPanel } from './components/AboutPanel.jsx';
import { Hint, PICKED_SOLID } from './components/Ui.jsx';

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
      degreeFilter: state.degreeFilter,
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
      state.degreeFilter,
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

  const { notes, permutation, permutationCount, isPlaying, toggle } = useSequencer(
    state,
    onPlayedNote,
  );

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
    dispatch({ type: 'toggleSpotlight', pc: ((note.midi % 12) + 12) % 12 });
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
  const exportName = state.title.trim() || `${names[state.rootPc]} ${name}`;

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
        <header className="flex flex-wrap items-start gap-3">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl leading-none font-bold tracking-tight text-primary">
              Freetboard
            </h1>
            <AboutPanel />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <Transport
              state={state}
              dispatch={dispatch}
              isPlaying={isPlaying}
              onToggle={toggle}
              permutation={permutation}
              permutationCount={permutationCount}
            />

            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={state.mode}
                onValueChange={(mode) => mode && dispatch({ type: 'setMode', mode })}
                data-testid="mode-group"
              >
                <ToggleGroupItem value="scales" aria-label="Scales" className={PICKED_SOLID}>
                  Scales
                </ToggleGroupItem>
                <ToggleGroupItem value="chords" aria-label="Chords" className={PICKED_SOLID}>
                  Chords
                </ToggleGroupItem>
              </ToggleGroup>

              <div
                className="min-w-40 flex-1 truncate rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground tabular-nums"
                data-testid="sequence-display"
                aria-live="polite"
              >
                {notes.length ? (
                  <>
                    <span className="font-semibold text-primary">{notes.length} notes </span>
                    {notes.slice(0, 18).map((m) => noteName(m, state.flats)).join(' ')}
                    {notes.length > 18 ? ' \u2026' : ''}
                  </>
                ) : (
                  'No notes in range'
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Input
                  className="h-8 w-40 text-xs"
                  placeholder="Untitled view"
                  aria-label="Diagram title"
                  value={state.title}
                  onChange={(event) =>
                    dispatch({ type: 'patch', patch: { title: event.target.value } })
                  }
                />
                <Hint label="Download the diagram as a PNG">
                  <Button variant="outline" size="sm" data-testid="export-btn" onClick={onExport}>
                    <Download />
                    Export
                  </Button>
                </Hint>
                <SettingsPanel state={state} dispatch={dispatch} />
              </div>
            </div>
          </div>
        </header>

        <SelectionPanel
          state={state}
          dispatch={dispatch}
          intervals={intervals}
          stringCount={totalStrings}
        />

        <section className="flex flex-col gap-2">
          <BoardControls
            state={state}
            dispatch={dispatch}
            stringCount={totalStrings}
            extraAllowed={extraAllowed}
          />

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

          <p className="text-xs text-muted-foreground" data-testid="summary">
            <span className="font-semibold text-foreground">
              {names[state.rootPc]} {name}
            </span>
            {'  '}
            {intervals.map((semi) => names[(state.rootPc + semi) % 12]).join(' \u00b7 ')}
          </p>
        </section>
      </div>
    </TooltipProvider>
  );
}
