import { SessionState, Session } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
};

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<Session | null>) => {
      state.currentSession = action.payload;

      // Persist current session bucket to localStorage
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem("openbucket-current-session", action.payload.bucket);
        } else {
          localStorage.removeItem("openbucket-current-session");
        }
      }
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;

      // Try to restore previously selected session from localStorage
      let selectedSession = null;
      if (typeof window !== 'undefined') {
        const savedSessionBucket = localStorage.getItem("openbucket-current-session");
        if (savedSessionBucket) {
          selectedSession = action.payload.find(session => session.bucket === savedSessionBucket);
        }
      }

      // Fall back to first session if no saved session or saved session not found
      state.currentSession = selectedSession || (action.payload.length > 0 ? action.payload[0] : null);

      // Only access localStorage on client side
      if (typeof window !== 'undefined') {
        const tokens = action.payload.map((session) => session.token);
        localStorage.setItem("openbucket-sessions", JSON.stringify({ "sessions": tokens }));

        // Update current session in localStorage to match what we actually set
        if (state.currentSession) {
          localStorage.setItem("openbucket-current-session", state.currentSession.bucket);
        } else {
          localStorage.removeItem("openbucket-current-session");
        }
      }
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.sessions.push(action.payload);
      state.currentSession = action.payload;

      // Persist the new current session
      if (typeof window !== 'undefined') {
        localStorage.setItem("openbucket-current-session", action.payload.bucket);
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.bucket !== action.payload);

      if (state.currentSession?.bucket === action.payload) {
        state.currentSession = state.sessions.length > 0 ? state.sessions[0] : null;

        // Update localStorage
        if (typeof window !== 'undefined') {
          if (state.currentSession) {
            localStorage.setItem("openbucket-current-session", state.currentSession.bucket);
          } else {
            localStorage.removeItem("openbucket-current-session");
          }
        }
      }
    }
  },
});

export const selectCurrentSession = (state: RootState) =>
  state.session.currentSession;

export const { addSession, removeSession, setActiveSession, setSessions } = sessionSlice.actions;
export default sessionSlice.reducer;
