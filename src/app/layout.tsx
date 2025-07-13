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

config.autoAddCss = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)]">
        <Provider store={store}>
          <Navigation />
          <div className="px-10 max-w-[var(--max-page-width)] mx-auto">
            <ClientOnly>{children}</ClientOnly>
          </div>
          <Footer />
        </Provider>
      </body>
    </html>
  );
}
