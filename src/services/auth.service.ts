import { fetchApi } from "@/tools/axios.tools";
import {
    UserPublic,
} from "@/types";

export const reqGetSelf = () =>
    fetchApi<UserPublic>({
        method: "GET",
        url: "/self",
    });

export const fortaLogin = () => {
    if (typeof window !== "undefined") {
        sessionStorage.setItem("returnUrl", window.location.pathname);
        window.location.href = `${process.env.NEXT_PUBLIC_OPENBUCKET_API}/forta/login`;
    }
};

export const openBucketLogout = () => {
    if (typeof window !== "undefined") {
        window.location.href = `${process.env.NEXT_PUBLIC_OPENBUCKET_API}/forta/logout`;
    }
};
