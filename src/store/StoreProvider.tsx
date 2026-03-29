"use client";

import { Provider } from "react-redux";
import { makeStore, AppStore } from "./index";
import { setIsLoading, setIsLogged, setUser } from "./slices/authSlice";
import { useEffect } from "react";
import { reqFortaCheck } from "@/services/auth.service";

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

const StoreProvider = ({ children }: StoreProviderProps) => {
  const storeInstance = getStore();

  useEffect(() => {
    reqFortaCheck()
      .then((res) => {
        if (res && res.authenticated && res.user) {
          storeInstance.dispatch(setIsLogged(true));
          storeInstance.dispatch(setUser(res.user));
          storeInstance.dispatch(setIsLoading(false));
        } else {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/forta/login`;
        }
      })
      .catch(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/forta/login`;
      });
  }, [storeInstance]);

  return <Provider store={storeInstance}>{children}</Provider>;
};

export default StoreProvider;
