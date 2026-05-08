import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rightSlot?: ReactNode;
}

const labelCls =
  "mb-1.5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400";
const hintCls = "mt-1.5 text-[11px] text-gray-500";
const errorCls = "mt-1.5 text-[11px] text-rose-400";
const baseInputCls =
  "w-full rounded-xl border border-dark-500 bg-dark-900/70 px-4 py-3 text-sm text-white placeholder:text-gray-600 transition focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, rightSlot, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className={cn("flex w-full flex-col", className)}>
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}
          {required && <span className="text-orange-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={cn(baseInputCls, error && "border-rose-500/60")}
          {...rest}
        />
        {rightSlot && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
            {rightSlot}
          </div>
        )}
      </div>
      {hint && !error && <p className={hintCls}>{hint}</p>}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
});

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, required, className, id, rows = 4, ...rest },
    ref,
  ) {
    const inputId = id ?? rest.name;
    return (
      <div className={cn("flex w-full flex-col", className)}>
        {label && (
          <label htmlFor={inputId} className={labelCls}>
            {label}
            {required && <span className="text-orange-400">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(baseInputCls, "resize-y leading-relaxed", error && "border-rose-500/60")}
          {...rest}
        />
        {hint && !error && <p className={hintCls}>{hint}</p>}
        {error && <p className={errorCls}>{error}</p>}
      </div>
    );
  },
);

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    FieldProps {
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, error, required, rightSlot, options, className, id, ...rest },
    ref,
  ) {
    const inputId = id ?? rest.name;
    return (
      <div className={cn("flex w-full flex-col", className)}>
        {label && (
          <label htmlFor={inputId} className={labelCls}>
            {label}
            {required && <span className="text-orange-400">*</span>}
          </label>
        )}
        <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            baseInputCls,
            "appearance-none pr-10",
            error && "border-rose-500/60",
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-dark-900">
              {o.label}
            </option>
          ))}
        </select>
        {rightSlot && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
            {rightSlot}
          </div>
        )}
        </div>
        {hint && !error && <p className={hintCls}>{hint}</p>}
        {error && <p className={errorCls}>{error}</p>}
      </div>
    );
  },
);

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, className, ...rest }, ref) {
    return (
      <label
        className={cn(
          "group flex cursor-pointer items-start gap-3 rounded-xl border border-dark-600 bg-dark-800/40 p-3 transition hover:border-purple-500/40",
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="mt-0.5 size-4 rounded border-dark-500 bg-dark-900 text-purple-500 accent-purple-500 focus:ring-purple-500"
          {...rest}
        />
        <div className="flex-1 text-sm">
          {label && <div className="text-white">{label}</div>}
          {description && (
            <div className="mt-0.5 text-[12px] leading-snug text-gray-500">
              {description}
            </div>
          )}
        </div>
      </label>
    );
  },
);
