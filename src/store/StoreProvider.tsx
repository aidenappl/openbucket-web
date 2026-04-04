"use client";

import { Provider } from "react-redux";
import { makeStore, AppStore } from "./index";
import { setIsLoading, setIsLogged, setUser } from "./slices/authSlice";
import { setSessions, setActiveSession } from "./slices/sessionSlice";
import { useEffect, useState } from "react";
import { reqGetSelf } from "@/services/auth.service";
import { reqGetSessions } from "@/services/session.service";
import {
  getCurrentSessionBucket,
  parseSessionKey,
} from "@/tools/sessionStore.tools";
import { Session } from "@/types";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";

interface StoreProviderProps {
  children: React.ReactNode;
}

let store: AppStore | null = null;

export const getStore = () => {
  if (!store) {
    store = makeStore();
  }
  return store;
};

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const storeInstance = getStore();

  useEffect(() => {
    const initialize = async () => {
      // Auth check
      try {
        const authRes = await reqGetSelf();
        if (authRes.success) {
          storeInstance.dispatch(setIsLogged(true));
          storeInstance.dispatch(setUser(authRes.data));
          storeInstance.dispatch(setIsLoading(false));
        } else {
          window.location.href = `${process.env.NEXT_PUBLIC_OPENBUCKET_API}/forta/login`;
          return;
        }
      } catch {
        window.location.href = `${process.env.NEXT_PUBLIC_OPENBUCKET_API}/forta/login`;
        return;
      }

      // Session init
      try {
        const sessionRes = await reqGetSessions();
        if (sessionRes.success) {
          storeInstance.dispatch(setSessions(sessionRes.data));

          const savedKey = getCurrentSessionBucket();
          if (savedKey) {
            const parsed = parseSessionKey(savedKey);
            if (parsed) {
              const savedSession = sessionRes.data.find(
                (s: Session) =>
                  s.endpoint === parsed.endpoint && s.bucket === parsed.bucket,
              );
              if (savedSession) {
                storeInstance.dispatch(setActiveSession(savedSession));
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize sessions:", error);
      }

      setIsReady(true);
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] gap-6">
        <div className="flex items-center gap-1.5">
          <Image
            src="/OpemBucket-Logo-Transparent-Dark.svg"
            alt="OpenBucket"
            width={52}
            height={52}
            priority
            className="dark:invert"
          />
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            OpenBucket
          </span>
        </div>
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="text-slate-400 text-2xl animate-spin"
        />
      </div>
    );
  }

  return <>{children}</>;
}

const StoreProvider = ({ children }: StoreProviderProps) => {
  const storeInstance = getStore();

  return (
    <Provider store={storeInstance}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
};

export default StoreProvider;
