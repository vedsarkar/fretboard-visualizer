import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Wraps a control in a tooltip, or passes it through when there's nothing to say.
 *
 * TooltipTrigger asChild merges its own `data-state` onto the child, shadowing
 * the one a Toggle sets. Style pressed state via `aria-pressed:` (as shadcn's
 * variants do) rather than `data-[state=on]:` on anything wrapped here.
 */
export function Hint({ label, children }) {
  if (!label) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Selection styling for ToggleGroup items. `data-[state=on]` only survives on
 * items that aren't wrapped in Hint — see the note above.
 */
export const PICKED = 'data-[state=on]:bg-primary/20 data-[state=on]:text-primary';
export const PICKED_SOLID =
  'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground';
/** Muted strings read as struck through rather than merely tinted. */
export const MUTABLE = 'data-[state=off]:opacity-40 data-[state=off]:line-through';

/** Row label shared by the control groups. */
export const Cap = ({ children }) => (
  <span className="px-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
    {children}
  </span>
);

/** Groups related controls into one bordered cluster. */
export const Cluster = ({ className = '', children, ...rest }) => (
  <div
    className={`flex items-center gap-0.5 rounded-lg border border-border bg-card p-1 ${className}`}
    {...rest}
  >
    {children}
  </div>
);

/** Minus / value / plus control, used for both tuning and fret count. */
export function Stepper({ label, value, onDecrease, onIncrease, decHint, incHint, testId }) {
  return (
    <Cluster role="group" aria-label={label}>
      <Cap>{label}</Cap>
      <Hint label={decHint}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={decHint}
          data-testid={`${testId}-dec`}
          onClick={onDecrease}
        >
          <Minus />
        </Button>
      </Hint>
      <span
        className="min-w-8 text-center text-xs font-semibold tabular-nums text-primary"
        data-testid={`${testId}-value`}
      >
        {value}
      </span>
      <Hint label={incHint}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={incHint}
          data-testid={`${testId}-inc`}
          onClick={onIncrease}
        >
          <Plus />
        </Button>
      </Hint>
    </Cluster>
  );
}
