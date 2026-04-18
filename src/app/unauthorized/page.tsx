"use client";

import Image from "next/image";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--background)]">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 max-w-md w-full text-center">
        {/* Logos */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image
            src="/OpemBucket-Logo-Transparent-Dark.svg"
            alt="OpenBucket"
            width={40}
            height={40}
            className="dark:invert"
          />
          <span className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Forta
          </span>
        </div>

        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 dark:text-gray-500"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Unauthorized
        </h1>

        {/* Reason */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          You don&apos;t have access to OpenBucket. Your grant may have been
          revoked or you haven&apos;t been granted access yet.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <a
            href="https://forta.appleby.cloud"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Go to Forta Dashboard
          </a>
          <a
            href="https://forta.appleby.cloud"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            Sign in with a different account
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          If you believe this is a mistake, contact your administrator.
        </p>
      </div>
    </div>
  );
}
