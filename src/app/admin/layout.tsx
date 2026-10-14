"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/instances", label: "Instances" },
  { href: "/admin/tokens", label: "API tokens" },
  { href: "/admin/sso", label: "SSO" },
];

/**
 * Admin shell: a sidebar at `md` and up, a scrolling tab strip below it. The
 * fixed 192px sidebar used to stay put on phones and squeeze every admin page
 * into what was left.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn && user?.role !== "admin") router.replace("/");
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 md:flex-row md:gap-8">
      <nav aria-label="Admin" className="md:w-44 md:shrink-0">
        <h2 className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-muted md:block">
          Admin
        </h2>
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-surface-elevated font-medium text-primary"
                      : "text-secondary hover:bg-surface-alt hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
