"use client";

import { useEffect, useState } from "react";
import {
  reqAdminGetSSOConfig,
  reqAdminUpdateSSOConfig,
} from "@/services/admin.service";
import { AdminSSOConfig, UpdateSSOConfigPayload } from "@/types";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";

export default function SSOPage() {
  const [config, setConfig] = useState<AdminSSOConfig | null>(null);
  const [form, setForm] = useState<UpdateSSOConfigPayload>({});
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    const res = await reqAdminGetSSOConfig();
    if (res.success) {
      setConfig(res.data);
      setForm({
        enabled: res.data.enabled,
        client_id: res.data.client_id,
        authorize_url: res.data.authorize_url,
        token_url: res.data.token_url,
        userinfo_url: res.data.userinfo_url,
        redirect_url: res.data.redirect_url,
        logout_url: res.data.logout_url,
        scopes: res.data.scopes,
        user_identifier: res.data.user_identifier,
        button_label: res.data.button_label,
        auto_provision: res.data.auto_provision,
        post_login_url: res.data.post_login_url,
      });
      setSecret("");
    } else {
      toast.error("Failed to load SSO configuration");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: UpdateSSOConfigPayload = { ...form };
    if (secret) {
      payload.client_secret = secret;
    }
    const res = await reqAdminUpdateSSOConfig(payload);
    setSaving(false);
    if (res.success) {
      toast.success("SSO configuration saved");
      loadConfig();
    } else {
      toast.error(res.success === false ? res.error_message : "Failed to save");
    }
  };

  const update = (field: keyof UpdateSSOConfigPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
          SSO Configuration
        </h1>
        <Button variant="dark" onClick={handleSave} active={!saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* General */}
        <section className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <h2 className="text-sm font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-4 tracking-wider">
            General
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              SSO Status
            </span>
            <button
              onClick={() => update("enabled", !form.enabled)}
              className={`text-xs px-3 py-1 rounded-full cursor-pointer font-medium transition-colors ${
                form.enabled
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              {form.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <Input
            label="Button Label"
            placeholder="Sign in with SSO"
            value={form.button_label ?? ""}
            onChange={(e) => update("button_label", e.target.value)}
          />
        </section>

        {/* OAuth Provider URLs */}
        <section className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <h2 className="text-sm font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-4 tracking-wider">
            OAuth Provider
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Authorize URL"
              placeholder="https://provider.com/authorize"
              value={form.authorize_url ?? ""}
              onChange={(e) => update("authorize_url", e.target.value)}
            />
            <Input
              label="Token URL"
              placeholder="https://provider.com/token"
              value={form.token_url ?? ""}
              onChange={(e) => update("token_url", e.target.value)}
            />
            <Input
              label="User Info URL"
              placeholder="https://provider.com/userinfo"
              value={form.userinfo_url ?? ""}
              onChange={(e) => update("userinfo_url", e.target.value)}
            />
            <Input
              label="Redirect URL"
              placeholder="https://your-app.com/auth/sso/callback"
              value={form.redirect_url ?? ""}
              onChange={(e) => update("redirect_url", e.target.value)}
            />
            <Input
              label="Logout URL"
              placeholder="https://provider.com/logout"
              value={form.logout_url ?? ""}
              onChange={(e) => update("logout_url", e.target.value)}
            />
            <Input
              label="Post-Login Redirect"
              placeholder="/"
              value={form.post_login_url ?? ""}
              onChange={(e) => update("post_login_url", e.target.value)}
            />
          </div>
        </section>

        {/* Client Credentials */}
        <section className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <h2 className="text-sm font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-4 tracking-wider">
            Client Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client ID"
              placeholder="your-client-id"
              value={form.client_id ?? ""}
              onChange={(e) => update("client_id", e.target.value)}
            />
            <div>
              <Input
                label="Client Secret"
                type="password"
                placeholder={config?.has_secret ? "********" : "Enter client secret"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              {config?.has_secret && (
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                  Leave blank to keep existing secret
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Behavior */}
        <section className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <h2 className="text-sm font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-4 tracking-wider">
            Behavior
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Scopes"
              placeholder="openid email profile"
              value={form.scopes ?? ""}
              onChange={(e) => update("scopes", e.target.value)}
            />
            <Input
              label="User Identifier Field"
              placeholder="email"
              value={form.user_identifier ?? ""}
              onChange={(e) => update("user_identifier", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              Auto-provision Users
            </span>
            <button
              onClick={() => update("auto_provision", !form.auto_provision)}
              className={`text-xs px-3 py-1 rounded-full cursor-pointer font-medium transition-colors ${
                form.auto_provision
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400"
              }`}
            >
              {form.auto_provision ? "Enabled" : "Disabled"}
            </button>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Automatically create accounts for new SSO users (pending approval)
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
