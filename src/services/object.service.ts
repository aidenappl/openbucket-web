import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, BulkACLResult, ObjectACLResponse, ObjectHead, PresignResponse, S3ObjectMetadata } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

interface PutObjectOptions {
    file: File;
    prefix?: string;
    onUploadProgress?: (progress: number) => void;
}

const reqDeleteObject = async (objectKey: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<null>(
        {
            url: `/core/v1/${currentSession?.id}/object`,
            method: "DELETE",
            params: { key: objectKey },
        }
    );
};

const reqFetchMultiObjectHead = async (): Promise<ApiResponse<ObjectHead[]>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<ObjectHead[]>(
        {
            url: `/core/v1/${currentSession?.id}/head?multi=true`,
            method: "GET",
        }
    );
};

const reqPutObjectACL = async (key: string, acl: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<null>(
        {
            url: `/core/v1/${currentSession?.id}/object/acl`,
            method: "PUT",
            params: { key },
            data: {
                acl: acl.toLowerCase().trim(),
            },
        }
    );
};

const reqFetchObjectACL = async (objectKey: string): Promise<ApiResponse<ObjectACLResponse>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<ObjectACLResponse>(
        {
            url: `/core/v1/${currentSession?.id}/object/acl`,
            method: "GET",
            params: { key: objectKey },
        }
    );
};

const reqPutObjectWithProgress = async ({
    file,
    prefix,
    onUploadProgress
}: PutObjectOptions): Promise<ApiResponse<unknown>> => {
    const currentSession = selectCurrentSession(getStore().getState());

    const formData = new FormData();
    formData.append("file", file);

    if (prefix) {
        formData.append("prefix", prefix);
    }

    return fetchApi(
        {
            url: `/core/v1/${currentSession?.id}/object`,
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
        }
    );
};

const reqFetchObjectPresign = async (objectKey: string): Promise<ApiResponse<PresignResponse>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<PresignResponse>(
        {
            url: `/core/v1/${currentSession?.id}/object/presign`,
            method: "GET",
            params: { key: objectKey },
        }
    );
};

const reqPutRenameObject = async (oldPath: string, newPath: string): Promise<ApiResponse<null>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<null>(
        {
            url: `/core/v1/${currentSession?.id}/object/rename`,
            method: "PUT",
            params: { key: oldPath, newKey: newPath },
        }
    );
};

const reqFetchObjectHead = async (key: string): Promise<ApiResponse<ObjectHead>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<ObjectHead>(
        {
            url: `/core/v1/${currentSession?.id}/object/head`,
            method: "GET",
            params: { key },
        }
    );
}

const reqFetchBulkObjectHead = async (keys: string[]): Promise<ApiResponse<ObjectHead[]>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<ObjectHead[]>(
        {
            url: `/core/v1/${currentSession?.id}/object/head?bulk`,
            method: "POST",
            data: {
                keys
            }
        }
    );
}

const reqPutBulkObjectACL = async (keys: string[], acl: string): Promise<ApiResponse<BulkACLResult[]>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<BulkACLResult[]>({
        url: `/core/v1/${currentSession?.id}/object/acl?bulk`,
        method: "POST",
        data: { keys, acl: acl.toLowerCase().trim() },
    });
};

const reqFetchObjects = async (prefix: string): Promise<ApiResponse<S3ObjectMetadata[]>> => {
    const currentSession = selectCurrentSession(getStore().getState());
    return fetchApi<S3ObjectMetadata[]>(
        {
            url: `/core/v1/${currentSession?.id}/objects`,
            method: "GET",
            params: { prefix },
        }
    );
}

export {
    reqDeleteObject,
    reqFetchObjectACL,
    reqFetchObjects,
    reqPutObjectACL,
    reqFetchObjectPresign,
    reqPutRenameObject,
    reqFetchObjectHead,
    reqFetchMultiObjectHead,
    reqFetchBulkObjectHead,
    reqPutBulkObjectACL,
    reqPutObjectWithProgress
}