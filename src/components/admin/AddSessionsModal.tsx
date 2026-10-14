"use client";

import { FormEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Instance, InstanceCredential } from "@/services/admin.service";
import { reqPostSession, reqProbeSession } from "@/services/session.service";
import { addSession, setActiveSession } from "@/store/slices/sessionSlice";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { endpointHost } from "@/tools/url.tools";

interface AddSessionsModalProps {
  open: boolean;
  onClose: () => void;
  instance: Instance | null;
  buckets: string[];
  credentials: InstanceCredential[];
  /** A just-created key whose secret is still known — pre-fills both fields. */
  preset?: { key_id: string; secret_key: string } | null;
  onDone: () => void;
}

/** Save one or more buckets on an instance as sessions, sharing one key. */
export function AddSessionsModal({
  open,
  onClose,
  instance,
  buckets,
  credentials,
  preset,
  onDone,
}: AddSessionsModalProps) {
  const dispatch = useDispatch();
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKeyId(preset?.key_id ?? credentials[0]?.key_id ?? "");
    setSecret(preset?.secret_key ?? "");
    setRegion("us-east-1");
    setNicknames(Object.fromEntries(buckets.map((b) => [b, b])));
  }, [open, preset, credentials, buckets]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!instance || !keyId || !secret || !region.trim()) return;
    setSaving(true);
    let ok = 0;
    let last = null;
    for (const bucket of buckets) {
      const res = await reqPostSession({
        bucket,
        nickname: nicknames[bucket]?.trim() || bucket,
        region: region.trim(),
        endpoint: instance.endpoint,
        access_key_id: keyId,
        secret_access_key: secret,
      });
      if (res.success) {
        ok += 1;
        last = res.data;
        dispatch(addSession(res.data));
      } else {
        toast.error(`${bucket}: ${res.error_message || "failed"}`);
      }
    }
    setSaving(false);
    if (last) {
      dispatch(setActiveSession(last));
      toast.success(
        ok === 1
          ? `Session for ${last.bucket} created`
          : `${ok} sessions created`,
      );
      const probe = await reqProbeSession(last.id);
      if (!probe.success)
        toast.error(
          `Saved, but the bucket couldn't be listed with that key: ${probe.error_message}`,
          { duration: 8000 },
        );
      onDone();
      onClose();
    }
  };

  const keyOptions = credentials.map((c) => ({
    value: c.key_id,
    label: `${c.name} (${c.key_id})`,
  }));
  if (preset && !credentials.some((c) => c.key_id === preset.key_id))
    keyOptions.unshift({ value: preset.key_id, label: preset.key_id });

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={
        buckets.length === 1
          ? `Add ${buckets[0]} as a session`
          : `Add ${buckets.length} buckets as sessions`
      }
      description={
        instance
          ? `${instance.name} · ${endpointHost(instance.endpoint)}`
          : undefined
      }
      widthClass="max-w-lg"
    >
      <form
        onSubmit={submit}
        className="flex flex-col gap-4"
        autoComplete="off"
      >
        <Select
          label="Access key"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          options={keyOptions}
        />
        <Input
          label="Secret access key"
          type="password"
          autoComplete="new-password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          hint={
            preset
              ? "Filled in from the key you just created."
              : "The secret shown when this key was created."
          }
          data-1p-ignore
        />
        <Input
          label="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-xs font-medium uppercase tracking-wider text-secondary">
            {buckets.length === 1 ? "Nickname" : "Nicknames"}
          </legend>
          {buckets.map((b) => (
            <div key={b} className="flex items-center gap-3">
              {buckets.length > 1 && (
                <span className="w-32 shrink-0 truncate font-mono text-xs text-muted">
                  {b}
                </span>
              )}
              <div className="flex-1">
                <Input
                  aria-label={`Nickname for ${b}`}
                  value={nicknames[b] ?? b}
                  onChange={(e) =>
                    setNicknames((n) => ({ ...n, [b]: e.target.value }))
                  }
                />
              </div>
            </div>
          ))}
        </fieldset>
        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={!keyId || !secret || !region.trim()}
          >
            {buckets.length === 1
              ? "Add session"
              : `Add ${buckets.length} sessions`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
