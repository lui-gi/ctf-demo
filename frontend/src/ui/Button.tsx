import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Themed button. Always render the children directly so screen-readers
 * read the labelled action; loading state is announced via aria-busy.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    'pc-btn',
    `pc-btn--${variant}`,
    `pc-btn--${size}`,
    fullWidth ? 'pc-btn--full' : '',
    loading ? 'pc-btn--loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {leadingIcon ? <span className="pc-btn__icon" aria-hidden>{leadingIcon}</span> : null}
      <span className="pc-btn__label">{children}</span>
    </button>
  );
});
