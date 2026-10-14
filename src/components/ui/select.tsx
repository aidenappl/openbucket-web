import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

/** A native select styled to match `Input` — native for keyboard and mobile pickers for free. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, options, className, id, ...props }, ref) => {
    const generated = useId();
    const selectId = id ?? generated;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium uppercase tracking-wider text-secondary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={hint ? `${selectId}-hint` : undefined}
          className={cn(
            "h-9 w-full rounded-lg border border-border-strong bg-surface-elevated px-2.5 text-sm text-primary cursor-pointer",
            "focus:border-border-emphasis focus:outline-none focus:ring-1 focus:ring-accent/40",
            "disabled:cursor-not-allowed disabled:opacity-40",
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hint && (
          <p id={`${selectId}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
