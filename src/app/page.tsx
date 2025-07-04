"use client";

import Button from "@/components/Button";
import Checkbox, { CheckboxState } from "@/components/Checkbox";
import MajorButton from "@/components/MajorButton";
import { fetchApi } from "@/tools/axios.tools";
import {
  faArrowUpRight,
  faCloudUpload,
  faDownload,
  faFile,
  faFolder,
  faFolderPlus,
  faShare,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";

const ROOT_FOLDER = "All Files";

const Home = () => {
  const [folders, setFolders] = useState<null | string[]>(null);
  const [objects, setObjects] = useState<null | string[]>(null);
  const [prefix, setPrefix] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([ROOT_FOLDER]);
  const [selectedObjects, setSelectedObjects] = useState<
    Record<string, boolean>
  >({});

  const totalItems = [...(folders || []), ...(objects || [])];
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

  return (
    <main className="w-full h-[calc(100vh-80px)]">
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
                  alert("Folder name cannot be empty.");
                  return;
                }
                const response = await fetchApi({
                  url: "/aplb/folder",
                  method: "POST",
                  data: { folder: folderName },
                });
                if (response.success) {
                  // Refresh the folder list
                  initialize();
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
            <div>
              {breadcrumbs.map((crumb, index) => (
                <span
                  key={crumb}
                  className="text-md text-gray-700 font-semibold cursor-pointer select-none"
                  onClick={() => {
                    // Update breadcrumbs
                    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
                    setBreadcrumbs(newBreadcrumbs);
                    // Update prefix
                    const newPrefix = newBreadcrumbs.slice(1).join("/") + "/";
                    setPrefix(newPrefix);
                    // Fetch new data
                    initialize(newPrefix);
                  }}
                >
                  {crumb}
                  {index < breadcrumbs.length - 1 ? " / " : ""}
                </span>
              ))}
            </div>
            {/* Right Controls */}
            <div></div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center my-3">
            {/* Left Controls */}
            <div className="flex gap-2">
              <Button faIcon={faArrowUpRight}>Share Selected</Button>
              <Button variant="light" faIcon={faDownload}>
                Download
              </Button>
              <Button
                variant="light"
                faIcon={faTrash}
                onClick={() => {
                  // get from selectedObjects
                  const selectedFolders = Object.keys(selectedObjects).filter(
                    (key) => selectedObjects[key] && folders?.includes(key)
                  );
                  // get objects from selectedObjects
                  const selectedObjectsList = Object.keys(
                    selectedObjects
                  ).filter(
                    (key) => selectedObjects[key] && objects?.includes(key)
                  );
                  if (
                    selectedFolders.length === 0 &&
                    selectedObjectsList.length === 0
                  ) {
                    alert("No folders or objects selected for deletion.");
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
              <p className="text-sm text-gray-800" hidden={selectedCount === 0}>
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
                        {folder}
                      </div>
                      <div>Size</div>
                      <div>Actions</div>
                    </div>
                  ))
                : null}
              {objects && objects.length > 0
                ? objects.map((object) => (
                    <div
                      key={object}
                      className="grid text-sm px-3 border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr] hover:bg-gray-50 cursor-pointer select-none"
                      onClick={() => {
                        console.log("Clicked on object:", object);
                        window.location.href = `/object/${encodeURIComponent(
                          object
                        )}`;
                      }}
                    >
                      <Checkbox
                        state={
                          selectedObjects[object] ? "checked" : "unchecked"
                        }
                        onToggle={() => toggleObject(object)}
                      />
                      <div className="flex gap-2 items-center">
                        <FontAwesomeIcon
                          icon={faFile}
                          className="text-gray-500 cursor-pointer"
                        />
                        {object}
                      </div>
                      <div>Size</div>
                      <div>Actions</div>
                    </div>
                  ))
                : null}
              {folders &&
              folders.length === 0 &&
              objects &&
              objects.length === 0 ? (
                <div className="text-sm text-gray-500 p-3">No items found.</div>
              ) : null}
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
      </div>
    </main>
  );
};

export default Home;
