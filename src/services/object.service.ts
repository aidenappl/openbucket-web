import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, ObjectACLResponse, ObjectHead, PresignResponse } from "@/types";
import { store } from "@/store/store";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

interface PutObjectOptions {
    file: File;
    prefix?: string;
    onUploadProgress?: (progress: number) => void;
}

const reqDeleteObject = async (objectKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<null>(
        {
            url: `/${currentSession?.bucket}/object`,
            method: "DELETE",
            params: { key: objectKey },
        },
        currentSession?.token
    );
};

const reqFetchMultiObjectHead = async (): Promise<ApiResponse<ObjectHead[]>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<ObjectHead[]>(
        {
            url: `/${currentSession?.bucket}/head?multi=true`,
            method: "GET",
        },
        currentSession?.token
    );
};

const reqPutObjectACL = async (key: string, acl: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<null>(
        {
            url: `/${currentSession?.bucket}/object/acl`,
            method: "PUT",
            params: { key },
            data: {
                acl: acl.toLowerCase().trim(),
            },
        },
        currentSession?.token
    );
};

const reqFetchObjectACL = async (objectKey: string): Promise<ApiResponse<ObjectACLResponse>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<ObjectACLResponse>(
        {
            url: `/${currentSession?.bucket}/object/acl`,
            method: "GET",
            params: { key: objectKey },
        },
        currentSession?.token
    );
};

const reqPutObjectWithProgress = async ({
    file,
    prefix,
    onUploadProgress
}: PutObjectOptions): Promise<ApiResponse<unknown>> => {
    const currentSession = selectCurrentSession(store.getState());

    const formData = new FormData();
    formData.append("file", file);

    if (prefix) {
        formData.append("prefix", prefix);
    }

    return fetchApi(
        {
            url: `/${currentSession?.bucket}/object`,
            method: "PUT",
            data: formData,
            onUploadProgress: (event) => {
                if (onUploadProgress) {
                    const progress = Math.round(
                        (event.loaded * 100) / (event?.total || 1)
                    );
                    onUploadProgress(progress);
                }
            },
            headers: { "Content-Type": "multipart/form-data" },
        },
        currentSession?.token
    );
};

const reqFetchObjectPresign = async (objectKey: string): Promise<ApiResponse<PresignResponse>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<PresignResponse>(
        {
            url: `/${currentSession?.bucket}/object/presign`,
            method: "GET",
            params: { key: objectKey },
        },
        currentSession?.token
    );
};

const reqPutRenameObject = async (oldPath: string, newPath: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<null>(
        {
            url: `/${currentSession?.bucket}/object/rename`,
            method: "PUT",
            params: { key: oldPath, newKey: newPath },
        },
        currentSession?.token
    );
};

const reqFetchObjectHead = async (key: string): Promise<ApiResponse<ObjectHead>> => {
    const currentSession = selectCurrentSession(store.getState());
    return fetchApi<ObjectHead>(
        {
            url: `/${currentSession?.bucket}/object/head`,
            method: "GET",
            params: { key },
        },
        currentSession?.token
    );
}

export {
    reqDeleteObject,
    reqFetchObjectACL,
    reqPutObjectACL,
    reqFetchObjectPresign,
    reqPutRenameObject,
    reqFetchObjectHead,
    reqFetchMultiObjectHead,
    reqPutObjectWithProgress
}