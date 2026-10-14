"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/pro-solid-svg-icons";
import {
  Instance,
  InstanceBucket,
  InstanceBucketStats,
  InstanceCredential,
  reqProxyCreateBucket,
  reqProxyCreateGrant,
  reqProxyDeleteBucket,
  reqProxyDeleteGrant,
  reqProxyUpdateBucketACL,
} from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { formatBytes } from "@/tools/formatBytes.tools";

const BUCKET_ACLS = [
  { value: "PRIVATE", label: "Private" },
  { value: "PUBLIC_READ", label: "Public read" },
  { value: "PUBLIC_READ_WRITE", label: "Public read + write" },
  { value: "PUBLIC_WRITE", label: "Public write" },
];

const PERMISSIONS = [
  "READ",
  "WRITE",
  "FULL_CONTROL",
  "READ_ACP",
  "WRITE_ACP",
].map((p) => ({ value: p, label: p }));

// S3 bucket-naming rules, the subset that matters for a typo.
const BUCKET_NAME = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

interface BucketsPanelProps {
  instance: Instance;
  buckets: InstanceBucket[];
  stats: Record<string, InstanceBucketStats>;
  credentials: InstanceCredential[];
  /** Bucket names that already have a session on this instance. */
  existingSessions: Set<string>;
  onChanged: () => void;
  onAddSessions: (buckets: string[]) => void;
}

export function BucketsPanel({
  instance,
  buckets,
  stats,
  credentials,
  existingSessions,
  onChanged,
  onAddSessions,
}: BucketsPanelProps) {
  const credOptions = credentials.map((c) => ({
    value: c.key_id,
    label: `${c.name} (${c.key_id})`,
  }));

  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState(credentials[0]?.key_id ?? "");
  const [creating, setCreating] = useState(false);
  const [aclChange, setAclChange] = useState<{
    bucket: string;
    acl: string;
  } | null>(null);
  const [grantFor, setGrantFor] = useState<string | null>(null);
  const [grantKey, setGrantKey] = useState(credentials[0]?.key_id ?? "");
  const [grantPerm, setGrantPerm] = useState("READ");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const nameError =
    newName && !BUCKET_NAME.test(newName)
      ? "3–63 lowercase letters, digits, dots or hyphens"
      : undefined;
  const missingSessions = buckets
    .map((b) => b.name)
    .filter((n) => !existingSessions.has(n));

  const run = async (
    fn: () => Promise<{ success: boolean; error_message?: string }>,
    ok: string,
  ) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Request failed");
      return false;
    }
    toast.success(ok);
    onChanged();
    return true;
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName || nameError || !newOwner) return;
    setCreating(true);
    const res = await reqProxyCreateBucket(instance.id, newName, newOwner);
    setCreating(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to create bucket");
      return;
    }
    toast.success(`Bucket ${newName} created`);
    setNewName("");
    onChanged();
  };

  return (
    <div className="flex flex-col gap-4">
      {credentials.length === 0 ? (
        <Alert variant="info">
          Create a credential first. Every bucket needs an owner key.
        </Alert>
      ) : (
        <form
          onSubmit={create}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Input
            label="New bucket"
            placeholder="my-bucket"
            value={newName}
            onChange={(e) => setNewName(e.target.value.toLowerCase())}
            error={nameError}
          />
          <Select
            label="Owner"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            options={credOptions}
          />
          <Button
            type="submit"
            loading={creating}
            disabled={!newName || !!nameError}
          >
            Create bucket
          </Button>
        </form>
      )}

      {missingSessions.length > 1 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddSessions(missingSessions)}
          >
            Add {missingSessions.length} buckets as sessions
          </Button>
        </div>
      )}

      {buckets.length === 0 ? (
        <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted">
          No buckets on this instance.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {buckets.map((b) => (
            <li
              key={b.id}
              className="rounded-lg border border-border bg-surface-alt p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium text-primary">
                    {b.name}
                  </p>
                  <p className="text-xs text-muted">
                    {stats[b.name]
                      ? `${stats[b.name].object_count.toLocaleString()} objects · ${formatBytes(stats[b.name].total_size)}`
                      : "Stats unavailable"}{" "}
                    · owner {b.owner?.display_name || b.owner?.key_id}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={b.acl}
                    aria-label={`Access for bucket ${b.name}`}
                    onChange={(e) =>
                      setAclChange({ bucket: b.name, acl: e.target.value })
                    }
                    className="h-7 rounded-lg border border-border-strong bg-surface px-2 text-xs text-primary cursor-pointer"
                  >
                    {BUCKET_ACLS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  {existingSessions.has(b.name) ? (
                    <span className="text-xs text-muted">Has a session</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAddSessions([b.name])}
                    >
                      Add as session
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setDeleting(b.name);
                      setTyped("");
                    }}
                    aria-label={`Delete bucket ${b.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-2">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                  Grants
                </p>
                {b.grants && b.grants.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {b.grants.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="min-w-0 truncate text-secondary">
                          {g.display_name}{" "}
                          <span className="font-mono text-muted">
                            {g.key_id}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-xs text-secondary">
                            {g.permission}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${g.permission} grant for ${g.display_name}`}
                            onClick={() =>
                              run(
                                () =>
                                  reqProxyDeleteGrant(
                                    instance.id,
                                    b.name,
                                    g.id,
                                  ),
                                "Grant removed",
                              )
                            }
                            className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-surface-elevated hover:text-destructive cursor-pointer"
                          >
                            <FontAwesomeIcon
                              icon={faXmark}
                              className="h-3 w-3"
                            />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">
                    Only the owner has access.
                  </p>
                )}
                {grantFor === b.name ? (
                  <form
                    className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await run(
                          () =>
                            reqProxyCreateGrant(
                              instance.id,
                              b.name,
                              grantKey,
                              grantPerm,
                            ),
                          "Grant added",
                        )
                      )
                        setGrantFor(null);
                    }}
                  >
                    <Select
                      aria-label="Credential"
                      value={grantKey}
                      onChange={(e) => setGrantKey(e.target.value)}
                      options={credOptions}
                    />
                    <Select
                      aria-label="Permission"
                      value={grantPerm}
                      onChange={(e) => setGrantPerm(e.target.value)}
                      options={PERMISSIONS}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      loading={busy}
                      disabled={!grantKey}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setGrantFor(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  credentials.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setGrantFor(b.name)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                      Add grant
                    </button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!aclChange}
        onClose={() => setAclChange(null)}
        title={`Change ${aclChange?.bucket} to ${BUCKET_ACLS.find((a) => a.value === aclChange?.acl)?.label.toLowerCase()}?`}
        description={
          aclChange?.acl === "PRIVATE"
            ? "Anonymous requests to this bucket will be refused."
            : aclChange?.acl?.includes("WRITE")
              ? "Anyone on the internet will be able to write to this bucket — upload, overwrite and delete objects."
              : "Anyone on the internet will be able to list and read this bucket."
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAclChange(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant={
                aclChange?.acl?.includes("WRITE") ? "destructive" : "primary"
              }
              loading={busy}
              onClick={async () => {
                if (
                  aclChange &&
                  (await run(
                    () =>
                      reqProxyUpdateBucketACL(
                        instance.id,
                        aclChange.bucket,
                        aclChange.acl,
                      ),
                    "Bucket access updated",
                  ))
                )
                  setAclChange(null);
              }}
            >
              Change access
            </Button>
          </>
        }
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete bucket ${deleting}?`}
        description={
          deleting && stats[deleting]
            ? `This permanently deletes the bucket and all ${stats[deleting].object_count.toLocaleString()} objects (${formatBytes(stats[deleting].total_size)}) in it.`
            : "This permanently deletes the bucket and every object in it."
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={busy}
              disabled={typed !== deleting}
              onClick={async () => {
                if (
                  deleting &&
                  (await run(
                    () => reqProxyDeleteBucket(instance.id, deleting),
                    `Deleted ${deleting}`,
                  ))
                )
                  setDeleting(null);
              }}
            >
              Delete bucket
            </Button>
          </>
        }
      >
        <Input
          label={`Type ${deleting} to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="font-mono"
        />
      </Modal>
    </div>
  );
}
