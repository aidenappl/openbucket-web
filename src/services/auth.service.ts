import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, User, SSOConfig } from "@/types";

const reqLogin = async (
  email: string,
  password: string
): Promise<ApiResponse<User>> => {
  return fetchApi<User>({
    url: "/auth/login",
    method: "POST",
    data: { email, password },
  });
};

const reqRefresh = async (): Promise<ApiResponse<null>> => {
  return fetchApi<null>({
    url: "/auth/refresh",
    method: "POST",
  });
};

const reqLogout = async (): Promise<ApiResponse<null>> => {
  return fetchApi<null>({
    url: "/auth/logout",
    method: "POST",
  });
};

const reqGetSelf = async (): Promise<ApiResponse<User>> => {
  return fetchApi<User>({
    url: "/auth/self",
    method: "GET",
  });
};

const reqGetSSOConfig = async (): Promise<ApiResponse<SSOConfig>> => {
  return fetchApi<SSOConfig>({
    url: "/auth/sso/config",
    method: "GET",
  });
};

export { reqLogin, reqRefresh, reqLogout, reqGetSelf, reqGetSSOConfig };
