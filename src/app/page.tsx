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
import { fetchApi } from "@/tools/axios.tools";
import {
  getCurrentSessionBucket,
  getSessionTokens,
  parseSessionKey,
} from "@/tools/sessionStore.tools";
import {
  selectCurrentSession,
  setSessions,
  setActiveSession,
} from "@/store/slices/sessionSlice";
import { Session } from "@/types";
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

const Home = () => {
  const dispatch = useDispatch();
  const currentSession = useSelector(selectCurrentSession);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { hasAPI } = usePermissions();
  const [previousSessionBucket, setPreviousSessionBucket] = useState<
    string | null
  >(null);

  // Custom hooks
  const { format, setFormat } = useViewFormat();
  const { folders, objects, loadBucketData } = useBucketData();
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
  const { createFolder, deleteBulkItems } = useBucketActions();

  // Initialize sessions from localStorage on app start
  useEffect(() => {
    const initializeSessions = async () => {
      try {
        // Get all stored session tokens
        const tokens = getSessionTokens();
        if (tokens.length > 0) {
          // Fetch session data from API
          const response = await fetchApi<Session[]>({
            url: "/sessions",
            method: "PUT",
            data: { sessions: tokens },
          });

          if (response.success) {
            // Set sessions in Redux
            dispatch(setSessions(response.data));

            // Check if there's a saved current session
            const savedSessionKey = getCurrentSessionBucket();
            if (savedSessionKey) {
              const parsed = parseSessionKey(savedSessionKey);
              if (parsed) {
                // Find and set the active session
                const savedSession = response.data.find(
                  (session: Session) =>
                    session.endpoint === parsed.endpoint &&
                    session.bucket === parsed.bucket
                );
                if (savedSession) {
                  dispatch(setActiveSession(savedSession));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize sessions:", error);
      }
    };

    initializeSessions();
  }, [dispatch]); // Include dispatch in dependencies

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
    [router, searchParams]
  );

  // Initialize from URL params (only on initial load or when URL changes)
  useEffect(() => {
    const folderParam = searchParams.get("folder");
    if (currentSession?.bucket && currentSession?.token) {
      if (folderParam) {
        setFromPath(folderParam, (newPrefix) => {
          loadBucketData(
            currentSession.bucket,
            newPrefix,
            currentSession.token
          );
        });
      } else {
        // No folder param, so we're at root
        resetToRoot((newPrefix) => {
          loadBucketData(
            currentSession.bucket,
            newPrefix,
            currentSession.token
          );
        });
      }
    }
  }, [
    searchParams,
    currentSession?.bucket,
    currentSession?.token,
    setFromPath,
    loadBucketData,
    resetToRoot,
  ]);

  // Get all items for selection (need to separate folder and object keys)
  const folderKeys = folders || [];
  const objectKeys = (objects || []).map((obj) => obj.ETag);
  const allKeys = [...folderKeys, ...objectKeys];
  const { selectedCount, masterCheckboxState } = getSelectionStats(allKeys);

  // Handle bulk selection
  const handleToggleAll = () => {
    const newState = masterCheckboxState !== "checked";
    toggleAll(allKeys, newState);
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (folderName && currentSession?.bucket && currentSession?.token) {
      const success = await createFolder(
        currentSession.bucket,
        folderName,
        currentSession.token
      );
      if (success) {
        loadBucketData(currentSession.bucket, prefix, currentSession.token);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (!currentSession?.bucket || !currentSession?.token) return;

    const selectedFolders = getSelectedItems(folderKeys);
    const selectedObjectKeys = getSelectedItems(objectKeys);

    deleteBulkItems(
      currentSession.bucket,
      selectedFolders,
      selectedObjectKeys,
      currentSession.token,
      () => loadBucketData(currentSession.bucket, prefix, currentSession.token)
    );
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!currentSession?.bucket || !currentSession?.token) return;

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

    // Use the current prefix for uploading to the current folder
    if (prefix) {
      formData.append("prefix", prefix);
    }

    fetchApi(
      {
        url: `/${currentSession.bucket}/object`,
        method: "PUT",
        data: formData,
        onUploadProgress: (event) => {
          const progress = Math.round(
            (event.loaded * 100) / (event?.total || 1)
          );
          dispatch(updateProgress({ id, progress }));
        },
        headers: { "Content-Type": "multipart/form-data" },
      },
      currentSession.token
    ).then((response) => {
      if (response.success) {
        dispatch(markCompleted({ id }));
        // Refresh the current folder
        loadBucketData(currentSession.bucket, prefix, currentSession.token);
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
  };

  // Effects
  useEffect(() => {
    if (hasAPI === false) {
      router.replace("/bucket");
    }
  }, [hasAPI, router]);

  // Reset to root when session changes (but not on initial load)
  useEffect(() => {
    if (currentSession?.bucket) {
      // If this is a different session than before, reset to root
      if (
        previousSessionBucket !== null &&
        previousSessionBucket !== currentSession.bucket
      ) {
        resetToRoot((newPrefix) => {
          updateUrlParams(newPrefix);
        });
      }
      setPreviousSessionBucket(currentSession.bucket);
    }
  }, [
    currentSession?.bucket,
    resetToRoot,
    updateUrlParams,
    previousSessionBucket,
  ]);

  // Loading states
  if (hasAPI === null) return <p>Loading...</p>;
  if (hasAPI === false) return null;

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
            onClick={handleCreateFolder}
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
                        navigateToBreadcrumb(index, (newPrefix) => {
                          updateUrlParams(newPrefix);
                          clearSelection();
                          if (currentSession?.bucket && currentSession?.token) {
                            loadBucketData(
                              currentSession.bucket,
                              newPrefix,
                              currentSession.token
                            );
                          }
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
                              if (
                                currentSession?.bucket &&
                                currentSession?.token
                              ) {
                                loadBucketData(
                                  currentSession.bucket,
                                  newPrefix,
                                  currentSession.token
                                );
                              }
                            });
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
            <div className="border border-gray-200">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr] text-sm font-semibold border-b border-gray-300 h-[40px] items-center px-3">
                <Checkbox
                  state={masterCheckboxState}
                  onToggle={handleToggleAll}
                />
                <div>Name</div>
                <div>Owner</div>
                <div>Size</div>
                <div>Last Modified</div>
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
                          className="grid text-sm px-3  border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr_1fr_1fr] hover:bg-gray-50 cursor-pointer select-none"
                          onClick={() => {
                            navigateToFolder(folder, (newPrefix) => {
                              updateUrlParams(newPrefix);
                              clearSelection();
                              if (
                                currentSession?.bucket &&
                                currentSession?.token
                              ) {
                                loadBucketData(
                                  currentSession.bucket,
                                  newPrefix,
                                  currentSession.token
                                );
                              }
                            });
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
                          <div>
                            <i>No Owner</i>
                          </div>
                          <div>
                            <i>No Size</i>
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
                          key={object.ETag}
                          className="grid text-sm px-3 border-b border-gray-200 h-[40px] items-center grid-cols-[40px_1fr_1fr_1fr_1fr_1fr] hover:bg-gray-50 select-none"
                        >
                          <Checkbox
                            state={
                              selectedObjects[object.ETag]
                                ? "checked"
                                : "unchecked"
                            }
                            onToggle={() => toggleObject(object.ETag)}
                          />
                          <div
                            className="flex gap-2 items-center line-clamp-1 pr-8 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`
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
                                `/object/${encodeURIComponent(object.Key)}`
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
                                `/object/${encodeURIComponent(object.Key)}`
                              )
                            }
                          >
                            {formatBytes(object.Size)}
                          </div>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/object/${encodeURIComponent(object.Key)}`
                              )
                            }
                          >
                            <i>{formatDate(object.LastModified)}</i>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => {
                                router.push(
                                  `/object/${encodeURIComponent(object.Key)}`
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
          id="fileInput"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
            }
          }}
        />
      </div>
    </main>
  );
};

export default Home;
