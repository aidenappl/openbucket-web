"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";
import {
  ApiToken,
  ApiTokenExpiry,
  CreatedApiToken,
  reqAdminCreateApiToken,
  reqAdminListApiTokens,
  reqAdminListUsers,
  reqAdminRevokeApiToken,
} from "@/services/admin.service";
import { User } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { CopyButton } from "@/components/ui/copy-button";
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Spinner from "@/components/Spinner";
import { cn } from "@/lib/utils";

const EXPIRY_OPTIONS: { value: ApiTokenExpiry; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "365d", label: "1 year" },
  { value: "never", label: "Never" },
];

const relative = (iso: string | null) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [86400000 * 365, "year"],
    [86400000 * 30, "month"],
    [86400000, "day"],
    [3600000, "hour"],
    [60000, "minute"],
  ];
  for (const [ms, name] of units) {
    const n = Math.floor(abs / ms);
    if (n >= 1)
      return diff >= 0
        ? `${n} ${name}${n === 1 ? "" : "s"} ago`
        : `in ${n} ${name}${n === 1 ? "" : "s"}`;
  }
  return "just now";
};

/**
 * `obk_` API tokens — what openbucket-mcp, CLIs and CI authenticate with.
 *
 * The API had full create/list/revoke routes and no UI, so the only way to mint
 * one was a hand-rolled curl with an admin cookie.
 */
export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState<ApiTokenExpiry>("90d");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedApiToken | null>(null);
  const [revoking, setRevoking] = useState<ApiToken | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const load = async () => {
    const [t, u] = await Promise.all([
      reqAdminListApiTokens(),
      reqAdminListUsers(),
    ]);
    if (t.success) setTokens(t.data ?? []);
    else toast.error(t.error_message || "Failed to load tokens");
    if (u.success) setUsers(u.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const owner = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const res = await reqAdminCreateApiToken(name.trim(), expiry);
    setCreating(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to create token");
      return;
    }
    setCreateOpen(false);
    setCreated(res.data);
    setName("");
    setExpiry("90d");
    load();
  };

  const revoke = async () => {
    if (!revoking) return;
    setRevokeBusy(true);
    const res = await reqAdminRevokeApiToken(revoking.id);
    setRevokeBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to revoke token");
      return;
    }
    toast.success(`Revoked “${revoking.name}”`);
    setRevoking(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="API tokens"
        description="Long-lived obk_ tokens for openbucket-mcp, CLIs and CI. Each acts as the admin who created it."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
            Create token
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Owner</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead className="hidden sm:table-cell">Expires</TableHead>
            <TableHead className="hidden lg:table-cell">Created</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">Actions</span>
            </TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {tokens.length === 0 ? (
            <EmptyState
              message="No active API tokens."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  Create token
                </Button>
              }
            />
          ) : (
            tokens.map((t) => {
              const expired =
                t.expires_at != null &&
                new Date(t.expires_at).getTime() < Date.now();
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-secondary">
                    {owner.get(t.user_id)?.email ?? `User ${t.user_id}`}
                  </TableCell>
                  <TableCell className="text-secondary">
                    <span title={t.last_used_at ?? undefined}>
                      {relative(t.last_used_at) ?? (
                        <span className="text-muted">Never</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "hidden sm:table-cell",
                      expired ? "text-destructive" : "text-secondary",
                    )}
                  >
                    {t.expires_at ? (
                      <span title={new Date(t.expires_at).toLocaleString()}>
                        {expired ? "Expired" : relative(t.expires_at)}
                      </span>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-secondary">
                    {new Date(t.inserted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRevoking(t)}
                      aria-label={`Revoke ${t.name}`}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create API token"
        description="Minted for your account. Name it after what will use it, so the Last used column means something."
        widthClass="max-w-md"
      >
        <form onSubmit={create} className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="e.g. openbucket-mcp on laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
          />
          <Select
            label="Expires"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value as ApiTokenExpiry)}
            options={EXPIRY_OPTIONS}
          />
          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating} disabled={!name.trim()}>
              Create token
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!created}
        onClose={() => setCreated(null)}
        title={`Token “${created?.name}” created`}
        widthClass="max-w-lg"
        footer={
          <Button onClick={() => setCreated(null)}>I&apos;ve copied it</Button>
        }
      >
        <Alert variant="warning">
          Copy it now. It is shown once and can&apos;t be retrieved again.
        </Alert>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-strong bg-surface-alt p-2">
          <code className="min-w-0 flex-1 break-all px-1 font-mono text-xs text-primary">
            {created?.token}
          </code>
          {created && (
            <CopyButton text={created.token} aria-label="Copy token" />
          )}
        </div>
      </Modal>

      <Modal
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title={`Revoke “${revoking?.name}”?`}
        description="Anything using it stops working on its next request. This can't be undone."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRevoking(null)}
              disabled={revokeBusy}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke} loading={revokeBusy}>
              Revoke token
            </Button>
          </>
        }
      />
    </div>
  );
}
