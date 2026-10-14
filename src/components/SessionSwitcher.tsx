"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faDatabase,
} from "@fortawesome/pro-solid-svg-icons";
import {
  selectAllSessions,
  selectCurrentSession,
  setActiveSession,
} from "@/store/slices/sessionSlice";
import { useDismiss } from "@/hooks/useDismiss";
import { endpointHost } from "@/tools/url.tools";
import { cn } from "@/lib/utils";

/**
 * The active-bucket picker in the nav.
 *
 * ⚠️ Every row shows the endpoint host under the name. Two sessions can share a
 * nickname and a bucket name on different instances (there are two "website"
 * buckets, Trailblaze and APLB) and the old dropdown listed them as two
 * identical "website" rows — pick the wrong one and uploads land on the other
 * instance.
 */
export function SessionSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const dispatch = useDispatch();
  const sessions = useSelector(selectAllSessions);
  const current = useSelector(selectCurrentSession);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Active bucket: ${current.nickname || current.bucket} on ${endpointHost(current.endpoint)}`}
        className="flex h-8 max-w-[220px] items-center gap-2 rounded-lg border border-border-strong bg-surface pl-2.5 pr-2 text-sm text-primary transition-colors hover:border-border-emphasis cursor-pointer"
      >
        <FontAwesomeIcon icon={faDatabase} className="h-3 w-3 text-muted" />
        <span className="truncate font-medium">
          {current.nickname || current.bucket}
        </span>
        <span className="hidden xl:inline truncate text-xs text-muted">
          {endpointHost(current.endpoint)}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="h-2.5 w-2.5 text-muted"
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-72 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-lg">
          <ul
            role="listbox"
            aria-label="Bucket sessions"
            className="max-h-[60vh] overflow-y-auto py-1"
          >
            {sessions.map((s) => {
              const active = s.id === current.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      dispatch(setActiveSession(s));
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-alt cursor-pointer",
                      active && "bg-surface-alt",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-primary">
                        {s.nickname || s.bucket}
                      </span>
                      <span className="block truncate font-mono text-xs text-muted">
                        {s.bucket} · {endpointHost(s.endpoint)}
                      </span>
                    </span>
                    {active && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="h-3 w-3 text-accent"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/sessions"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block border-t border-border px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-alt hover:text-primary"
          >
            Manage sessions
          </Link>
        </div>
      )}
    </div>
  );
}
