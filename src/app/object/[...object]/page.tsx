"use client";

import { fetchApi } from "@/tools/axios.tools";
import { PresignResponse, S3Object } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ObjectPage = () => {
  const router = useRouter();
  const [object, setObject] = useState<S3Object | null>(null);
  const params = useParams();
  const fullPath = decodeURIComponent(
    Array.isArray(params.object) ? params.object.join("/") : params.object ?? ""
  );

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
    <div>
      <h1>Object Page</h1>
      <p>Object ID: {fullPath}</p>
      <div>
        <button
          className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
          onClick={async () => {
            const res = await generatePresignedUrl(fullPath);
            const url = res?.url || null;
            if (url) {
              window.open(url, "_blank");
            }
          }}
        >
          View
        </button>
        <button
          className="px-4 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-700 transition-colors cursor-pointer"
          onClick={() => {
            deleteObject();
          }}
        >
          Delete
        </button>
      </div>
      {object && (
        <div>
          <h2>Object Metadata</h2>
          <pre>{JSON.stringify(object, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ObjectPage;
