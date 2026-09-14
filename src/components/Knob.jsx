import { useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';

const SWEEP = 270; // degrees of travel, centred on 12 o'clock
const TRAVEL = 140; // px of vertical drag to cross the whole range
const BOX = 40; // viewBox units, so `className` alone decides the drawn size
const CENTRE = BOX / 2;
const RADIUS = 15;

/** Polar to cartesian with 0° pointing up. */
function point(degrees, radius = RADIUS) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [CENTRE + radius * Math.cos(radians), CENTRE + radius * Math.sin(radians)];
}

function arc(from, to) {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} ${to < from ? 0 : 1} ${x2} ${y2}`;
}

/**
 * Rotary dial. Drag vertically or use the arrow keys; double-click returns it
 * to `origin`, which is also where the filled arc is measured from, so a
 * centred value reads as "no change" rather than "half way up".
 *
 * Renders the dial only — the caller owns the label and readout, so it can sit
 * on the same baseline as neighbouring form fields.
 */
export function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  origin = min,
  display,
  onChange,
  testId,
  className,
}) {
  const latest = useRef(value);
  latest.current = value;

  const angleFor = (at) => -SWEEP / 2 + ((at - min) / (max - min)) * SWEEP;
  const commit = (next) => onChange(Math.min(max, Math.max(min, next)));

  const drag = useCallback(
    (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startValue = latest.current;
      const span = max - min;
      const move = (event) => {
        const moved = ((startY - event.clientY) / TRAVEL) * span;
        const next = startValue + Math.round(moved / step) * step;
        commit(Number(next.toFixed(4)));
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, onChange],
  );

  const key = (e) => {
    const nudge = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step }[e.key];
    if (nudge) {
      e.preventDefault();
      commit(value + nudge);
    } else if (e.key === 'Home') {
      commit(min);
    } else if (e.key === 'End') {
      commit(max);
    }
  };

  return (
    <svg
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={display}
      data-testid={testId}
      viewBox={`0 0 ${BOX} ${BOX}`}
      className={cn(
        'shrink-0 cursor-ns-resize touch-none rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
      onPointerDown={drag}
      onDoubleClick={() => commit(origin)}
      onKeyDown={key}
    >
      <path
        d={arc(-SWEEP / 2, SWEEP / 2)}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-border"
      />
      <path
        d={arc(angleFor(origin), angleFor(value))}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-primary"
      />
      <line
        x1={point(angleFor(value), 3)[0]}
        y1={point(angleFor(value), 3)[1]}
        x2={point(angleFor(value), 10)[0]}
        y2={point(angleFor(value), 10)[1]}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-foreground"
      />
    </svg>
  );
}
