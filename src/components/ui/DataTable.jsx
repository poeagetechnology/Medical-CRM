import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button, IconButton } from './Button';
import { EmptyState } from './primitives';
import { cx } from './cx';

const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' };
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

const compare = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
};

/*
 * columns: [{ key, header, render(row), sortValue(row), sortable=true, align, hide: 'md', className }]
 * rowActions(row)           buttons shown on the right of each row
 * onBulkDelete(rows, clear) enables checkboxes + a delete button for the selection
 * bulkActions(rows, clear)  extra buttons for the selection
 * empty                     props for <EmptyState/>
 */
export function DataTable({
  columns, rows, rowActions, onRowClick, onBulkDelete, bulkActions, empty,
  pageSize = 10, initialSort = null, toolbar,
}) {
  const [sort, setSort] = useState(initialSort);   // { key, dir: 1 | -1 }
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(pageSize);
  const [selected, setSelected] = useState(() => new Set());
  const selectable = !!(onBulkDelete || bulkActions);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const value = col.sortValue || ((r) => r[col.key]);
    return [...rows].sort((a, b) => sort.dir * compare(value(a), value(b)));
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * size, current * size + size);

  // Selection only ever covers rows that are still listed (after filter/delete).
  const selectedRows = rows.filter((r) => selected.has(r.id));
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  const clear = () => setSelected(new Set());
  const allOnPage = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s);
      visible.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)));
      return next;
    });
  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cycleSort = (key) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  return (
    <div className="card overflow-hidden">
      {selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-line bg-brand-50/70 dark:bg-brand-500/10">
          <span className="text-sm font-semibold text-fg mr-auto">{selectedRows.length} selected</span>
          {bulkActions?.(selectedRows, clear)}
          {onBulkDelete && (
            <Button size="sm" variant="danger" icon={Trash2} onClick={() => onBulkDelete(selectedRows, clear)}>
              Delete selected
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
        </div>
      ) : (
        toolbar && <div className="px-4 py-3 border-b border-line">{toolbar}</div>
      )}

      {rows.length === 0 ? (
        <EmptyState title="Nothing here yet" {...empty} />
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-subtle/60 border-b border-line">
                  {selectable && (
                    <th className="w-10 pl-4 py-2.5 text-left">
                      <input type="checkbox" aria-label="Select all rows on this page" checked={allOnPage} onChange={toggleAll} className="accent-brand-600 w-4 h-4 align-middle" />
                    </th>
                  )}
                  {columns.map((c) => {
                    const sortable = c.sortable !== false;
                    const on = sort?.key === c.key;
                    const Icon = !on ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
                    return (
                      <th
                        key={c.key}
                        aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                        className={cx('px-4 py-2.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle whitespace-nowrap', ALIGN[c.align || 'left'], c.hide && HIDE[c.hide])}
                      >
                        {sortable ? (
                          <button type="button" onClick={() => cycleSort(c.key)} className="inline-flex items-center gap-1 uppercase tracking-wider font-bold hover:text-fg">
                            {c.header}
                            <Icon size={11} className={on ? 'text-brand-600' : 'opacity-40'} />
                          </button>
                        ) : c.header}
                      </th>
                    );
                  })}
                  {rowActions && <th className="px-4 py-2.5 text-right text-2xs font-bold uppercase tracking-wider text-fg-subtle">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    className={cx('transition-colors hover:bg-subtle/50', onRowClick && 'cursor-pointer', selected.has(r.id) && 'bg-brand-50/50 dark:bg-brand-500/5')}
                  >
                    {selectable && (
                      <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label="Select row" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-brand-600 w-4 h-4 align-middle" />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cx('px-4 py-3 text-fg-muted', ALIGN[c.align || 'left'], c.hide && HIDE[c.hide], c.className)}>
                        {c.render ? c.render(r) : r[c.key] || r[c.key] === 0 ? r[c.key] : <span className="text-fg-subtle">—</span>}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">{rowActions(r)}</div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line text-xs text-fg-subtle">
            <span className="tabular">
              Showing {current * size + 1}–{Math.min(sorted.length, (current + 1) * size)} of {sorted.length}
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                Rows
                <select
                  value={size}
                  onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                  className="h-7 rounded-md border border-line bg-surface px-1.5 text-xs text-fg"
                >
                  {[...new Set([pageSize, 10, 25, 50, 100])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <IconButton size="sm" label="Previous page" icon={ChevronLeft} disabled={current === 0} onClick={() => setPage(current - 1)} />
                <span className="tabular px-1">{current + 1} / {pages}</span>
                <IconButton size="sm" label="Next page" icon={ChevronRight} disabled={current >= pages - 1} onClick={() => setPage(current + 1)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
