"use client";

import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  /** `shiftKey` reports whether Shift was held, so a table can select a range. */
  onChange: (checked: boolean, shiftKey: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * A 16px checkbox inside a 40x40 click target — ported from keyring-web.
 *
 * It is a real `role="checkbox"` button. The old explorer checkbox was a bare
 * div: invisible to screen readers, unreachable by Tab, and a 20px target.
 * The click is stopped here so a row that navigates on click doesn't also
 * navigate when its checkbox is toggled.
 */
export function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked, event.shiftKey);
      }}
      className={cn(
        "-m-3 flex h-10 w-10 items-center justify-center rounded-lg p-3 cursor-pointer",
        "transition-colors hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked || indeterminate
            ? "border-accent bg-accent"
            : "border-border-emphasis bg-transparent",
        )}
      >
        {checked && !indeterminate && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {indeterminate && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        )}
      </span>
    </button>
  );
}
