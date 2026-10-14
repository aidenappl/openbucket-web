import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, Session } from "@/types";

export type SessionPayload = {
  bucket: string;
  nickname: string;
  region: string;
  endpoint: string;
  access_key_id: string;
  secret_access_key: string;
};

const reqGetSessions = async (): Promise<ApiResponse<Session[]>> => {
  return fetchApi<Session[]>({
    url: "/core/v1/sessions",
    method: "GET",
  });
};

const reqPostSession = async (
  data: SessionPayload,
): Promise<ApiResponse<Session>> => {
  return fetchApi<Session>({
    url: "/core/v1/session",
    method: "POST",
    data,
  });
};

const reqDeleteSession = async (id: number): Promise<ApiResponse<null>> => {
  return fetchApi<null>({
    url: `/core/v1/session/${id}`,
    method: "DELETE",
  });
};

/**
 * Lists the bucket root through a specific session. openbucket-api stores a
 * session without checking its credentials, so this is the only way to learn a
 * key was mistyped before the user lands on an explorer full of errors.
 */
const reqProbeSession = async (
  id: number,
): Promise<ApiResponse<string[] | null>> => {
  return fetchApi<string[] | null>({
    url: `/core/v1/${id}/folders`,
    method: "GET",
    params: { prefix: "" },
  });
};

export { reqGetSessions, reqPostSession, reqDeleteSession, reqProbeSession };
