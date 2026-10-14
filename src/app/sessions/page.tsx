"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { Session } from "@/types";
import {
  addSession,
  removeSession,
  selectCurrentSession,
  setActiveSession,
  setSessions as setSessionsAction,
} from "@/store/slices/sessionSlice";
import {
  reqDeleteSession,
  reqGetSessions,
  reqPostSession,
  reqProbeSession,
  SessionPayload,
} from "@/services/session.service";
import { reqAdminListInstances, Instance } from "@/services/admin.service";
import { useAuthContext } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { SessionFormModal } from "@/components/SessionFormModal";
import Spinner from "@/components/Spinner";
import { endpointHost } from "@/tools/url.tools";
import { cn } from "@/lib/utils";

const normalize = (url: string) => url.replace(/\/+$/, "");

export default function SessionsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const current = useSelector(selectCurrentSession);
  const { user, isLoggedIn, isLoading: authLoading } = useAuthContext();
  const isAdmin = user?.role === "admin";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Session | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const fetchSessions = async () => {
    const res = await reqGetSessions();
    if (res.success) {
      setSessions(res.data ?? []);
      dispatch(setSessionsAction(res.data ?? []));
      setLoadError(null);
    } else {
      setLoadError(res.error_message || "Failed to load sessions");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    reqAdminListInstances().then(
      (res) => res.success && setInstances(res.data ?? []),
    );
  }, [isAdmin]);

  const instanceFor = (s: Session) =>
    instances.find((i) => normalize(i.endpoint) === normalize(s.endpoint));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [s.nickname, s.bucket, s.endpoint, s.region].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [sessions, query]);

  const probe = async (s: Session) => {
    const res = await reqProbeSession(s.id);
    if (!res.success) {
      toast.error(
        `Saved, but ${s.bucket} couldn't be listed: ${res.error_message || res.error}. Check the keys and endpoint.`,
        {
          duration: 8000,
        },
      );
    }
  };

  const handleSubmit = async (payload: SessionPayload) => {
    setSaving(true);
    // Create first, delete the old one only once the new one exists. The old
    // edit deleted first, so a rejected save destroyed the session it was editing.
    const res = await reqPostSession(payload);
    if (!res.success) {
      setSaving(false);
      toast.error(res.error_message || "Failed to save session");
      return;
    }
    if (editing) {
      const del = await reqDeleteSession(editing.id);
      if (del.success) dispatch(removeSession(editing));
      else
        toast.error(
          "Saved the new settings, but couldn't remove the old session — remove it by hand.",
        );
    }
    dispatch(addSession(res.data));
    dispatch(setActiveSession(res.data));
    setSaving(false);
    setFormOpen(false);
    toast.success(editing ? "Session updated" : "Session created");
    setEditing(null);
    fetchSessions();
    probe(res.data);
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    const res = await reqDeleteSession(removing.id);
    setRemoveBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to remove session");
      return;
    }
    toast.success(`Removed ${removing.nickname || removing.bucket}`);
    dispatch(removeSession(removing));
    setSessions((prev) => prev.filter((s) => s.id !== removing.id));
    setRemoving(null);
  };

  const open = (s: Session) => {
    dispatch(setActiveSession(s));
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!isLoggedIn) return null;

  return (
    <div className="pb-16">
      <PageHeader
        title="Bucket sessions"
        description="Saved connections to S3-compatible buckets. Pick one to browse it."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
            New session
          </Button>
        }
      />

      {loadError && (
        <Alert variant="error" className="mb-4">
          {loadError}.{" "}
          <button
            type="button"
            onClick={fetchSessions}
            className="font-medium underline cursor-pointer"
          >
            Retry
          </button>
        </Alert>
      )}

      {sessions.length > 6 && (
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Filter by name, bucket or endpoint…"
          className="mb-4 w-full sm:w-80"
        />
      )}

      {sessions.length === 0 && !loadError ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
            <FontAwesomeIcon icon={faDatabase} className="h-5 w-5 text-muted" />
          </span>
          <h2 className="text-base font-semibold text-primary">
            No bucket sessions yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-secondary">
            Connect to an S3-compatible bucket to start browsing. Each session
            stores the credentials for one bucket.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Create your first session
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-12 text-center text-sm text-muted">
          No sessions match “{query}”.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const inst = isAdmin ? instanceFor(s) : undefined;
            const active = current?.id === s.id;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border bg-surface transition-colors",
                  active
                    ? "border-accent"
                    : "border-border hover:border-border-emphasis",
                )}
              >
                <button
                  type="button"
                  onClick={() => open(s)}
                  className="flex-1 p-4 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  aria-label={`Open ${s.nickname || s.bucket} on ${endpointHost(s.endpoint)}`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-primary">
                        {s.nickname || s.bucket}
                      </h3>
                      {s.nickname && s.nickname !== s.bucket && (
                        <p className="truncate font-mono text-xs text-muted">
                          {s.bucket}
                        </p>
                      )}
                    </div>
                    {active && (
                      <span className="shrink-0 rounded-full bg-info-bg px-2 py-0.5 text-xs font-medium text-info">
                        Active
                      </span>
                    )}
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-muted">Endpoint</dt>
                      <dd className="truncate font-mono text-secondary">
                        {endpointHost(s.endpoint)}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-muted">Region</dt>
                      <dd className="text-secondary">{s.region}</dd>
                    </div>
                    {inst && (
                      <div className="flex gap-2">
                        <dt className="w-16 shrink-0 text-muted">Instance</dt>
                        <dd className="truncate text-secondary">{inst.name}</dd>
                      </div>
                    )}
                  </dl>
                </button>
                <div className="flex items-center justify-between border-t border-border px-4 py-2">
                  <span className="text-xs text-muted">
                    Created {new Date(s.inserted_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(s);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${s.nickname || s.bucket}`}
                    >
                      <FontAwesomeIcon
                        icon={faPen}
                        className="mr-1.5 h-3 w-3"
                      />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRemoving(s)}
                      aria-label={`Remove ${s.nickname || s.bucket}`}
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="mr-1.5 h-3 w-3"
                      />
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isAdmin && (
        <p className="mt-6 text-xs text-muted">
          Managing storage instances, credentials or buckets? That&apos;s in{" "}
          <Link href="/admin/instances" className="text-accent hover:underline">
            Admin → Instances
          </Link>
          .
        </p>
      )}

      <SessionFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        editing={editing}
        saving={saving}
      />
      <Modal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.nickname || removing?.bucket}?`}
        description="This deletes the saved connection and its stored keys. The bucket and its objects are not touched."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoving(null)}
              disabled={removeBusy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemove}
              loading={removeBusy}
            >
              Remove session
            </Button>
          </>
        }
      />
    </div>
  );
}
