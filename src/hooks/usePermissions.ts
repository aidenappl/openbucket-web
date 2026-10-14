// src/hooks/usePermissions.ts
"use client";

import { useSelector } from "react-redux";
import {
  selectAllSessions,
  selectSessionsInitialized,
} from "@/store/slices/sessionSlice";
import { useAuthContext } from "@/context/AuthContext";

/**
 * Whether the signed-in user may change bucket contents. openbucket-api
 * enforces this (RequireEditor on every mutating bucket route — viewers get
 * 403 "editor access required"); the UI only hides the controls so viewers
 * aren't offered actions that always fail.
 */
export function useCanWrite(): boolean {
  const { user } = useAuthContext();
  return user?.role === "admin" || user?.role === "editor";
}

export function usePermissions() {
  const sessions = useSelector(selectAllSessions);
  const isInitialized = useSelector(selectSessionsInitialized);

  if (!isInitialized) return { hasAPI: null };
  return { hasAPI: (sessions ?? []).length > 0 };
}
