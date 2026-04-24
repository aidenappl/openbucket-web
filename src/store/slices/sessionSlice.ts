import { SessionState, Session } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";
import {
  setCurrentSessionBucket,
  clearCurrentSessionBucket,
  getCurrentSessionBucket
} from "@/tools/sessionStore.tools";

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  isInitialized: false,
};

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<Session>) => {
      state.currentSession = action.payload;
      setCurrentSessionBucket(action.payload.endpoint, action.payload.bucket);
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload ?? [];
      state.isInitialized = true;

      // Try to restore previously selected session from localStorage
      let selectedSession = null;
      if (typeof window !== 'undefined') {
        const savedSessionKey = getCurrentSessionBucket();
        if (savedSessionKey && savedSessionKey.includes('{')) {
          const lastBraceIndex = savedSessionKey.lastIndexOf('{');
          const savedEndpoint = savedSessionKey.substring(0, lastBraceIndex);
          const savedBucket = savedSessionKey.substring(lastBraceIndex + 1, savedSessionKey.length - 1);

          selectedSession = action.payload.find(session =>
            session.endpoint === savedEndpoint && session.bucket === savedBucket
          );
        }
      }

      // Fall back to first session if no saved session or saved session not found
      state.currentSession = selectedSession || (action.payload.length > 0 ? action.payload[0] : null);

      if (typeof window !== 'undefined') {
        if (state.currentSession) {
          setCurrentSessionBucket(state.currentSession.endpoint, state.currentSession.bucket);
        } else {
          clearCurrentSessionBucket();
        }
      }
    },
    addSession: (state, action: PayloadAction<Session>) => {
      const existingIndex = state.sessions.findIndex(
        (session) => session.endpoint === action.payload.endpoint && session.bucket === action.payload.bucket
      );
      if (existingIndex !== -1) {
        state.sessions[existingIndex] = action.payload;
      } else {
        state.sessions.push(action.payload);
      }
      // Set as active session
      state.currentSession = action.payload;
      setCurrentSessionBucket(action.payload.endpoint, action.payload.bucket);
    },
    removeSession: (state, action: PayloadAction<Session>) => {
      state.sessions = state.sessions.filter(
        (session) => !(session.endpoint === action.payload.endpoint && session.bucket === action.payload.bucket)
      );
      // Clear current session if it was the removed one
      if (state.currentSession?.endpoint === action.payload.endpoint && state.currentSession?.bucket === action.payload.bucket) {
        state.currentSession = state.sessions[0] ?? null;
        if (state.currentSession) {
          setCurrentSessionBucket(state.currentSession.endpoint, state.currentSession.bucket);
        } else {
          clearCurrentSessionBucket();
        }
      }
    },
  },
});

export const selectCurrentSession = (state: RootState) =>
  state.session.currentSession;

export const selectAllSessions = (state: RootState) =>
  state.session.sessions;

export const selectSessionsInitialized = (state: RootState) =>
  state.session.isInitialized;

export const { addSession, removeSession, setActiveSession, setSessions } = sessionSlice.actions;
export default sessionSlice.reducer;
