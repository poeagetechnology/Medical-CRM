import React, { useId, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Overlay';
import { useToast } from './Toast';
import { errorMessage } from '../../utils/errors';
import { cx } from './cx';

/*
 * Add / edit form driven by a field list (see utils/formConfigs.js).
 *
 * field: { name, label, type: text|tel|email|password|number|date|select|combo|textarea,
 *          required, options, suggestions, placeholder, hint, min, max, step,
 *          rows, full, defaultValue, visible(values) }
 * onSubmit  async (cleanValues)            throw to show an error
 * validate  (cleanValues) => string|null   cross-field rules
 * onDelete  () => void                     shows a Delete button (open a ConfirmDialog)
 */
const optionOf = (o) => (typeof o === 'string' ? { value: o, label: o } : o);
const isVisible = (f, values) => !f.visible || f.visible(values);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s\-()]{5,}$/;

function checkField(f, raw) {
  let value = typeof raw === 'string' && f.type !== 'password' ? raw.trim() : raw;
  const empty = value === '' || value === null || value === undefined;
  if (empty) return { value: '', error: f.required ? `${f.label} is required.` : null };
  if (f.type === 'number') {
    value = Number(value);
    if (!Number.isFinite(value)) return { value, error: 'Enter a valid number.' };
    if (f.min !== undefined && value < f.min) return { value, error: `Must be at least ${f.min}.` };
    if (f.max !== undefined && value > f.max) return { value, error: `Must be at most ${f.max}.` };
    if (f.step === 1 && !Number.isInteger(value)) return { value, error: 'Must be a whole number.' };
  }
  if (f.type === 'email' && !EMAIL.test(value)) return { value, error: 'Enter a valid email address.' };
  if (f.type === 'tel' && !PHONE.test(value)) return { value, error: 'Enter a valid phone number.' };
  return { value, error: null };
}

export function RecordForm({
  title, description, fields, initial = {}, submitLabel = 'Save', successMessage = 'Saved successfully',
  onSubmit, onDelete, onClose, validate, width = 'max-w-2xl', children,
}) {
  const uid = useId();
  const formId = `${uid}-form`;
  const toast = useToast();
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? f.defaultValue ?? '']))
  );
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: null } : e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const clean = {};
    const found = {};
    for (const f of fields) {
      // hidden fields are cleared so no stale data is kept
      if (!isVisible(f, values)) { clean[f.name] = ''; continue; }
      const result = checkField(f, values[f.name]);
      clean[f.name] = result.value;
      if (result.error) found[f.name] = result.error;
    }
    setErrors(found);
    if (Object.keys(found).length) {
      setError('Please fix the highlighted fields.');
      document.getElementById(`${uid}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const problem = validate?.(clean);
    if (problem) { setError(problem); return; }

    setError('');
    setSaving(true);
    try {
      await onSubmit(clean);
      toast.success(successMessage);
      onClose();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  const renderInput = (f, index) => {
    const id = `${uid}-${f.name}`;
    const common = {
      id,
      name: f.name,
      value: values[f.name],
      onChange: (e) => set(f.name, e.target.value),
      className: cx('input', errors[f.name] && 'input-error'),
      disabled: saving,
      placeholder: f.placeholder,
      autoFocus: index === 0,
      'aria-invalid': !!errors[f.name],
    };
    if (f.type === 'select') {
      const opts = (f.options || []).map(optionOf);
      const current = values[f.name];
      const missing = current !== '' && !opts.some((o) => o.value === current);
      return (
        <select {...common}>
          {(!f.required || current === '') && <option value="">{f.required ? 'Select…' : '—'}</option>}
          {missing && <option value={current}>{current}</option>}
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    if (f.type === 'combo') {
      return (
        <>
          <input {...common} type="text" list={`${id}-list`} autoComplete="off" />
          <datalist id={`${id}-list`}>
            {(f.suggestions || []).map((s) => <option key={s} value={s} />)}
          </datalist>
        </>
      );
    }
    if (f.type === 'textarea') return <textarea {...common} rows={f.rows || 3} />;
    if (f.type === 'number') return <input {...common} type="number" min={f.min} max={f.max} step={f.step ?? 'any'} inputMode="decimal" />;
    return <input {...common} type={f.type || 'text'} />;
  };

  return (
    <Modal
      title={title}
      description={description}
      onClose={saving ? () => {} : onClose}
      width={width}
      footer={
        <>
          {onDelete && (
            <Button variant="danger-soft" onClick={onDelete} disabled={saving} className="mr-auto">Delete</Button>
          )}
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>{submitLabel}</Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {error && (
          <div role="alert" className="mb-4 px-3.5 py-2.5 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.filter((f) => isVisible(f, values)).map((f, i) => (
            <div key={f.name} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <label htmlFor={`${uid}-${f.name}`} className="label">
                {f.label}{f.required && <span className="text-red-500"> *</span>}
              </label>
              {renderInput(f, i)}
              {errors[f.name]
                ? <p className="text-xs text-red-600 mt-1">{errors[f.name]}</p>
                : f.hint && <p className="text-xs text-fg-subtle mt-1">{f.hint}</p>}
            </div>
          ))}
        </div>
        {children}
      </form>
    </Modal>
  );
}
