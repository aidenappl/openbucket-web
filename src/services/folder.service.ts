import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const getSessionId = (): number | null => {
    return selectCurrentSession(getStore().getState())?.id ?? null;
};

const noSession = <T>(): ApiResponse<T> => ({
    success: false, status: 0, error: "no_session", error_message: "No active session", error_code: -1,
});

const reqDeleteFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const id = getSessionId();
    if (id === null) return noSession();
    return fetchApi<null>(
        {
            url: `/core/v1/${id}/folder`,
            method: "DELETE",
            params: { folder: folderKey },
        }
    );
};

const reqFetchFolders = async (prefix: string): Promise<ApiResponse<string[]>> => {
    const id = getSessionId();
    if (id === null) return noSession();
    return fetchApi<string[]>(
        {
            url: `/core/v1/${id}/folders`,
            method: "GET",
            params: { prefix },
        }
    );
}

const reqPostFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const id = getSessionId();
    if (id === null) return noSession();
    return await fetchApi(
        {
            url: `/core/v1/${id}/folder`,
            method: "POST",
            data: { folder: folderKey },
        }
    );
};

export {
    reqDeleteFolder,
    reqPostFolder,
    reqFetchFolders
};