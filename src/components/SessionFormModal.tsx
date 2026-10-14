"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Session } from "@/types";
import { SessionPayload } from "@/services/session.service";
import { isValidUrl } from "@/tools/url.tools";

interface SessionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SessionPayload) => void;
  /** Set to edit; null to create. */
  editing: Session | null;
  saving: boolean;
}

const empty: SessionPayload = {
  bucket: "",
  nickname: "",
  region: "",
  endpoint: "",
  access_key_id: "",
  secret_access_key: "",
};

/**
 * Create or edit a bucket session.
 *
 * openbucket-api never returns stored keys, so editing always asks for them
 * again — the hint says so instead of leaving two mysteriously blank required
 * fields.
 */
export function SessionFormModal({
  open,
  onClose,
  onSubmit,
  editing,
  saving,
}: SessionFormModalProps) {
  const [f, setF] = useState<SessionPayload>(empty);
  const [submitted, setSubmitted] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setF(
      editing
        ? {
            ...empty,
            bucket: editing.bucket,
            nickname: editing.nickname ?? "",
            region: editing.region,
            endpoint: editing.endpoint,
          }
        : empty,
    );
  }, [open, editing]);

  const errors: Partial<Record<keyof SessionPayload, string>> = {
    bucket: f.bucket.trim() ? undefined : "Required",
    region: f.region.trim() ? undefined : "Required",
    endpoint: !f.endpoint.trim()
      ? "Required"
      : !/^https?:\/\//.test(f.endpoint.trim()) ||
          !isValidUrl(f.endpoint.trim())
        ? "Must be a full http(s) URL, e.g. https://s3.example.com"
        : undefined,
    access_key_id: f.access_key_id.trim() ? undefined : "Required",
    secret_access_key: f.secret_access_key ? undefined : "Required",
  };
  const valid = Object.values(errors).every((e) => !e);
  const err = (k: keyof SessionPayload) => (submitted ? errors[k] : undefined);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid || saving) return;
    onSubmit({
      bucket: f.bucket.trim(),
      nickname: f.nickname.trim(),
      region: f.region.trim(),
      endpoint: f.endpoint.trim().replace(/\/+$/, ""),
      access_key_id: f.access_key_id.trim(),
      secret_access_key: f.secret_access_key,
    });
  };

  const set =
    (k: keyof SessionPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={
        editing
          ? `Edit ${editing.nickname || editing.bucket}`
          : "New bucket session"
      }
      description={
        editing
          ? "Stored keys are never sent back to the browser, so enter them again to save."
          : "A session saves the credentials for one bucket. Keys are encrypted at rest."
      }
      initialFocusRef={firstRef}
      widthClass="max-w-lg"
    >
      <form
        onSubmit={submit}
        className="flex flex-col gap-4"
        autoComplete="off"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            ref={firstRef}
            label="Bucket"
            placeholder="my-bucket"
            value={f.bucket}
            onChange={set("bucket")}
            error={err("bucket")}
          />
          <Input
            label="Nickname"
            placeholder="Optional"
            value={f.nickname}
            onChange={set("nickname")}
          />
          <Input
            label="Endpoint"
            placeholder="https://s3.example.com"
            value={f.endpoint}
            onChange={set("endpoint")}
            error={err("endpoint")}
          />
          <Input
            label="Region"
            placeholder="us-east-1"
            value={f.region}
            onChange={set("region")}
            error={err("region")}
          />
          <Input
            label="Access key ID"
            value={f.access_key_id}
            onChange={set("access_key_id")}
            error={err("access_key_id")}
            className="font-mono"
            data-1p-ignore
          />
          <Input
            label="Secret access key"
            type="password"
            value={f.secret_access_key}
            onChange={set("secret_access_key")}
            error={err("secret_access_key")}
            autoComplete="new-password"
            data-1p-ignore
          />
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create session"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
