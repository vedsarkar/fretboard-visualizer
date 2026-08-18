import { Btn, Dropdown } from './Ui.jsx';
import { INSTRUMENT_GROUPS, PITCH_SHARP, SCALE_GROUPS } from '../lib/theory.js';
import { PERSIST_FIELDS, STORAGE_KEY } from '../lib/state.js';

export function SettingsPanel({ state, dispatch }) {
  const setDefault = (field) => (event) =>
    dispatch({
      type: 'setDefault',
      field,
      value: field === 'root' ? Number(event.target.value) : event.target.value,
    });

  return (
    <Dropdown label="Settings" menuClassName="settings-panel">
      {() => (
        <>
          <h3>Defaults on load</h3>
          <label className="field">
            <span>Instrument</span>
            <select value={state.defaults.instrument} onChange={setDefault('instrument')}>
              {INSTRUMENT_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.tunings.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Root</span>
            <select value={String(state.defaults.root)} onChange={setDefault('root')}>
              {PITCH_SHARP.map((name, pc) => (
                <option key={name} value={String(pc)}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Scale</span>
            <select value={state.defaults.scale} onChange={setDefault('scale')}>
              {SCALE_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.scales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <h3>Remember between sessions</h3>
          <div className="checks">
            {PERSIST_FIELDS.map(([field, label]) => (
              <label key={field}>
                <input
                  type="checkbox"
                  checked={Boolean(state.persist[field])}
                  onChange={(event) =>
                    dispatch({ type: 'setPersist', field, value: event.target.checked })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <Btn
            className="btn-reset wide"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
          >
            Reset everything
          </Btn>
        </>
      )}
    </Dropdown>
  );
}
