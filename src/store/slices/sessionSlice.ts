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
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.sessions.push(action.payload);
      state.currentSession = action.payload;
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.bucket !== action.payload);
      if (state.currentSession?.bucket === action.payload) {
        state.currentSession = null;
      }
    },
  },
});

export const selectCurrentSession = (state: RootState) =>
  state.session.currentSession;

export const { addSession, removeSession, setActiveSession, setSessions } = sessionSlice.actions;
export default sessionSlice.reducer;
