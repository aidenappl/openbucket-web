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

export { getCurrentSessionBucket, setCurrentSessionBucket, clearCurrentSessionBucket, getSessionKey, setCurrentSession, parseSessionKey };
