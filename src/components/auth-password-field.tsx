import { useState, type ComponentProps } from 'react';
import type { AnyFieldApi } from '@tanstack/react-form';
import { Eye, EyeOff } from 'lucide-react';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type VisibilityLabels = { showLabel: string; hideLabel: string };
export function AuthPasswordInput({
  showLabel,
  hideLabel,
  ...props
}: ComponentProps<typeof Input> & VisibilityLabels) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password-control">
      <Input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="auth-password-toggle"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
export function AuthPasswordField({
  field,
  label,
  showLabel,
  hideLabel,
  placeholder,
}: VisibilityLabels & {
  field: AnyFieldApi;
  label: string;
  placeholder: string;
}) {
  const touched =
    field.state.meta.isTouched || field.form.state.submissionAttempts > 0;
  const first = touched ? field.state.meta.errors[0] : undefined;
  const error =
    typeof first === 'string'
      ? first
      : first && typeof first === 'object' && 'message' in first
        ? String(first.message)
        : null;
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <AuthPasswordInput
        id={field.name}
        name={field.name}
        value={String(field.state.value ?? '')}
        required
        autoComplete="new-password"
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        showLabel={showLabel}
        hideLabel={hideLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.name}-error` : undefined}
      />
      {error && (
        <p
          id={`${field.name}-error`}
          className="text-destructive text-sm"
          role="alert"
        >
          {error}
        </p>
      )}
    </Field>
  );
}
