"use client";

import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-loading-skeleton/dist/skeleton.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/store/store";
import ClientOnly from "@/components/ClientOnly";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  getCurrentSessionBucket,
  getSessionTokens,
  parseSessionKey,
} from "@/tools/sessionStore.tools";
import { setSessions, setActiveSession } from "@/store/slices/sessionSlice";
import { reqFetchSession } from "@/services/session.service";
import { Session } from "@/types";

config.autoAddCss = false;

// Module-level flag to ensure initialization only happens once
let hasInitializedSessions = false;

function SessionInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (hasInitializedSessions) return;
    hasInitializedSessions = true;

    const initializeSessions = async () => {
      try {
        const tokens = getSessionTokens();
        if (tokens.length > 0) {
          const response = await reqFetchSession(tokens);

          if (response.success) {
            dispatch(setSessions(response.data));

            const savedSessionKey = getCurrentSessionBucket();
            if (savedSessionKey) {
              const parsed = parseSessionKey(savedSessionKey);
              if (parsed) {
                const savedSession = response.data.find(
                  (session: Session) =>
                    session.endpoint === parsed.endpoint &&
                    session.bucket === parsed.bucket
                );
                if (savedSession) {
                  dispatch(setActiveSession(savedSession));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize sessions:", error);
      }
    };

    initializeSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>OpenBucket - Appleby Cloud</title>
      </head>
      <body className="bg-[var(--background)]" suppressHydrationWarning={true}>
        <Provider store={store}>
          {mounted && (
            <>
              <SessionInitializer />
              <Toaster position="top-center" reverseOrder={false} />
              <Navigation />
              <div className="px-10 max-w-[var(--max-page-width)] mx-auto">
                <ClientOnly>{children}</ClientOnly>
              </div>
              <Footer />
            </>
          )}
        </Provider>
      </body>
    </html>
  );
}
