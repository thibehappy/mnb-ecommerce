import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

const baseInput =
  'w-full bg-transparent border-b border-[var(--color-line-strong)] py-3 px-0 text-[15px] outline-none transition-colors duration-[180ms] focus:border-[var(--color-ink)] placeholder:text-[var(--color-muted)]';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-eyebrow text-[var(--color-graphite)]">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(baseInput, error && 'border-[var(--color-terracotta)]', className)}
        {...rest}
      />
      {error ? (
        <p className="text-[12px] text-[var(--color-terracotta)]">{error}</p>
      ) : hint ? (
        <p className="text-caption">{hint}</p>
      ) : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-eyebrow text-[var(--color-graphite)]">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={4}
        className={cn(
          'w-full border border-[var(--color-line-strong)] p-3 text-[15px] outline-none transition-colors duration-[180ms] focus:border-[var(--color-ink)] rounded-[var(--radius-sm)] bg-transparent resize-none',
          error && 'border-[var(--color-terracotta)]',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-[12px] text-[var(--color-terracotta)]">{error}</p>
      ) : hint ? (
        <p className="text-caption">{hint}</p>
      ) : null}
    </div>
  );
});
