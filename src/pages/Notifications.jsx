import React, { useState } from 'react';
import { AlertTriangle, Bell, BellPlus, CheckCheck, CheckCircle2, Info, Pencil, Trash2 } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useNotificationSeen } from '../hooks/useNotificationSeen';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import EntityEditor from '../components/editors/EntityEditor';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, FilterBar, IconButton, IconTile, Page, PageHeader,
  PageLoader, SearchInput, StatCard, StatGrid, Tabs, cx,
} from '../components/ui';
import { notificationFields } from '../utils/formConfigs';
import { byNewest, matches, nowLabel, relativeTime } from '../utils/format';

const TYPES = {
  critical: { icon: AlertTriangle, tone: 'red' },
  info: { icon: Info, tone: 'blue' },
  success: { icon: CheckCircle2, tone: 'green' },
};

export default function Notifications({ navigate, params }) {
  const store = useCollection('notifications');
  const { data: notifications, loading, remove, removeMany, canWrite, canDelete } = store;
  const { isUnread, markAllRead } = useNotificationSeen();

  const [search, setSearch] = useParamState(params, 'q');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearing, setClearing] = useState(false);

  useCreateIntent({ params, navigate, page: 'notifications', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const unread = notifications.filter(isUnread).length;
  const count = (t) => notifications.filter((n) => n.type === t).length;
  const visible = [...notifications]
    .filter((n) => filter === 'all' || (filter === 'unread' ? isUnread(n) : n.type === filter))
    .filter((n) => matches(search, n.title, n.message))
    .sort(byNewest);

  return (
    <Page className="!max-w-5xl">
      <PageHeader
        title="Notifications"
        description="Announcements and alerts for the whole team."
        actions={
          <>
            <Button icon={CheckCheck} onClick={markAllRead} disabled={!unread}>Mark all read</Button>
            {canDelete && <Button variant="danger-soft" icon={Trash2} onClick={() => setClearing(true)} disabled={!notifications.length}>Clear all</Button>}
            {canWrite && <Button variant="primary" icon={BellPlus} onClick={() => setEditing({})}>New notification</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="All alerts" value={notifications.length} icon={Bell} active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatCard label="Unread" value={unread} icon={BellPlus} tone="violet" active={filter === 'unread'} onClick={() => setFilter('unread')} />
        <StatCard label="Critical" value={count('critical')} icon={AlertTriangle} tone="red" active={filter === 'critical'} onClick={() => setFilter('critical')} />
        <StatCard label="Success" value={count('success')} icon={CheckCircle2} tone="green" active={filter === 'success'} onClick={() => setFilter('success')} />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search notifications…" />
        <Tabs value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'critical', label: 'Critical' },
          { value: 'info', label: 'Info' }, { value: 'success', label: 'Success' },
        ]} />
      </FilterBar>

      <Card className="overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState icon={Bell} title={notifications.length ? 'Nothing matches this filter' : 'No notifications yet'} />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((n) => {
              const t = TYPES[n.type] || TYPES.info;
              return (
                <li key={n.id} className={cx('flex items-start gap-4 px-5 py-4', isUnread(n) && 'bg-brand-50/50 dark:bg-brand-500/5')}>
                  <IconTile icon={t.icon} tone={t.tone} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-fg">
                      {n.title}
                      {isUnread(n) && <Badge tone="brand" className="ml-2 align-middle">New</Badge>}
                    </p>
                    <p className="text-sm text-fg-muted mt-0.5 whitespace-pre-wrap break-words">{n.message}</p>
                    <p className="text-2xs text-fg-subtle mt-1.5">{[n.time, relativeTime(n.createdAt)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(n)} />}
                    {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting(n)} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <EntityEditor
          noun="Notification"
          record={editing}
          store={store}
          fields={notificationFields()}
          submitLabel={editing.id ? undefined : 'Send notification'}
          prepare={(v) => (editing.id ? v : { ...v, time: nowLabel() })}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog title="Delete notification" message={`Delete "${deleting.title}"?`} onConfirm={() => remove(deleting.id)} onClose={() => setDeleting(null)} />
      )}
      {clearing && (
        <ConfirmDialog
          title="Clear all notifications"
          message={`Delete all ${notifications.length} notifications for everyone? This cannot be undone.`}
          confirmLabel="Clear all"
          successMessage="Notifications cleared"
          onConfirm={() => removeMany(notifications.map((n) => n.id))}
          onClose={() => setClearing(false)}
        />
      )}
    </Page>
  );
}
