import './Skeleton.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  inline?: boolean;
  ariaLabel?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-sm)',
  inline = false,
  ariaLabel,
}: SkeletonProps): JSX.Element {
  return (
    <span
      className={`pc-skeleton ${inline ? 'pc-skeleton--inline' : ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
      }}
      role="status"
      aria-label={ariaLabel ?? 'Loading'}
    />
  );
}
