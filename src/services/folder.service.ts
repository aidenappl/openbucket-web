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

export {
    reqDeleteFolder
};