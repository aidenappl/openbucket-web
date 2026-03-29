import { fetchApi } from "@/tools/axios.tools";
import {
    UserPublic,
} from "@/types";

export const reqGetSelf = () =>
    fetchApi<UserPublic>({
        method: "GET",
        url: "/auth/self",
    });
