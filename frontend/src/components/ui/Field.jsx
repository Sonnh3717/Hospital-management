import { Children, cloneElement, isValidElement, useId } from 'react';
import '../../styles/workspace.css';

export default function Field({ children, label, id, error, hint, required = false, className = '' }) {
  const generatedId = useId();
  const child = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const fieldId = id || child?.props.id || generatedId;
  const descriptionIds = [child?.props['aria-describedby'], hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ');
  const isNativeControl = child && ['input', 'select', 'textarea'].includes(child.type);
  const control = isNativeControl ? cloneElement(child, {
    id: fieldId,
    required: child.props.required ?? required,
    'aria-invalid': error ? true : child.props['aria-invalid'],
    'aria-describedby': descriptionIds || undefined,
  }) : children;

  return (
    <div className={`ui-field${error ? ' ui-field--error' : ''} ${className}`.trim()}>
      {label && <label htmlFor={fieldId}>{label}{required && <span className="ui-field__required" aria-hidden="true"> *</span>}</label>}
      {control}
      {hint && <span className="ui-field__hint" id={`${fieldId}-hint`}>{hint}</span>}
      {error && <span className="ui-field__error" id={`${fieldId}-error`} role="alert">{error}</span>}
    </div>
  );
}
