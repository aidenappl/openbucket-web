"use client";

import { fetchApi } from "@/tools/axios.tools";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const Home = () => {
  const [folders, setFolders] = useState<null | string[]>(null);
  const [objects, setObjects] = useState<null | string[]>(null);
  const [prefix, setPrefix] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(["../"]);

  const listFolders = async (prefix: string): Promise<string[] | null> => {
    if (prefix == "/") {
      // If the prefix is just "/", we want to list the root folders
      prefix = "";
    }
    const response = await fetchApi<string[]>({
      url: "/aplb/folders",
      method: "GET",
      params: { prefix },
    });
    if (response.success) {
      return response.data;
    } else {
      return null;
    }
  };

  const listObjects = async (prefix: string): Promise<string[] | null> => {
    if (prefix == "/") {
      // If the prefix is just "/", we want to list the root folders
      prefix = "";
    }
    const response = await fetchApi<string[]>({
      url: `/aplb/objects`,
      method: "GET",
      params: { prefix },
    });
    if (response.success) {
      return response.data;
    } else {
      return null;
    }
  };

  const initialize = async (overPrefix?: string) => {
    setObjects(null);
    setFolders(null);
    const folders = await listFolders(overPrefix || prefix);
    setFolders(folders || []);
    const objects = await listObjects(overPrefix || prefix);
    setObjects(objects || []);
  };

  useEffect(() => {
    // Initialize the page
    initialize();
  }, []);

  return (
    <div>
      <h1 className="text-lg pb-10">Welcome to OpenBucket</h1>
      <button
        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
        onClick={async () => {
          document.getElementById("fileInput")?.click();
        }}
      >
        Upload File
      </button>
      <input
        type="file"
        ref={fileInputRef}
        id="fileInput"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const formData = new FormData();
            formData.append("file", file);
            // use all but first part of the prefix, as thats ../
            const prefixParts = breadcrumbs.slice(1);
            const prefix = prefixParts.join("/");
            console.log("Uploading file with prefix:", prefix);
            if (prefix && prefix.endsWith("/")) {
              formData.append("prefix", `${prefix}`);
            }

            fetchApi({
              url: "/aplb/object",
              method: "PUT",
              data: formData,
              headers: {
                "Content-Type": undefined, // let Axios remove the default and set it correctly
              },
            }).then((response) => {
              if (response.success) {
                initialize(prefix);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              } else {
                console.error("Upload failed:", response);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
            });
          }
        }}
      />
      <div className="w-full h-fit bg-gray-200 rounded-md p-3 mb-10">
        <div className="flex flex-wrap gap-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <span
              key={index}
              className="cursor-pointer text-blue-600 hover:underline"
              onClick={() => {
                if (breadcrumb == "../") {
                  setBreadcrumbs(["../"]);
                  setPrefix("");
                  initialize("/");
                } else {
                  setBreadcrumbs((prev) => prev.slice(0, index + 1));
                  setPrefix(breadcrumb);
                  initialize(breadcrumb);
                }
              }}
            >
              {breadcrumb}
            </span>
          ))}
        </div>
        {folders ? (
          folders.map((folder, index) => (
            <div
              key={index}
              className="cursor-pointer"
              onClick={() => {
                setPrefix(folder);
                setBreadcrumbs((prev) => [...prev, folder]);
                initialize(folder);
              }}
            >
              <h2 className="select-none">{folder}</h2>
            </div>
          ))
        ) : (
          <p>Loading folders...</p>
        )}
        {objects ? (
          objects.map((object, index) => (
            <div key={index} className="cursor-pointer">
              <Link
                href={`object/${object}`}
                className="select-none text-blue-600 font-medium"
              >
                {object}
              </Link>
            </div>
          ))
        ) : (
          <p>Loading objects...</p>
        )}
      </div>
    </div>
  );
};

export default Home;
