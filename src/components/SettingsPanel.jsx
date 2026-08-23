import { RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { INSTRUMENT_GROUPS, PITCH_SHARP, SCALE_GROUPS } from '@/lib/theory.js';
import { PERSIST_FIELDS, STORAGE_KEY } from '@/lib/state.js';

const Heading = ({ children }) => (
  <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
    {children}
  </h3>
);

export function SettingsPanel({ state, dispatch }) {
  const setDefault = (field) => (value) =>
    dispatch({ type: 'setDefault', field, value: field === 'root' ? Number(value) : value });

  return (
    <Popover>
      <Hint label="Defaults and what to remember">
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Settings" data-testid="settings-btn">
            <Settings />
          </Button>
        </PopoverTrigger>
      </Hint>

      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-3">
          <Heading>Defaults on load</Heading>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="default-instrument">Instrument</Label>
              <Select value={state.defaults.instrument} onValueChange={setDefault('instrument')}>
                <SelectTrigger size="sm" id="default-instrument" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh]">
                  {INSTRUMENT_GROUPS.map((group) => (
                    <SelectGroup key={group.id}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.tunings.map((tuning) => (
                        <SelectItem key={tuning.id} value={tuning.id}>
                          {tuning.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="default-root">Root</Label>
              <Select value={String(state.defaults.root)} onValueChange={setDefault('root')}>
                <SelectTrigger size="sm" id="default-root" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PITCH_SHARP.map((name, pc) => (
                    <SelectItem key={name} value={String(pc)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="default-scale">Scale</Label>
              <Select value={state.defaults.scale} onValueChange={setDefault('scale')}>
                <SelectTrigger size="sm" id="default-scale" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh]">
                  {SCALE_GROUPS.map((group) => (
                    <SelectGroup key={group.id}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.scales.map((scale) => (
                        <SelectItem key={scale.id} value={scale.id}>
                          {scale.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <Heading>Remember between sessions</Heading>

          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1">
            {PERSIST_FIELDS.map(([field, label]) => (
              <div key={field} className="flex items-center justify-between gap-2">
                <Label htmlFor={`persist-${field}`} className="text-xs font-normal">
                  {label}
                </Label>
                <Switch
                  id={`persist-${field}`}
                  data-testid={`persist-${field}`}
                  checked={Boolean(state.persist[field])}
                  onCheckedChange={(value) => dispatch({ type: 'setPersist', field, value })}
                />
              </div>
            ))}
          </div>

          <Separator />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
          >
            <RotateCcw />
            Reset everything
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
