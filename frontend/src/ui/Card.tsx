import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'parchment' | 'deep';
  interactive?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export function Card({
  variant = 'deep',
  interactive = false,
  header,
  footer,
  className,
  children,
  ...rest
}: CardProps): JSX.Element {
  const classes = [
    'pc-card',
    `pc-card--${variant}`,
    interactive ? 'pc-card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...rest}>
      {header ? <header className="pc-card__header">{header}</header> : null}
      <div className="pc-card__body">{children}</div>
      {footer ? <footer className="pc-card__footer">{footer}</footer> : null}
    </div>
  );
}
