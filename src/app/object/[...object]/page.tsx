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

// The API's anonymous-read grantee; shown as the Access row, not as a grant.
const ALL_USERS_URI = "http://openbucket/groups/global/AllUsers";

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
    "access" | "delete" | "rename" | "move" | null
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

  const loadAcl = useCallback(async () => {
    const res = await reqFetchObjectACL(fullPath);
    if (res.success) {
      setAcl({
        ...res.data,
        Grants: (res.data.Grants ?? []).filter(
          (g) => g.Grantee.URI !== ALL_USERS_URI,
        ),
      });
    }
  }, [fullPath]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    setPreviewUrl(null);
    const res = await reqFetchObjectHead(fullPath);
    if (!res.success) {
      setObject(null);
      setIsLoading(false);
      if (res.status === 404) setNotFound(true);
      else toast.error(res.error_message || "Couldn't load this object");
      return;
    }
    setObject(res.data);
    setIsLoading(false);
    loadAcl();
    const presign = await reqFetchObjectPresign(fullPath);
    if (presign.success) setPreviewUrl(presign.data.url);
  }, [fullPath, loadAcl]);

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
        object={object}
        objectACL={acl}
        fullPath={fullPath}
        previewUrl={previewUrl}
        publicUrl={publicObjectUrl(session, fullPath)}
        isLoading={isLoading}
        notFound={notFound}
        onRename={() => setModal("rename")}
        onMove={() => setModal("move")}
        onChangeAccess={() => setModal("access")}
        onOpen={async () => {
          if (!(await openObject(fullPath)))
            toast.error("Couldn't open this object");
        }}
        onDownload={async () => {
          if (!(await downloadObject(fullPath, object?.ContentLength)))
            toast.error("Download failed");
        }}
        onCopyLink={() =>
          copyObjectLink(session, fullPath, object?.Metadata?.Acl)
        }
        onDelete={() => setModal("delete")}
      />
      <ChangeAccessModal
        isOpen={modal === "access"}
        onClose={() => setModal(null)}
        onConfirm={handleAccess}
        currentAcl={object?.Metadata?.Acl || "private"}
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
