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

export type SSOConfig = {
  enabled: boolean;
  button_label: string;
};

export type AdminSSOConfig = {
  enabled: boolean;
  client_id: string;
  authorize_url: string;
  token_url: string;
  userinfo_url: string;
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
  redirect_url?: string;
  logout_url?: string;
  scopes?: string;
  user_identifier?: string;
  button_label?: string;
  auto_provision?: boolean;
  post_login_url?: string;
};
