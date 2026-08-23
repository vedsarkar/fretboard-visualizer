import { ChevronLeft, ChevronRight, Minus, Play, Plus, Repeat, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Cap, Cluster, Hint } from './Ui.jsx';
import { DIRECTIONS } from '@/lib/state.js';
import { permutationLabel } from '@/lib/sequencer.js';

/** Cycling control: shows its current value, advances on click. */
function Cycle({ hint, value, onClick, testId }) {
  return (
    <Hint label={hint}>
      <Button variant="ghost" size="sm" onClick={onClick} data-testid={testId}>
        {value}
      </Button>
    </Hint>
  );
}

export function Transport({ state, dispatch, isPlaying, onToggle, permutation, permutationCount }) {
  const cycle = (field, values) => () => dispatch({ type: 'cycle', field, values });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Cluster role="group" aria-label="Tempo">
        <Hint label="Slower">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Decrease tempo"
            data-testid="tempo-dec"
            onClick={() => dispatch({ type: 'clamp', field: 'tempo', delta: -5, min: 30, max: 300 })}
          >
            <Minus />
          </Button>
        </Hint>
        <span
          className="min-w-9 text-center text-xs font-semibold tabular-nums text-primary"
          data-testid="tempo-value"
        >
          {state.tempo}
        </span>
        <Hint label="Faster">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Increase tempo"
            data-testid="tempo-inc"
            onClick={() => dispatch({ type: 'clamp', field: 'tempo', delta: 5, min: 30, max: 300 })}
          >
            <Plus />
          </Button>
        </Hint>
        <Separator orientation="vertical" className="mx-0.5 !h-5" />
        <Hint label="Click on every beat">
          <Toggle
            size="sm"
            aria-label="Metronome"
            data-testid="metro-toggle"
            pressed={state.metronome}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'metronome' })}
          >
            <Timer />
          </Toggle>
        </Hint>
      </Cluster>

      <Cluster role="group" aria-label="Playback">
        <Hint label={isPlaying ? 'Stop (Space)' : 'Play (Space)'}>
          <Button
            size="sm"
            variant={isPlaying ? 'default' : 'outline'}
            onClick={onToggle}
            data-testid="play-btn"
          >
            {isPlaying ? <Square /> : <Play />}
            {isPlaying ? 'Stop' : 'Play'}
          </Button>
        </Hint>
        <Hint label="Four beats of clicks before the notes start">
          <Toggle
            size="sm"
            aria-label="Count-in"
            data-testid="countin-toggle"
            pressed={state.countIn}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'countIn' })}
          >
            Count&#8209;in
          </Toggle>
        </Hint>
        <Hint label="Repeat the sequence until stopped">
          <Toggle
            size="sm"
            aria-label="Loop"
            data-testid="loop-toggle"
            pressed={state.loop}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'loop' })}
          >
            <Repeat />
          </Toggle>
        </Hint>
      </Cluster>

      <Cluster role="group" aria-label="Pattern">
        <Cap>Pattern</Cap>
        <Cycle
          hint="Notes played per beat"
          value={`${state.notesPerBeat}/beat`}
          testId="npb-cycle"
          onClick={cycle('notesPerBeat', [1, 2, 3, 4])}
        />
        <Cycle
          hint="How many octaves the run spans"
          value={`${state.octaves} oct`}
          testId="oct-cycle"
          onClick={cycle('octaves', [1, 2, 3, 4])}
        />
        <Cycle
          hint="Which way the sequence travels"
          value={DIRECTIONS.find(([id]) => id === state.direction)[1]}
          testId="dir-cycle"
          onClick={cycle('direction', DIRECTIONS.map(([id]) => id))}
        />
        <Cycle
          hint="Notes per repeating group. Group 4 gives the classic 1234-2345 drill"
          value={`Group ${state.groupLength}`}
          testId="group-cycle"
          onClick={cycle('groupLength', [1, 2, 3, 4, 5, 6])}
        />
        <Cycle
          hint="Scale steps between notes inside a group. Step 2 plays in thirds"
          value={`Step ${state.jump}`}
          testId="step-cycle"
          onClick={cycle('jump', [1, 2, 3, 4])}
        />
        <Separator orientation="vertical" className="mx-0.5 !h-5" />
        <Hint label="Reorder the notes within each group">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous permutation"
            data-testid="perm-prev"
            onClick={() =>
              dispatch({
                type: 'patch',
                patch: { permIndex: (state.permIndex - 1 + permutationCount) % permutationCount },
              })
            }
          >
            <ChevronLeft />
          </Button>
        </Hint>
        <span
          className="min-w-10 text-center text-xs font-semibold tabular-nums text-primary"
          data-testid="perm-value"
        >
          {permutationLabel(permutation)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next permutation"
          data-testid="perm-next"
          onClick={() =>
            dispatch({
              type: 'patch',
              patch: { permIndex: (state.permIndex + 1) % permutationCount },
            })
          }
        >
          <ChevronRight />
        </Button>
      </Cluster>
    </div>
  );
}
