import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Play, Settings, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hint } from './Ui.jsx';
import { Knob } from './Knob.jsx';
import { cn } from '@/lib/utils';
import { CLICK_SOUNDS } from '@/lib/audio.js';
import { CLICK_RHYTHMS, METERS, METER_GROUPS, findMeter } from '@/lib/sequencer.js';
import { TEMPO_MAX, TEMPO_MIN, clampTempo, useTempoScrub } from '@/hooks/useTempo.js';

const Cap = ({ children, htmlFor, className }) => (
  <Label
    htmlFor={htmlFor}
    className={cn(
      'text-[10px] font-medium tracking-wider text-muted-foreground uppercase',
      className,
    )}
  >
    {children}
  </Label>
);

/** Label over control, so every setting lines up on the same two baselines. */
const Field = ({ label, htmlFor, className, children }) => (
  <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
    <Cap htmlFor={htmlFor}>{label}</Cap>
    {children}
  </div>
);

const dbLabel = (db) => `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;

/**
 * One dot per beat in the bar. The downbeat is always primary blue — the one
 * beat that never moves — and every other beat is plain foreground white,
 * the same tone as the BPM readout. The click passing through just dims and
 * brightens each dot in place, so the colour keeps meaning "position" while
 * opacity carries "now".
 */
function BeatLights({ meter, beat, className }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} data-testid="beat-lights">
      {Array.from({ length: meter.beats }, (_, i) => {
        const live = i === beat;
        return (
          <span
            key={i}
            data-testid={`beat-light-${i}`}
            data-live={live || undefined}
            className={cn(
              'size-2 rounded-full transition-opacity',
              i === 0 ? 'bg-primary' : 'bg-foreground',
              live ? 'opacity-100' : 'opacity-30',
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * The metronome's own window: tempo, transport and click settings.
 *
 * Settings live in app state and are applied by the Transport, so they keep
 * working after this dialog closes. Only the beat lamps are wired up here,
 * since nothing can see them otherwise.
 */
export function MetronomePanel({ state, dispatch, clock, playing, onTogglePlay, onTap }) {
  const meter = findMeter(state.meter);
  const [beat, setBeat] = useState(-1);

  const setTempo = (tempo) => dispatch({ type: 'patch', patch: { tempo } });
  const scrub = useTempoScrub(state.tempo, setTempo);
  const set = (field) => (value) => dispatch({ type: 'patch', patch: { [field]: value } });

  useEffect(() => {
    if (!playing) setBeat(-1);
  }, [playing]);

  useEffect(() => {
    clock.onBeat = ({ beat: index, isSub }) => {
      if (!isSub) setBeat(index);
    };
    return () => {
      clock.onBeat = () => {};
    };
  }, [clock]);

  const step = (delta) => clampTempo(state.tempo + delta);

  return (
    <Dialog>
      <Hint label="Metronome settings">
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Metronome settings"
            data-testid="tempo-settings"
          >
            <Settings />
          </Button>
        </DialogTrigger>
      </Hint>

      {/* Padding is per-section so the rule can run edge to edge. */}
      <DialogContent className="gap-0 p-0 sm:max-w-md" data-testid="metronome-panel">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Metronome</DialogTitle>
        </DialogHeader>

        {/* One grid, one field height: the knob is sized to match a small
            select so all four labels and controls share a baseline. */}
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-4 gap-y-3 px-4 pt-4">
          <Field label="Volume">
            <div className="flex h-7 items-center gap-2">
              <Knob
                label="Volume"
                testId="click-volume"
                className="size-7"
                value={state.clickVolumeDb}
                min={-12}
                max={12}
                step={0.5}
                origin={0}
                display={dbLabel(state.clickVolumeDb)}
                onChange={set('clickVolumeDb')}
              />
              <span
                className="text-xs tabular-nums text-muted-foreground"
                data-testid="click-volume-readout"
              >
                {dbLabel(state.clickVolumeDb)}
              </span>
            </div>
          </Field>

          <Field label="Time sig." htmlFor="meter-select">
            <Select value={state.meter} onValueChange={set('meter')}>
              <SelectTrigger size="sm" id="meter-select" className="w-full" data-testid="meter-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[50vh]">
                {METER_GROUPS.map((group) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {METERS.filter((m) => m.group === group).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Rhythm" htmlFor="rhythm-select">
            <Select value={state.rhythm} onValueChange={set('rhythm')}>
              <SelectTrigger
                size="sm"
                id="rhythm-select"
                className="w-full"
                data-testid="rhythm-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLICK_RHYTHMS.map(([id]) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Sound" htmlFor="sound-select">
            <Select value={state.clickSound} onValueChange={set('clickSound')}>
              <SelectTrigger size="sm" id="sound-select" className="w-full" data-testid="sound-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLICK_SOUNDS.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Separator className="mt-4" />

        {/* Tempo and transport carry the weight — they are the controls you
            reach for mid-practice, so they get the size. The lamps sit between
            them, where the eye already is while the click runs. */}
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Hint label="Tap four beats to set the tempo">
              <Button
                variant="outline"
                className="size-11 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                data-testid="panel-tap"
                onClick={onTap}
              >
                Tap
              </Button>
            </Hint>

            <Hint label={playing ? 'Stop the click' : 'Start the click'}>
              <Button
                variant={playing ? 'default' : 'outline'}
                className="size-11 rounded-full [&_svg:not([class*='size-'])]:size-5"
                aria-label={playing ? 'Stop metronome' : 'Start metronome'}
                aria-pressed={playing}
                data-testid="panel-play"
                onClick={onTogglePlay}
              >
                {playing ? <Square /> : <Play />}
              </Button>
            </Hint>
          </div>

          <BeatLights meter={meter} beat={beat} className="min-w-0 flex-1 flex-wrap justify-center" />

          <Field label="BPM">
            <div className="flex items-center gap-1.5">
              <span
                role="slider"
                tabIndex={0}
                aria-label="Tempo"
                aria-valuemin={TEMPO_MIN}
                aria-valuemax={TEMPO_MAX}
                aria-valuenow={state.tempo}
                data-testid="panel-tempo-value"
                className="cursor-ns-resize touch-none text-4xl leading-none font-semibold tabular-nums select-none"
                onPointerDown={scrub}
              >
                {state.tempo}
              </span>
              <div
                className="flex cursor-ns-resize touch-none flex-col select-none"
                onPointerDown={scrub}
                data-testid="panel-tempo-stepper"
              >
                <button
                  type="button"
                  aria-label="Increase tempo"
                  data-testid="panel-tempo-inc"
                  className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setTempo(step(1))}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Decrease tempo"
                  data-testid="panel-tempo-dec"
                  className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setTempo(step(-1))}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
