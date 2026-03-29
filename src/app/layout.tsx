"use client";

import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-loading-skeleton/dist/skeleton.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import ClientOnly from "@/components/ClientOnly";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/store/StoreProvider";

config.autoAddCss = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
      </head>
      <body className="bg-[var(--background)]" suppressHydrationWarning={true}>
        <StoreProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <Navigation />
          <div className="px-10 max-w-[var(--max-page-width)] mx-auto">
            <ClientOnly>{children}</ClientOnly>
          </div>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
