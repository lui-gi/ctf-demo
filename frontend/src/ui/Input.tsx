import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface BaseProps {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
}

export type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, trailing, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`pc-field ${className ?? ''}`}>
      <label htmlFor={inputId} className="pc-field__label">
        {label}
      </label>
      <div className={`pc-field__control ${error ? 'pc-field__control--invalid' : ''}`}>
        <input
          ref={ref}
          id={inputId}
          className="pc-field__input"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {trailing ? <span className="pc-field__trailing">{trailing}</span> : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="pc-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="pc-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `textarea-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`pc-field ${className ?? ''}`}>
      <label htmlFor={inputId} className="pc-field__label">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        className={`pc-field__textarea ${error ? 'pc-field__textarea--invalid' : ''}`}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && !error ? (
        <p id={hintId} className="pc-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="pc-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
