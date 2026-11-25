import React, { useRef, useState } from 'react';
import { ConfirmDialog, RecordForm } from '../ui';

/*
 * Create / edit / delete for one record.
 *   record      {} or prefill for a new record; an existing record when editing
 *   store       a useCollection() result
 *   prepare     (values, record) => data to store
 *   afterSave   async (data, record) side effects (logging, linked records)
 *   afterDelete async (record)
 */
export default function EntityEditor({
  noun, record, store, fields, validate, prepare, afterSave, afterDelete,
  onClose, submitLabel, description, width, deleteMessage,
}) {
  const isNew = !record?.id;
  const [confirming, setConfirming] = useState(false);
  const deleted = useRef(false);
  const lower = noun.toLowerCase();

  const submit = async (values) => {
    if (store.loading) throw new Error('Records are still loading. Please try again in a moment.');
    const data = prepare ? await prepare(values, record) : values;
    if (isNew) await store.add(data);
    else await store.update(record.id, data);
    await afterSave?.(data, record);
  };

  if (confirming) {
    return (
      <ConfirmDialog
        title={`Delete ${lower}`}
        message={deleteMessage || `This permanently deletes the ${lower}. This cannot be undone.`}
        successMessage={`${noun} deleted`}
        onConfirm={async () => {
          await store.remove(record.id);
          deleted.current = true;
          await afterDelete?.(record);
        }}
        onClose={() => (deleted.current ? onClose() : setConfirming(false))}
      />
    );
  }

  return (
    <RecordForm
      title={isNew ? `New ${lower}` : `Edit ${lower}`}
      description={description}
      fields={fields}
      initial={record}
      width={width}
      submitLabel={submitLabel || (isNew ? `Create ${lower}` : 'Save changes')}
      successMessage={isNew ? `${noun} created` : `${noun} updated`}
      validate={validate}
      onSubmit={submit}
      onDelete={!isNew && store.canDelete ? () => setConfirming(true) : undefined}
      onClose={onClose}
    />
  );
}
