export type UserStatus = "active" | "invited" | "suspended" | "disabled" | "deleted";

export type UserMetadata = {
    username: string | null;
    phone: string | null;
    phone_verified: boolean;
};

export type User = {
    id: number;
    uuid: string;
    name: string | null;
    display_name: string | null;
    email: string;
    email_verified: boolean;
    is_super_admin: boolean;
    status: UserStatus;
    profile_image_url: string | null;
    last_login_at: string | null;
    inserted_at: string;
    updated_at: string;
    metadata: UserMetadata;
};

// Alias for API responses
export type UserPublic = User;

export interface AuthCheckResponse {
    authenticated: boolean;
    user?: User;
    message?: string;
}