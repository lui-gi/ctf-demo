import { useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { strings } from '@/theme/strings';
import './Modal.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Set to false to disable the backdrop-click close affordance for
   * destructive confirmations (force the user to use Cancel/Confirm).
   */
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible modal with focus trap, ESC-to-close, restored focus on close.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  size = 'md',
}: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Move focus into the dialog
    const node = dialogRef.current;
    if (node) {
      const focusable = node.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? node).focus();
    }

    return () => {
      // Restore focus on close
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        // Simple focus trap
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!open) return null;

  return (
    <div
      className="pc-modal-backdrop"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`pc-modal pc-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="pc-modal__header">
          <h2 id="pc-modal-title" className="pc-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="pc-modal__close"
            aria-label={strings.common.close}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="pc-modal__body">{children}</div>
        {footer ? <footer className="pc-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
