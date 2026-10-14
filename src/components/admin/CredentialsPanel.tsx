"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import {
  Instance,
  InstanceCredential,
  reqProxyCreateCredential,
  reqProxyDeleteCredential,
} from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface CredentialsPanelProps {
  instance: Instance;
  credentials: InstanceCredential[];
  onChanged: () => void;
  /** Offer to create sessions with a just-minted key while its secret is still known. */
  onUseForSessions: (cred: { key_id: string; secret_key: string }) => void;
}

/**
 * Access keys on one openbucket-go instance.
 *
 * ⚠️ The secret is returned once, on create. It used to be shown in a toast that
 * vanished after 15 seconds — miss it and the key was useless. It now sits in a
 * modal until dismissed, with a copy button and a shortcut to make sessions.
 */
export function CredentialsPanel({
  instance,
  credentials,
  onChanged,
  onUseForSessions,
}: CredentialsPanelProps) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [minted, setMinted] = useState<InstanceCredential | null>(null);
  const [deleting, setDeleting] = useState<InstanceCredential | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const res = await reqProxyCreateCredential(instance.id, name.trim());
    setCreating(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to create credential");
      return;
    }
    setName("");
    setMinted(res.data);
    onChanged();
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await reqProxyDeleteCredential(instance.id, deleting.id);
    setBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to delete credential");
      return;
    }
    toast.success(`Deleted ${deleting.name}`);
    setDeleting(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={create}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="New credential"
            placeholder="Name, e.g. website-uploader"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" loading={creating} disabled={!name.trim()}>
          Generate key
        </Button>
      </form>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Name</TableHead>
            <TableHead>Access key ID</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead className="w-20">
              <span className="sr-only">Actions</span>
            </TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {credentials.length === 0 ? (
            <EmptyState message="No credentials on this instance." />
          ) : (
            credentials.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-secondary">
                  {c.key_id}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-secondary">
                  {new Date(c.date_created).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-1.5 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeleting(c)}
                    aria-label={`Delete credential ${c.name}`}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Modal
        open={!!minted}
        onClose={() => setMinted(null)}
        title={`Credential “${minted?.name}” created`}
        widthClass="max-w-lg"
        footer={
          <>
            {minted?.secret_key && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (minted?.secret_key)
                    onUseForSessions({
                      key_id: minted.key_id,
                      secret_key: minted.secret_key,
                    });
                  setMinted(null);
                }}
              >
                Create sessions with it
              </Button>
            )}
            <Button onClick={() => setMinted(null)}>I&apos;ve copied it</Button>
          </>
        }
      >
        <Alert variant="warning">
          The secret key is shown once. Copy it now; it can&apos;t be retrieved
          later.
        </Alert>
        <dl className="mt-3 flex flex-col gap-3">
          {[
            ["Access key ID", minted?.key_id],
            ["Secret access key", minted?.secret_key],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-secondary">
                {label}
              </dt>
              <dd className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface-alt p-2">
                <code className="min-w-0 flex-1 break-all px-1 font-mono text-xs text-primary">
                  {value ?? "—"}
                </code>
                {value && (
                  <CopyButton text={value} aria-label={`Copy ${label}`} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete credential “${deleting?.name}”?`}
        description="Every session and client using this key stops working. Buckets it owns keep their data."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} loading={busy}>
              Delete credential
            </Button>
          </>
        }
      />
    </div>
  );
}
