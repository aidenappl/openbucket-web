"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { fetchApi } from "@/tools/axios.tools";
import {
  getSessionTokens,
  storeSessionToken,
} from "@/tools/sessionStore.tools";
import { isValidUrl } from "@/tools/url.tools";
import { Session } from "@/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type SessionResponse = {
  token: string;
};

const Bucket = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<Session[]>([]);

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

    const response = await fetchApi<SessionResponse>({
      url: "/session",
      method: "POST",
      data: fields,
    });

    if (response.success) {
      toast.success("Bucket created successfully!");
      if (response.data.token) {
        storeSessionToken(response.data.token);
      }
    } else {
      toast.error(
        `Error: ${response.error_message || "Failed to create bucket"}`
      );
    }
  };

  const fetchSessions = async () => {
    const tokens = getSessionTokens();
    const response = await fetchApi<Session[]>({
      url: "/sessions",
      method: "PUT",
      data: { sessions: tokens },
    });
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
                key={session.bucket}
                className="mt-2 p-2 bg-gray-100 rounded-md flex justify-between items-center"
              >
                <p className="break-all">{session.bucket}</p>
                <Button
                  onClick={() => {
                    setSessions((prev) => prev.filter((t) => t !== session));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Bucket;
