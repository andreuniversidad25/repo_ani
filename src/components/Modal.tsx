import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDivElement>(null),
    cb = useRef(onClose),
    id = useId();
  cb.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cb.current();
      }
      if (e.key === 'Tab') {
        const items = [
          ...(dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
          ) || []),
        ].filter((el) => el.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === dialog.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      prev?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={'modal' + (wide ? ' modal-wide' : '')}
        ref={dialog}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="modal-header">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 id={id}>{title}</h2>
          </div>
          <button className="icon-button close-modal" onClick={onClose} aria-label="Cerrar ventana">
            <X size={19} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
