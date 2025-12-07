import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, ObjectHead } from "@/types";
import { store } from "@/store/store";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

const reqFetchBucketHead = async (): Promise<ApiResponse<ObjectHead>> => {
    const currentSession = selectCurrentSession(store.getState());
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