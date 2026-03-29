import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const reqDeleteFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<null>(
        {
            url: `/core/v1/${currentSession?.bucket}/folder`,
            method: "DELETE",
            params: { folder: folderKey },
        },
        currentSession?.token
    );
};

const reqFetchFolders = async (prefix: string): Promise<ApiResponse<string[]>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<string[]>(
        {
            url: `/core/v1/${currentSession?.bucket}/folders`,
            method: "GET",
            params: { prefix },
        },
        currentSession?.token
    );
}

const reqPostFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return await fetchApi(
        {
            url: `/core/v1/${currentSession?.bucket}/folder`,
            method: "POST",
            data: { folder: folderKey },
        },
        currentSession?.token
    );
};

export {
    reqDeleteFolder,
    reqPostFolder,
    reqFetchFolders
};