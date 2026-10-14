import toast from "react-hot-toast";
import { Session } from "@/types";
import {
  reqDownloadObject,
  reqFetchObjectPresign,
} from "@/services/object.service";
import { getStore } from "@/store/StoreProvider";
import { selectCurrentSession } from "@/store/slices/sessionSlice";
import { endpointHost } from "@/tools/url.tools";

/** Normalise a folder prefix: no leading slash, exactly one trailing slash, "" for the root. */
export const normalizePrefix = (raw: string | null | undefined): string => {
  const p = (raw ?? "")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\//, "");
  return p === "" ? "" : p.endsWith("/") ? p : `${p}/`;
};

/** Last path segment of a key; folders (trailing `/`) give their own name. */
export const baseName = (key: string): string => {
  const clean = key.endsWith("/") ? key.slice(0, -1) : key;
  return clean.split("/").pop() || key;
};

/** Parent prefix of a key, with trailing slash ("" at the root). */
export const parentPrefix = (key: string): string => {
  const clean = key.endsWith("/") ? key.slice(0, -1) : key;
  const i = clean.lastIndexOf("/");
  return i === -1 ? "" : clean.slice(0, i + 1);
};

export const explorerHref = (prefix: string) =>
  prefix ? `/?folder=${encodeURIComponent(prefix)}` : "/";
export const objectHref = (key: string) => `/object/${encodeURIComponent(key)}`;

/**
 * The unsigned, path-style URL for an object: `<endpoint>/<bucket>/<key>`.
 *
 * ⚠️ `endpoint` already carries its scheme. The old copy-link built
 * `https://${endpoint}/…`, which produced `https://https://cdn…` for every object.
 * Only works for objects whose ACL is public-read.
 */
export const publicObjectUrl = (
  session: Pick<Session, "endpoint" | "bucket">,
  key: string,
): string => {
  const base = session.endpoint.replace(/\/+$/, "");
  const withScheme = /^https?:\/\//.test(base) ? base : `https://${base}`;
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${withScheme}/${encodeURIComponent(session.bucket)}/${path}`;
};

export const isPublicAcl = (acl: string | undefined | null) =>
  (acl ?? "").toLowerCase() === "public-read";

const SIGNED_LINK_SECONDS = 24 * 3600;

/**
 * Copy a shareable link: the plain URL for a public-read object, otherwise a
 * presigned URL valid for 24 hours (the toast says which, so nobody pastes an
 * expiring link into docs thinking it's permanent).
 */
export const copyObjectLink = async (
  session: Session,
  key: string,
  acl: string | undefined | null,
) => {
  try {
    if (isPublicAcl(acl)) {
      await navigator.clipboard.writeText(publicObjectUrl(session, key));
      toast.success("Public URL copied");
      return;
    }
    const res = await reqFetchObjectPresign(key, SIGNED_LINK_SECONDS);
    if (!res.success) {
      toast.error(res.error_message || "Couldn't create a link");
      return;
    }
    await navigator.clipboard.writeText(res.data.url);
    toast.success("Signed link copied — valid for 24 hours");
  } catch {
    toast.error("Couldn't write to the clipboard");
  }
};

// Bytes above which a download is handed to the browser via a presigned URL
// instead of being buffered through the API (the API's 60s write timeout and
// browser memory both get in the way of very large blobs).
const STREAM_LIMIT = 200 * 1024 * 1024;

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Open a presigned URL in a new tab.
 *
 * The URL comes from openbucket-api, but the browser is only sent to it when it
 * points at the active session's storage endpoint over http(s) — a presigned URL
 * for this bucket can't legitimately be anywhere else.
 */
export const openSignedUrl = (url: string): boolean => {
  const session = selectCurrentSession(getStore().getState());
  if (!session) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const allowedHost = endpointHost(session.endpoint);
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.host !== allowedHost
  ) {
    toast.error("Refusing to open a link outside this bucket's endpoint");
    return false;
  }
  window.open(
    `${parsed.origin}${parsed.pathname}${parsed.search}`,
    "_blank",
    "noopener,noreferrer",
  );
  return true;
};

/** Open an object in a new tab via a fresh presigned URL. */
export const openObject = async (key: string): Promise<boolean> => {
  const res = await reqFetchObjectPresign(key);
  return res.success && openSignedUrl(res.data.url);
};

/** Download one object to disk. Returns whether it succeeded. */
export const downloadObject = async (
  key: string,
  size?: number,
): Promise<boolean> => {
  const name = baseName(key);
  if (size != null && size > STREAM_LIMIT) return openObject(key);
  const blob = await reqDownloadObject(key);
  if (!blob) return false;
  saveBlob(blob, name);
  return true;
};
