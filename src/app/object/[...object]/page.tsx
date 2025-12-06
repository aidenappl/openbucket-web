"use client";

import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import { selectCurrentSession } from "@/store/slices/sessionSlice";
import { fetchApi } from "@/tools/axios.tools";
import { formatBytes } from "@/tools/formatBytes.tools";
import { formatDate } from "@/tools/formatDate.tools";
import { Grant, ObjectACLResponse, PresignResponse, S3Object } from "@/types";
import {
  faChevronLeft,
  faEdit,
  faFile,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useSelector } from "react-redux";

const ObjectPage = () => {
  const router = useRouter();
  const [object, setObject] = useState<S3Object | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [initialSessionBucket, setInitialSessionBucket] = useState<
    string | null
  >(null);
  const [objectACL, setObjectACL] = useState<ObjectACLResponse | null>(null);
  const [objectPublic, setObjectPublic] = useState<string | boolean>(false);
  const params = useParams();
  const currentSession = useSelector(selectCurrentSession);
  const { getParentPath } = useBreadcrumbs();
  const fullPath = decodeURIComponent(
    Array.isArray(params.object) ? params.object.join("/") : params.object ?? ""
  );

  // Check if session is available and set initial session
  useEffect(() => {
    if (currentSession?.token) {
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
    if (!sessionReady || !currentSession?.token) return;

    const res = await fetchApi<{ success: boolean }>(
      {
        url: `/${currentSession?.bucket}/object`,
        method: "DELETE",
        params: { key: fullPath },
      },
      currentSession?.token
    );
    if (res.success) {
      console.log("Object deleted successfully");
      router.back(); // Redirect to the previous page after deletion
    } else {
      console.error("Error deleting object:", res);
    }
  };

  const generatePresignedUrl = async (key: string) => {
    if (!currentSession?.token) return null;

    const res = await fetchApi<PresignResponse>(
      {
        url: `/${currentSession?.bucket}/object/presign`,
        method: "GET",
        params: { key },
      },
      currentSession?.token
    );
    if (res.success) {
      return res.data;
    } else {
      console.error("Error generating presigned URL:", res);
      return null;
    }
  };

  const getObjectACL = useCallback(
    async (key: string) => {
      if (!currentSession?.token) return null;

      const res = await fetchApi<ObjectACLResponse>(
        {
          url: `/${currentSession?.bucket}/object/acl`,
          method: "GET",
          params: { key },
        },
        currentSession?.token
      );

      if (res.success) {
        return res.data;
      } else {
        console.error("Error fetching object ACL:", res);
        return null;
      }
    },
    [currentSession?.token, currentSession?.bucket]
  );

  const filterObjectACLs = useCallback(async (acls: Grant[] | null) => {
    if (!acls) return null;
    const filtered = acls.filter(
      (grant) =>
        grant.Grantee.URI !== "http://openbucket/groups/global/AllUsers"
    );
    const publicACL = acls.find(
      (grant) =>
        grant.Grantee.URI === "http://openbucket/groups/global/AllUsers"
    );

    setObjectPublic(publicACL ? publicACL.Permission : false);
    return filtered;
  }, []);

  const renameObject = async () => {
    if (!sessionReady || !currentSession?.token) return;

    const response = window.prompt("Enter new name for the object:");
    console.log("Rename response:", response);
    if (response && response.trim() !== "") {
      const res = await fetchApi<{ success: boolean }>(
        {
          url: `/${currentSession?.bucket}/object/rename`,
          method: "PUT",
          params: { key: fullPath, newKey: response.trim() },
        },
        currentSession?.token
      );
      if (res.success) {
        console.log("Object renamed successfully");
        router.push(`/object/${encodeURIComponent(response.trim())}`);
      } else {
        console.error("Error renaming object:", res);
      }
    }
  };

  const changePublicAccess = async () => {
    if (!sessionReady || !currentSession?.token) return;

    const newAccess = window.prompt("Enter new public access (None, Read):");
    console.log("Change public access response:", newAccess);
    if (newAccess && ["None", "Read"].includes(newAccess)) {
      const res = await fetchApi<{ success: boolean }>(
        {
          url: `/${currentSession?.bucket}/object/acl/public`,
          method: "PUT",
          params: { key: fullPath, access: newAccess },
        },
        currentSession?.token
      );
      if (res.success) {
        console.log("Public access changed successfully");
        // Refresh ACLs
        const acl = await getObjectACL(fullPath);
        if (acl) {
          const filteredGrants = await filterObjectACLs(acl.Grants);
          acl.Grants = filteredGrants || [];
          setObjectACL(acl);
        }
      } else {
        console.error("Error changing public access:", res);
      }
    }
  };

  const initialize = useCallback(async () => {
    if (!sessionReady || !currentSession?.token) return;

    setIsLoading(true);

    const res = await fetchApi<S3Object>(
      {
        url: `/${currentSession?.bucket}/object`,
        method: "GET",
        params: { key: fullPath },
      },
      currentSession?.token
    );

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
      const filteredGrants = await filterObjectACLs(acl.Grants);
      acl.Grants = filteredGrants || [];
      setObjectACL(acl);
    }

    setIsLoading(false);
  }, [
    sessionReady,
    currentSession?.token,
    currentSession?.bucket,
    fullPath,
    router,
    filterObjectACLs,
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
    currentSession?.token,
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
  if (!sessionReady || !currentSession?.token) {
    return (
      <main className="w-full h-[calc(100vh-80px)]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col bg-white w-full p-4 border border-gray-200 shadow-sm rounded-md">
            <div className="flex items-center justify-center h-32">
              <Spinner />
              <span className="ml-2 text-slate-600">
                Waiting for session...
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="w-full min-h-[calc(100vh-80px)] h-fit mb-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col bg-white w-full p-4 border border-gray-200 shadow-sm rounded-md">
          {/* Object heading */}
          <div className="flex justify-between border-b border-gray-200 pb-4 gap-10 items-center">
            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <a
                className="flex items-center gap-1 text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-900"
                onClick={() => {
                  const parentPath = getParentPath(fullPath);
                  const url = parentPath
                    ? `/?folder=${encodeURIComponent(parentPath)}`
                    : "/";
                  router.push(url);
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                Back
              </a>
              <div className="flex gap-2 items-center mt-2">
                <FontAwesomeIcon
                  icon={faFile}
                  className="text-slate-800 text-xl"
                />
                <h1 className="text-xl font-semibold line-clamp-1 truncate">
                  {fullPath.split("/").pop()}
                </h1>
              </div>
              <p className="text-slate-600 text-sm mt-0.5">
                {object ? (
                  <>Last Modified: {formatDate(object?.LastModified || "")}</>
                ) : (
                  <Skeleton width={300} />
                )}
              </p>
            </div>

            {/* Button Section */}
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => changePublicAccess()} variant="light">
                Change Public Access
              </Button>
              <Button onClick={() => viewObject()} variant="light">
                Preview
              </Button>
              <Button onClick={() => deleteObject()} hoverVariant="danger">
                Delete
              </Button>
            </div>
          </div>

          {/* Object Metadata & Content */}
          <div className="pt-4">
            {isLoading && (
              <div className="flex items-center justify-center h-32">
                <Spinner />
                <span className="ml-2 text-slate-600">Loading object...</span>
              </div>
            )}
            {!isLoading && !object && (
              <div className="flex items-center justify-center h-32">
                <span className="text-slate-600">Object not found</span>
              </div>
            )}
            {!isLoading && object && (
              <div className="flex flex-col ">
                <p className="break-all">
                  <strong>Full Path:</strong> {fullPath || "N/A"}
                  <FontAwesomeIcon
                    icon={faEdit}
                    className="pl-2 text-slate-500 cursor-pointer hover:text-slate-900"
                    onClick={renameObject}
                  />
                </p>
                <p>
                  <strong>Size:</strong>{" "}
                  {formatBytes(object?.ContentLength || 0)}
                </p>
                <p>
                  <strong>ETag:</strong>{" "}
                  {object?.ETag!.replaceAll('"', "") || "N/A"}
                </p>
                <p>
                  <strong>Owner:</strong> {objectACL?.Owner.DisplayName}{" "}
                  <i>{objectACL?.Owner.ID}</i>
                </p>
                <p>
                  <strong>Public:</strong>
                  <a className="ml-2 px-2 py-1 bg-blue-100 rounded-md font-semibold text-sm">
                    {objectPublic}
                  </a>
                </p>
                <strong>Grants:</strong>
                {objectACL?.Grants.map((grant, index) => (
                  <div
                    key={"grant_" + index}
                    className="bg-slate-100 w-fit py-2 px-4 rounded-md"
                  >
                    <p>
                      <strong>Grantee:</strong>{" "}
                      {grant.Grantee.DisplayName || grant.Grantee.URI}{" "}
                    </p>
                    <p>
                      {" "}
                      <strong>Permission:</strong> {grant.Permission}{" "}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ObjectPage;
