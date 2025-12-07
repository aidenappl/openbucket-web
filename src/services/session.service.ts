import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, Session, SessionResponse } from "@/types";

const reqFetchSession = async (tokens: string[]): Promise<ApiResponse<Session[]>> => {
    return fetchApi<Session[]>({
        url: "/sessions",
        method: "PUT",
        data: { sessions: tokens },
    });
};

const reqPutSession = async (tokens: string[]): Promise<ApiResponse<Session[]>> => {
    return fetchApi<Session[]>({
        url: "/sessions",
        method: "PUT",
        data: { sessions: tokens },
    });
};

const reqPostSession = async (data: Record<string, string>): Promise<ApiResponse<SessionResponse>> => {
    return fetchApi<SessionResponse>({
        url: "/session",
        method: "POST",
        data,
    });
};

export {
    reqFetchSession,
    reqPutSession,
    reqPostSession
};