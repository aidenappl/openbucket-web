import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uploadReducer from "./slices/uploadSlice";
import sessionReducer from "./slices/sessionSlice";

export const makeStore = () => {
	return configureStore({
		reducer: {
			auth: authReducer,
			upload: uploadReducer,
			session: sessionReducer,
		},
		middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
	});
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
