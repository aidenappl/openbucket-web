"use client";

import { useCallback, useEffect, useState } from "react";
import {
  reqAdminGetSSOConfig,
  reqAdminUpdateSSOConfig,
} from "@/services/admin.service";
import { AdminSSOConfig, UpdateSSOConfigPayload } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";

/**
 * The SSO administration page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ THIS SERVICE IS SINGLE-PROVIDER, AND THAT IS WHY THIS PAGE IS A FORM
 * RATHER THAN A LIST.
 *
 * monitor-core has an `sso_providers` table and its admin page is a provider
 * list with create/edit. openbucket-api stores one configuration in `settings`,
 * so a list UI here would be a list that can only ever hold one row, with a
 * "New provider" button that has nowhere to write.
 *
 * The two pages are built from the SAME primitives and read the same, which is
 * the part that matters. When the `sso_providers` table lands here this page
 * grows a provider selector above the form; the form itself does not move.
 *
 * ⚠️ BRANDING FIELDS ARE ABSENT ON PURPOSE. `display_icon`, `button_color` and
 * `button_text_color` are in the `/auth/sso/config` contract and this API emits
 * them — always null, because the columns live on that same absent table.
 * Rendering inputs for them would be inputs whose values are dropped on save.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function SSOPage() {
  const [config, setConfig] = useState<AdminSSOConfig | null>(null);
  const [form, setForm] = useState<UpdateSSOConfigPayload>({});
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await reqAdminGetSSOConfig();
    if (res.success) {
      setConfig(res.data);
      setForm({
        enabled: res.data.enabled,
        client_id: res.data.client_id,
        authorize_url: res.data.authorize_url,
        token_url: res.data.token_url,
        userinfo_url: res.data.userinfo_url,
        introspect_url: res.data.introspect_url ?? "",
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
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    const payload: UpdateSSOConfigPayload = { ...form };
    // An empty box means "leave the stored secret alone", never "clear it".
    // Sending "" would wipe a working credential because the admin opened the
    // page to change a URL.
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

  const update = (
    field: keyof UpdateSSOConfigPayload,
    value: string | boolean,
  ) => {
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary">SSO Configuration</h1>
          <StatusBadge status={form.enabled ? "enabled" : "disabled"} />
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        <Section title="General">
          <Field
            label="Single sign-on"
            hint="When disabled, the login page stops offering SSO. Existing sessions are unaffected — this controls the entry point, not the exit."
          >
            <Switch
              checked={!!form.enabled}
              onChange={(v) => update("enabled", v)}
              label="Enable single sign-on"
            />
          </Field>
          <Input
            label="Button Label"
            placeholder="Sign in with SSO"
            value={form.button_label ?? ""}
            onChange={(e) => update("button_label", e.target.value)}
            hint="Shown on the login page button."
          />
        </Section>

        <Section title="OAuth Provider">
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
            {/*
              Optional on purpose. An SSO setup without introspection still logs
              people in correctly; what it loses is the ability to notice the
              provider has revoked a grant. Requiring it would block every
              provider that does not implement RFC 7662.
            */}
            <Input
              label="Introspection URL"
              placeholder="https://provider.com/oauth/introspect"
              value={form.introspect_url ?? ""}
              onChange={(e) => update("introspect_url", e.target.value)}
              hint="Optional. Without it a session survives until its token expires, even after the provider revokes the grant."
            />
            <Input
              label="Redirect URL"
              placeholder="https://your-app.com/auth/sso/callback"
              value={form.redirect_url ?? ""}
              onChange={(e) => update("redirect_url", e.target.value)}
              hint="Must match a redirect URI registered with the provider, exactly."
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
        </Section>

        <Section title="Client Credentials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client ID"
              placeholder="your-client-id"
              value={form.client_id ?? ""}
              onChange={(e) => update("client_id", e.target.value)}
            />
            <Input
              label="Client Secret"
              type="password"
              autoComplete="new-password"
              placeholder={
                config?.has_secret ? "••••••••" : "Enter client secret"
              }
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              hint={
                config?.has_secret
                  ? "A secret is stored. Leave blank to keep it."
                  : undefined
              }
            />
          </div>
        </Section>

        <Section title="Behaviour">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Scopes"
              placeholder="openid email profile"
              value={form.scopes ?? ""}
              onChange={(e) => update("scopes", e.target.value)}
              hint="Space-separated."
            />
            <Input
              label="User Identifier Field"
              placeholder="email"
              value={form.user_identifier ?? ""}
              onChange={(e) => update("user_identifier", e.target.value)}
              hint="The claim matched against a local account."
            />
          </div>

          {form.user_identifier === "email" && (
            <Alert variant="warning">
              Matching on <code>email</code> means anyone who can get the
              provider to assert an address can claim the matching local account.
              That is safe only where the provider verifies addresses and never
              lets one be reused. A provider-issued <code>sub</code> does not
              depend on either property.
            </Alert>
          )}

          <Field
            label="Auto-provision users"
            hint="Create an account the first time someone signs in. New accounts still land in the pending queue and can do nothing until approved."
          >
            <Switch
              checked={!!form.auto_provision}
              onChange={(v) => update("auto_provision", v)}
              label="Auto-provision users"
            />
          </Field>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="p-4 rounded-lg border border-border-strong bg-surface space-y-4">
      <h2 className="text-sm font-semibold uppercase text-muted tracking-wider">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A labelled row for a control that is not an Input — a Switch, typically. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint && (
          <p className="text-xs text-muted mt-1 leading-relaxed max-w-prose">
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}
