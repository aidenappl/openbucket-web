const storeSessionToken = (newToken: string) => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return;

  const existing = localStorage.getItem("openbucket-sessions");

  let sessions: string[] = [];
  if (existing) {
    try {
      sessions = JSON.parse(existing).sessions || [];
    } catch (e) {
      console.warn("Could not parse sessions from localStorage:", e);
    }
  }

  if (!sessions.includes(newToken)) {
    sessions.push(newToken);
  }

  localStorage.setItem("openbucket-sessions", JSON.stringify({ sessions }));
};

const removeSessionToken = (tokenToRemove: string) => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return;

  const existing = localStorage.getItem("openbucket-sessions");
  if (existing) {
    try {
      let sessions = JSON.parse(existing).sessions || [];
      sessions = sessions.filter((token: string) => token !== tokenToRemove);
      localStorage.setItem("openbucket-sessions", JSON.stringify({ sessions }));
    } catch (e) {
      console.warn("Could not parse sessions from localStorage:", e);
    }
  }
}

const getSessionTokens = (): string[] => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return [];

  const existing = localStorage.getItem("openbucket-sessions");
  if (existing) {
    try {
      const sessions = JSON.parse(existing).sessions || [];
      return Array.isArray(sessions) ? sessions : [];
    } catch (e) {
      console.warn("Could not parse sessions from localStorage:", e);
      return [];
    }
  }
  return [];
};

const CURRENT_SESSION_KEY = "openbucket-current-session";

const getCurrentSessionBucket = (): string | null => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(CURRENT_SESSION_KEY);
};

const setCurrentSessionBucket = (endpoint: string, bucket: string): void => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return;

  const sessionKey = `${endpoint}{${bucket}}`;
  localStorage.setItem(CURRENT_SESSION_KEY, sessionKey);
};

const clearCurrentSessionBucket = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_SESSION_KEY);
};

const getSessionKey = (endpoint: string, bucket: string): string => {
  return `${endpoint}{${bucket}}`;
};

const setCurrentSession = (session: { endpoint: string; bucket: string }): void => {
  setCurrentSessionBucket(session.endpoint, session.bucket);
};

const parseSessionKey = (sessionKey: string): { endpoint: string; bucket: string } | null => {
  if (!sessionKey) return null;

  // Check if it's the new format with endpoint{bucket}
  if (sessionKey.includes('{') && sessionKey.endsWith('}')) {
    const lastBraceIndex = sessionKey.lastIndexOf('{');
    if (lastBraceIndex === -1) return null;

    const endpoint = sessionKey.substring(0, lastBraceIndex);
    const bucket = sessionKey.substring(lastBraceIndex + 1, sessionKey.length - 1);

    return { endpoint, bucket };
  }

  // Legacy format - just bucket name, clear it and return null
  console.warn('Found legacy session format, clearing:', sessionKey);
  clearCurrentSessionBucket();
  return null;
};

export { storeSessionToken, getSessionTokens, removeSessionToken, getCurrentSessionBucket, setCurrentSessionBucket, clearCurrentSessionBucket, getSessionKey, setCurrentSession, parseSessionKey };
