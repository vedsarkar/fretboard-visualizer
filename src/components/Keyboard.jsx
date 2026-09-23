import { forwardRef, memo, useMemo } from 'react';
import { DEGREE_LABEL, noteName, noteNameOctave, pitchClass } from '../lib/theory.js';
import { FONT, NOTE_COLOR } from '../lib/layout.js';
import { KEY_COLORS, computeKeyboardLayout } from '../lib/keyboard.js';

/** One note dot. Memoised so playback highlights only re-render what changed. */
const KeyMarker = memo(function KeyMarker({ note, radius, flashId, onSelect, onSpotlight }) {
  const { cx, cy, fill, label, isRoot, onBlackKey, dimmed } = note;
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
        <circle
          cx={cx}
          cy={cy}
          r={radius + 3.5}
          fill="none"
          stroke={KEY_COLORS.rootRing}
          strokeWidth={2.5}
          opacity={0.9}
        />
      ) : null}
      <circle
        key={flashId}
        className="fb-dot"
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        /* A black dot on a black key needs the same solid rim the open-string
           dots use on the fretboard, or it disappears into the key. */
        stroke={onBlackKey ? '#f2f2f2' : 'rgba(255,255,255,0.35)'}
        strokeWidth={onBlackKey ? 2 : 1}
      />
      <text
        x={cx}
        y={cy}
        fill={KEY_COLORS.noteText}
        fontFamily={FONT}
        fontSize={label.length > 1 ? 9 : 11}
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
 * @param {object} props.view          derived keyboard description
 * @param {{key:string,id:number}} props.flash
 */
export const Keyboard = forwardRef(function Keyboard(
  { view, flash, onSelect, onSpotlight },
  ref,
) {
  const { keyCount, flats, showDegrees } = view;

  const L = useMemo(() => computeKeyboardLayout({ keyCount }), [keyCount]);

  /* Only notes in the selection get a marker, and only they are clickable —
     the fretboard works the same way, so paint and flash always have a dot. */
  const noteFor = useMemo(() => {
    const map = new Map();
    for (const key of L.keys) {
      const entry = view.pitches.get(pitchClass(key.midi));
      if (!entry) continue;
      map.set(key.midi, {
        key: `k:${key.midi}`,
        midi: key.midi,
        cx: key.cx,
        cy: key.cy,
        fill: NOTE_COLOR,
        label: showDegrees ? DEGREE_LABEL[entry.semitones] : noteName(key.midi, flats),
        isRoot: entry.semitones === 0,
        onBlackKey: key.black,
        dimmed: view.spotlight !== null && view.spotlight !== pitchClass(key.midi),
      });
    }
    return map;
  }, [L, view.pitches, view.spotlight, flats, showDegrees]);

  /** Handlers for a key rect, or nothing when the key is out of the selection. */
  const keyHandlers = (midi) => {
    const note = noteFor.get(midi);
    if (!note) return null;
    return {
      style: { cursor: 'pointer' },
      onClick: (event) => {
        if (event.detail > 1) return;
        onSelect(note);
      },
      onDoubleClick: () => onSpotlight(note),
    };
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${L.width} ${L.height}`}
      width="100%"
      className="block min-w-[520px]"
      role="img"
      aria-label="Keyboard diagram"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxHeight: L.height * 1.35 }}
    >
      <rect x={0} y={0} width={L.width} height={L.height} fill="transparent" />

      {L.whites.map((key) => (
        <rect
          key={`w-${key.midi}`}
          x={key.x}
          y={key.y}
          width={key.w}
          height={key.h}
          rx={3}
          fill={KEY_COLORS.white}
          stroke={KEY_COLORS.whiteEdge}
          strokeWidth={1}
          {...keyHandlers(key.midi)}
        />
      ))}

      {L.blacks.map((key) => (
        <rect
          key={`b-${key.midi}`}
          x={key.x}
          y={key.y}
          width={key.w}
          height={key.h}
          rx={2}
          fill={KEY_COLORS.black}
          stroke={KEY_COLORS.blackEdge}
          strokeWidth={1}
          {...keyHandlers(key.midi)}
        />
      ))}

      {/* Every C is labelled, the way the fretboard numbers its frets. */}
      {L.whites
        .filter((key) => pitchClass(key.midi) === 0)
        .map((key) => (
          <text
            key={`label-${key.midi}`}
            x={key.cx}
            y={L.labelY}
            fill={KEY_COLORS.label}
            fontFamily={FONT}
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="central"
            pointerEvents="none"
          >
            {noteNameOctave(key.midi, flats)}
          </text>
        ))}

      {[...noteFor.values()].map((note) => (
        <KeyMarker
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
