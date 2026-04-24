"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { reqLogin, reqGetSSOConfig } from "@/services/auth.service";
import { useAuthContext } from "@/context/AuthContext";
import { SSOConfig } from "@/types";
import Spinner from "@/components/Spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ssoConfig, setSsoConfig] = useState<SSOConfig | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading } = useAuthContext();

  // Check for SSO errors in query params
  useEffect(() => {
    const ssoError = searchParams.get("error");
    if (ssoError) {
      const messages: Record<string, string> = {
        sso_denied: "SSO login was denied.",
        sso_missing_params: "SSO callback missing required parameters.",
        sso_state_expired: "SSO session expired. Please try again.",
        sso_exchange_failed: "SSO authentication failed.",
        sso_userinfo_failed: "Failed to retrieve user information from SSO.",
        sso_no_email: "SSO provider did not return an email address.",
        sso_provision_failed: "Failed to create account. Contact an administrator.",
        sso_account_disabled: "Your account has been disabled.",
      };
      setError(messages[ssoError] ?? "An SSO error occurred.");
    }
  }, [searchParams]);

  // Load SSO config
  useEffect(() => {
    const loadSSO = async () => {
      const res = await reqGetSSOConfig();
      if (res.success && res.data.enabled) {
        setSsoConfig(res.data);
      }
    };
    loadSSO();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const res = await reqLogin(email, password);
    setIsSubmitting(false);

    if (res.success) {
      // Cookies are set by the API — reload to pick up auth state
      window.location.href = "/";
    } else {
      setError(res.error_message);
    }
  };

  const handleSSOLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_OPENBUCKET_API}/auth/sso/login`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/OpemBucket-Logo-Transparent-Dark.svg"
            alt="OpenBucket"
            width={52}
            height={52}
            priority
            className="dark:invert mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sign in to OpenBucket
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {ssoConfig && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--background)] text-gray-500">
                  or
                </span>
              </div>
            </div>

            <button
              onClick={handleSSOLogin}
              className="w-full py-2 px-4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {ssoConfig.button_label || "Sign in with SSO"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
