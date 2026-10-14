"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Alert } from "@/components/ui/alert";
import { Session } from "@/types";
import { reqFetchObjectPresign } from "@/services/object.service";
import {
  baseName,
  isPublicAcl,
  publicObjectUrl,
} from "@/tools/objectUrl.tools";
import { cn } from "@/lib/utils";

interface ShareLinkModalProps {
  open: boolean;
  onClose: () => void;
  session: Session;
  objectKey: string;
  acl: string | null | undefined;
}

// ⚠️ openbucket-api caps presigns at 24 h, and anything above the cap is
// silently reset to 1 h (HandlePresign), not clamped. A "7 days" option here
// produced 1-hour links labelled as 7-day ones. Stay within the cap, and show
// the expiry the API reports rather than the one requested.
const EXPIRIES = [
  { seconds: 900, label: "15 min" },
  { seconds: 3600, label: "1 hour" },
  { seconds: 86400, label: "1 day" },
];

const LinkBox = ({ url, label }: { url: string; label: string }) => (
  <div className="flex items-start gap-2 rounded-lg border border-border-strong bg-surface-alt p-2">
    <code className="min-w-0 flex-1 break-all px-1 py-0.5 font-mono text-xs text-primary">
      {url}
    </code>
    <CopyButton text={url} aria-label={`Copy ${label}`} className="shrink-0" />
  </div>
);

/**
 * Share an object: the permanent public URL when it's public-read, and a
 * signed link with a chosen lifetime either way (the only way to share a
 * private object without changing its access).
 */
export function ShareLinkModal({
  open,
  onClose,
  session,
  objectKey,
  acl,
}: ShareLinkModalProps) {
  const [expiry, setExpiry] = useState(86400);
  const [signed, setSigned] = useState<{ url: string; expiresAt: Date } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPublic = isPublicAcl(acl);

  useEffect(() => {
    if (open) {
      setSigned(null);
      setError(null);
      setExpiry(86400);
    }
  }, [open, objectKey]);

  const create = async () => {
    setBusy(true);
    setError(null);
    const res = await reqFetchObjectPresign(objectKey, expiry);
    setBusy(false);
    if (!res.success) {
      setError(res.error_message || "Couldn't create a link");
      return;
    }
    const granted = Number(res.data.expiration) || expiry;
    setSigned({
      url: res.data.url,
      expiresAt: new Date(Date.now() + granted * 1000),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Share ${baseName(objectKey)}`}
      widthClass="max-w-lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {isPublic && (
          <section className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-secondary">
              Public URL
            </h4>
            <LinkBox
              url={publicObjectUrl(session, objectKey)}
              label="public URL"
            />
            <p className="text-xs text-muted">
              Anyone with it can open the file for as long as it stays public.
            </p>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-secondary">
            Signed link
          </h4>
          {!isPublic && (
            <p className="text-xs text-secondary">
              This object is private. A signed link lets someone open it without
              making it public, until the link expires.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Link lifetime"
              className="flex rounded-lg border border-border-strong p-0.5"
            >
              {EXPIRIES.map((e) => (
                <button
                  key={e.seconds}
                  type="button"
                  role="radio"
                  aria-checked={expiry === e.seconds}
                  onClick={() => {
                    setExpiry(e.seconds);
                    setSigned(null);
                  }}
                  className={cn(
                    "h-7 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer",
                    expiry === e.seconds
                      ? "bg-surface-elevated text-primary"
                      : "text-secondary hover:text-primary",
                  )}
                >
                  {e.label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={create} loading={busy}>
              {signed ? "Create another" : "Create link"}
            </Button>
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          {signed && (
            <>
              <LinkBox url={signed.url} label="signed link" />
              <p className="text-xs text-muted">
                Expires {signed.expiresAt.toLocaleString()}. It can&apos;t be
                revoked early; making the object private doesn&apos;t stop it.
              </p>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}
