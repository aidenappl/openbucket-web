import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, ObjectHead } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const getSessionId = (): number | null => {
    return selectCurrentSession(getStore().getState())?.id ?? null;
};

const noSession = <T>(): ApiResponse<T> => ({
    success: false, status: 0, error: "no_session", error_message: "No active session", error_code: -1,
});

const reqFetchBucketHead = async (): Promise<ApiResponse<ObjectHead>> => {
    const id = getSessionId();
    if (id === null) return noSession();
    return fetchApi<ObjectHead>(
        {
            url: `/core/v1/${id}/head`,
            method: "GET",
        }
    );
};

export {
    reqFetchBucketHead
};