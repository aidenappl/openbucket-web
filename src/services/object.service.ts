import { axios_api, fetchApi } from "@/tools/axios.tools";
import {
  ApiResponse,
  BulkACLResult,
  ObjectACLResponse,
  ObjectHead,
  PresignResponse,
  S3ObjectMetadata,
} from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

interface PutObjectOptions {
  file: File;
  prefix?: string;
  /**
   * Key relative to `prefix`; defaults to the file name. May contain `/` (a
   * folder upload sends `photos/2024/a.jpg`) — the API only rejects `..`, a
   * leading `/` and NUL.
   */
  key?: string;
  onUploadProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

// openbucket-api rejects bulk HEAD and bulk ACL calls over this many keys
// ("batch size exceeds maximum of 100"). Sending a whole folder at once used to
// blank the ACL column for any folder holding more than 100 objects.
const BULK_BATCH_SIZE = 100;

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};

const getSessionId = (): number | null => {
  return selectCurrentSession(getStore().getState())?.id ?? null;
};

const noSession = <T>(): ApiResponse<T> => ({
  success: false,
  status: 0,
  error: "no_session",
  error_message: "No active session",
  error_code: -1,
});

const reqDeleteObject = async (
  objectKey: string,
): Promise<ApiResponse<null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<null>({
    url: `/core/v1/${id}/object`,
    method: "DELETE",
    params: { key: objectKey },
  });
};

const reqPutObjectACL = async (
  key: string,
  acl: string,
): Promise<ApiResponse<null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<null>({
    url: `/core/v1/${id}/object/acl`,
    method: "PUT",
    params: { key },
    data: {
      acl: acl.toLowerCase().trim(),
    },
  });
};

const reqFetchObjectACL = async (
  objectKey: string,
): Promise<ApiResponse<ObjectACLResponse>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<ObjectACLResponse>({
    url: `/core/v1/${id}/object/acl`,
    method: "GET",
    params: { key: objectKey },
  });
};

const reqPutObjectWithProgress = async ({
  file,
  prefix,
  key,
  onUploadProgress,
  signal,
}: PutObjectOptions): Promise<ApiResponse<unknown>> => {
  const id = getSessionId();
  if (id === null) return noSession();

  const formData = new FormData();
  formData.append("file", file);

  if (prefix) {
    formData.append("prefix", prefix);
  }
  if (key) {
    formData.append("key", key);
  }

  return fetchApi({
    url: `/core/v1/${id}/object`,
    method: "PUT",
    data: formData,
    // The client-wide 10s timeout failed every upload that took longer
    // than ten seconds to send. Uploads run until done or cancelled.
    timeout: 0,
    signal,
    onUploadProgress: (event) => {
      if (onUploadProgress) {
        const progress = Math.round((event.loaded * 100) / (event?.total || 1));
        onUploadProgress(progress);
      }
    },
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** `expiration` is integer seconds; the API defaults to 3600 when omitted. */
const reqFetchObjectPresign = async (
  objectKey: string,
  expiration?: number,
): Promise<ApiResponse<PresignResponse>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<PresignResponse>({
    url: `/core/v1/${id}/object/presign`,
    method: "GET",
    params: expiration ? { key: objectKey, expiration } : { key: objectKey },
  });
};

/**
 * Streams an object's bytes through the API (session-authenticated).
 *
 * ⚠️ Not via the presigned CDN URL: the storage CDNs send no CORS headers, so a
 * browser `fetch()` of a presigned URL is blocked — which is how the explorer's
 * old Download button silently did nothing for every file.
 */
const reqDownloadObject = async (
  objectKey: string,
  signal?: AbortSignal,
): Promise<Blob | null> => {
  const id = getSessionId();
  if (id === null) return null;
  try {
    const res = await axios_api.request<Blob>({
      url: `/core/v1/${id}/object`,
      method: "GET",
      params: { key: objectKey },
      responseType: "blob",
      timeout: 0,
      signal,
    });
    return res.status === 200 ? res.data : null;
  } catch {
    return null;
  }
};

const reqPutRenameObject = async (
  oldPath: string,
  newPath: string,
): Promise<ApiResponse<null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<null>({
    url: `/core/v1/${id}/object/rename`,
    method: "PUT",
    params: { key: oldPath, newKey: newPath },
  });
};

const reqFetchObjectHead = async (
  key: string,
): Promise<ApiResponse<ObjectHead>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<ObjectHead>({
    url: `/core/v1/${id}/object/head`,
    method: "GET",
    params: { key },
  });
};

/**
 * HEAD for many keys. The API returns results in request order with `null`
 * for keys it couldn't read, so callers must match by index — not by ETag,
 * which two identical files share.
 */
const reqFetchBulkObjectHead = async (
  keys: string[],
): Promise<ApiResponse<(ObjectHead | null)[]>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  const batches = await Promise.all(
    chunk(keys, BULK_BATCH_SIZE).map((batch) =>
      fetchApi<(ObjectHead | null)[]>({
        url: `/core/v1/${id}/object/head?bulk`,
        method: "POST",
        data: { keys: batch },
      }),
    ),
  );
  const failed = batches.find((b) => !b.success);
  if (failed && !failed.success) return failed;
  return {
    success: true,
    status: 200,
    message: "ok",
    data: batches.flatMap((b) => (b.success ? (b.data ?? []) : [])),
  };
};

const reqPutBulkObjectACL = async (
  keys: string[],
  acl: string,
): Promise<ApiResponse<BulkACLResult[]>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  const batches = await Promise.all(
    chunk(keys, BULK_BATCH_SIZE).map((batch) =>
      fetchApi<BulkACLResult[]>({
        url: `/core/v1/${id}/object/acl?bulk`,
        method: "POST",
        data: { keys: batch, acl: acl.toLowerCase().trim() },
      }),
    ),
  );
  const failed = batches.find((b) => !b.success);
  if (failed && !failed.success) return failed;
  return {
    success: true,
    status: 200,
    message: "ok",
    data: batches.flatMap((b) => (b.success ? (b.data ?? []) : [])),
  };
};

const reqFetchObjects = async (
  prefix: string,
): Promise<ApiResponse<S3ObjectMetadata[]>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<S3ObjectMetadata[]>({
    url: `/core/v1/${id}/objects`,
    method: "GET",
    params: { prefix },
  });
};

export {
  reqDeleteObject,
  reqDownloadObject,
  reqFetchObjectACL,
  reqFetchObjects,
  reqPutObjectACL,
  reqFetchObjectPresign,
  reqPutRenameObject,
  reqFetchObjectHead,
  reqFetchBulkObjectHead,
  reqPutBulkObjectACL,
  reqPutObjectWithProgress,
};
