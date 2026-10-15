"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import {
  setUser,
  clearUser,
  selectUser,
  selectIsLoggedIn,
  selectIsLoading,
} from "@/store/slices/authSlice";
import { reqGetSelf, reqLogout } from "@/services/auth.service";
import { finishSignOut, redirectToLogin as goToLogin } from "@/tools/sso.tools";
import { reqGetSessions } from "@/services/session.service";
import { setSessions } from "@/store/slices/sessionSlice";
import { clearPersistedViews } from "@/tools/viewCache.tools";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

const PUBLIC_PATHS = ["/login", "/unauthorized"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isLoading = useSelector(selectIsLoading);

  const redirectToLogin = () => {
    if (!PUBLIC_PATHS.includes(pathname)) {
      goToLogin();
    }
  };

  useEffect(() => {
    const init = async () => {
      // Don't attempt auth on the login page
      if (pathname === "/login") {
        dispatch(clearUser());
        return;
      }

      // Always ask the API. An SSO session lives in the HttpOnly
      // openbucket_session cookie, which JS cannot see, and SSO sign-in sets no
      // ob-logged-in marker — gating on that marker sent every freshly
      // signed-in SSO user straight back to /login.
      // Sessions are fetched alongside, not after: the explorer can't list
      // anything until it knows the session, and the two calls used to run
      // back to back (~650 ms before the first listing could start). A
      // pending user's 403 here is simply ignored.
      const [res, sessionRes] = await Promise.all([
        reqGetSelf(),
        reqGetSessions(),
      ]);
      if (res.success) {
        dispatch(setUser(res.data));

        // Redirect pending users to the pending page
        if (res.data.role === "pending") {
          if (pathname !== "/pending") {
            window.location.href = "/pending";
          }
          return;
        }

        if (sessionRes.success) {
          dispatch(setSessions(sessionRes.data));
        }
      } else {
        dispatch(clearUser());
        // Persisted listings belong to whoever was signed in.
        clearPersistedViews();
        redirectToLogin();
      }
    };

    init();
  }, [dispatch, pathname]);

  const logout = useCallback(async () => {
    const res = await reqLogout();
    dispatch(clearUser());
    clearPersistedViews();
    finishSignOut(res.success ? res.data?.redirect_url : null);
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
