"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";
import Spinner from "@/components/Spinner";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/instances", label: "Instances" },
  { href: "/admin/sso", label: "SSO" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || user?.role !== "admin")) {
      router.replace("/");
    }
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex gap-8 mt-4">
      <nav className="w-48 shrink-0">
        <h2 className="text-xs font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-3 tracking-wider">
          Admin
        </h2>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
