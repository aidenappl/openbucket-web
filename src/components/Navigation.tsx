"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faDesktop,
  faMoon,
  faSun,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import UserDropdown from "./UserDropdown";
import { SessionSwitcher } from "./SessionSwitcher";
import { selectAllSessions } from "@/store/slices/sessionSlice";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme, ThemePreference } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const THEME_CYCLE: ThemePreference[] = ["system", "light", "dark"];
const THEME_ICONS = { system: faDesktop, light: faSun, dark: faMoon };

/**
 * Top bar — same shape as keyring-web's and lattice-web's: a brand tile with
 * the product name and "Appleby Cloud", pill tabs with an active state, the
 * account menu on the right, and a hamburger below `lg`.
 *
 * Admin is a tab for admins. It used to be reachable only from inside the
 * account menu, which made the whole admin area undiscoverable.
 */
const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const sessions = useSelector(selectAllSessions);
  const { isLoggedIn, isLoading, user, logout } = useAuthContext();
  const { preference, setPreference } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    {
      name: "Explorer",
      href: "/",
      active: pathname === "/" || pathname.startsWith("/object"),
    },
    {
      name: "Sessions",
      href: "/sessions",
      active: pathname.startsWith("/sessions"),
    },
    ...(user?.role === "admin"
      ? [
          {
            name: "Admin",
            href: "/admin",
            active: pathname.startsWith("/admin"),
          },
        ]
      : []),
  ];

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(preference);
    setPreference(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const signedIn = !isLoading && isLoggedIn && user;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--max-page-width)] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="OpenBucket home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated">
              <Image
                src="/OpenBucket-Logo.svg"
                alt=""
                width={20}
                height={20}
                priority
              />
            </span>
            <span className="font-semibold text-primary">
              OpenBucket
              <span className="ml-1.5 hidden font-normal text-muted sm:inline">
                Appleby Cloud
              </span>
            </span>
          </Link>

          {signedIn && (
            <nav
              aria-label="Primary"
              className="hidden lg:flex items-center gap-1"
            >
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={t.active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    t.active
                      ? "bg-surface-elevated text-primary"
                      : "text-secondary hover:bg-surface-alt hover:text-primary",
                  )}
                >
                  {t.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {signedIn && sessions.length > 0 && (
            <div className="hidden sm:block">
              <SessionSwitcher />
            </div>
          )}
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${preference}. Switch theme`}
            title={`Theme: ${preference}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-alt hover:text-primary cursor-pointer"
          >
            <FontAwesomeIcon
              icon={THEME_ICONS[preference]}
              className="h-3.5 w-3.5"
            />
          </button>
          {!isLoading &&
            (signedIn ? (
              <UserDropdown user={user} onLogout={logout} />
            ) : (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="h-9 rounded-lg px-3 text-sm font-medium text-secondary hover:text-primary cursor-pointer"
              >
                Sign in
              </button>
            ))}
          {signedIn && (
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-alt hover:text-primary cursor-pointer"
            >
              <FontAwesomeIcon
                icon={mobileOpen ? faXmark : faBars}
                className="h-4 w-4"
              />
            </button>
          )}
        </div>
      </div>

      {signedIn && mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface">
          <nav aria-label="Primary" className="flex flex-col gap-0.5 p-2">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => setMobileOpen(false)}
                aria-current={t.active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  t.active
                    ? "bg-surface-elevated text-primary"
                    : "text-secondary hover:bg-surface-alt hover:text-primary",
                )}
              >
                {t.name}
              </Link>
            ))}
          </nav>
          {sessions.length > 0 && (
            <div className="border-t border-border p-3 sm:hidden">
              <SessionSwitcher onNavigate={() => setMobileOpen(false)} />
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navigation;
