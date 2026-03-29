import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const isLoggedIn = useAppSelector((state) => state.auth.is_logged);
    const user = useAppSelector((state) => state.auth.user);
    const isLoading = useAppSelector((state) => state.auth.is_loading);

    return { dispatch, isLoggedIn, user, isLoading };
};

export const useAuthStatus = () => {
    const isLoggedIn = useAppSelector((state) => state.auth.is_logged);
    const isLoading = useAppSelector((state) => state.auth.is_loading);

    return { isLoggedIn, isLoading };
};

export const useUser = () => {
    const user = useAppSelector((state) => state.auth.user);
    return user;
};

export const useSession = () => {
    const dispatch = useAppDispatch();
    const sessions = useAppSelector((state) => state.session.sessions);
    const currentSession = useAppSelector((state) => state.session.currentSession);

    return { dispatch, sessions, currentSession };
};

export const useCurrentSession = () => {
    const currentSession = useAppSelector((state) => state.session.currentSession);
    return currentSession;
};

export const useSessions = () => {
    const sessions = useAppSelector((state) => state.session.sessions);
    return sessions;
};