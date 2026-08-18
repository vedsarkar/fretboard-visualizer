import { Btn } from './Ui.jsx';

export function AboutPanel({ onClose }) {
  return (
    <div className="about-panel">
      <h3>Freetboard</h3>
      <p>
        Pick a root note and a scale or chord to light up every position on the neck. Choose an
        instrument and tuning, trim the fret count, and hide strings or degrees to isolate a shape.
      </p>
      <ul>
        <li>
          <b>Click</b> a note to hear it, or to paint it when a colour is selected.
        </li>
        <li>
          <b>Double-click</b> a note to spotlight every other position of that pitch.
        </li>
        <li>
          <b>Space</b> plays or stops the current pattern.
        </li>
        <li>
          <b>Group</b> and <b>Step</b> build melodic patterns; the arrows reorder each group.
        </li>
        <li>
          <b>Export</b> saves the diagram as a PNG.
        </li>
      </ul>
      <Btn onClick={onClose}>Close</Btn>
    </div>
  );
}
