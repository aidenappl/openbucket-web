import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const reqDeleteFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<null>(
        {
            url: `/core/v1/${currentSession?.id}/folder`,
            method: "DELETE",
            params: { folder: folderKey },
        }
    );
};

const reqFetchFolders = async (prefix: string): Promise<ApiResponse<string[]>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<string[]>(
        {
            url: `/core/v1/${currentSession?.id}/folders`,
            method: "GET",
            params: { prefix },
        }
    );
}

const reqPostFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return await fetchApi(
        {
            url: `/core/v1/${currentSession?.id}/folder`,
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