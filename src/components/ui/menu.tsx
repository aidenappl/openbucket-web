"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faEllipsis } from "@fortawesome/pro-solid-svg-icons";
import { cn } from "@/lib/utils";

export type MenuItem =
  | {
      label: string;
      icon?: IconProp;
      onSelect: () => void;
      destructive?: boolean;
      disabled?: boolean;
    }
  | "separator";

interface MenuProps {
  items: MenuItem[];
  /** Accessible name for the trigger, e.g. "Actions for report.pdf". */
  label: string;
  trigger?: ReactNode;
  className?: string;
}

const MENU_WIDTH = 192;

/**
 * A row-actions menu. Rendered in a portal with fixed positioning, because rows
 * live inside `overflow-x-auto` tables and an absolutely-positioned popover
 * there is clipped by the scroll container. Arrow keys move, Escape closes and
 * returns focus to the trigger.
 */
export function Menu({ items, label, trigger, className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight ?? 0;
    const below = r.bottom + 4 + height <= window.innerHeight;
    setPos({
      top: below ? r.bottom + 4 : Math.max(8, r.top - 4 - height),
      left: Math.min(
        Math.max(8, r.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8,
      ),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t))
        close(false);
    };
    const onScroll = () => close(false);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    requestAnimationFrame(() =>
      menuRef.current
        ?.querySelector<HTMLElement>("[role=menuitem]:not([disabled])")
        ?.focus(),
    );
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, close]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const els = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        "[role=menuitem]:not([disabled])",
      ) ?? [],
    );
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-elevated hover:text-primary cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          open && "bg-surface-elevated text-primary",
          className,
        )}
      >
        {trigger ?? (
          <FontAwesomeIcon icon={faEllipsis} className="h-3.5 w-3.5" />
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: MENU_WIDTH,
            }}
            className="fixed z-[60] overflow-hidden rounded-lg border border-border-strong bg-surface py-1 shadow-lg"
          >
            {items.map((item, i) =>
              item === "separator" ? (
                <div
                  key={`sep-${i}`}
                  role="separator"
                  className="my-1 h-px bg-border"
                />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    close(false);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                    "focus:outline-none focus:bg-surface-alt hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40",
                    item.destructive ? "text-destructive" : "text-primary",
                  )}
                >
                  {item.icon && (
                    <FontAwesomeIcon
                      icon={item.icon}
                      className="h-3 w-4 opacity-70"
                    />
                  )}
                  {item.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
