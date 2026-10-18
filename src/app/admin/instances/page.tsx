"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";
import {
  Instance,
  InstanceBucket,
  InstanceBucketStats,
  InstanceCredential,
  reqAdminCreateInstance,
  reqAdminDeleteInstance,
  reqAdminListInstances,
  reqAdminUpdateInstance,
  reqProxyGetBucketStats,
  reqProxyListBuckets,
  reqProxyListCredentials,
} from "@/services/admin.service";
import { selectAllSessions } from "@/store/slices/sessionSlice";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Menu } from "@/components/ui/menu";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import Spinner from "@/components/Spinner";
import { CredentialsPanel } from "@/components/admin/CredentialsPanel";
import { BucketsPanel } from "@/components/admin/BucketsPanel";
import { AddSessionsModal } from "@/components/admin/AddSessionsModal";
import { endpointHost, isValidUrl } from "@/tools/url.tools";
import { cn } from "@/lib/utils";

type View = "credentials" | "buckets";

const normalize = (url: string) => url.replace(/\/+$/, "");

export default function InstancesPage() {
  const sessions = useSelector(selectAllSessions);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded instance
  const [expanded, setExpanded] = useState<{ id: number; view: View } | null>(
    null,
  );
  const [credentials, setCredentials] = useState<InstanceCredential[]>([]);
  const [buckets, setBuckets] = useState<InstanceBucket[]>([]);
  const [stats, setStats] = useState<Record<string, InstanceBucketStats>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Instance form (create or edit)
  const [form, setForm] = useState<{
    editing: Instance | null;
    name: string;
    endpoint: string;
    admin_token: string;
  } | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Instance | null>(null);
  const [busy, setBusy] = useState(false);

  // Add-as-session
  const [sessionTarget, setSessionTarget] = useState<{
    instance: Instance;
    buckets: string[];
  } | null>(null);
  const [preset, setPreset] = useState<{
    key_id: string;
    secret_key: string;
  } | null>(null);

  const loadInstances = async () => {
    const res = await reqAdminListInstances();
    if (res.success) setInstances(res.data ?? []);
    else toast.error(res.error_message || "Failed to load instances");
    setLoading(false);
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const current = instances.find((i) => i.id === expanded?.id) ?? null;

  // silent refreshes keep the panel mounted — swapping it for a spinner would
  // unmount CredentialsPanel and lose the just-minted secret before it's shown.
  const loadDetail = useCallback(async (inst: Instance, silent = false) => {
    if (!silent) setDetailLoading(true);
    setDetailError(null);
    const [c, b] = await Promise.all([
      reqProxyListCredentials(inst.id),
      reqProxyListBuckets(inst.id),
    ]);
    if (!c.success || !b.success) {
      const failed = !c.success ? c : !b.success ? b : null;
      setDetailError(
        failed && !failed.success
          ? failed.error_message
          : "Couldn't reach this instance",
      );
      setCredentials([]);
      setBuckets([]);
      setDetailLoading(false);
      return;
    }
    setCredentials(c.data ?? []);
    setBuckets(b.data ?? []);
    setDetailLoading(false);
    const entries = await Promise.all(
      (b.data ?? []).map(
        async (bk) =>
          [bk.name, await reqProxyGetBucketStats(inst.id, bk.name)] as const,
      ),
    );
    setStats(
      Object.fromEntries(
        entries
          .filter(([, r]) => r.success)
          .map(([n, r]) => [n, r.success ? r.data : null]),
      ) as Record<string, InstanceBucketStats>,
    );
  }, []);

  const toggle = (inst: Instance, view: View) => {
    if (expanded?.id === inst.id && expanded.view === view) {
      setExpanded(null);
      return;
    }
    const sameInstance = expanded?.id === inst.id;
    setExpanded({ id: inst.id, view });
    if (!sameInstance) {
      setStats({});
      loadDetail(inst);
    }
  };

  const existingSessions = useMemo(() => {
    if (!current) return new Set<string>();
    return new Set(
      sessions
        .filter((s) => normalize(s.endpoint) === normalize(current.endpoint))
        .map((s) => s.bucket),
    );
  }, [sessions, current]);

  const formErrors = form
    ? {
        name: form.name.trim() ? undefined : "Required",
        endpoint:
          /^https?:\/\//.test(form.endpoint.trim()) &&
          isValidUrl(form.endpoint.trim())
            ? undefined
            : "A full http(s) URL",
        admin_token: form.editing || form.admin_token ? undefined : "Required",
      }
    : {};

  const saveForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setFormTouched(true);
    if (Object.values(formErrors).some(Boolean)) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      endpoint: normalize(form.endpoint.trim()),
      ...(form.admin_token ? { admin_token: form.admin_token } : {}),
    };
    const res = form.editing
      ? await reqAdminUpdateInstance(form.editing.id, payload)
      : await reqAdminCreateInstance({
          ...payload,
          admin_token: form.admin_token,
        });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to save instance");
      return;
    }
    toast.success(form.editing ? "Instance updated" : "Instance added");
    setForm(null);
    loadInstances();
  };

  const setActive = async (inst: Instance, active: boolean) => {
    const res = await reqAdminUpdateInstance(inst.id, { active });
    if (!res.success) {
      toast.error(res.error_message || "Update failed");
      return;
    }
    toast.success(
      active ? `${inst.name} activated` : `${inst.name} deactivated`,
    );
    loadInstances();
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await reqAdminDeleteInstance(deleting.id);
    setBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to delete instance");
      return;
    }
    toast.success(`Removed ${deleting.name}`);
    if (expanded?.id === deleting.id) setExpanded(null);
    setDeleting(null);
    loadInstances();
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
        title="Instances"
        description="openbucket-go storage servers. Manage their access keys, buckets and grants here."
        actions={
          <Button
            onClick={() => {
              setFormTouched(false);
              setForm({
                editing: null,
                name: "",
                endpoint: "",
                admin_token: "",
              });
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
            Add instance
          </Button>
        }
      />

      {instances.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-12 text-center text-sm text-muted">
          No instances yet. Add an openbucket-go server to manage its buckets.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {instances.map((inst) => {
            const open = expanded?.id === inst.id;
            return (
              <li
                key={inst.id}
                className="overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {inst.name}
                    </p>
                    <p className="truncate font-mono text-xs text-muted">
                      {endpointHost(inst.endpoint)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={inst.active ? "active" : "inactive"} />
                    {(["credentials", "buckets"] as View[]).map((v) => (
                      <Button
                        key={v}
                        size="sm"
                        variant="secondary"
                        aria-expanded={open && expanded?.view === v}
                        aria-controls={`instance-${inst.id}-detail`}
                        className={cn(
                          open &&
                            expanded?.view === v &&
                            "border-accent text-accent",
                        )}
                        onClick={() => toggle(inst, v)}
                      >
                        {v === "credentials" ? "Credentials" : "Buckets"}
                      </Button>
                    ))}
                    <Menu
                      label={`Actions for ${inst.name}`}
                      items={[
                        {
                          label: "Edit",
                          onSelect: () => {
                            setFormTouched(false);
                            setForm({
                              editing: inst,
                              name: inst.name,
                              endpoint: inst.endpoint,
                              admin_token: "",
                            });
                          },
                        },
                        inst.active
                          ? {
                              label: "Deactivate",
                              onSelect: () => setActive(inst, false),
                            }
                          : {
                              label: "Activate",
                              onSelect: () => setActive(inst, true),
                            },
                        "separator",
                        {
                          label: "Remove",
                          destructive: true,
                          onSelect: () => setDeleting(inst),
                        },
                      ]}
                    />
                  </div>
                </div>

                {open && (
                  <div
                    id={`instance-${inst.id}-detail`}
                    className="border-t border-border p-4"
                  >
                    {detailLoading ? (
                      <div className="flex justify-center py-6">
                        <Spinner />
                      </div>
                    ) : detailError ? (
                      <Alert variant="error">
                        {detailError}.{" "}
                        <button
                          type="button"
                          onClick={() => loadDetail(inst)}
                          className="font-medium underline cursor-pointer"
                        >
                          Retry
                        </button>
                      </Alert>
                    ) : expanded?.view === "credentials" ? (
                      <CredentialsPanel
                        instance={inst}
                        credentials={credentials}
                        onChanged={() => loadDetail(inst, true)}
                        onUseForSessions={(cred) => {
                          setPreset(cred);
                          setExpanded({ id: inst.id, view: "buckets" });
                          if (buckets.length === 0)
                            toast("Create a bucket, then add it as a session.");
                          else
                            setSessionTarget({
                              instance: inst,
                              buckets: buckets
                                .map((b) => b.name)
                                .filter((n) => !existingSessions.has(n)),
                            });
                        }}
                      />
                    ) : (
                      <BucketsPanel
                        instance={inst}
                        buckets={buckets}
                        stats={stats}
                        credentials={credentials}
                        existingSessions={existingSessions}
                        onChanged={() => loadDetail(inst, true)}
                        onAddSessions={(names) =>
                          setSessionTarget({ instance: inst, buckets: names })
                        }
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.editing ? `Edit ${form.editing.name}` : "Add instance"}
        description={
          form?.editing
            ? "Leave the admin token blank to keep the current one."
            : "The admin token is the openbucket-go server's OB_ADMIN_TOKEN."
        }
        widthClass="max-w-md"
      >
        {form && (
          <form
            onSubmit={saveForm}
            className="flex flex-col gap-4"
            autoComplete="off"
          >
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={formTouched ? formErrors.name : undefined}
            />
            <Input
              label="Endpoint"
              placeholder="https://cdn.example.com"
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              error={formTouched ? formErrors.endpoint : undefined}
            />
            <Input
              label={form.editing ? "New admin token" : "Admin token"}
              type="password"
              autoComplete="new-password"
              value={form.admin_token}
              onChange={(e) =>
                setForm({ ...form, admin_token: e.target.value })
              }
              error={formTouched ? formErrors.admin_token : undefined}
              data-1p-ignore
            />
            <div className="mt-1 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {form.editing ? "Save changes" : "Add instance"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Remove ${deleting?.name}?`}
        description="OpenBucket forgets this server and its admin token. The server, its buckets and their data are untouched, and existing bucket sessions keep working."
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
              Remove instance
            </Button>
          </>
        }
      />

      <AddSessionsModal
        open={!!sessionTarget}
        onClose={() => {
          setSessionTarget(null);
          setPreset(null);
        }}
        instance={sessionTarget?.instance ?? null}
        buckets={sessionTarget?.buckets ?? []}
        credentials={credentials}
        preset={preset}
        onDone={() => setPreset(null)}
      />
    </div>
  );
}
