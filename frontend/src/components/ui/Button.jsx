import '../../styles/workspace.css';

export default function Button({ children, variant = 'primary', loading = false, disabled = false, type = 'button', className = '', ...props }) {
  return (
    <button {...props} type={type} className={`ui-button ui-button--${variant} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading && <span className="ui-button__spinner" aria-hidden="true" />}
      {loading ? <span>Đang xử lý…</span> : children}
    </button>
  );
}
