"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { setUser, clearUser, selectUser, selectIsLoggedIn, selectIsLoading } from "@/store/slices/authSlice";
import { reqGetSelf, reqLogout } from "@/services/auth.service";
import { reqGetSessions } from "@/services/session.service";
import { setSessions } from "@/store/slices/sessionSlice";
import { User } from "@/types";
import Cookies from "js-cookie";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isLoading = useSelector(selectIsLoading);

  useEffect(() => {
    const init = async () => {
      // Don't attempt auth on the login page
      if (pathname === "/login") {
        dispatch(clearUser());
        return;
      }

      // Check if ob-logged-in cookie exists before making a request
      const loggedIn = Cookies.get("ob-logged-in");
      if (!loggedIn) {
        dispatch(clearUser());
        return;
      }

      const res = await reqGetSelf();
      if (res.success) {
        dispatch(setUser(res.data));

        // Redirect pending users to the pending page
        if (res.data.role === "pending") {
          if (pathname !== "/pending") {
            window.location.href = "/pending";
          }
          return;
        }

        // Load sessions after auth
        const sessionRes = await reqGetSessions();
        if (sessionRes.success) {
          dispatch(setSessions(sessionRes.data));
        }
      } else {
        dispatch(clearUser());
      }
    };

    init();
  }, [dispatch, pathname]);

  const logout = useCallback(async () => {
    await reqLogout();
    dispatch(clearUser());
    window.location.href = "/login";
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
