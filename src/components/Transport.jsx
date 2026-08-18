import { Btn, Readout } from './Ui.jsx';
import { DIRECTIONS } from '../lib/state.js';
import { permutationLabel } from '../lib/sequencer.js';

export function Transport({ state, dispatch, isPlaying, onToggle, permutation, permutationCount }) {
  const cycle = (field, values) => () => dispatch({ type: 'cycle', field, values });

  return (
    <div className="ctl-row">
      <div className="group" role="group" aria-label="Tempo">
        <Btn
          onClick={() => dispatch({ type: 'clamp', field: 'tempo', delta: -5, min: 30, max: 300 })}
          aria-label="Decrease tempo"
        >
          &minus;
        </Btn>
        <Btn
          on={state.metronome}
          title="Toggle metronome"
          onClick={() => dispatch({ type: 'toggle', field: 'metronome' })}
        >
          Metro
        </Btn>
        <Readout>{state.tempo}</Readout>
        <Btn
          onClick={() => dispatch({ type: 'clamp', field: 'tempo', delta: 5, min: 30, max: 300 })}
          aria-label="Increase tempo"
        >
          +
        </Btn>
      </div>

      <div className="group" role="group" aria-label="Playback">
        <Btn
          on={state.countIn}
          title="Four-beat count-in"
          onClick={() => dispatch({ type: 'toggle', field: 'countIn' })}
        >
          Count&#8209;in
        </Btn>
        <Btn className="btn-primary" on={isPlaying} title="Play / stop (Space)" onClick={onToggle}>
          {isPlaying ? 'Stop' : 'Play'}
        </Btn>
        <Btn on={state.loop} title="Loop the sequence" onClick={() => dispatch({ type: 'toggle', field: 'loop' })}>
          Loop
        </Btn>
        <Btn title="Notes per beat" onClick={cycle('notesPerBeat', [1, 2, 3, 4])}>
          {state.notesPerBeat}/beat
        </Btn>
        <Btn title="Octave range" onClick={cycle('octaves', [1, 2, 3, 4])}>
          {state.octaves} oct
        </Btn>
        <Btn title="Direction" onClick={cycle('direction', DIRECTIONS.map(([id]) => id))}>
          {DIRECTIONS.find(([id]) => id === state.direction)[1]}
        </Btn>
        <Btn title="Notes per pattern group" onClick={cycle('groupLength', [1, 2, 3, 4, 5, 6])}>
          Group {state.groupLength}
        </Btn>
        <Btn title="Scale steps between notes in a group" onClick={cycle('jump', [1, 2, 3, 4])}>
          Step {state.jump}
        </Btn>
        <span className="group-inline" role="group" aria-label="Permutation">
          <Btn
            aria-label="Previous permutation"
            onClick={() =>
              dispatch({
                type: 'patch',
                patch: { permIndex: (state.permIndex - 1 + permutationCount) % permutationCount },
              })
            }
          >
            &lsaquo;
          </Btn>
          <Readout>{permutationLabel(permutation)}</Readout>
          <Btn
            aria-label="Next permutation"
            onClick={() =>
              dispatch({
                type: 'patch',
                patch: { permIndex: (state.permIndex + 1) % permutationCount },
              })
            }
          >
            &rsaquo;
          </Btn>
        </span>
      </div>
    </div>
  );
}
