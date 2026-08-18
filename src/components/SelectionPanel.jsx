import { Btn, Dropdown, Label, MenuItem } from './Ui.jsx';
import {
  CHORD_GROUPS,
  DEGREE_LABEL,
  INTERVAL_LABEL,
  SCALE_GROUPS,
  findScale,
  scaleGroupOf,
} from '../lib/theory.js';

const intervalSummary = (intervals) => intervals.map((i) => DEGREE_LABEL[i]).join(' ');

function ScaleRow({ state, dispatch, intervals }) {
  const activeGroup = state.useCustom ? null : scaleGroupOf(state.scaleId);

  return (
    <>
      <div className="row">
        {SCALE_GROUPS.map((group) => {
          const isActive = activeGroup?.id === group.id;
          return (
            <Dropdown
              key={group.id}
              active={isActive}
              label={isActive ? findScale(state.scaleId).name : group.label}
            >
              {(close) =>
                group.scales.map((scale) => (
                  <MenuItem
                    key={scale.id}
                    active={!state.useCustom && state.scaleId === scale.id}
                    label={scale.name}
                    detail={intervalSummary(scale.intervals)}
                    onClick={() => {
                      dispatch({ type: 'selectScale', id: scale.id });
                      close();
                    }}
                  />
                ))
              }
            </Dropdown>
          );
        })}
        <Btn active={state.useCustom} onClick={() => dispatch({ type: 'enableCustom' })}>
          Custom
        </Btn>
      </div>

      <div className="row row-intervals">
        <Label>Intervals</Label>
        {INTERVAL_LABEL.map((name, semitones) => (
          <Btn
            key={name}
            active={intervals.includes(semitones)}
            onClick={() => dispatch({ type: 'toggleInterval', semitones })}
          >
            {name}
          </Btn>
        ))}
      </div>
    </>
  );
}

function ChordRow({ state, dispatch }) {
  return (
    <div className="row">
      {CHORD_GROUPS.map((group) =>
        group.label ? (
          <Dropdown
            key={group.id}
            label={group.label}
            active={
              !state.useCustom && group.chords.some((c) => c.id === state.chordId)
            }
          >
            {(close) =>
              group.chords.map((chord) => (
                <MenuItem
                  key={chord.id}
                  active={!state.useCustom && state.chordId === chord.id}
                  label={chord.name}
                  detail={intervalSummary(chord.intervals)}
                  onClick={() => {
                    dispatch({ type: 'selectChord', id: chord.id });
                    close();
                  }}
                />
              ))
            }
          </Dropdown>
        ) : (
          group.chords.map((chord) => (
            <Btn
              key={chord.id}
              active={!state.useCustom && state.chordId === chord.id}
              onClick={() => dispatch({ type: 'selectChord', id: chord.id })}
            >
              {chord.name}
            </Btn>
          ))
        ),
      )}
    </div>
  );
}

export function SelectionPanel({ state, dispatch, intervals, stringCount }) {
  return (
    <section className="selector">
      {state.mode === 'scales' ? (
        <div className="mode-panel">
          <ScaleRow state={state} dispatch={dispatch} intervals={intervals} />
        </div>
      ) : (
        <div className="mode-panel">
          <ChordRow state={state} dispatch={dispatch} />
        </div>
      )}

      <div className="row row-filters">
        <Label>Degrees</Label>
        <div className="chip-set">
          {intervals.map((semitones, index) => (
            <Btn
              key={index}
              active={state.degreeFilter.includes(index)}
              title={`Show degree ${DEGREE_LABEL[semitones]}`}
              onClick={() => dispatch({ type: 'toggleDegree', index })}
            >
              {index + 1}
            </Btn>
          ))}
          <Btn
            active={state.degreeFilter.length === 0}
            onClick={() => dispatch({ type: 'clearDegrees' })}
          >
            All
          </Btn>
        </div>

        <Label>Strings</Label>
        <div className="chip-set">
          {Array.from({ length: stringCount }, (_, n) => {
            const number = n + 1;
            const index = stringCount - number;
            return (
              <Btn
                key={index}
                on={!state.stringsOff.includes(index)}
                title={`String ${number}`}
                onClick={() => dispatch({ type: 'toggleString', index })}
              >
                {number}
              </Btn>
            );
          })}
          <Btn
            active={state.stringsOff.length === 0}
            onClick={() => dispatch({ type: 'clearStrings' })}
          >
            All
          </Btn>
        </div>
      </div>
    </section>
  );
}
