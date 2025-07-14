// src/hooks/usePermissions.ts
"use client";

import { useEffect, useState } from "react";

export function usePermissions() {
  const [hasAPI, setHasAPI] = useState<boolean | null>(null);

  useEffect(() => {
    // get sessions from local storage
    const sessions = localStorage.getItem("openbucket-sessions");
    if (sessions) {
      const parsedSessions = JSON.parse(sessions);
      if (Array.isArray(parsedSessions.sessions) && parsedSessions.sessions.length > 0) {
        setHasAPI(true);
        return;
      }
    }
    setHasAPI(false);
  }, []);

  return { hasAPI };
}
