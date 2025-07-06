"use client";

import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import { fetchApi } from "@/tools/axios.tools";
import { formatBytes } from "@/tools/formatBytes.tools";
import { formatDate } from "@/tools/formatDate.tools";
import { PresignResponse, S3Object } from "@/types";
import { faChevronLeft, faFile } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

const ObjectPage = () => {
  const router = useRouter();
  const [object, setObject] = useState<S3Object | null>(null);
  const params = useParams();
  const fullPath = decodeURIComponent(
    Array.isArray(params.object) ? params.object.join("/") : params.object ?? ""
  );

  const viewObject = async () => {
    const res = await generatePresignedUrl(fullPath);
    const url = res?.url || null;
    if (url) {
      window.open(url, "_blank");
    }
  };

  const getObject = async (key: string) => {
    const res = await fetchApi<S3Object>({
      url: "/aplb/object",
      method: "GET",
      params: { key },
    });
    if (res.success) {
      return res.data;
    } else {
      console.error("Error fetching object:", res);
      if (res.status === 404) {
        router.back(); // Redirect to the previous page if object not found
      }
      return null;
    }
  };

  const deleteObject = async () => {
    const res = await fetchApi<{ success: boolean }>({
      url: "/aplb/object",
      method: "DELETE",
      params: { key: fullPath },
    });
    if (res.success) {
      console.log("Object deleted successfully");
      router.back(); // Redirect to the previous page after deletion
    } else {
      console.error("Error deleting object:", res);
    }
  };

  const generatePresignedUrl = async (key: string) => {
    const res = await fetchApi<PresignResponse>({
      url: "/aplb/object/presign",
      method: "GET",
      params: { key },
    });
    if (res.success) {
      return res.data;
    } else {
      console.error("Error generating presigned URL:", res);
      return null;
    }
  };

  const initialize = async () => {
    const response = await getObject(fullPath || "");
    console.log("Object data:", response);
    setObject(response);
  };

  useEffect(() => {
    initialize();
  }, [fullPath]);
  return (
    <main className="w-full h-[calc(100vh-80px)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col bg-white w-full p-4 border border-gray-200 shadow-sm rounded-md">
          {/* Object heading */}
          <div className="flex justify-between border-b border-gray-200 pb-4 gap-4 items-center">
            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <a
                className="flex items-center gap-1 text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-900"
                onClick={() => {
                  router.back();
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
              <Button onClick={() => viewObject()} variant="light">
                View
              </Button>
              <Button onClick={() => deleteObject()} hoverVariant="danger">
                Delete
              </Button>
            </div>
          </div>

          {/* Object Metadata & Content */}
          <div className="pt-4">
            {!object && (
              <div className="flex items-center justify-center h-32">
                <Spinner />
              </div>
            )}
            {object && (
              <div className="flex flex-col ">
                <p className="break-all">
                  <strong>Full Name:</strong> {fullPath || "N/A"}
                </p>
                <p>
                  <strong>Size:</strong>{" "}
                  {formatBytes(object?.ContentLength || 0)}
                </p>
                <p>
                  <strong>ETag:</strong>{" "}
                  {object?.ETag!.replaceAll('"', "") || "N/A"}
                </p>
                <strong>Metadata:</strong>
                <pre>{JSON.stringify(object, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ObjectPage;
