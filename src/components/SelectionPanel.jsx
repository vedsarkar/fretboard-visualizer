import { ChevronDown, Guitar, Piano } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cap, Hint, PICKED, PICKED_SOLID } from './Ui.jsx';
import { TempoCluster } from './Transport.jsx';
import {
  DEGREE_LABEL,
  INTERVAL_LABEL,
  INTERVAL_NAME,
  SCALE_GROUPS,
  findScale,
} from '@/lib/theory.js';

const summary = (intervals) => intervals.map((i) => DEGREE_LABEL[i]).join(' ');

/** Stands in for a scale id while the intervals are hand-picked. */
const CUSTOM = 'custom';

function ScaleGroups({ state, dispatch }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Cap>Scale</Cap>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" data-testid="scale-select">
            {state.useCustom ? 'Custom' : (findScale(state.scaleId)?.name ?? 'Scale')}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="flex max-h-[70vh] w-auto min-w-72 overflow-hidden">
          {/* Row layout stretches the scroll area, so its viewport gets a height to scroll within. */}
          <ScrollArea className="flex-1">
            <DropdownMenuRadioGroup
              value={state.useCustom ? CUSTOM : state.scaleId}
              onValueChange={(id) =>
                dispatch(id === CUSTOM ? { type: 'enableCustom' } : { type: 'selectScale', id })
              }
            >
              {SCALE_GROUPS.map((group, index) => (
                <DropdownMenuGroup key={group.id}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                  {group.scales.map((scale) => (
                    <DropdownMenuRadioItem key={scale.id} value={scale.id}>
                      <span className="flex-1">{scale.name}</span>
                      <span className="ml-3 text-xs tabular-nums text-muted-foreground">
                        {summary(scale.intervals)}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuGroup>
              ))}

              <DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Custom</DropdownMenuLabel>
                <DropdownMenuRadioItem value={CUSTOM} data-testid="custom-btn">
                  <span className="flex-1">Build your own set</span>
                  <span className="ml-3 text-xs text-muted-foreground">
                    from the intervals below
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuGroup>
            </DropdownMenuRadioGroup>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SelectionPanel({ state, dispatch, intervals, isPlaying }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={state.board}
          onValueChange={(board) => board && dispatch({ type: 'setBoard', board })}
          data-testid="mode-group"
        >
          <ToggleGroupItem value="guitar" aria-label="Guitar" className={PICKED_SOLID}>
            <Guitar className="size-4" />
            Guitar
          </ToggleGroupItem>
          <ToggleGroupItem value="piano" aria-label="Piano" className={PICKED_SOLID}>
            <Piano className="size-4" />
            Piano
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="ml-auto flex items-center gap-2">
          <TempoCluster state={state} dispatch={dispatch} isPlaying={isPlaying} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
            {INTERVAL_LABEL.map((label, semitones) => (
              <Hint key={label} label={INTERVAL_NAME[semitones]}>
                <ToggleGroupItem
                  value={String(semitones)}
                  aria-label={INTERVAL_NAME[semitones]}
                  className={PICKED}
                >
                  {label}
                </ToggleGroupItem>
              </Hint>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </section>
  );
}
