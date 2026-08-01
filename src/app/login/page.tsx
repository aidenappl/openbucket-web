"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { reqLogin, reqGetSSOConfig } from "@/services/auth.service";
import { useAuthContext } from "@/context/AuthContext";
import { SSOProviderButtons } from "@/components/sso-provider-buttons";
import { SSOConfig, SSOProvider } from "@/types";

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

  // ⚠️ The SSO login URL used to be BUILT HERE, client-side, as a hardcoded
  // "/auth/sso/login". That works only while there is exactly one provider and it
  // lives at exactly that path — it cannot express a second provider, and it
  // silently breaks if the route ever moves. The server now computes login_url per
  // provider and returns it in the config contract; the component below validates
  // it before rendering it as a link.
  const API_URL = process.env.NEXT_PUBLIC_OPENBUCKET_API ?? "";

  // Prefer the shared `providers` array; fall back to the legacy single-provider
  // fields so this page still works against an API that has not deployed the new
  // contract yet.
  //
  // ⚠️ DATED. Delete the fallback once all three APIs serve `providers` — keeping
  // it means maintaining two rendering paths forever, and only one supports icons
  // or more than one provider.
  const providers: SSOProvider[] =
    ssoConfig?.providers && ssoConfig.providers.length > 0
      ? ssoConfig.providers
      : ssoConfig?.enabled
        ? [
            {
              name: "sso",
              display_name: ssoConfig.button_label || "Sign in with SSO",
              display_icon: null,
              button_color: null,
              button_text_color: null,
              login_url: ssoConfig.login_url || "/auth/sso/login",
              sort_order: 0,
            },
          ]
        : [];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/OpenBucket-Logo.svg"
            alt="OpenBucket"
            width={40}
            height={40}
            className="w-10 h-10 shadow-md rounded-xl"
            priority
          />
          <span className="text-xl font-semibold tracking-tight dark:text-white">
            OpenBucket
          </span>
          <span className="h-4 w-px bg-border-strong" />
          <span className="text-sm text-muted">
            Appleby Cloud
          </span>
        </div>

        <div className="w-full bg-surface rounded-xl p-6 shadow-sm border border-border">
          <p className="text-sm text-muted text-center mb-5">
            Sign in to continue
          </p>

          {isLoading ? (
            <InlineLoading message="Checking session…" />
          ) : (
            <div className="flex flex-col gap-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={setPassword}
                />

                {error && <ErrorAlert message={error} />}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              {providers.length > 0 && (
                <>
                  <Divider />
                  {/* Each href is validated inside the component: login_url is
                      rendered as a clickable anchor on an unauthenticated page, so
                      javascript: and absolute URLs are refused there rather than
                      trusted from the API. */}
                  <SSOProviderButtons providers={providers} apiURL={API_URL} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-dimmed">
        © {new Date().getFullYear()} Appleby Cloud
      </footer>
    </main>
  );
}

// Sub-components

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-secondary"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="border border-border-strong bg-surface-elevated text-primary placeholder:text-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
      />
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800 rounded-lg p-3">
      <svg
        className="w-4 h-4 mt-0.5 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-dimmed uppercase tracking-wide">
        or continue with
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}


function InlineLoading({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-5 h-5 border-2 border-border-strong border-t-secondary rounded-full animate-spin" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
