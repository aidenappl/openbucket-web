import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, Session } from "@/types";

const reqGetSessions = async (): Promise<ApiResponse<Session[]>> => {
    return fetchApi<Session[]>({
        url: "/core/v1/sessions",
        method: "GET",
    });
};

const reqPostSession = async (data: Record<string, string>): Promise<ApiResponse<Session>> => {
    return fetchApi<Session>({
        url: "/core/v1/session",
        method: "POST",
        data,
    });
};

export {
    reqGetSessions,
    reqPostSession
};