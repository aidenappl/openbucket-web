import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, FolderContents, FolderObject } from "@/types";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";

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

const reqDeleteFolder = async (
  folderKey: string,
): Promise<ApiResponse<null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<null>({
    url: `/core/v1/${id}/folder`,
    method: "DELETE",
    params: { folder: folderKey },
    timeout: 0,
  });
};

const reqFetchFolders = async (
  prefix: string,
): Promise<ApiResponse<string[]>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<string[]>({
    url: `/core/v1/${id}/folders`,
    method: "GET",
    params: { prefix },
  });
};

/**
 * One folder level — sub-folders and objects — from a single listing
 * (GET /contents). Takes the session id rather than reading the store: a
 * hover prefetch must list the session it was started for.
 *
 * Replaces calling reqFetchFolders + reqFetchObjects per folder, which made
 * the API list the same prefix twice.
 */
const reqListContents = async (
  sessionId: number,
  prefix: string,
): Promise<ApiResponse<FolderContents>> =>
  fetchApi<FolderContents>({
    url: `/core/v1/${sessionId}/contents`,
    method: "GET",
    params: { prefix },
  });

/**
 * Every object under a folder, recursively (GET /folder). Used to tell the user
 * how much a folder delete will actually remove.
 */
const reqFetchFolderContents = async (
  folderKey: string,
): Promise<ApiResponse<FolderObject[] | null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<FolderObject[] | null>({
    url: `/core/v1/${id}/folder`,
    method: "GET",
    params: { folder: folderKey },
  });
};

/**
 * `folderKey` is the FULL key from the bucket root (e.g. `blog_posts/drafts`).
 * The API does not prepend the current prefix — passing a bare name creates the
 * folder at the root, which is what the explorer used to do from any depth.
 */
const reqPostFolder = async (folderKey: string): Promise<ApiResponse<null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<null>({
    url: `/core/v1/${id}/folder`,
    method: "POST",
    data: { folder: folderKey },
  });
};

/** Renames (moves) a folder. Both keys are full keys ending in `/`. */
const reqRenameFolder = async (
  folderKey: string,
  newFolderKey: string,
): Promise<ApiResponse<null>> => {
  const id = getSessionId();
  if (id === null) return noSession();
  return fetchApi<null>({
    url: `/core/v1/${id}/folder`,
    method: "PUT",
    data: { folder: folderKey, name: newFolderKey },
    timeout: 0,
  });
};

export {
  reqDeleteFolder,
  reqPostFolder,
  reqFetchFolders,
  reqListContents,
  reqFetchFolderContents,
  reqRenameFolder,
};
