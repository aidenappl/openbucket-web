import { configureStore } from "@reduxjs/toolkit";
import uploadReducer from "./slices/uploadSlice";
import sessionReducer from "./slices/sessionSlice";

export const store = configureStore({
  reducer: {
    upload: uploadReducer,
    session: sessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
