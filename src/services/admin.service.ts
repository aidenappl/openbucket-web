import { fetchApi } from "@/tools/axios.tools";
import { ApiResponse, User, AdminSSOConfig, UpdateSSOConfigPayload } from "@/types";

// ── User Management ──────────────────────────────────────────────────────

export const reqAdminListUsers = async (): Promise<ApiResponse<User[]>> => {
  return fetchApi<User[]>({ url: "/admin/users", method: "GET" });
};

export type CreateUserPayload = {
  email: string;
  name: string;
  password: string;
  role: string;
};

export const reqAdminCreateUser = async (
  data: CreateUserPayload
): Promise<ApiResponse<User>> => {
  return fetchApi<User>({ url: "/admin/users", method: "POST", data });
};

export type UpdateUserPayload = {
  name?: string;
  role?: string;
  active?: boolean;
};

export const reqAdminUpdateUser = async (
  id: number,
  data: UpdateUserPayload
): Promise<ApiResponse<User>> => {
  return fetchApi<User>({ url: `/admin/users/${id}`, method: "PUT", data });
};

export const reqAdminDeleteUser = async (
  id: number
): Promise<ApiResponse<null>> => {
  return fetchApi<null>({ url: `/admin/users/${id}`, method: "DELETE" });
};

// ── Instance Management ──────────────────────────────────────────────────

export type Instance = {
  id: number;
  name: string;
  endpoint: string;
  active: boolean;
  updated_at: string;
  inserted_at: string;
};

export const reqAdminListInstances = async (): Promise<
  ApiResponse<Instance[]>
> => {
  return fetchApi<Instance[]>({ url: "/admin/instances", method: "GET" });
};

export type CreateInstancePayload = {
  name: string;
  endpoint: string;
  admin_token: string;
};

export const reqAdminCreateInstance = async (
  data: CreateInstancePayload
): Promise<ApiResponse<Instance>> => {
  return fetchApi<Instance>({
    url: "/admin/instances",
    method: "POST",
    data,
  });
};

export type UpdateInstancePayload = {
  name?: string;
  endpoint?: string;
  admin_token?: string;
  active?: boolean;
};

export const reqAdminUpdateInstance = async (
  id: number,
  data: UpdateInstancePayload
): Promise<ApiResponse<Instance>> => {
  return fetchApi<Instance>({
    url: `/admin/instances/${id}`,
    method: "PUT",
    data,
  });
};

export const reqAdminDeleteInstance = async (
  id: number
): Promise<ApiResponse<null>> => {
  return fetchApi<null>({ url: `/admin/instances/${id}`, method: "DELETE" });
};

// ── Instance Proxy (openbucket-go admin API) ─────────────────────────────

export type InstanceCredential = {
  id: number;
  name: string;
  key_id: string;
  secret_key?: string;
  date_created: string;
};

export type InstanceBucket = {
  id: number;
  name: string;
  creation_date: string;
  acl: string;
  owner: { key_id: string; display_name: string };
  grants?: InstanceGrant[];
};

export type InstanceGrant = {
  id: number;
  key_id: string;
  display_name: string;
  permission: string;
  date_added: string;
};

export type InstanceBucketStats = {
  object_count: number;
  total_size: number;
};

const proxyFetch = async <T>(
  instanceId: number,
  path: string,
  method: string = "GET",
  data?: unknown
): Promise<ApiResponse<T>> => {
  return fetchApi<T>({
    url: `/admin/instances/${instanceId}/proxy/${path}`,
    method,
    data,
  });
};

export const reqProxyListCredentials = (instanceId: number) =>
  proxyFetch<InstanceCredential[]>(instanceId, "credentials");

export const reqProxyCreateCredential = (
  instanceId: number,
  name: string
) => proxyFetch<InstanceCredential>(instanceId, "credentials", "POST", { name });

export const reqProxyDeleteCredential = (instanceId: number, id: number) =>
  proxyFetch<null>(instanceId, `credentials/${id}`, "DELETE");

export const reqProxyListBuckets = (instanceId: number) =>
  proxyFetch<InstanceBucket[]>(instanceId, "buckets?grants=true");

export const reqProxyGetBucket = (instanceId: number, bucket: string) =>
  proxyFetch<InstanceBucket>(instanceId, `buckets/${bucket}`);

export const reqProxyCreateBucket = (
  instanceId: number,
  name: string,
  ownerKeyId: string
) =>
  proxyFetch<InstanceBucket>(instanceId, "buckets", "POST", {
    name,
    owner_key_id: ownerKeyId,
  });

export const reqProxyDeleteBucket = (instanceId: number, bucket: string) =>
  proxyFetch<null>(instanceId, `buckets/${bucket}`, "DELETE");

export const reqProxyGetBucketStats = (instanceId: number, bucket: string) =>
  proxyFetch<InstanceBucketStats>(instanceId, `buckets/${bucket}/stats`);

export const reqProxyUpdateBucketACL = (
  instanceId: number,
  bucket: string,
  acl: string
) => proxyFetch<null>(instanceId, `buckets/${bucket}/acl`, "PUT", { acl });

export const reqProxyListGrants = (instanceId: number, bucket: string) =>
  proxyFetch<InstanceGrant[]>(instanceId, `buckets/${bucket}/grants`);

export const reqProxyCreateGrant = (
  instanceId: number,
  bucket: string,
  keyId: string,
  permission: string
) =>
  proxyFetch<null>(instanceId, `buckets/${bucket}/grants`, "POST", {
    key_id: keyId,
    permission,
  });

export const reqProxyDeleteGrant = (
  instanceId: number,
  bucket: string,
  grantId: number
) => proxyFetch<null>(instanceId, `buckets/${bucket}/grants/${grantId}`, "DELETE");

// ── SSO Configuration ───────────────────────────────────────────────────

export const reqAdminGetSSOConfig = async (): Promise<ApiResponse<AdminSSOConfig>> => {
  return fetchApi<AdminSSOConfig>({ url: "/admin/sso-config", method: "GET" });
};

export const reqAdminUpdateSSOConfig = async (
  data: UpdateSSOConfigPayload
): Promise<ApiResponse<null>> => {
  return fetchApi<null>({ url: "/admin/sso-config", method: "PUT", data });
};
