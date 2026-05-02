import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeTone =
  | 'neutral'
  | 'brass'
  | 'success'
  | 'danger'
  | 'warning'
  | 'depth';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  title?: string;
}

export function Badge({ tone = 'neutral', children, title }: BadgeProps): JSX.Element {
  return (
    <span className={`pc-badge pc-badge--${tone}`} title={title}>
      {children}
    </span>
  );
}

export function difficultyTone(difficulty: string): BadgeTone {
  switch (difficulty) {
    case 'port':
      return 'brass';
    case 'open_sea':
      return 'success';
    case 'cursed_depths':
      return 'depth';
    default:
      return 'neutral';
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
      return 'neutral';
    default:
      return 'neutral';
  }
}
