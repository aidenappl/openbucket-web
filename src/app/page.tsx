"use client";

import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import GridItem from "@/components/GridItem";
import MajorButton from "@/components/MajorButton";
import Spinner from "@/components/Spinner";
import ToggleOption from "@/components/ToggleOption";
import ToggleSelector from "@/components/ToggleSelector";
import UploadTracker from "@/components/UploadTracker";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import {
  addUpload,
  updateProgress,
  markCompleted,
  markError,
} from "@/store/slices/uploadSlice";
import { selectCurrentSession } from "@/store/slices/sessionSlice";
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
import { useEffect, useRef, useCallback, useState } from "react";
import { formatBytes } from "@/tools/formatBytes.tools";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/tools/formatDate.tools";
import { useBucketData } from "@/hooks/useBucketData";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useSelection } from "@/hooks/useSelection";
import { useBucketActions } from "@/hooks/useBucketActions";
import { useViewFormat } from "@/hooks/useViewFormat";
import FullscreenDropZone from "@/components/FullscreenDropZone";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import Skeleton from "react-loading-skeleton";
import toast from "react-hot-toast";
import {
  reqDeleteObject,
  reqFetchObjectPresign,
  reqPutObjectWithProgress,
} from "@/services/object.service";
import { reqDeleteFolder } from "@/services/folder.service";

const Home = () => {
  const dispatch = useDispatch();
  const currentSession = useSelector(selectCurrentSession);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { hasAPI } = usePermissions();
  const [isFullscreenDragActive, setIsFullscreenDragActive] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const previousSessionIdRef = useRef<number | null>(null);

  // Custom hooks
  const { format, setFormat } = useViewFormat();
  const { folders, objects, metadata, loadBucketData } = useBucketData();
  const {
    breadcrumbs,
    prefix,
    navigateToFolder,
    navigateToBreadcrumb,
    resetToRoot,
    setFromPath,
  } = useBreadcrumbs();
  const {
    selectedObjects,
    toggleObject,
    toggleAll,
    clearSelection,
    getSelectedItems,
    getSelectionStats,
  } = useSelection();
  const { createFolder } = useBucketActions();

  // URL parameter management
  const updateUrlParams = useCallback(
    (folderPath: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (folderPath) {
        params.set("folder", folderPath);
      } else {
        params.delete("folder");
      }
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Initialize from URL params (only on initial load or when URL changes)
  useEffect(() => {
    const folderParam = searchParams.get("folder");
    if (currentSession?.bucket) {
      if (folderParam) {
        setFromPath(folderParam, (newPrefix) => {
          loadBucketData(currentSession.bucket, newPrefix);
        });
      } else {
        resetToRoot((newPrefix) => {
          loadBucketData(currentSession.bucket, newPrefix);
        });
      }
    }
  }, [
    searchParams,
    currentSession?.id,
    currentSession?.bucket,
    setFromPath,
    loadBucketData,
    resetToRoot,
  ]);

  // Get all items for selection (need to separate folder and object keys)
  const folderKeys = folders || [];
  const objectKeys = (objects || []).map((obj) => obj.Key);
  const allKeys = [...folderKeys, ...objectKeys];
  const { selectedCount, masterCheckboxState } = getSelectionStats(allKeys);

  // Handle bulk selection
  const handleToggleAll = () => {
    // event parameter for compatibility with Checkbox component
    const newState = masterCheckboxState !== "checked";
    toggleAll(allKeys, newState);
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (folderName && currentSession?.bucket) {
      const success = await createFolder(folderName);
      if (success) {
        loadBucketData(currentSession.bucket, prefix);
      }
    }
  };

  // Get display names for selected items
  const getSelectedDisplayNames = (): string[] => {
    const selectedFolders = getSelectedItems(folderKeys);
    const selectedObjectKeys = getSelectedItems(objectKeys);

    return [...selectedFolders, ...selectedObjectKeys];
  };

  // Handle download selected objects
  const handleDownload = async () => {
    if (!currentSession?.bucket || selectedCount === 0) return;
    const selectedObjectKeys = getSelectedItems(objectKeys);
    if (selectedObjectKeys.length === 0) return;

    for (const key of selectedObjectKeys) {
      const res = await reqFetchObjectPresign(key);
      if (res.success && res.data?.url) {
        const a = document.createElement("a");
        a.href = res.data.url;
        a.download = key.split("/").pop() || key;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  // Handle bulk delete - show confirmation modal
  const handleBulkDelete = () => {
    if (!currentSession?.bucket || selectedCount === 0) return;
    setIsDeleteModalOpen(true);
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!currentSession?.bucket) return;

    setIsDeleting(true);

    const selectedFolders = getSelectedItems(folderKeys);
    const selectedObjectKeys = getSelectedItems(objectKeys);

    try {
      // Delete folders and objects without confirmation prompts
      const deletePromises = [
        ...selectedFolders.map(async (folder) => {
          const response = await reqDeleteFolder(folder);
          return response.success;
        }),
        ...selectedObjectKeys.map(async (objectKey) => {
          const response = await reqDeleteObject(objectKey);
          return response.success;
        }),
      ];

      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((result: boolean) => result);

      if (allSuccessful) {
        toast.success(
          `Successfully deleted ${selectedCount} item${
            selectedCount === 1 ? "" : "s"
          }`,
        );
        clearSelection();
        loadBucketData(currentSession.bucket, prefix);
      } else {
        toast.error("Some items failed to delete");
      }
    } catch (error) {
      console.error("Error during bulk deletion:", error);
      toast.error("Failed to delete items");
    }

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!currentSession?.bucket) return;

    const id = uuidv4();
    const startedAt = Date.now();

    dispatch(
      addUpload({
        id,
        fileName: file.name,
        progress: 0,
        status: "uploading",
        startedAt,
      }),
    );

    reqPutObjectWithProgress({
      file,
      prefix,
      onUploadProgress: (progress) => {
        dispatch(updateProgress({ id, progress }));
      },
    }).then((response) => {
      if (response.success) {
        dispatch(markCompleted({ id }));
        loadBucketData(currentSession.bucket, prefix);
      } else {
        dispatch(markError({ id, error: response.error }));
        console.error("Upload failed:", response);
      }
    });
  };

  // Effects
  useEffect(() => {
    if (hasAPI === false) {
      router.replace("/bucket");
    }
  }, [hasAPI, router]);

  // Reset to root when session changes (but not on initial load)
  useEffect(() => {
    if (currentSession?.id != null) {
      if (
        previousSessionIdRef.current !== null &&
        previousSessionIdRef.current !== currentSession.id
      ) {
        resetToRoot((newPrefix) => {
          updateUrlParams(newPrefix);
        });
      }
      previousSessionIdRef.current = currentSession.id;
    }
  }, [currentSession?.id, resetToRoot, updateUrlParams]);

  // Loading states
  if (hasAPI === null) return <p>Loading...</p>;
  if (hasAPI === false) return null;

  return (
    <main className="w-full">
      <UploadTracker />
      <div className="flex flex-col gap-5 min-h-[calc(100vh-80px)]">
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
            onClick={handleCreateFolder}
          />
        </div>

        <div className="bg-white w-full p-4 border border-gray-200 shadow-sm rounded-md flex flex-col max-h-[calc(100vh-200px)]">
          {/* Breadcrumbs & Controls */}
          <div className="flex justify-between items-center flex-shrink-0">
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
                        navigateToBreadcrumb(index, (newPrefix) => {
                          updateUrlParams(newPrefix);
                          clearSelection();
                        });
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
                            navigateToFolder(folder, (newPrefix) => {
                              updateUrlParams(newPrefix);
                              clearSelection();
                            });
                          }}
                        />
                      ))
                    : null}
                  {objects && objects.length > 0
                    ? objects.map((object) => (
                        <GridItem
                          key={object.Key}
                          title={object.Key}
                          subtitle="x items"
                          icon={faFile}
                          onClick={() => {
                            window.location.href = `/object/${encodeURIComponent(
                              object.Key,
                            )}`;
                          }}
                        />
                      ))
                    : null}
                </div>
              ))}
          </div>

          {/* LIST FORMAT */}
          <div hidden={format !== "list"} className="flex flex-col">
            {/* Controls */}
            <div className="flex justify-between items-center my-3 flex-shrink-0">
              {/* Left Controls */}
              <div className="flex gap-2">
                <Button faIcon={faArrowUpRight} active={selectedCount > 0}>
                  Share Selected
                </Button>
                <Button
                  variant="light"
                  active={selectedCount > 0}
                  faIcon={faDownload}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                <Button
                  variant="light"
                  active={selectedCount > 0}
                  hoverVariant="danger"
                  faIcon={faTrash}
                  onClick={handleBulkDelete}
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
            <div className="border border-gray-200 overflow-hidden flex flex-col">
              {/* Table Header - Fixed */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] text-sm font-semibold border-b border-gray-300 h-[40px] items-center px-3 bg-gray-50 flex-shrink-0">
                <Checkbox
                  state={masterCheckboxState}
                  onToggle={handleToggleAll}
                />
                <div>Name</div>
                <div>Owner</div>
                <div>Size</div>
                <div>ACL</div>
                <div>Last Modified</div>
                <div>Actions</div>
              </div>

              {/* Table Content - Dynamic Height with Max Height Scrolling */}
              {!objects || !folders ? (
                <div className="flex items-center justify-center h-32">
                  <Spinner />
                </div>
              ) : (
                <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
                  {folders && folders.length > 0
                    ? folders.map((folder) => (
                        <div
                          key={folder}
                          className="grid text-sm px-3  border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] hover:bg-gray-50 cursor-pointer select-none"
                          onClick={() => {
                            navigateToFolder(folder, (newPrefix) => {
                              updateUrlParams(newPrefix);
                              clearSelection();
                            });
                          }}
                        >
                          <Checkbox
                            state={
                              selectedObjects[folder] ? "checked" : "unchecked"
                            }
                            onToggle={(event) =>
                              toggleObject(
                                folder,
                                event?.shiftKey || false,
                                allKeys,
                              )
                            }
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
                          <div>
                            <i>No Owner</i>
                          </div>
                          <div>
                            <i>No Size</i>
                          </div>
                          <div>
                            <i>No ACL</i>
                          </div>
                          <div>
                            <i>Undefined</i>
                          </div>
                          <div>
                            <Button
                              variant="light"
                              hoverVariant="danger"
                              className="py-1! px-1.5! text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    : null}
                  {objects && objects.length > 0
                    ? objects.map((object) => (
                        <div
                          key={object.Key}
                          className="grid text-sm px-3 border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] hover:bg-gray-50 select-none"
                        >
                          <Checkbox
                            state={
                              selectedObjects[object.Key]
                                ? "checked"
                                : "unchecked"
                            }
                            onToggle={(event) =>
                              toggleObject(
                                object.Key,
                                event?.shiftKey || false,
                                allKeys,
                              )
                            }
                          />
                          <div
                            className="flex gap-2 items-center line-clamp-1 pr-8 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`,
                              )
                            }
                          >
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
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`,
                              )
                            }
                          >
                            {object.Owner?.DisplayName == ""
                              ? "No Owner"
                              : object.Owner?.DisplayName}
                          </div>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`,
                              )
                            }
                          >
                            {formatBytes(object.Size)}
                          </div>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`,
                              )
                            }
                          >
                            {metadata === null ? (
                              <Skeleton width={60} />
                            ) : (
                              metadata?.find((m) => m.ETag === object.ETag)
                                ?.Metadata?.Acl || "No ACL"
                            )}
                          </div>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`,
                              )
                            }
                          >
                            <i>{formatDate(object.LastModified)}</i>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => {
                                router.push(
                                  `/object/${encodeURIComponent(object.Key)}`,
                                );
                              }}
                              variant="light"
                              className="py-1! px-1.5! text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="light"
                              className="py-1! px-1.5! text-xs"
                            >
                              Preview
                            </Button>
                          </div>
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
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              Array.from(files).forEach((file) => handleFileUpload(file));
            }
          }}
        />
      </div>

      <FullscreenDropZone
        isActive={isFullscreenDragActive}
        onFileUpload={handleFileUpload}
        onDragStateChange={setIsFullscreenDragActive}
        disabled={!currentSession?.bucket}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          items={getSelectedDisplayNames()}
          isDeleting={isDeleting}
        />
      )}
    </main>
  );
};

export default Home;
