"use client";

import Button from "@/components/Button";
import Checkbox, { CheckboxState } from "@/components/Checkbox";
import GridItem from "@/components/GridItem";
import MajorButton from "@/components/MajorButton";
import Spinner from "@/components/Spinner";
import ToggleOption from "@/components/ToggleOption";
import ToggleSelector from "@/components/ToggleSelector";
import UploadTracker from "@/components/UploadTracker";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import {
  addUpload,
  updateProgress,
  markCompleted,
  markError,
} from "@/store/slices/uploadSlice";
import { fetchApi } from "@/tools/axios.tools";
import {
  faArrowUpRight,
  faChevronRight,
  faCloudUpload,
  faDownload,
  faFile,
  faFolder,
  faFolderPlus,
  faGrid2,
  faListCheck,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { S3ObjectMetadata } from "@/types";
import { formatBytes } from "@/tools/formatBytes.tools";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import toast from "react-hot-toast";

const ROOT_FOLDER = "All Files";

const Home = () => {
  const dispatch = useDispatch();
  const [format, setFormat] = useState<"grid" | "list" | null>(null); // null = not ready
  const [folders, setFolders] = useState<null | string[]>(null);
  const [objects, setObjects] = useState<null | S3ObjectMetadata[]>(null);
  const [prefix, setPrefix] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([ROOT_FOLDER]);
  const [selectedObjects, setSelectedObjects] = useState<
    Record<string, boolean>
  >({});
  const router = useRouter();
  const { hasAPI } = usePermissions();

  useEffect(() => {
    if (format) {
      localStorage.setItem("viewFormat", format);
    }
  }, [format]);

  useEffect(() => {
    if (hasAPI === false) {
      router.replace("/bucket");
    }
  }, [hasAPI, router]);

  const totalItems = [...(folders || [])];
  const selectedCount = totalItems.filter(
    (item) => selectedObjects[item]
  ).length;

  const masterCheckboxState: CheckboxState =
    selectedCount === 0
      ? "unchecked"
      : selectedCount === totalItems.length
      ? "checked"
      : "indeterminate";

  const toggleAll = () => {
    const newState = masterCheckboxState !== "checked";

    const allItems = [...(folders || []), ...(objects || [])];
    const newSelection = Object.fromEntries(
      allItems.map((item) => [item, newState])
    );

    setSelectedObjects(newSelection);
  };

  const toggleObject = (key: string) => {
    setSelectedObjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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

  const listObjects = async (
    prefix: string
  ): Promise<S3ObjectMetadata[] | null> => {
    if (prefix == "/") {
      // If the prefix is just "/", we want to list the root folders
      prefix = "";
    }
    const response = await fetchApi<S3ObjectMetadata[]>({
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
    const saved = localStorage.getItem("viewFormat") as "grid" | "list";
    setFormat(saved || "list");
    setObjects(null);
    setFolders(null);
    const folders = await listFolders(overPrefix || prefix);
    setFolders(folders || []);
    const objects = await listObjects(overPrefix || prefix);
    setObjects(objects || []);
  };

  const deleteFolder = async (folderToDelete: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete the folder "${folderToDelete}"? This action cannot be undone.`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetchApi({
      url: `/aplb/folder`,
      method: "DELETE",
      params: { folder: folderToDelete },
    });
    if (response.success) {
      // Refresh the folder list
      initialize();
    } else {
      console.error("Failed to delete folder:", response);
    }
  };

  const deleteObject = async (objectToDelete: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete the object "${objectToDelete}"? This action cannot be undone.`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetchApi({
      url: `/aplb/object`,
      method: "DELETE",
      params: { key: objectToDelete },
    });
    if (response.success) {
      // Refresh the folder list
      initialize();
    } else {
      console.error("Failed to delete object:", response);
    }
  };

  useEffect(() => {
    // Initialize the page
    initialize();
  }, []);

  if (hasAPI === null) return <p>Loading...</p>;
  if (hasAPI === false) return null; // redirecting

  return (
    <main className="w-full h-[calc(100vh-80px)]">
      <UploadTracker />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 w-fit gap-x-3">
          <MajorButton
            label="Upload or Drop"
            faIcon={faCloudUpload}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          />
          <MajorButton
            label="Create Folder"
            variant="light"
            faIcon={faFolderPlus}
            onClick={async () => {
              const folderName = prompt("Enter folder name:");
              if (folderName) {
                // Create the new folder
                if (folderName.trim() === "") {
                  toast.error("Folder name cannot be empty.");
                  return;
                }
                const response = await fetchApi({
                  url: "/aplb/folder",
                  method: "POST",
                  data: { folder: folderName },
                });
                if (response.success) {
                  // Refresh the folder list
                  initialize("/");
                } else {
                  console.error("Failed to create folder:", response);
                }
              }
            }}
          />
        </div>

        <div className="bg-white w-full p-4 border border-gray-200 shadow-sm rounded-md">
          {/* Breadcrumbs & Controls */}
          <div className="flex justify-between items-center mb-3">
            {/* Left Breadcrumbs */}
            <div className="flex items-center gap-1 text-md text-gray-700 font-semibold select-none">
              {breadcrumbs.map((fullPath, index) => {
                const isLast = index === breadcrumbs.length - 1;

                // Display name = last non-empty part
                const parts = fullPath.split("/").filter(Boolean);
                const displayName =
                  index === 0 ? "All Files" : parts[parts.length - 1];

                return (
                  <span key={fullPath} className="flex items-center gap-1">
                    <span
                      className={`cursor-pointer hover:underline ${
                        isLast ? "text-gray-900" : ""
                      }`}
                      onClick={() => {
                        if (fullPath === ROOT_FOLDER) {
                          setBreadcrumbs([ROOT_FOLDER]);
                          setPrefix("");
                          initialize("/");
                          return;
                        }
                        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
                        const newPrefix = index === 0 ? "" : fullPath;
                        setPrefix(newPrefix);
                        initialize(newPrefix);
                      }}
                    >
                      {displayName}
                    </span>
                    {!isLast && (
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-gray-400 text-sm"
                      />
                    )}
                  </span>
                );
              })}
            </div>
            {/* Right Controls */}
            <div>
              <ToggleSelector
                value={format != null ? (format === "grid" ? 1 : 0) : -1}
                onChange={(index) => {
                  setFormat(index === 0 ? "list" : "grid");
                }}
              >
                <ToggleOption key={"list"}>
                  <FontAwesomeIcon icon={faListCheck} />
                </ToggleOption>
                <ToggleOption key={"grid"}>
                  <FontAwesomeIcon icon={faGrid2} />
                </ToggleOption>
              </ToggleSelector>
            </div>
          </div>

          {/* GRID FORMAT */}
          <div hidden={format !== "grid"}>
            {!folders ||
              (!objects ? (
                <div className="flex items-center justify-center h-32">
                  <Spinner />
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-4 gap-y-4 px-0">
                  {folders && folders.length > 0
                    ? folders.map((folder) => (
                        <GridItem
                          key={folder}
                          title={folder}
                          subtitle="x items"
                          icon={faFolder}
                          onClick={() => {
                            console.log("Clicked on folder:", folder);
                            // Update breadcrumbs
                            setBreadcrumbs((prev) => [...prev, folder]);
                            // Update prefix
                            const newPrefix = `${folder}`;
                            setPrefix(newPrefix);
                            // Fetch new data
                            initialize(newPrefix);
                          }}
                        />
                      ))
                    : null}
                  {objects && objects.length > 0
                    ? objects.map((object) => (
                        <GridItem
                          key={object.ETag}
                          title={object.Key}
                          subtitle="x items"
                          icon={faFile}
                          onClick={() => {
                            console.log("Clicked on object:", object);
                            window.location.href = `/object/${encodeURIComponent(
                              object.Key
                            )}`;
                          }}
                        />
                      ))
                    : null}
                </div>
              ))}
          </div>

          {/* LIST FORMAT */}
          <div hidden={format !== "list"}>
            {/* Controls */}
            <div className="flex justify-between items-center my-3">
              {/* Left Controls */}
              <div className="flex gap-2">
                <Button faIcon={faArrowUpRight} active={selectedCount > 0}>
                  Share Selected
                </Button>
                <Button
                  variant="light"
                  active={selectedCount > 0}
                  faIcon={faDownload}
                >
                  Download
                </Button>
                <Button
                  variant="light"
                  active={selectedCount > 0}
                  hoverVariant="danger"
                  faIcon={faTrash}
                  onClick={() => {
                    // get from selectedObjects
                    const selectedFolders = Object.keys(selectedObjects).filter(
                      (key) => selectedObjects[key] && folders?.includes(key)
                    );
                    const selectedObjectsList = Object.keys(
                      selectedObjects
                    ).filter(
                      (key) => selectedObjects[key] && !folders?.includes(key)
                    );
                    if (
                      selectedFolders.length === 0 &&
                      selectedObjectsList.length === 0
                    ) {
                      toast.error("No items selected for deletion.");
                      return;
                    }
                    for (const folder of selectedFolders) {
                      deleteFolder(folder);
                    }

                    for (const object of selectedObjectsList) {
                      deleteObject(object);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
              {/* Right Data */}
              <div>
                <p
                  className="text-sm text-gray-800"
                  hidden={selectedCount === 0}
                >
                  {selectedCount} selected
                </p>
              </div>
            </div>
            {/* Files Table */}
            <div className="border border-gray-200">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr] text-sm font-semibold border-b border-gray-300 h-[40px] items-center px-3">
                <Checkbox state={masterCheckboxState} onToggle={toggleAll} />
                <div>Name</div>
                <div>Size</div>
                <div>Actions</div>
              </div>
              {/* Table Objects/Folders */}
              {!objects || !folders ? (
                <div className="flex items-center justify-center h-32">
                  <Spinner />
                </div>
              ) : (
                <div>
                  {folders && folders.length > 0
                    ? folders.map((folder) => (
                        <div
                          key={folder}
                          className="grid text-sm px-3  border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr] hover:bg-gray-50 cursor-pointer select-none"
                          onClick={() => {
                            console.log("Clicked on folder:", folder);
                            // Update breadcrumbs
                            setBreadcrumbs((prev) => [...prev, folder]);
                            // Update prefix
                            const newPrefix = `${folder}`;
                            setPrefix(newPrefix);
                            // Fetch new data
                            initialize(newPrefix);
                          }}
                        >
                          <Checkbox
                            state={
                              selectedObjects[folder] ? "checked" : "unchecked"
                            }
                            onToggle={() => toggleObject(folder)}
                          />
                          <div className="flex gap-2 items-center">
                            <FontAwesomeIcon
                              icon={faFolder}
                              className="text-gray-500 cursor-pointer"
                            />
                            <span className="block text-ellipsis whitespace-nowrap overflow-hidden">
                              {folder.split("/")[folder.split("/").length - 2]}
                            </span>
                          </div>
                          <div>Size</div>
                          <div>Actions</div>
                        </div>
                      ))
                    : null}
                  {objects && objects.length > 0
                    ? objects.map((object) => (
                        <div
                          key={object.ETag}
                          className="grid text-sm px-3 border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr] hover:bg-gray-50 cursor-pointer select-none"
                          onClick={() => {
                            console.log("Clicked on object:", object);
                            window.location.href = `/object/${encodeURIComponent(
                              object.Key
                            )}`;
                          }}
                        >
                          <Checkbox
                            state={
                              selectedObjects[object.ETag]
                                ? "checked"
                                : "unchecked"
                            }
                            onToggle={() => toggleObject(object.ETag)}
                          />
                          <div className="flex gap-2 items-center line-clamp-1 pr-8">
                            <FontAwesomeIcon
                              icon={faFile}
                              className="text-gray-500 cursor-pointer"
                            />
                            <span className="block text-ellipsis whitespace-nowrap overflow-hidden">
                              {
                                object.Key.split("/")[
                                  object.Key.split("/").length - 1
                                ]
                              }
                            </span>
                          </div>
                          <div>{formatBytes(object.Size)}</div>
                          <div>Actions</div>
                        </div>
                      ))
                    : null}
                  {folders &&
                  folders.length === 0 &&
                  objects &&
                  objects.length === 0 ? (
                    <div className="text-sm text-gray-500 p-3">
                      No items found.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          id="fileInput"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const id = uuidv4();
              const startedAt = Date.now();

              dispatch(
                addUpload({
                  id,
                  fileName: file.name,
                  progress: 0,
                  status: "uploading",
                  startedAt,
                })
              );

              const formData = new FormData();
              formData.append("file", file);
              // get the last prefix from breadcrumbs
              const prefix = breadcrumbs[breadcrumbs.length - 1];
              console.log("Uploading file with prefix:", prefix);
              if (prefix && prefix.endsWith("/")) {
                formData.append("prefix", `${prefix}`);
              }

              fetchApi({
                url: "/aplb/object",
                method: "PUT",
                data: formData,
                onUploadProgress: (event) => {
                  const progress = Math.round(
                    (event.loaded * 100) / (event?.total || 1)
                  );
                  dispatch(updateProgress({ id, progress }));
                  // You can dispatch an action to update the upload progress in your store here
                },
                headers: { "Content-Type": "multipart/form-data" },
              }).then((response) => {
                if (response.success) {
                  dispatch(markCompleted({ id }));
                  initialize();
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                } else {
                  dispatch(markError({ id, error: response.error }));
                  console.error("Upload failed:", response);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              });
            }
          }}
        />
      </div>
    </main>
  );
};

export default Home;
