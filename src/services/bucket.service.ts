import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, ObjectHead } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const reqFetchBucketHead = async (): Promise<ApiResponse<ObjectHead>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<ObjectHead>(
        {
            url: `/${currentSession?.bucket}/head`,
            method: "GET",
        },
        currentSession?.token
    );
};

export {
    reqFetchBucketHead
};