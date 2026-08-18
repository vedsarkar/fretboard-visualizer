import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { PITCH_FLAT, PITCH_SHARP, noteName } from './lib/theory.js';
import { svgToPng, PAINT_COLORS } from './lib/layout.js';
import { audio } from './lib/audio.js';
import {
  currentTuning,
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
} from './lib/state.js';
import { useSequencer } from './hooks/useSequencer.js';
import { Fretboard } from './components/Fretboard.jsx';
import { Transport } from './components/Transport.jsx';
import { SelectionPanel } from './components/SelectionPanel.jsx';
import { BoardControls } from './components/BoardControls.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { AboutPanel } from './components/AboutPanel.jsx';
import { Btn } from './components/Ui.jsx';

const NO_FLASH = { key: '', id: 0 };

/** Saved settings are folded in before the first render, not after. */
const restore = (base) => ({ ...base, ...(loadState() || {}) });

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, restore);
  const [flash, setFlash] = useState(NO_FLASH);
  const [showAbout, setShowAbout] = useState(false);
  const svgRef = useRef(null);
  const flashId = useRef(0);

  useEffect(() => {
    saveState(state);
  }, [state]);

  /* ---- derived, memoised so playback highlights stay cheap ---- */
  const tuning = useMemo(() => currentTuning(state), [state.tuningId]);
  const strings = useMemo(() => openStrings(state), [state.tuningId, state.transpose]);
  const totalStrings = useMemo(() => stringCount(state), [state.tuningId]);
  const enabled = useMemo(
    () => stringEnabled(state),
    [state.tuningId, state.stringsOff],
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
      } else if (event.key === 'Escape') {
        setShowAbout(false);
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

  const playPainted = () => {
    const pitched = Object.keys(state.painted)
      .map((key) => {
        const [s, f] = key.split(':').map(Number);
        return strings[s] + f;
      })
      .sort((a, b) => a - b);
    if (pitched.length) audio.strum(pitched, 0.08);
  };

  const sequencePreview = notes.slice(0, 18).map((m) => noteName(m, state.flats)).join(' ');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Freetboard</h1>
          <button
            type="button"
            className="icon-btn"
            aria-label="About and keyboard shortcuts"
            onClick={() => setShowAbout((v) => !v)}
          >
            ?
          </button>
        </div>

        <div className="topbar-controls">
          <Transport
            state={state}
            dispatch={dispatch}
            isPlaying={isPlaying}
            onToggle={toggle}
            permutation={permutation}
            permutationCount={permutationCount}
          />

          <div className="ctl-row">
            <div className="group" role="group" aria-label="Marker colours">
              <Btn
                className="btn-reset"
                title="Clear marked notes"
                onClick={() => dispatch({ type: 'clearPaint' })}
              >
                Clear
              </Btn>
              <div className="palette">
                {PAINT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch${state.paintColor === color ? ' is-active' : ''}`}
                    style={{ background: color }}
                    aria-label={`Marker colour ${color}`}
                    title={`Mark notes in ${color}`}
                    onClick={() => dispatch({ type: 'setPaintColor', color })}
                  />
                ))}
              </div>
              <Btn title="Play the marked notes" onClick={playPainted}>
                Play marked
              </Btn>
            </div>

            <div className="group mode-selector" role="group" aria-label="Mode">
              <Btn
                active={state.mode === 'scales'}
                onClick={() => dispatch({ type: 'setMode', mode: 'scales' })}
              >
                Scales
              </Btn>
              <Btn
                active={state.mode === 'chords'}
                onClick={() => dispatch({ type: 'setMode', mode: 'chords' })}
              >
                Chords
              </Btn>
            </div>

            <div className="sequence-display" aria-live="polite">
              {notes.length ? (
                <>
                  <b>{notes.length} notes </b>
                  {sequencePreview}
                  {notes.length > 18 ? ' \u2026' : ''}
                </>
              ) : (
                'No notes in range'
              )}
            </div>

            <div className="group group-end">
              <input
                className="title-input"
                type="text"
                placeholder="Untitled view"
                aria-label="Diagram title"
                value={state.title}
                onChange={(event) => dispatch({ type: 'patch', patch: { title: event.target.value } })}
              />
              <Btn title="Download the diagram as a PNG" onClick={onExport}>
                Export
              </Btn>
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

      <section className="board">
        <BoardControls state={state} dispatch={dispatch} tuning={tuning} strings={strings} />
        <div className="fretboard">
          <Fretboard
            ref={svgRef}
            view={view}
            flash={flash}
            onSelect={onSelect}
            onSpotlight={onSpotlight}
          />
        </div>
        <p className="summary">
          <b>
            {names[state.rootPc]} {name}
          </b>
          {'  '}
          {intervals.map((semi) => names[(state.rootPc + semi) % 12]).join(' \u00b7 ')}
        </p>
      </section>

      {showAbout ? <AboutPanel onClose={() => setShowAbout(false)} /> : null}
    </div>
  );
}
