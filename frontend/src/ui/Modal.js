import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
};

/**
 * Accessible modal dialog: portal, Escape to close, backdrop click, scroll lock
 * and focus restoration. Content is rendered inside a scrollable panel.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
}) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector(
        '[data-autofocus], input:not([type="hidden"]), textarea, select, button, a[href]'
      );
      target?.focus?.();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = (event) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink-950/50 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={handleBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={`w-full ${sizes[size] || sizes.md} animate-slide-up rounded-card border border-ink-200 bg-white shadow-pop dark:border-ink-800 dark:bg-ink-900 ${className}`}
      >
        {title || onClose ? (
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="text-base font-semibold text-ink-900 dark:text-white">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  {description}
                </p>
              ) : null}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 shrink-0 rounded-[8px] p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 px-5 py-4 dark:border-ink-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
