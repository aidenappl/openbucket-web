"use client";

import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-loading-skeleton/dist/skeleton.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Provider } from "react-redux";
import { store } from "@/store/store";
config.autoAddCss = false;

// export const metadata: Metadata = {
//   title: "OpenBucket",
//   icons: {
//     icon: [
//       { rel: "icon", url: "/favicon.ico" },
//       { rel: "shortcut icon", url: "/favicon.ico" },
//     ],
//     apple: [{ url: "/apple-touch-icon.png" }],
//   },
//   description:
//     "OpenBucket is a free and open-source tool to add a gui to any S3 bucket. It allows you to easily manage your S3 buckets, upload and download files, and perform other common tasks without needing to use the AWS CLI or SDK.",
//   keywords: ["Aiden Appleby"],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-[var(--background)]"
        data-new-gr-c-s-check-loaded="14.1239.0"
        data-gr-ext-installed=""
      >
        <Provider store={store}>
          <Navigation />
          <div className="px-10 max-w-[var(--max-page-width)] mx-auto">
            {children}
          </div>
          <Footer />
        </Provider>
      </body>
    </html>
  );
}
