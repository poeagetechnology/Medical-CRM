// Three-column patient flow board shared by the OP queue and Checkups.
import React from 'react';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, Card, IconButton, cx } from './ui';
import { DOTS, toneOf } from '../utils/status';

/*
 * statuses     ordered, e.g. ['Waiting', 'In Progress', 'Completed']
 * advanceLabel { status: 'Start' }
 * renderCard   (item) => content of the card
 * extraAction  (item) => node shown beside the main button
 */
export default function QueueBoard({
  items, statuses, advanceLabel, renderCard, extraAction, onMove, onEdit, onDelete, columnAction,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      {statuses.map((status, index) => {
        const list = items.filter((i) => (i.status || statuses[0]) === status);
        const next = statuses[index + 1];
        const previous = statuses[index - 1];
        return (
          <section key={status} aria-label={status} className="rounded-xl bg-subtle/70 border border-line">
            <header className="flex items-center gap-2 px-4 py-3">
              <span className={cx('w-2 h-2 rounded-full', DOTS[toneOf(status)])} />
              <h2 className="text-sm font-bold text-fg">{status}</h2>
              <Badge>{list.length}</Badge>
              <span className="ml-auto">{columnAction?.(status, list)}</span>
            </header>
            <div className="px-3 pb-3 space-y-3 lg:max-h-[640px] overflow-y-auto scrollbar-thin">
              {list.map((item, position) => (
                <Card key={item.id} className="p-4">
                  {renderCard(item, position)}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-line">
                    {onMove && next && (
                      <Button size="xs" variant="primary" iconRight={ChevronRight} onClick={() => onMove(item, next)}>
                        {advanceLabel[status]}
                      </Button>
                    )}
                    {extraAction?.(item)}
                    <span className="ml-auto flex items-center">
                      {onMove && previous && <IconButton size="sm" label={`Move back to ${previous}`} icon={ChevronLeft} onClick={() => onMove(item, previous)} />}
                      {onEdit && <IconButton size="sm" label="Edit" icon={Pencil} tone="brand" onClick={() => onEdit(item)} />}
                      {onDelete && <IconButton size="sm" label="Remove" icon={Trash2} tone="red" onClick={() => onDelete(item)} />}
                    </span>
                  </div>
                </Card>
              ))}
              {list.length === 0 && (
                <p className="text-xs text-fg-subtle text-center py-8 border border-dashed border-line rounded-lg">No patients</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
