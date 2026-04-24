"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
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

const Bucket = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const removeSession = async (sessionToRemove: Session) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Remove "${sessionToRemove.nickname || sessionToRemove.bucket}"? This will delete the session from the server.`
    );
    if (!confirmed) return;

    setDeletingId(sessionToRemove.id);
    const res = await reqDeleteSession(sessionToRemove.id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Session removed");
      setSessions((prev) => prev.filter((s) => s.id !== sessionToRemove.id));
      dispatch(removeSessionAction(sessionToRemove));
    } else {
      toast.error(
        res.success === false ? res.error_message : "Failed to remove session"
      );
    }
  };

  const editSession = (sessionToEdit: Session) => {
    setEditingSession(sessionToEdit);
    setEditFields({
      bucket: sessionToEdit.bucket,
      nickname: sessionToEdit.nickname,
      region: sessionToEdit.region,
      endpoint: sessionToEdit.endpoint,
      access_key_id: "",
      secret_access_key: "",
    });
  };

  const closeEditModal = () => {
    setEditingSession(null);
    setEditFields({});
  };

  const saveEditedSession = async () => {
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

    // Delete old session on server
    const delRes = await reqDeleteSession(editingSession.id);
    if (!delRes.success) {
      toast.error("Failed to remove old session");
      return;
    }
    dispatch(removeSessionAction(editingSession));

    // Create new session with updated data
    const response = await reqPostSession(editFields);

    if (response.success) {
      toast.success("Bucket updated successfully!");
      dispatch(addSession(response.data));
      dispatch(setActiveSession(response.data));
      fetchSessions();
      closeEditModal();
    } else {
      toast.error(
        `Error: ${response.success === false ? response.error_message : "Failed to update bucket"}`
      );
      // Refresh to get accurate state since we deleted the old one
      fetchSessions();
    }
  };

  const submit = async () => {
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

    const response = await reqPostSession(fields);
    if (response.success) {
      toast.success("Bucket created successfully!");
      dispatch(addSession(response.data));
      dispatch(setActiveSession(response.data));
      setCurrentSessionBucket(response.data.endpoint, response.data.bucket);
      setFields({});
      router.push("/");
    } else {
      toast.error(
        `Error: ${response.success === false ? response.error_message : "Failed to create bucket"}`
      );
    }
  };

  const fetchSessions = async () => {
    const response = await reqGetSessions();
    if (response.success) {
      setSessions(response.data ?? []);
    } else {
      toast.error(
        `Error fetching sessions: ${response.success === false ? response.error_message : "Failed to fetch sessions"}`
      );
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && editingSession) {
        closeEditModal();
      }
    };

    if (editingSession) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [editingSession]);

  return (
    <div className="pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-[#161616] p-4 rounded-md shadow-sm border border-transparent dark:border-gray-800">
        {/* Add Bucket Form */}
        <div className="flex flex-col gap-3 w-full">
          <h1 className="text-lg font-semibold dark:text-gray-100">
            Add Bucket
          </h1>
          <Input
            placeholder="Enter bucket name"
            value={fields["bucket"] || ""}
            label="Bucket Name"
            required
            onChange={(e) =>
              setFields((prev) => ({ ...prev, bucket: e.target.value }))
            }
          />
          <Input
            placeholder="Enter bucket nickname"
            value={fields["nickname"] || ""}
            label="Bucket Nickname"
            onChange={(e) =>
              setFields((prev) => ({ ...prev, nickname: e.target.value }))
            }
          />
          <Input
            placeholder="Enter region"
            value={fields["region"] || ""}
            label="Region"
            required
            onChange={(e) =>
              setFields((prev) => ({ ...prev, region: e.target.value }))
            }
          />
          <Input
            placeholder="Enter endpoint"
            value={fields["endpoint"] || ""}
            label="Endpoint"
            required
            onChange={(e) =>
              setFields((prev) => ({ ...prev, endpoint: e.target.value }))
            }
          />
          <Input
            placeholder="Enter access key ID"
            value={fields["access_key_id"] || ""}
            label="Access Key ID"
            required
            onChange={(e) =>
              setFields((prev) => ({
                ...prev,
                access_key_id: e.target.value,
              }))
            }
          />
          <Input
            placeholder="Enter secret access key"
            value={fields["secret_access_key"] || ""}
            label="Secret Access Key"
            type="password"
            required
            onChange={(e) =>
              setFields((prev) => ({
                ...prev,
                secret_access_key: e.target.value,
              }))
            }
          />
          <Button onClick={submit}>Submit</Button>
        </div>

        {/* Sessions List */}
        <div>
          <h1 className="text-lg font-semibold dark:text-gray-100 mb-3">
            {sessions.length === 0 ? "No Bucket Sessions" : "Bucket Sessions"}
          </h1>

          {sessions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect your first bucket using the form to get started. Each
              session links to an S3-compatible bucket with its own credentials.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm dark:text-gray-100 truncate">
                      {session.nickname || session.bucket}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {session.endpoint}
                    </p>
                    {session.nickname && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {session.bucket} &middot; {session.region}
                      </p>
                    )}
                    {!session.nickname && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {session.region}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="light"
                      onClick={() => editSession(session)}
                    >
                      Edit
                    </Button>
                    <Button
                      hoverVariant="danger"
                      onClick={() => removeSession(session)}
                      active={deletingId !== session.id}
                    >
                      {deletingId === session.id ? "..." : "Remove"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSession && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeEditModal}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-[#161616] rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-gray-100">
                  Edit Bucket Session
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <Input
                  placeholder="Enter bucket name"
                  value={editFields["bucket"] || ""}
                  label="Bucket Name"
                  required
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      bucket: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Enter bucket nickname"
                  value={editFields["nickname"] || ""}
                  label="Bucket Nickname"
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Enter region"
                  value={editFields["region"] || ""}
                  label="Region"
                  required
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      region: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Enter endpoint"
                  value={editFields["endpoint"] || ""}
                  label="Endpoint"
                  required
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      endpoint: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Enter access key ID"
                  value={editFields["access_key_id"] || ""}
                  label="Access Key ID"
                  required
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      access_key_id: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Enter secret access key"
                  value={editFields["secret_access_key"] || ""}
                  label="Secret Access Key"
                  type="password"
                  required
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      secret_access_key: e.target.value,
                    }))
                  }
                />

                <div className="flex gap-2 mt-4">
                  <Button onClick={saveEditedSession} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    onClick={closeEditModal}
                    variant="light"
                    className="flex-1"
                  >
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
};

export default Bucket;
