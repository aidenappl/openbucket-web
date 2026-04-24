"use client";

import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Image
        src="/OpemBucket-Logo-Transparent-Dark.svg"
        alt="OpenBucket"
        width={52}
        height={52}
        className="dark:invert mb-4"
      />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
        Access Denied
      </h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-6 max-w-sm">
        Your account does not have permission to access this resource. Contact
        an administrator if you believe this is an error.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Go back home
      </Link>
    </div>
  );
}
