"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Spinner from "@/components/Spinner";
import ChangeAccessModal from "@/components/ChangeAccessModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import RenameModal from "@/components/RenameModal";
import MoveObjectModal from "@/components/MoveObjectModal";
import ObjectInspectPanel from "@/components/ObjectInspectPanel";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { selectCurrentSession } from "@/store/slices/sessionSlice";
import { usePermissions } from "@/hooks/usePermissions";
import { ObjectACLResponse, ObjectHead } from "@/types";
import {
  reqDeleteObject,
  reqFetchObjectACL,
  reqFetchObjectHead,
  reqFetchObjectPresign,
  reqPutObjectACL,
  reqPutRenameObject,
} from "@/services/object.service";
import {
  baseName,
  copyObjectLink,
  downloadObject,
  explorerHref,
  objectHref,
  openObject,
  parentPrefix,
  publicObjectUrl,
} from "@/tools/objectUrl.tools";
import { ViewCache } from "@/tools/viewCache.tools";

// The API's anonymous-read grantee; shown as the Access row, not as a grant.
const ALL_USERS_URI = "http://openbucket/groups/global/AllUsers";

type ObjectView = {
  object: ObjectHead;
  acl: ObjectACLResponse | null;
  previewUrl: string | null;
  etag: string;
  /** When previewUrl was signed (ms). Presigned URLs last 3600s. */
  previewAt: number;
};

// Keyed `${sessionId}:${key}`.
const objectViews = new ViewCache<ObjectView>();

// Reuse a cached preview URL for up to 45 of its 60 minutes.
const PREVIEW_REUSE_MS = 45 * 60 * 1000;

const ObjectPage = () => {
  const router = useRouter();
  const params = useParams();
  const session = useSelector(selectCurrentSession);
  const { hasAPI } = usePermissions();
  const fullPath = decodeURIComponent(
    Array.isArray(params.object)
      ? params.object.join("/")
      : ((params.object as string | undefined) ?? ""),
  );

  const [object, setObject] = useState<ObjectHead | null>(null);
  const [acl, setAcl] = useState<ObjectACLResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [modal, setModal] = useState<
    "access" | "delete" | "rename" | "move" | "share" | null
  >(null);
  const [busy, setBusy] = useState(false);

  // The session this page was opened under. Switching buckets in the nav while
  // looking at an object means this key is meaningless there: go to the root.
  const openedUnder = useRef<number | null>(null);
  useEffect(() => {
    if (!session) return;
    if (openedUnder.current === null) openedUnder.current = session.id;
    else if (openedUnder.current !== session.id) router.push("/");
  }, [session, router]);

  useEffect(() => {
    if (hasAPI === false) router.replace("/sessions");
  }, [hasAPI, router]);

  // `stillCurrent` drops a response that arrives after the user moved on.
  const loadAcl = useCallback(
    async (stillCurrent?: () => boolean) => {
      const res = await reqFetchObjectACL(fullPath);
      if (stillCurrent && !stillCurrent()) return;
      if (res.success) {
        setAcl({
          ...res.data,
          Grants: (res.data.Grants ?? []).filter(
            (g) => g.Grantee.URI !== ALL_USERS_URI,
          ),
        });
      }
    },
    [fullPath],
  );

  // Stale-while-revalidate, like the explorer: a revisited object renders its
  // last copy at once and refreshes in the background.
  //
  // ⚠️ `shownKey` says which object the state belongs to. Until load() has
  // run for a new path, render from the cache (or the skeleton) instead of the
  // previous object's state — the title comes from the URL, so state alone
  // paired the new name with the old object's details for a frame, and the
  // cache-write effect below filed the old object under the new key.
  const cacheKey = session ? `${session.id}:${fullPath}` : null;
  const [shownKey, setShownKey] = useState<string | null>(null);
  const requestRef = useRef(0);
  const previewSignedAt = useRef(0);

  const load = useCallback(async () => {
    if (!cacheKey) return;
    const req = ++requestRef.current;
    const cached = objectViews.get(cacheKey);
    setShownKey(cacheKey);
    setNotFound(false);
    if (cached) {
      setObject(cached.object);
      setAcl(cached.acl);
      setPreviewUrl(cached.previewUrl);
      previewSignedAt.current = cached.previewAt;
      setIsLoading(false);
    } else {
      setObject(null);
      setAcl(null);
      setPreviewUrl(null);
      setIsLoading(true);
    }

    const res = await reqFetchObjectHead(fullPath);
    if (req !== requestRef.current) return;
    if (!res.success) {
      setIsLoading(false);
      if (res.status === 404) {
        objectViews.delete(cacheKey);
        setObject(null);
        setNotFound(true);
      } else {
        toast.error(
          cached
            ? "Couldn't refresh this object — showing the last loaded copy"
            : res.error_message || "Couldn't load this object",
        );
        if (!cached) setObject(null);
      }
      return;
    }
    setObject(res.data);
    setIsLoading(false);
    loadAcl(() => req === requestRef.current);

    // A new presigned URL changes the <img>/<video> src and re-downloads the
    // preview, so keep the cached one while it has plenty of life left.
    if (
      cached?.previewUrl &&
      cached.etag === res.data.ETag &&
      Date.now() - cached.previewAt < PREVIEW_REUSE_MS
    ) {
      return;
    }
    const presign = await reqFetchObjectPresign(fullPath);
    if (req !== requestRef.current) return;
    if (presign.success) {
      previewSignedAt.current = Date.now();
      setPreviewUrl(presign.data.url);
    }
  }, [fullPath, cacheKey, loadAcl]);

  // Keep the cache in step with what's on screen, including local edits
  // (an access change) between loads.
  useEffect(() => {
    if (!cacheKey || shownKey !== cacheKey || !object || isLoading) return;
    objectViews.set(cacheKey, {
      object,
      acl,
      previewUrl,
      etag: object.ETag,
      previewAt: previewSignedAt.current,
    });
  }, [cacheKey, shownKey, object, acl, previewUrl, isLoading]);

  const ready = shownKey === cacheKey;
  const fallback = !ready && cacheKey ? objectViews.get(cacheKey) : undefined;
  const view = ready
    ? { object, acl, previewUrl, isLoading }
    : {
        object: fallback?.object ?? null,
        acl: fallback?.acl ?? null,
        previewUrl: fallback?.previewUrl ?? null,
        isLoading: !fallback,
      };

  useEffect(() => {
    if (session && openedUnder.current === session.id) load();
    // session.id, not session: see the explorer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, fullPath]);

  const handleAccess = async (newAcl: string) => {
    setBusy(true);
    const res = await reqPutObjectACL(fullPath, newAcl);
    setBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to update access");
      return;
    }
    toast.success(
      newAcl === "public-read"
        ? "Object is now public"
        : "Object is now private",
    );
    setObject((o) =>
      o ? { ...o, Metadata: { ...o.Metadata, Acl: newAcl } } : o,
    );
    setModal(null);
    loadAcl();
  };

  const handleMove = async (newPath: string) => {
    setBusy(true);
    const res = await reqPutRenameObject(fullPath, newPath);
    setBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to move object");
      return;
    }
    toast.success(`Saved as ${baseName(newPath)}`);
    if (cacheKey) objectViews.delete(cacheKey);
    setModal(null);
    router.replace(objectHref(newPath));
  };

  const handleDelete = async () => {
    setBusy(true);
    const res = await reqDeleteObject(fullPath);
    setBusy(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to delete object");
      return;
    }
    toast.success(`Deleted ${baseName(fullPath)}`);
    if (cacheKey) objectViews.delete(cacheKey);
    setModal(null);
    // Not router.back(): this page is often opened from a shared link, and
    // "back" would leave the app entirely.
    router.push(explorerHref(parentPrefix(fullPath)));
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-secondary">
        <Spinner />
        Loading session…
      </div>
    );
  }

  return (
    <div className="pb-16">
      <ObjectInspectPanel
        object={view.object}
        objectACL={view.acl}
        fullPath={fullPath}
        previewUrl={view.previewUrl}
        publicUrl={publicObjectUrl(session, fullPath)}
        isLoading={view.isLoading}
        notFound={ready && notFound}
        onRename={() => setModal("rename")}
        onMove={() => setModal("move")}
        onChangeAccess={() => setModal("access")}
        onOpen={async () => {
          if (!(await openObject(fullPath)))
            toast.error("Couldn't open this object");
        }}
        onDownload={async () => {
          if (!(await downloadObject(fullPath, view.object?.ContentLength)))
            toast.error("Download failed");
        }}
        onCopyLink={() =>
          copyObjectLink(session, fullPath, view.object?.Metadata?.Acl)
        }
        onShare={() => setModal("share")}
        onDelete={() => setModal("delete")}
      />
      <ShareLinkModal
        open={modal === "share"}
        onClose={() => setModal(null)}
        session={session}
        objectKey={fullPath}
        acl={view.object?.Metadata?.Acl}
      />
      <ChangeAccessModal
        isOpen={modal === "access"}
        onClose={() => setModal(null)}
        onConfirm={handleAccess}
        currentAcl={view.object?.Metadata?.Acl || "private"}
        isLoading={busy}
      />
      <DeleteConfirmationModal
        isOpen={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        items={[fullPath]}
        isDeleting={busy}
      />
      <RenameModal
        isOpen={modal === "rename"}
        onClose={() => setModal(null)}
        onConfirm={handleMove}
        currentPath={fullPath}
        isLoading={busy}
      />
      <MoveObjectModal
        isOpen={modal === "move"}
        onClose={() => setModal(null)}
        onConfirm={handleMove}
        currentPath={fullPath}
        isLoading={busy}
      />
    </div>
  );
};

export default ObjectPage;
