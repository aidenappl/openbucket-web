"use client";

import Spinner from "@/components/Spinner";
import ChangeAccessModal from "@/components/ChangeAccessModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import RenameModal from "@/components/RenameModal";
import MoveObjectModal from "@/components/MoveObjectModal";
import ObjectInspectPanel from "@/components/ObjectInspectPanel";
import { selectCurrentSession } from "@/store/slices/sessionSlice";
import { Grant, ObjectACLResponse, ObjectHead } from "@/types";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  reqDeleteObject,
  reqFetchObjectACL,
  reqFetchObjectHead,
  reqFetchObjectPresign,
  reqPutObjectACL,
  reqPutRenameObject,
} from "@/services/object.service";

const ObjectPage = () => {
  const router = useRouter();
  const [object, setObject] = useState<ObjectHead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [initialSessionBucket, setInitialSessionBucket] = useState<
    string | null
  >(null);
  const [objectACL, setObjectACL] = useState<ObjectACLResponse | null>(null);
  const [isChangeAccessOpen, setIsChangeAccessOpen] = useState(false);
  const [isChangingAccess, setIsChangingAccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const params = useParams();
  const currentSession = useSelector(selectCurrentSession);
  const { getParentPath } = useBreadcrumbs();
  const fullPath = decodeURIComponent(
    Array.isArray(params.object)
      ? params.object.join("/")
      : (params.object ?? ""),
  );

  // Check if session is available and set initial session
  useEffect(() => {
    if (currentSession) {
      setSessionReady(true);
      // Set initial session bucket if not already set
      if (initialSessionBucket === null && currentSession?.bucket) {
        setInitialSessionBucket(currentSession.bucket);
      }
    }
  }, [currentSession, initialSessionBucket]);

  const viewObject = async () => {
    if (!sessionReady) return;
    const res = await generatePresignedUrl(fullPath);
    const url = res?.url || null;
    if (url) {
      window.open(url, "_blank");
    }
  };

  const deleteObject = async () => {
    if (!sessionReady || !currentSession?.bucket) return;
    setIsDeleting(true);
    const res = await reqDeleteObject(fullPath);
    if (res.success) {
      router.back();
    } else {
      console.error("Error deleting object:", res);
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  const generatePresignedUrl = async (key: string) => {
    if (!currentSession) return null;

    const res = await reqFetchObjectPresign(key);
    if (res.success) {
      return res.data;
    } else {
      console.error("Error generating presigned URL:", res);
      return null;
    }
  };

  const getObjectACL = useCallback(
    async (key: string) => {
      if (!currentSession) return null;

      const res = await reqFetchObjectACL(key);
      if (res.success) {
        return res.data;
      } else {
        console.error("Error fetching object ACL:", res);
        return null;
      }
    },
    [currentSession],
  );

  const filterGrants = useCallback((grants: Grant[] | null) => {
    if (!grants) return [];
    return grants.filter(
      (grant) =>
        grant.Grantee.URI !== "http://openbucket/groups/global/AllUsers",
    );
  }, []);

  const renameObject = async (newPath: string) => {
    if (!sessionReady || !currentSession) return;
    setIsRenaming(true);
    const res = await reqPutRenameObject(fullPath, newPath);
    if (res.success) {
      router.push(`/object/${encodeURIComponent(newPath)}`);
    } else {
      console.error("Error renaming object:", res);
    }
    setIsRenaming(false);
    setIsRenameOpen(false);
  };

  const moveObject = async (newPath: string) => {
    if (!sessionReady || !currentSession) return;
    setIsMoving(true);
    const res = await reqPutRenameObject(fullPath, newPath);
    if (res.success) {
      router.push(`/object/${encodeURIComponent(newPath)}`);
    } else {
      console.error("Error moving object:", res);
    }
    setIsMoving(false);
    setIsMoveOpen(false);
  };

  const handleConfirmAccess = async (newAcl: string) => {
    if (!sessionReady || !currentSession) return;
    setIsChangingAccess(true);
    const res = await reqPutObjectACL(fullPath, newAcl);
    if (res.success) {
      // Update local metadata so badge reflects change immediately
      if (object) {
        setObject({ ...object, Metadata: { ...object.Metadata, Acl: newAcl } });
      }
      // Refresh ACL grants
      const acl = await getObjectACL(fullPath);
      if (acl) {
        acl.Grants = filterGrants(acl.Grants);
        setObjectACL(acl);
      }
    }
    setIsChangingAccess(false);
    setIsChangeAccessOpen(false);
  };

  const initialize = useCallback(async () => {
    if (!sessionReady || !currentSession) return;

    setIsLoading(true);
    setPreviewUrl(null);

    const res = await reqFetchObjectHead(fullPath);

    if (res.success) {
      console.log("Object data:", res.data);
      setObject(res.data);
    } else {
      console.error("Error fetching object:", res);
      if (res.status === 404) {
        router.back(); // Redirect to the previous page if object not found
      }
      setObject(null);
    }

    const acl = await getObjectACL(fullPath);
    if (acl) {
      const filteredGrants = filterGrants(acl.Grants);
      acl.Grants = filteredGrants;
      setObjectACL(acl);
    }

    setIsLoading(false);

    // Generate preview URL after loading completes
    const presign = await generatePresignedUrl(fullPath);
    if (presign?.url) {
      setPreviewUrl(presign.url);
    }
  }, [
    sessionReady,
    currentSession,
    fullPath,
    router,
    filterGrants,
    getObjectACL,
  ]);

  useEffect(() => {
    // Don't initialize if session has changed (we'll be redirecting)
    const sessionChanged =
      currentSession?.bucket &&
      initialSessionBucket !== null &&
      currentSession.bucket !== initialSessionBucket;

    if (sessionReady && !sessionChanged) {
      initialize();
    }
  }, [
    fullPath,
    sessionReady,
    currentSession,
    router,
    initialize,
    currentSession?.bucket,
    initialSessionBucket,
  ]);

  // Redirect to root when session changes (but not on initial load)
  useEffect(() => {
    if (
      currentSession?.bucket &&
      initialSessionBucket !== null &&
      currentSession.bucket !== initialSessionBucket
    ) {
      router.push("/");
    }
  }, [currentSession?.bucket, initialSessionBucket, router]);

  // Show loading spinner while waiting for session
  if (!sessionReady || !currentSession) {
    return (
      <main className="w-full h-[calc(100vh-80px)] flex items-center justify-center gap-2 text-slate-500">
        <Spinner />
        <span className="text-sm">Waiting for session...</span>
      </main>
    );
  }

  return (
    <main className="w-full min-h-[calc(100vh-80px)] h-fit mb-10">
      <div className="flex flex-col gap-5">
        <ObjectInspectPanel
          object={object}
          objectACL={objectACL}
          fullPath={fullPath}
          previewUrl={previewUrl}
          endpoint={currentSession.endpoint}
          bucket={currentSession.bucket}
          isLoading={isLoading}
          onBack={() => {
            const parentPath = getParentPath(fullPath);
            router.push(
              parentPath ? `/?folder=${encodeURIComponent(parentPath)}` : "/",
            );
          }}
          onRename={() => setIsRenameOpen(true)}
          onMove={() => setIsMoveOpen(true)}
          onChangeAccess={() => setIsChangeAccessOpen(true)}
          onPreview={viewObject}
          onDelete={() => setIsDeleteModalOpen(true)}
        />
      </div>
      <ChangeAccessModal
        isOpen={isChangeAccessOpen}
        onClose={() => setIsChangeAccessOpen(false)}
        onConfirm={handleConfirmAccess}
        currentAcl={object?.Metadata?.Acl || "private"}
        isLoading={isChangingAccess}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteObject}
        items={[fullPath]}
        isDeleting={isDeleting}
      />
      <RenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onConfirm={renameObject}
        currentPath={fullPath}
        isLoading={isRenaming}
      />
      <MoveObjectModal
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        onConfirm={moveObject}
        currentPath={fullPath}
        isLoading={isMoving}
      />
    </main>
  );
};

export default ObjectPage;
