import { ReactNode } from "react";
import type { SortDir } from "@/hooks/useSort";
import { cn } from "@/lib/utils";

/**
 * Table primitives — ported from keyring-web onto this app's token layer, so a
 * list here reads the same as one in Keyring: uppercase muted headers, hairline
 * row dividers, a quiet hover.
 */
export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // `relative` matters: without a positioned ancestor, an `sr-only` (absolute)
  // label in a column scrolled out of view is placed against the viewport and
  // widens the whole page — Admin → Users scrolled sideways at 320px because of
  // the hidden "Actions" header.
  return (
    <div
      className={cn(
        "relative overflow-x-auto rounded-lg border border-border bg-surface",
        className,
      )}
    >
      <table className="min-w-full">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-border">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TableRow({
  children,
  className,
  selected,
}: {
  children: ReactNode;
  className?: string;
  selected?: boolean;
}) {
  return (
    <tr
      aria-selected={selected}
      className={cn(
        "transition-colors hover:bg-surface-alt",
        selected && "bg-surface-alt",
        className,
      )}
    >
      {children}
    </tr>
  );
}

const headClass =
  "px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider whitespace-nowrap";

export function TableHead({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <th className={cn(headClass, className)}>{children}</th>;
}

/**
 * A column header that sorts. aria-sort tells assistive tech which way the
 * column is ordered.
 */
export function SortableHead<K extends string>({
  children,
  column,
  sort,
  className,
}: {
  children: ReactNode;
  column: K;
  sort: { key: K; dir: SortDir; sortBy: (key: K) => void };
  className?: string;
}) {
  const active = sort.key === column;
  return (
    <th
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn(headClass, className)}
    >
      <button
        type="button"
        onClick={() => sort.sortBy(column)}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wider transition-colors hover:text-primary cursor-pointer",
          active && "text-primary",
        )}
      >
        {children}
        <span
          aria-hidden="true"
          className={cn("text-[10px]", !active && "opacity-30")}
        >
          {active && sort.dir === "desc" ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}

export function TableCell({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-4 py-3 text-sm text-primary",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: ReactNode;
  action?: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-12 text-center text-sm text-muted">
        {message}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </td>
    </tr>
  );
}
