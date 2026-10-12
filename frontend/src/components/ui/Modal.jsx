import { useEffect, useId, useRef } from "react";
import Icon from "../Icon.jsx";
import "../../styles/workspace.css";

let openDialogCount = 0;
let bodyOverflowBeforeDialogs = "";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  busy = false,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    if (openDialogCount === 0)
      bodyOverflowBeforeDialogs = document.body.style.overflow;
    openDialogCount += 1;
    document.body.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      dialog.close();
      openDialogCount -= 1;
      if (openDialogCount === 0)
        document.body.style.overflow = bodyOverflowBeforeDialogs;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();
    if (!busy) onClose?.();
  }

  function handleBackdropClick(event) {
    if (busy || event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      onClose?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className="ui-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="ui-modal__surface">
        <div className="ui-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="ui-modal__close"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng hộp thoại"
          >
            <Icon name="close" size={21} />
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </dialog>
  );
}
