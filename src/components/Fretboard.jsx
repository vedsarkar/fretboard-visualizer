import { forwardRef, memo, useMemo } from 'react';
import { DEGREE_LABEL, DOUBLE_INLAY_FRETS, INLAY_FRETS, noteName, noteNameOctave, pitchClass } from '../lib/theory.js';
import { COLORS, FONT, NOTE_COLOR, computeLayout } from '../lib/layout.js';

/** One note dot. Memoised so playback highlights only re-render what changed. */
const NoteMarker = memo(function NoteMarker({ note, radius, flashId, onSelect, onSpotlight }) {
  const { cx, cy, fill, label, isRoot, dimmed } = note;
  return (
    <g
      className={`fb-note${flashId ? ' is-flashing' : ''}`}
      opacity={dimmed ? 0.28 : 1}
      style={{ cursor: 'pointer' }}
      onClick={(event) => {
        if (event.detail > 1) return;
        onSelect(note);
      }}
      onDoubleClick={() => onSpotlight(note)}
    >
      {isRoot ? (
        <circle cx={cx} cy={cy} r={radius + 3.5} fill="none" stroke={fill} strokeWidth={2} opacity={0.75} />
      ) : null}
      <circle
        key={flashId}
        className="fb-dot"
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={note.fret === 0 ? '#f2f2f2' : 'rgba(0,0,0,0.45)'}
        strokeWidth={note.fret === 0 ? 2 : 1}
      />
      <text
        x={cx}
        y={cy}
        fill={COLORS.noteText}
        fontFamily={FONT}
        fontSize={label.length > 2 ? 10 : 12}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        pointerEvents="none"
      >
        {label}
      </text>
    </g>
  );
});

/**
 * @param {object} props
 * @param {object} props.view          derived board description
 * @param {{key:string,id:number}} props.flash
 */
export const Fretboard = forwardRef(function Fretboard(
  { view, flash, onSelect, onSpotlight },
  ref,
) {
  const { strings, fretCount, leftHanded, flats, showDegrees, stringEnabled } = view;
  const stringCount = strings.length;

  const L = useMemo(
    () => computeLayout({ stringCount, fretCount, leftHanded }),
    [stringCount, fretCount, leftHanded],
  );

  const notes = useMemo(() => {
    const out = [];
    const showAllDegrees = view.degreeFilter.length === 0;
    for (let i = 0; i < stringCount; i += 1) {
      for (let fret = 0; fret <= fretCount; fret += 1) {
        const midi = strings[i] + fret;
        const entry = view.pitches.get(pitchClass(midi));
        if (!entry) continue;
        if (!showAllDegrees && !view.degreeFilter.includes(entry.degree)) continue;
        const key = `${i}:${fret}`;
        out.push({
          key,
          string: i,
          fret,
          midi,
          cx: L.mirror(fret === 0 ? L.openX : L.fretCentre(fret)),
          cy: L.stringY(i),
          fill: view.painted[key] || NOTE_COLOR,
          label: showDegrees ? DEGREE_LABEL[entry.semitones] : noteName(midi, flats),
          isRoot: entry.semitones === 0,
          dimmed:
            !stringEnabled[i] || (view.spotlight !== null && view.spotlight !== pitchClass(midi)),
        });
      }
    }
    return out;
  }, [L, strings, stringCount, fretCount, flats, showDegrees, stringEnabled, view.pitches, view.degreeFilter, view.painted, view.spotlight]);

  const boardX = L.mirror(L.boardLeft) - (leftHanded ? L.boardWidth : 0);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${L.width} ${L.height}`}
      width="100%"
      className="block min-w-[640px]"
      role="img"
      aria-label="Fretboard diagram"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxHeight: L.height * 1.35 }}
    >
      <rect x={0} y={0} width={L.width} height={L.height} fill="transparent" />

      <rect
        x={boardX}
        y={L.boardTop}
        width={L.boardWidth}
        height={L.boardHeight}
        rx={3}
        fill={COLORS.board}
        stroke={COLORS.boardEdge}
        strokeWidth={1}
      />

      {Array.from({ length: fretCount }, (_, n) => {
        const x = L.mirror(L.fretLine(n + 1));
        return (
          <line
            key={`fret-${n}`}
            x1={x}
            y1={L.boardTop}
            x2={x}
            y2={L.boardTop + L.boardHeight}
            stroke={COLORS.fret}
            strokeWidth={2}
          />
        );
      })}

      {Array.from({ length: fretCount }, (_, n) => {
        const fret = n + 1;
        const x = L.mirror(L.fretCentre(fret));
        if (DOUBLE_INLAY_FRETS.includes(fret)) {
          const offset = Math.min(L.boardHeight / 4, L.stringGap * 1.1);
          return (
            <g key={`inlay-${fret}`}>
              <circle cx={x} cy={L.inlayY - offset} r={L.inlayRadius} fill={COLORS.inlay} />
              <circle cx={x} cy={L.inlayY + offset} r={L.inlayRadius} fill={COLORS.inlay} />
            </g>
          );
        }
        if (INLAY_FRETS.includes(fret)) {
          return <circle key={`inlay-${fret}`} cx={x} cy={L.inlayY} r={L.inlayRadius} fill={COLORS.inlay} />;
        }
        return null;
      })}

      <rect
        x={L.mirror(L.nutCentre) - L.nutWidth / 2}
        y={L.boardTop}
        width={L.nutWidth}
        height={L.boardHeight}
        rx={1.5}
        fill={COLORS.nut}
      />

      {strings.map((open, i) => {
        const y = L.stringY(i);
        const enabled = stringEnabled[i];
        return (
          <g key={`string-${i}`}>
            <line
              x1={L.mirror(L.boardLeft)}
              y1={y}
              x2={L.mirror(L.boardLeft + L.boardWidth)}
              y2={y}
              stroke={enabled ? COLORS.string : COLORS.muted}
              strokeWidth={L.stringWidth(i)}
              opacity={enabled ? 0.85 : 0.4}
            />
            <text
              x={L.mirror(L.labelX)}
              y={y}
              fill={enabled ? COLORS.openLabel : COLORS.muted}
              fontFamily={FONT}
              fontSize={13}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {noteNameOctave(open, flats)}
            </text>
          </g>
        );
      })}

      <text
        x={L.mirror(L.openX)}
        y={L.numberY}
        fill={COLORS.fretNumber}
        fontFamily={FONT}
        fontSize={12}
        textAnchor="middle"
        dominantBaseline="central"
      >
        0
      </text>
      {Array.from({ length: fretCount }, (_, n) => {
        const fret = n + 1;
        const marked = INLAY_FRETS.includes(fret) || DOUBLE_INLAY_FRETS.includes(fret);
        return (
          <text
            key={`num-${fret}`}
            x={L.mirror(L.fretCentre(fret))}
            y={L.numberY}
            fill={marked ? COLORS.fretNumberOn : COLORS.fretNumber}
            fontFamily={FONT}
            fontSize={12}
            fontWeight={marked ? 700 : 400}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {fret}
          </text>
        );
      })}

      {notes.map((note) => (
        <NoteMarker
          key={note.key}
          note={note}
          radius={L.noteRadius}
          flashId={flash.key === note.key ? flash.id : 0}
          onSelect={onSelect}
          onSpotlight={onSpotlight}
        />
      ))}
    </svg>
  );
});
