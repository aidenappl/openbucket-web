"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import Spinner from "@/components/Spinner";
import { setCurrentSessionBucket } from "@/tools/sessionStore.tools";
import { isValidUrl } from "@/tools/url.tools";
import { Session } from "@/types";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  addSession,
  removeSession as removeSessionAction,
  setActiveSession,
} from "@/store/slices/sessionSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  reqPostSession,
  reqGetSessions,
  reqDeleteSession,
} from "@/services/session.service";
import { useAuthContext } from "@/context/AuthContext";
import { reqAdminListInstances, Instance } from "@/services/admin.service";
import Link from "next/link";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const [fields, setFields] = useState({
    bucket: "",
    nickname: "",
    region: "",
    endpoint: "",
    access_key_id: "",
    secret_access_key: "",
  });
  const [editFields, setEditFields] = useState({
    bucket: "",
    nickname: "",
    region: "",
    endpoint: "",
    access_key_id: "",
    secret_access_key: "",
  });

  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuthContext();
  const isAdmin = user?.role === "admin";

  const fetchSessions = async () => {
    const res = await reqGetSessions();
    if (res.success) {
      setSessions(res.data ?? []);
    } else {
      toast.error("Failed to load sessions");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Load instances for admin users to show association
  useEffect(() => {
    if (isAdmin) {
      reqAdminListInstances().then((res) => {
        if (res.success) setInstances(res.data ?? []);
      });
    }
  }, [isAdmin]);

  const getInstanceForSession = (session: Session): Instance | undefined => {
    if (!isAdmin || instances.length === 0) return undefined;
    // Match by normalizing endpoints (strip trailing slash)
    const normalize = (url: string) => url.replace(/\/+$/, "");
    return instances.find(
      (inst) => normalize(inst.endpoint) === normalize(session.endpoint)
    );
  };

  const clearFields = () =>
    setFields({
      bucket: "",
      nickname: "",
      region: "",
      endpoint: "",
      access_key_id: "",
      secret_access_key: "",
    });

  const handleCreate = async () => {
    if (
      !fields.bucket ||
      !fields.region ||
      !fields.endpoint ||
      !fields.access_key_id ||
      !fields.secret_access_key
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!isValidUrl(fields.endpoint)) {
      toast.error("Please enter a valid endpoint URL.");
      return;
    }

    const res = await reqPostSession(fields);
    if (res.success) {
      toast.success("Session created");
      dispatch(addSession(res.data));
      dispatch(setActiveSession(res.data));
      setCurrentSessionBucket(res.data.endpoint, res.data.bucket);
      clearFields();
      setShowCreate(false);
      fetchSessions();
    } else {
      toast.error(
        res.success === false
          ? res.error_message
          : "Failed to create session"
      );
    }
  };

  const handleDelete = async (session: Session) => {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Remove "${session.nickname || session.bucket}"? This will permanently delete this session.`
    );
    if (!confirmed) return;

    setDeletingId(session.id);
    const res = await reqDeleteSession(session.id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Session removed");
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      dispatch(removeSessionAction(session));
    } else {
      toast.error(
        res.success === false ? res.error_message : "Failed to remove session"
      );
    }
  };

  const handleSelect = (session: Session) => {
    dispatch(setActiveSession(session));
    setCurrentSessionBucket(session.endpoint, session.bucket);
    router.push("/");
  };

  const openEdit = (session: Session) => {
    setEditingSession(session);
    setEditFields({
      bucket: session.bucket,
      nickname: session.nickname,
      region: session.region,
      endpoint: session.endpoint,
      access_key_id: "",
      secret_access_key: "",
    });
  };

  const closeEdit = () => {
    setEditingSession(null);
    setEditFields({
      bucket: "",
      nickname: "",
      region: "",
      endpoint: "",
      access_key_id: "",
      secret_access_key: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;
    if (
      !editFields.bucket ||
      !editFields.region ||
      !editFields.endpoint ||
      !editFields.nickname ||
      !editFields.access_key_id ||
      !editFields.secret_access_key
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!isValidUrl(editFields.endpoint)) {
      toast.error("Please enter a valid endpoint URL.");
      return;
    }

    // Delete old, create new
    const delRes = await reqDeleteSession(editingSession.id);
    if (!delRes.success) {
      toast.error("Failed to remove old session");
      return;
    }
    dispatch(removeSessionAction(editingSession));

    const res = await reqPostSession(editFields);
    if (res.success) {
      toast.success("Session updated");
      dispatch(addSession(res.data));
      dispatch(setActiveSession(res.data));
      fetchSessions();
      closeEdit();
    } else {
      toast.error(
        res.success === false
          ? res.error_message
          : "Failed to update session"
      );
      fetchSessions();
    }
  };

  // Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingSession) closeEdit();
        if (showCreate) setShowCreate(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editingSession, showCreate]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!isLoggedIn) return null;

  return (
    <div className="mt-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
            Bucket Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Manage your S3-compatible bucket connections
          </p>
        </div>
        <Button variant="dark" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "New Session"}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 p-5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-4 tracking-wider">
            New Connection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bucket Name"
              placeholder="my-bucket"
              value={fields.bucket}
              onChange={(e) =>
                setFields({ ...fields, bucket: e.target.value })
              }
              required
            />
            <Input
              label="Nickname"
              placeholder="Production Media"
              value={fields.nickname}
              onChange={(e) =>
                setFields({ ...fields, nickname: e.target.value })
              }
            />
            <Input
              label="Endpoint"
              placeholder="https://s3.example.com"
              value={fields.endpoint}
              onChange={(e) =>
                setFields({ ...fields, endpoint: e.target.value })
              }
              required
            />
            <Input
              label="Region"
              placeholder="us-east-1"
              value={fields.region}
              onChange={(e) =>
                setFields({ ...fields, region: e.target.value })
              }
              required
            />
            <Input
              label="Access Key ID"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={fields.access_key_id}
              onChange={(e) =>
                setFields({ ...fields, access_key_id: e.target.value })
              }
              required
            />
            <Input
              label="Secret Access Key"
              placeholder="Secret key"
              type="password"
              value={fields.secret_access_key}
              onChange={(e) =>
                setFields({ ...fields, secret_access_key: e.target.value })
              }
              required
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="dark" onClick={handleCreate}>
              Create Session
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setShowCreate(false);
                clearFields();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && !showCreate && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
            No bucket sessions
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Connect to an S3-compatible bucket to start managing your files.
            Each session stores credentials for a specific bucket.
          </p>
          <Button variant="dark" onClick={() => setShowCreate(true)}>
            Create Your First Session
          </Button>
        </div>
      )}

      {/* Sessions Grid */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const instance = getInstanceForSession(session);
            return (
              <div
                key={session.id}
                className="group rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
                        {session.nickname || session.bucket}
                      </h3>
                      {session.nickname && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5 font-mono">
                          {session.bucket}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelect(session)}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                    >
                      Open
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 dark:text-zinc-500 w-16 shrink-0">
                        Endpoint
                      </span>
                      <span className="text-gray-700 dark:text-zinc-300 truncate font-mono">
                        {session.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 dark:text-zinc-500 w-16 shrink-0">
                        Region
                      </span>
                      <span className="text-gray-700 dark:text-zinc-300">
                        {session.region}
                      </span>
                    </div>
                    {isAdmin && instance && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-zinc-500 w-16 shrink-0">
                          Instance
                        </span>
                        <Link
                          href="/admin/instances"
                          className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                          {instance.name}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    Created{" "}
                    {new Date(session.inserted_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(session)}
                      className="text-xs px-2 py-1 rounded text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session)}
                      disabled={deletingId === session.id}
                      className="text-xs px-2 py-1 rounded text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === session.id ? "..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeEdit}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-5 pb-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                  Edit Session
                </h2>
                <button
                  onClick={closeEdit}
                  className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Bucket Name"
                    placeholder="my-bucket"
                    value={editFields.bucket}
                    onChange={(e) =>
                      setEditFields({ ...editFields, bucket: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Nickname"
                    placeholder="Production Media"
                    value={editFields.nickname}
                    onChange={(e) =>
                      setEditFields({
                        ...editFields,
                        nickname: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Endpoint"
                    placeholder="https://s3.example.com"
                    value={editFields.endpoint}
                    onChange={(e) =>
                      setEditFields({
                        ...editFields,
                        endpoint: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    label="Region"
                    placeholder="us-east-1"
                    value={editFields.region}
                    onChange={(e) =>
                      setEditFields({ ...editFields, region: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Access Key ID"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={editFields.access_key_id}
                    onChange={(e) =>
                      setEditFields({
                        ...editFields,
                        access_key_id: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    label="Secret Access Key"
                    placeholder="Secret key"
                    type="password"
                    value={editFields.secret_access_key}
                    onChange={(e) =>
                      setEditFields({
                        ...editFields,
                        secret_access_key: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="dark" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <Button variant="light" onClick={closeEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
