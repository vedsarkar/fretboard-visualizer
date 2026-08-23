import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cap, Cluster, Hint, MUTABLE, PICKED, PICKED_SOLID } from './Ui.jsx';
import {
  CHORD_GROUPS,
  DEGREE_LABEL,
  INTERVAL_LABEL,
  SCALE_GROUPS,
  findScale,
  scaleGroupOf,
} from '@/lib/theory.js';

const summary = (intervals) => intervals.map((i) => DEGREE_LABEL[i]).join(' ');

function ScaleGroups({ state, dispatch }) {
  const activeGroup = state.useCustom ? null : scaleGroupOf(state.scaleId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SCALE_GROUPS.map((group) => {
        const isActive = activeGroup?.id === group.id;
        return (
          <DropdownMenu key={group.id}>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                data-testid={`scale-group-${group.id}`}
              >
                {isActive ? findScale(state.scaleId).name : group.label}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[70vh] overflow-y-auto">
              <DropdownMenuRadioGroup
                value={state.useCustom ? '' : state.scaleId}
                onValueChange={(id) => dispatch({ type: 'selectScale', id })}
              >
                {group.scales.map((scale) => (
                  <DropdownMenuRadioItem key={scale.id} value={scale.id}>
                    <span className="flex-1">{scale.name}</span>
                    <span className="ml-3 text-xs tabular-nums text-muted-foreground">
                      {summary(scale.intervals)}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      <Hint label="Build your own set from the intervals below">
        <Button
          size="sm"
          variant={state.useCustom ? 'default' : 'outline'}
          data-testid="custom-btn"
          onClick={() => dispatch({ type: 'enableCustom' })}
        >
          Custom
        </Button>
      </Hint>
    </div>
  );
}

function Chords({ state, dispatch }) {
  const [common, extended] = CHORD_GROUPS;
  const extendedActive = !state.useCustom && extended.chords.some((c) => c.id === state.chordId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={state.useCustom ? '' : state.chordId}
        onValueChange={(id) => id && dispatch({ type: 'selectChord', id })}
        data-testid="chord-group"
      >
        {common.chords.map((chord) => (
          <ToggleGroupItem
            key={chord.id}
            value={chord.id}
            aria-label={chord.name}
            className={PICKED_SOLID}
          >
            {chord.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant={extendedActive ? 'default' : 'outline'} data-testid="chord-more">
            {extendedActive ? findChordName(state.chordId) : extended.label}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={state.useCustom ? '' : state.chordId}
            onValueChange={(id) => dispatch({ type: 'selectChord', id })}
          >
            {extended.chords.map((chord) => (
              <DropdownMenuRadioItem key={chord.id} value={chord.id}>
                <span className="flex-1">{chord.name}</span>
                <span className="ml-3 text-xs tabular-nums text-muted-foreground">
                  {summary(chord.intervals)}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const findChordName = (id) =>
  CHORD_GROUPS.flatMap((g) => g.chords).find((c) => c.id === id)?.name ?? 'More';

export function SelectionPanel({ state, dispatch, intervals, stringCount }) {
  const enabledStrings = Array.from({ length: stringCount }, (_, i) => i).filter(
    (i) => !state.stringsOff.includes(i),
  );

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      {state.mode === 'scales' ? (
        <>
          <ScaleGroups state={state} dispatch={dispatch} />
          <div className="flex flex-wrap items-center gap-1.5">
            <Cap>Intervals</Cap>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={intervals.map(String)}
              onValueChange={(values) =>
                dispatch({ type: 'setIntervals', semitones: values.map(Number) })
              }
              data-testid="interval-group"
            >
              {INTERVAL_LABEL.map((name, semitones) => (
                <ToggleGroupItem
                  key={name}
                  value={String(semitones)}
                  aria-label={name}
                  className={PICKED}
                >
                  {name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </>
      ) : (
        <Chords state={state} dispatch={dispatch} />
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
        <Cluster role="group" aria-label="Degrees">
          <Cap>Degrees</Cap>
          <ToggleGroup
            type="multiple"
            size="sm"
            value={state.degreeFilter.map(String)}
            onValueChange={(values) =>
              dispatch({ type: 'setDegrees', indices: values.map(Number) })
            }
            data-testid="degree-group"
          >
            {intervals.map((semitones, index) => (
              <ToggleGroupItem
                key={index}
                value={String(index)}
                aria-label={`Degree ${index + 1} (${DEGREE_LABEL[semitones]})`}
                className={PICKED}
              >
                {index + 1}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            size="sm"
            variant={state.degreeFilter.length === 0 ? 'default' : 'ghost'}
            data-testid="degree-all"
            onClick={() => dispatch({ type: 'clearDegrees' })}
          >
            All
          </Button>
        </Cluster>

        <Cluster role="group" aria-label="Strings">
          <Cap>Strings</Cap>
          <ToggleGroup
            type="multiple"
            size="sm"
            value={enabledStrings.map(String)}
            onValueChange={(values) =>
              dispatch({ type: 'setStrings', on: values.map(Number), total: stringCount })
            }
            data-testid="string-group"
          >
            {Array.from({ length: stringCount }, (_, n) => {
              const number = stringCount - n;
              const index = n;
              return (
                <ToggleGroupItem
                  key={index}
                  value={String(index)}
                  aria-label={`String ${number}`}
                  className={MUTABLE}
                >
                  {number}
                </ToggleGroupItem>
              );
            }).reverse()}
          </ToggleGroup>
          <Button
            size="sm"
            variant={state.stringsOff.length === 0 ? 'default' : 'ghost'}
            data-testid="string-all"
            onClick={() => dispatch({ type: 'clearStrings' })}
          >
            All
          </Button>
        </Cluster>
      </div>
    </section>
  );
}
