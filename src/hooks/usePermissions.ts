// src/hooks/usePermissions.ts
"use client";

import { useSelector } from "react-redux";
import { selectAllSessions, selectSessionsInitialized } from "@/store/slices/sessionSlice";

export function usePermissions() {
  const sessions = useSelector(selectAllSessions);
  const isInitialized = useSelector(selectSessionsInitialized);

  if (!isInitialized) return { hasAPI: null };
  return { hasAPI: (sessions ?? []).length > 0 };
}
