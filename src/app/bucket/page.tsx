"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  getSessionTokens,
  removeSessionToken,
  storeSessionToken,
  setCurrentSessionBucket,
} from "@/tools/sessionStore.tools";
import { isValidUrl } from "@/tools/url.tools";
import { Session } from "@/types";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addSession, setActiveSession } from "@/store/slices/sessionSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { reqPostSession, reqPutSession } from "@/services/session.service";

const Bucket = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  const router = useRouter();

  const removeSession = (sessionToRemove: Session) => {
    const updatedSessions = sessions.filter(
      (s) =>
        !(
          s.endpoint === sessionToRemove.endpoint &&
          s.bucket === sessionToRemove.bucket
        )
    );
    setSessions(updatedSessions);
    removeSessionToken(sessionToRemove.token);
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

    // Remove old session
    removeSession(editingSession);

    // Create new session with updated data
    const response = await reqPostSession(editFields);

    if (response.success) {
      toast.success("Bucket updated successfully!");
      if (response.data.token) {
        // Store in localStorage
        storeSessionToken(response.data.token);

        // Create session object
        const updatedSession: Session = {
          bucket: editFields.bucket,
          nickname: editFields.nickname || editFields.bucket,
          region: editFields.region,
          endpoint: editFields.endpoint,
          token: response.data.token,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };

        // Add to Redux store
        dispatch(addSession(updatedSession));

        // If this was the active session, set the updated one as active
        dispatch(setActiveSession(updatedSession));

        // Refresh sessions list
        fetchSessions();

        // Close modal
        closeEditModal();
      }
    } else {
      toast.error(
        `Error: ${response.error_message || "Failed to update bucket"}`
      );
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
      if (response.data.token) {
        // Store in localStorage
        storeSessionToken(response.data.token);

        // Create session object
        const newSession: Session = {
          bucket: fields.bucket,
          nickname: fields.nickname || fields.bucket,
          region: fields.region,
          endpoint: fields.endpoint,
          token: response.data.token,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // Default 7 days from now
        };

        // Add to Redux store
        dispatch(addSession(newSession));

        // Set as active session and persist to localStorage
        dispatch(setActiveSession(newSession));
        setCurrentSessionBucket(fields.endpoint, fields.bucket);

        // Clear form
        setFields({});

        // Redirect to main page
        router.push("/");
      }
    } else {
      toast.error(
        `Error: ${response.error_message || "Failed to create bucket"}`
      );
    }
  };

  const fetchSessions = async () => {
    const tokens = getSessionTokens();
    const response = await reqPutSession(tokens);
    if (response.success) {
      setSessions(response.data);
    } else {
      toast.error(
        `Error fetching sessions: ${
          response.error_message || "Failed to fetch sessions"
        }`
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
      <div className="bg-white p-4 rounded-md shadow-sm gap-10 grid grid-cols-2">
        <div className="flex flex-col gap-3 w-full">
          <h1 className="text-lg font-semibold">Add Bucket</h1>
          <Input
            placeholder="Enter bucket name"
            value={fields["bucket"] || ""}
            label="Bucket Name"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                bucket: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter bucket nickname"
            value={fields["nickname"] || ""}
            label="Bucket Nickname"
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                nickname: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter region"
            value={fields["region"] || ""}
            label="Region"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                region: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter endpoint"
            value={fields["endpoint"] || ""}
            label="Endpoint"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                endpoint: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter access key ID"
            value={fields["access_key_id"] || ""}
            label="Access Key ID"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                access_key_id: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter secret access key"
            value={fields["secret_access_key"] || ""}
            label="Secret Access Key"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                secret_access_key: e.target.value,
              }));
            }}
          />
          <Button onClick={submit}>Submit</Button>
        </div>
        <div>
          {sessions.length === 0 && (
            <h1 className="text-lg font-semibold">No active sessions</h1>
          )}
          {sessions.length > 0 && (
            <h1 className="text-lg font-semibold">Active Sessions</h1>
          )}
          {sessions &&
            sessions.map((session) => (
              <div
                key={session.nickname}
                className="mt-2 p-2 px-4 bg-gray-100 rounded-md flex justify-between items-center"
              >
                <p className="break-all">{session.nickname}</p>
                <div className="flex gap-1">
                  <Button variant="light" onClick={() => editSession(session)}>
                    Edit
                  </Button>
                  <Button onClick={() => removeSession(session)}>Remove</Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingSession && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto z-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Bucket Session</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                placeholder="Enter bucket name"
                value={editFields["bucket"] || ""}
                label="Bucket Name"
                required
                onChange={(e) => {
                  setEditFields((prev) => ({
                    ...prev,
                    bucket: e.target.value,
                  }));
                }}
              />
              <Input
                placeholder="Enter bucket nickname"
                value={editFields["nickname"] || ""}
                label="Bucket Nickname"
                onChange={(e) => {
                  setEditFields((prev) => ({
                    ...prev,
                    nickname: e.target.value,
                  }));
                }}
              />
              <Input
                placeholder="Enter region"
                value={editFields["region"] || ""}
                label="Region"
                required
                onChange={(e) => {
                  setEditFields((prev) => ({
                    ...prev,
                    region: e.target.value,
                  }));
                }}
              />
              <Input
                placeholder="Enter endpoint"
                value={editFields["endpoint"] || ""}
                label="Endpoint"
                required
                onChange={(e) => {
                  setEditFields((prev) => ({
                    ...prev,
                    endpoint: e.target.value,
                  }));
                }}
              />
              <Input
                placeholder="Enter access key ID"
                value={editFields["access_key_id"] || ""}
                label="Access Key ID"
                required
                onChange={(e) => {
                  setEditFields((prev) => ({
                    ...prev,
                    access_key_id: e.target.value,
                  }));
                }}
              />
              <Input
                placeholder="Enter secret access key"
                value={editFields["secret_access_key"] || ""}
                label="Secret Access Key"
                required
                onChange={(e) => {
                  setEditFields((prev) => ({
                    ...prev,
                    secret_access_key: e.target.value,
                  }));
                }}
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
          <div
            className="fixed inset-0 bg-black opacity-20 flex items-center justify-center z-10"
            onClick={closeEditModal}
          />
        </div>
      )}
    </div>
  );
};

export default Bucket;
