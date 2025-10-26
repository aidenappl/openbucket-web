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

const getCurrentSessionBucket = (): string | null => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return null;

  return localStorage.getItem("openbucket-current-session");
};

const setCurrentSessionBucket = (bucket: string) => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return;

  localStorage.setItem("openbucket-current-session", bucket);
};

const clearCurrentSessionBucket = () => {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return;

  localStorage.removeItem("openbucket-current-session");
};

export { storeSessionToken, getSessionTokens, removeSessionToken, getCurrentSessionBucket, setCurrentSessionBucket, clearCurrentSessionBucket };
