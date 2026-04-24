"use client";

import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingPage() {
  const { user, isLoading, logout } = useAuthContext();
  const router = useRouter();

  // If user is no longer pending, redirect to home
  useEffect(() => {
    if (!isLoading && user && user.role !== "pending") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-amber-500 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
        Account Pending Approval
      </h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-2 max-w-md">
        Your account has been created but is awaiting admin approval.
        You&apos;ll be able to access OpenBucket once an administrator
        activates your account.
      </p>
      {user?.email && (
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
      )}
      <button
        onClick={logout}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
