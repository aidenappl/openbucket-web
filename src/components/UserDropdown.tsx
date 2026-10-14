"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { User } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { useDismiss } from "@/hooks/useDismiss";

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
}

const itemClass =
  "block w-full px-3 py-2 text-left text-sm text-secondary transition-colors hover:bg-surface-alt hover:text-primary cursor-pointer";

const UserDropdown = ({ user, onLogout }: UserDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name ?? user.email}`}
        className="flex h-9 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-surface-alt cursor-pointer"
      >
        {user.profile_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profile_image_url}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
            {initials}
          </span>
        )}
        <span className="hidden md:inline max-w-[140px] truncate text-sm font-medium text-secondary">
          {user.name ?? user.email}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="hidden md:inline h-2.5 w-2.5 text-muted"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-primary">
              {user.name ?? "—"}
            </p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
              {user.role} · {user.auth_type === "sso" ? "SSO" : "Local"}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/account"
              role="menuitem"
              className={itemClass}
              onClick={close}
            >
              Account
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                role="menuitem"
                className={itemClass}
                onClick={close}
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onLogout();
              }}
              className={`${itemClass} text-destructive! hover:text-destructive!`}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
