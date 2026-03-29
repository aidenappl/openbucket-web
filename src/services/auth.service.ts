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

export const fortaLogout = () => {
    if (typeof window !== "undefined") {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/forta/logout`;
    }
};
