"use client";

import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-loading-skeleton/dist/skeleton.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import ClientOnly from "@/components/ClientOnly";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

config.autoAddCss = false;

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
