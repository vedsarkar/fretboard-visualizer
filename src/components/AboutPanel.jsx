import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Hint } from './Ui.jsx';

const SHORTCUTS = [
  ['Click', 'Hear a note, or paint it when a colour is selected'],
  ['Double-click', 'Spotlight every other position of that pitch'],
  ['Space', 'Play or stop the current pattern'],
  ['Group / Step', 'Build melodic drills; the arrows reorder each group'],
  ['Export', 'Save the diagram as a PNG'],
];

export function AboutPanel() {
  return (
    <Dialog>
      <Hint label="About and shortcuts">
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="About" data-testid="about-btn">
            <HelpCircle />
          </Button>
        </DialogTrigger>
      </Hint>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Freetboard</DialogTitle>
          <DialogDescription>
            Pick a root note and a scale or chord to light up every position on the neck. Choose an
            instrument and tuning, trim the fret count, and hide strings or degrees to isolate a
            shape.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {SHORTCUTS.map(([key, description]) => (
            <div key={key} className="col-span-2 grid grid-cols-subgrid items-baseline">
              <dt className="font-medium whitespace-nowrap">{key}</dt>
              <dd className="text-muted-foreground">{description}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
