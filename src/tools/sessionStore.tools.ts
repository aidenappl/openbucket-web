const storeSessionToken = (newToken: string) => {
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

export { storeSessionToken, getSessionTokens, removeSessionToken };
