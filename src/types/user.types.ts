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
