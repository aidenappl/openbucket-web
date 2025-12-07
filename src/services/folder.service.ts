import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse } from "@/types";
import { store } from "@/store/store";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const reqDeleteFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<null>(
        {
            url: `/${currentSession?.bucket}/folder`,
            method: "DELETE",
            params: { folder: folderKey },
        },
        currentSession?.token
    );
};

const reqFetchFolders = async (prefix: string): Promise<ApiResponse<string[]>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<string[]>(
        {
            url: `/${currentSession?.bucket}/folders`,
            method: "GET",
            params: { prefix },
        },
        currentSession?.token
    );
}

export {
    reqDeleteFolder,
    reqFetchFolders
};