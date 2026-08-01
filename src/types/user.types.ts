export type UserRole = "admin" | "editor" | "viewer" | "pending";

export type User = {
  id: number;
  email: string;
  name: string | null;
  auth_type: "local" | "sso";
  sso_subject?: string;
  profile_image_url: string | null;
  role: UserRole;
  active: boolean;
  updated_at: string;
  inserted_at: string;
};

/**
 * One entry from the shared `GET /auth/sso/config` contract.
 *
 * ⚠️ Shared with monitor-core and lattice-api. Nullable fields are nullable ON
 * PURPOSE — null means "plain text button in the default style", which is the
 * state before branding is configured and the state a failed icon fetch returns to.
 */
export type SSOProvider = {
  name: string;
  display_name: string;
  display_icon: string | null;
  button_color: string | null;
  button_text_color: string | null;
  login_url: string;
  sort_order: number;
};

export type SSOConfig = {
  enabled: boolean;
  providers?: SSOProvider[];

  /** @deprecated legacy single-provider shape; drop once every API serves `providers`. */
  button_label?: string;
  /** @deprecated legacy single-provider shape. */
  login_url?: string;
};

export type AdminSSOConfig = {
  enabled: boolean;
  client_id: string;
  authorize_url: string;
  token_url: string;
  userinfo_url: string;
  /**
   * RFC 7662 introspection endpoint. Optional, but WITHOUT IT THE REVOCATION
   * CHECKPOINT CANNOT RUN — there is no endpoint to ask whether the upstream
   * grant is still live, so a revocation at the provider stays invisible until
   * the local session expires on its own.
   */
  introspect_url: string;
  redirect_url: string;
  logout_url: string;
  scopes: string;
  user_identifier: string;
  button_label: string;
  auto_provision: boolean;
  post_login_url: string;
  has_secret: boolean;
};

export type UpdateSSOConfigPayload = {
  enabled?: boolean;
  client_id?: string;
  client_secret?: string;
  authorize_url?: string;
  token_url?: string;
  userinfo_url?: string;
  introspect_url?: string;
  redirect_url?: string;
  logout_url?: string;
  scopes?: string;
  user_identifier?: string;
  button_label?: string;
  auto_provision?: boolean;
  post_login_url?: string;
};
