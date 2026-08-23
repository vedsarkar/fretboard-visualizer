import { FlipHorizontal2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cap, Cluster, Hint, PICKED_SOLID, Stepper } from './Ui.jsx';
import { INSTRUMENT_GROUPS, PITCH_FLAT, PITCH_SHARP, noteNameOctave } from '@/lib/theory.js';

export function BoardControls({ state, dispatch, strings }) {
  const names = state.flats ? PITCH_FLAT : PITCH_SHARP;

  return (
    <div className="flex flex-wrap items-center gap-2">
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

      <span className="text-xs tabular-nums text-muted-foreground" data-testid="tuning-summary">
        {strings.map((midi) => noteNameOctave(midi, state.flats)).join(' ')}
      </span>

      <Cluster>
        <Hint label="Mirror the neck for left-handed players">
          <Toggle
            size="sm"
            aria-label="Left-handed"
            data-testid="hand-toggle"
            pressed={state.leftHanded}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'leftHanded' })}
          >
            <FlipHorizontal2 />
            {state.leftHanded ? 'Lefty' : 'Righty'}
          </Toggle>
        </Hint>
        <Hint label="Spell accidentals as sharps or flats">
          <Toggle
            size="sm"
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
            aria-label="Show degrees"
            data-testid="degree-toggle"
            pressed={state.showDegrees}
            onPressedChange={() => dispatch({ type: 'toggle', field: 'showDegrees' })}
          >
            {state.showDegrees ? 'Degrees' : 'Notes'}
          </Toggle>
        </Hint>
      </Cluster>

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

      <Cluster className="ml-auto" role="group" aria-label="Root note">
        <Cap>Root</Cap>
        <ToggleGroup
          type="single"
          size="sm"
          value={String(state.rootPc)}
          onValueChange={(value) => value && dispatch({ type: 'setRoot', pc: Number(value) })}
          data-testid="key-group"
        >
          {names.map((name, pc) => (
            <ToggleGroupItem
              key={name}
              value={String(pc)}
              aria-label={name}
              className={`font-semibold ${PICKED_SOLID}`}
            >
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Cluster>
    </div>
  );
}
