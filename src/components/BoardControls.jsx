import { Btn, Dropdown, Label, MenuHeading, MenuItem, Readout } from './Ui.jsx';
import { INSTRUMENT_GROUPS, PITCH_FLAT, PITCH_SHARP, noteNameOctave } from '../lib/theory.js';

export function BoardControls({ state, dispatch, tuning, strings }) {
  const names = state.flats ? PITCH_FLAT : PITCH_SHARP;
  const tuningSummary = strings.map((m) => noteNameOctave(m, state.flats)).join(' ');

  return (
    <div className="board-controls">
      <Dropdown
        label={`${tuning.name} \u00b7 ${tuningSummary}`}
        menuClassName="instrument-menu"
      >
        {(close) =>
          INSTRUMENT_GROUPS.map((group) => (
            <div key={group.id}>
              <MenuHeading>{group.label}</MenuHeading>
              {group.tunings.map((t) => (
                <MenuItem
                  key={t.id}
                  active={t.id === state.tuningId}
                  label={t.name}
                  detail={t.notes.join('-')}
                  onClick={() => {
                    dispatch({ type: 'setTuning', id: t.id });
                    close();
                  }}
                />
              ))}
            </div>
          ))
        }
      </Dropdown>

      <Btn
        on={state.leftHanded}
        title="Flip for left-handed players"
        onClick={() => dispatch({ type: 'toggle', field: 'leftHanded' })}
      >
        {state.leftHanded ? 'Lefty' : 'Righty'}
      </Btn>

      <div className="group" role="group" aria-label="Transpose tuning">
        <Label>Tune</Label>
        <Btn
          aria-label="Tune down a semitone"
          onClick={() => dispatch({ type: 'clamp', field: 'transpose', delta: -1, min: -12, max: 12 })}
        >
          &minus;
        </Btn>
        <Readout>{state.transpose > 0 ? `+${state.transpose}` : state.transpose}</Readout>
        <Btn
          aria-label="Tune up a semitone"
          onClick={() => dispatch({ type: 'clamp', field: 'transpose', delta: 1, min: -12, max: 12 })}
        >
          +
        </Btn>
      </div>

      <div className="group" role="group" aria-label="Fret count">
        <Label>Frets</Label>
        <Btn
          aria-label="Fewer frets"
          onClick={() => dispatch({ type: 'clamp', field: 'fretCount', delta: -1, min: 4, max: 24 })}
        >
          &minus;
        </Btn>
        <Readout>{state.fretCount}</Readout>
        <Btn
          aria-label="More frets"
          onClick={() => dispatch({ type: 'clamp', field: 'fretCount', delta: 1, min: 4, max: 24 })}
        >
          +
        </Btn>
      </div>

      <Btn
        on={state.flats}
        title="Sharps or flats"
        onClick={() => dispatch({ type: 'toggle', field: 'flats' })}
      >
        {state.flats ? '\u266d' : '\u266f'}
      </Btn>
      <Btn
        on={state.showDegrees}
        title="Note names or scale degrees"
        onClick={() => dispatch({ type: 'toggle', field: 'showDegrees' })}
      >
        {state.showDegrees ? 'Degrees' : 'Notes'}
      </Btn>

      <div className="key-selector" role="group" aria-label="Root note">
        {names.map((name, pc) => (
          <Btn key={name} active={pc === state.rootPc} onClick={() => dispatch({ type: 'setRoot', pc })}>
            {name}
          </Btn>
        ))}
      </div>
    </div>
  );
}
