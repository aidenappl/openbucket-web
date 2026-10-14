"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ApiToken,
  Instance,
  reqAdminGetSSOConfig,
  reqAdminListApiTokens,
  reqAdminListInstances,
  reqAdminListUsers,
} from "@/services/admin.service";
import { AdminSSOConfig, User } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner";
import { endpointHost } from "@/tools/url.tools";

export default function AdminOverview() {
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [sso, setSso] = useState<AdminSSOConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reqAdminListUsers(),
      reqAdminListInstances(),
      reqAdminListApiTokens(),
      reqAdminGetSSOConfig(),
    ]).then(([u, i, t, s]) => {
      if (u.success) setUsers(u.data ?? []);
      if (i.success) setInstances(i.data ?? []);
      if (t.success) setTokens(t.data ?? []);
      if (s.success) setSso(s.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const pending = users.filter((u) => u.role === "pending" && u.active);
  const stats = [
    {
      label: "Users",
      value: users.filter((u) => u.active).length,
      sub: `${users.length} total`,
      href: "/admin/users",
    },
    {
      label: "Pending approval",
      value: pending.length,
      sub: pending.length ? "Needs review" : "None waiting",
      href: "/admin/users",
      warn: pending.length > 0,
    },
    {
      label: "Instances",
      value: instances.filter((i) => i.active).length,
      sub: `${instances.length} configured`,
      href: "/admin/instances",
    },
    {
      label: "API tokens",
      value: tokens.length,
      sub: "Active",
      href: "/admin/tokens",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Users, storage instances, automation tokens and sign-in."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-emphasis"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-primary tabular-nums">
              {s.value}
            </p>
            <p
              className={
                s.warn
                  ? "mt-0.5 text-xs text-pending"
                  : "mt-0.5 text-xs text-muted"
              }
            >
              {s.sub}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">Instances</h2>
            <Link
              href="/admin/instances"
              className="text-xs text-accent hover:underline"
            >
              Manage
            </Link>
          </header>
          {instances.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">
              No instances configured.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {instances.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-primary">
                      {i.name}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted">
                      {endpointHost(i.endpoint)}
                    </span>
                  </span>
                  <StatusBadge status={i.active ? "active" : "inactive"} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">Sign-in</h2>
            <Link
              href="/admin/sso"
              className="text-xs text-accent hover:underline"
            >
              Configure
            </Link>
          </header>
          <dl className="divide-y divide-border text-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-secondary">Single sign-on</dt>
              <dd>
                <StatusBadge status={sso?.enabled ? "enabled" : "disabled"} />
              </dd>
            </div>
            {sso?.enabled && (
              <>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="text-secondary">Provider</dt>
                  <dd className="truncate font-mono text-xs text-primary">
                    {sso.issuer_url
                      ? endpointHost(sso.issuer_url)
                      : "OAuth2 (no issuer)"}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-secondary">Auto-provision</dt>
                  <dd className="text-primary">
                    {sso.auto_provision ? "New users start as pending" : "Off"}
                  </dd>
                </div>
              </>
            )}
            <div className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-secondary">Local accounts</dt>
              <dd className="text-primary tabular-nums">
                {users.filter((u) => u.auth_type === "local").length}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
