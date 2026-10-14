"use client";

import "./globals.css";
import Navigation from "@/components/Navigation";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-loading-skeleton/dist/skeleton.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import ClientOnly from "@/components/ClientOnly";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/store/StoreProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

config.autoAddCss = false;

// Routes that render their own full-screen shell and <main> (no nav chrome).
const BARE_ROUTES = ["/login"];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>OpenBucket - Appleby Cloud</title>
        <meta name="application-name" content="OpenBucket" />
        <meta name="apple-mobile-web-app-title" content="OpenBucket" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('ob-theme')||'system';if(m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="bg-background text-primary flex flex-col min-h-screen"
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <StoreProvider>
            <AuthProvider>
              {/* Styled through the token layer so toasts follow light/dark like
                  everything else; the library default is a white card. */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "var(--surface-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-strong)",
                    fontSize: "0.875rem",
                    maxWidth: "28rem",
                  },
                }}
              />
              {!isBare && (
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-white"
                >
                  Skip to content
                </a>
              )}
              {!isBare && <Navigation />}
              {isBare ? (
                <div className="flex-1">
                  <ClientOnly>{children}</ClientOnly>
                </div>
              ) : (
                <main
                  id="main"
                  tabIndex={-1}
                  className="mx-auto w-full max-w-[var(--max-page-width)] flex-1 px-4 pt-6 focus:outline-none sm:px-6 lg:px-10"
                >
                  <ClientOnly>{children}</ClientOnly>
                </main>
              )}
            </AuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
