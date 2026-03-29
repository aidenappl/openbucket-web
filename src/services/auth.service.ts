import { fetchApi, fetchRaw } from "@/tools/axios.tools";
import {
    UserPublic,
    AuthCheckResponse,
} from "@/types";

export const reqGetSelf = () =>
    fetchApi<UserPublic>({
        method: "GET",
        url: "/self",
    });

export const reqFortaCheck = () =>
    fetchRaw<AuthCheckResponse>({
        method: "GET",
        url: "/forta/check",
    });

export const fortaLogin = () => {
    if (typeof window !== "undefined") {
        sessionStorage.setItem("returnUrl", window.location.pathname);
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/forta/login`;
    }
};

export const openBucketLogout = () => {
    // Intentionally only clears the local OpenBucket session.
    // Does NOT call /forta/logout so the user remains signed in to Forta.
    // Callers are responsible for dispatching auth state resets via Redux.
};
