import { FlipHorizontal2, Music, Music2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hint, Stepper } from './Ui.jsx';
import { INSTRUMENT_GROUPS, KEY_COUNTS, PITCH_FLAT, PITCH_SHARP } from '@/lib/theory.js';

/** Inline caption sitting inside a select trigger, ahead of the value. */
const FieldLabel = ({ children }) => (
  <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
    {children}
  </span>
);

export function BoardControls({ state, dispatch, stringCount, extraAllowed }) {
  const names = state.flats ? PITCH_FLAT : PITCH_SHARP;
  const guitar = state.board === 'guitar';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={String(state.rootPc)}
          onValueChange={(pc) => dispatch({ type: 'setRoot', pc: Number(pc) })}
        >
          <SelectTrigger size="sm" className="w-[124px]" aria-label="Root note" data-testid="root-select">
            <span className="flex items-center gap-1.5">
              <FieldLabel>Root</FieldLabel>
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {names.map((name, pc) => (
              <SelectItem key={name} value={String(pc)} className="font-semibold">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {guitar && (
          <Select value={state.tuningId} onValueChange={(id) => dispatch({ type: 'setTuning', id })}>
            <SelectTrigger size="sm" className="w-[260px]" data-testid="instrument-select">
              <SelectValue placeholder="Instrument" />
            </SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              {INSTRUMENT_GROUPS.map((group) => (
                <SelectGroup key={group.id}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.tunings.map((tuning) => (
                    <SelectItem key={tuning.id} value={tuning.id}>
                      <span className="flex-1">{tuning.name}</span>
                      <span className="ml-3 text-xs tabular-nums text-muted-foreground">
                        {tuning.notes.join('-')}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="ml-auto" />

      {guitar && (
        <Hint label="Mirror the neck for left-handed players">
          <Toggle
            size="sm"
            variant="outline"
            aria-label="Left-handed"
            data-testid="hand-toggle"
            pressed={state.leftHanded}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'leftHanded' })}
          >
            <FlipHorizontal2 />
            {state.leftHanded ? 'Lefty' : 'Righty'}
          </Toggle>
        </Hint>
      )}

      <Hint label="Spell accidentals as sharps or flats">
        <Toggle
          size="sm"
          variant="outline"
          aria-label="Use flats"
          data-testid="notation-toggle"
          pressed={state.flats}
          onPressedChange={() => dispatch({ type: 'toggle', field: 'flats' })}
        >
          {state.flats ? '\u266d Flats' : '\u266f Sharps'}
        </Toggle>
      </Hint>

      <Hint label="Label dots with note names or scale degrees">
        <Toggle
          size="sm"
          variant="outline"
          aria-label="Show degrees"
          data-testid="degree-toggle"
          pressed={state.showDegrees}
          onPressedChange={() => dispatch({ type: 'toggle', field: 'showDegrees' })}
        >
          {state.showDegrees ? (
            <>
              <Music2 className="size-4" />
              Degrees
            </>
          ) : (
            <>
              <Music className="size-4" />
              Notes
            </>
          )}
        </Toggle>
      </Hint>

      {guitar ? (
        <>
          {extraAllowed > 0 && (
            <Stepper
              label="Strings"
              testId="strings"
              value={stringCount}
              decHint="Remove the lowest added string"
              incHint="Add a string below the lowest one"
              onDecrease={() => dispatch({ type: 'setExtraStrings', extra: state.extraStrings - 1 })}
              onIncrease={() => dispatch({ type: 'setExtraStrings', extra: state.extraStrings + 1 })}
            />
          )}

          <Stepper
            label="Tune"
            testId="tune"
            value={state.transpose > 0 ? `+${state.transpose}` : state.transpose}
            decHint="Tune every string down a semitone"
            incHint="Tune every string up a semitone"
            onDecrease={() => dispatch({ type: 'clamp', field: 'transpose', delta: -1, min: -12, max: 12 })}
            onIncrease={() => dispatch({ type: 'clamp', field: 'transpose', delta: 1, min: -12, max: 12 })}
          />

          <Stepper
            label="Frets"
            testId="frets"
            value={state.fretCount}
            decHint="Show fewer frets"
            incHint="Show more frets"
            onDecrease={() => dispatch({ type: 'clamp', field: 'fretCount', delta: -1, min: 4, max: 24 })}
            onIncrease={() => dispatch({ type: 'clamp', field: 'fretCount', delta: 1, min: 4, max: 24 })}
          />
        </>
      ) : (
        <Select
          value={String(state.keyCount)}
          onValueChange={(count) => dispatch({ type: 'setKeyCount', count: Number(count) })}
        >
          <SelectTrigger size="sm" className="w-20" aria-label="Keys" data-testid="keys-select">
            <span className="flex items-center gap-1.5">
              <FieldLabel>Keys</FieldLabel>
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {KEY_COUNTS.map(({ count }) => (
              <SelectItem key={count} value={String(count)} className="font-semibold">
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
