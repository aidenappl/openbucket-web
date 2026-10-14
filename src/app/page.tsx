"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faArrowUpRightFromSquare,
  faCloudArrowUp,
  faDownload,
  faFolderOpen,
  faFolderPlus,
  faGrid2,
  faLink,
  faList,
  faLock,
  faPen,
  faTrash,
  faUpRightAndDownLeftFromCenter,
  faFolderArrowUp,
  faRightLeft,
  faShareNodes,
} from "@fortawesome/pro-solid-svg-icons";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { MoveToFolderModal } from "@/components/MoveToFolderModal";
import { entriesFromFiles, UploadEntry } from "@/hooks/useUploader";
import { selectCurrentSession } from "@/store/slices/sessionSlice";
import { useAuthContext } from "@/context/AuthContext";
import { useCanWrite, usePermissions } from "@/hooks/usePermissions";
import { ListedObject, useBucketData } from "@/hooks/useBucketData";
import { useSelection } from "@/hooks/useSelection";
import { useSort } from "@/hooks/useSort";
import { useViewFormat } from "@/hooks/useViewFormat";
import { useUploader } from "@/hooks/useUploader";
import {
  reqDeleteObject,
  reqFetchObjects,
  reqPutBulkObjectACL,
} from "@/services/object.service";
import {
  reqDeleteFolder,
  reqFetchFolderContents,
  reqPostFolder,
  reqRenameFolder,
} from "@/services/folder.service";
import { reqPutRenameObject } from "@/services/object.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Alert } from "@/components/ui/alert";
import {
  EmptyState,
  SortableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Spinner from "@/components/Spinner";
import UploadTracker from "@/components/UploadTracker";
import FullscreenDropZone from "@/components/FullscreenDropZone";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import ChangeAccessModal from "@/components/ChangeAccessModal";
import CreateFolderModal from "@/components/CreateFolderModal";
import RenameModal from "@/components/RenameModal";
import { Modal } from "@/components/ui/modal";
import { ObjectThumb, iconForKey } from "@/components/ObjectThumb";
import { formatBytes } from "@/tools/formatBytes.tools";
import { formatDate } from "@/tools/formatDate.tools";
import { endpointHost } from "@/tools/url.tools";
import {
  baseName,
  copyObjectLink,
  downloadObject,
  explorerHref,
  isPublicAcl,
  normalizePrefix,
  objectHref,
  openObject,
  parentPrefix,
} from "@/tools/objectUrl.tools";
import { cn } from "@/lib/utils";

type SortKey = "name" | "size" | "modified";

const AclTag = ({ object }: { object: ListedObject }) => {
  if (object.head === undefined)
    return (
      <span className="inline-block h-3 w-14 animate-pulse rounded bg-surface-elevated" />
    );
  const acl = object.head?.Metadata?.Acl;
  if (!acl) return <span className="text-muted">—</span>;
  const pub = isPublicAcl(acl);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        pub ? "text-healthy" : "text-secondary",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          pub ? "bg-healthy" : "bg-border-emphasis",
        )}
      />
      {pub ? "Public" : "Private"}
    </span>
  );
};

const Explorer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSelector(selectCurrentSession);
  const { isLoggedIn, isLoading: authLoading } = useAuthContext();
  // Viewers browse, download and share; every write control is hidden.
  const canWrite = useCanWrite();
  const { hasAPI } = usePermissions();
  const { format, setFormat } = useViewFormat();
  const prefix = normalizePrefix(searchParams.get("folder"));
  const { folders, objects, error, refreshing, truncatedAt, loadBucketData } =
    useBucketData(session?.id ?? null, prefix);
  const upload = useUploader();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteKeys, setDeleteKeys] = useState<string[] | null>(null);
  const [deleteDetail, setDeleteDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [aclKeys, setAclKeys] = useState<string[] | null>(null);
  const [aclSaving, setAclSaving] = useState(false);
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [shareKey, setShareKey] = useState<string | null>(null);
  const [moveKeys, setMoveKeys] = useState<string[] | null>(null);
  const [moving, setMoving] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [overwrite, setOverwrite] = useState<{
    files: UploadEntry[];
    clashes: string[];
  } | null>(null);

  // Always a background refresh: whatever is on screen (cached or current)
  // stays until the fresh listing replaces it.
  const reload = useCallback(() => {
    loadBucketData();
  }, [loadBucketData]);

  useEffect(() => {
    setQuery("");
    reload();
    // session.id, not session: a re-fetched sessions list hands back a new object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, prefix]);

  useEffect(() => {
    if (hasAPI === false) router.replace("/sessions");
  }, [hasAPI, router]);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase();
  const visibleFolders = useMemo(
    () =>
      (folders ?? []).filter(
        (f) => !q || baseName(f).toLowerCase().includes(q),
      ),
    [folders, q],
  );
  const filteredObjects = useMemo(
    () =>
      (objects ?? []).filter(
        (o) => !q || baseName(o.Key).toLowerCase().includes(q),
      ),
    [objects, q],
  );
  const [sortedObjects, sort] = useSort<ListedObject, SortKey>(
    filteredObjects,
    {
      name: (o) => baseName(o.Key),
      size: (o) => o.Size,
      modified: (o) => o.LastModified,
    },
    { key: "name", dir: "asc" },
  );
  const sortedFolders = useMemo(() => {
    const byName = [...visibleFolders].sort((a, b) =>
      baseName(a).localeCompare(baseName(b), undefined, { numeric: true }),
    );
    return sort.key === "name" && sort.dir === "desc"
      ? byName.reverse()
      : byName;
  }, [visibleFolders, sort.key, sort.dir]);

  const allKeys = useMemo(
    () => [...sortedFolders, ...sortedObjects.map((o) => o.Key)],
    [sortedFolders, sortedObjects],
  );
  const selection = useSelection(allKeys);
  const objectByKey = useMemo(
    () => new Map((objects ?? []).map((o) => [o.Key, o])),
    [objects],
  );
  const selectedObjects = selection.selectedKeys.filter(
    (k) => !k.endsWith("/"),
  );
  const loading = folders === null || objects === null;
  const totalSize = (objects ?? []).reduce((n, o) => n + (o.Size ?? 0), 0);

  // Clear selection whenever the folder changes.
  const { clear: clearSelection } = selection;
  useEffect(() => clearSelection(), [prefix, session?.id, clearSelection]);

  // ── Navigation ────────────────────────────────────────────────────────────
  // push, not replace: the old explorer replaced history, so the browser's Back
  // button left the app instead of going up a folder.
  const goTo = useCallback(
    (p: string) => router.push(explorerHref(p), { scroll: false }),
    [router],
  );

  const crumbs = useMemo(() => {
    const parts = prefix.split("/").filter(Boolean);
    return parts.map((part, i) => ({
      name: part,
      prefix: parts.slice(0, i + 1).join("/") + "/",
    }));
  }, [prefix]);

  // ── Actions ───────────────────────────────────────────────────────────────
  // Entries carry a path relative to the current folder; a dropped or picked
  // folder uploads as `name/sub/file.ext`. Only files landing directly in this
  // folder can be checked for clashes — the listing doesn't cover subfolders.
  const startUpload = useCallback(
    (files: UploadEntry[]) => {
      if (!session || files.length === 0) return;
      const existing = new Set((objects ?? []).map((o) => baseName(o.Key)));
      const clashes = files
        .filter((f) => !f.path.includes("/") && existing.has(f.path))
        .map((f) => f.path);
      if (clashes.length > 0) {
        setOverwrite({ files, clashes });
        return;
      }
      upload(files, prefix, () => reload());
    },
    [session, objects, upload, prefix, reload],
  );

  const handleCreateFolder = async (name: string) => {
    setCreating(true);
    const res = await reqPostFolder(prefix + name);
    setCreating(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to create folder");
      return;
    }
    toast.success(`Folder “${name}” created`);
    setCreateOpen(false);
    reload();
  };

  const openDelete = async (keys: string[]) => {
    setDeleteKeys(keys);
    setDeleteDetail(null);
    const folderKeys = keys.filter((k) => k.endsWith("/"));
    if (folderKeys.length === 0) return;
    const counts = await Promise.all(
      folderKeys.map((f) => reqFetchFolderContents(f)),
    );
    const n = counts.reduce(
      (sum, r) => sum + (r.success ? (r.data ?? []).length : 0),
      0,
    );
    const bytes = counts.reduce(
      (sum, r) =>
        sum +
        (r.success ? (r.data ?? []).reduce((b, o) => b + (o.size ?? 0), 0) : 0),
      0,
    );
    setDeleteDetail(
      n === 0
        ? "The selected folders are empty."
        : `Includes ${n.toLocaleString()} object${n === 1 ? "" : "s"} (${formatBytes(bytes)}) inside the selected folder${folderKeys.length === 1 ? "" : "s"}.`,
    );
  };

  const confirmDelete = async () => {
    if (!deleteKeys) return;
    setDeleting(true);
    const results = await Promise.all(
      deleteKeys.map(async (k) => ({
        key: k,
        res: k.endsWith("/")
          ? await reqDeleteFolder(k)
          : await reqDeleteObject(k),
      })),
    );
    // ⚠️ Verify folder deletes. openbucket-go's multi-object delete can answer
    // 200 while leaving objects listed (it removes the files but not their
    // metadata rows), so "success" from the API is not proof anything went.
    const leftovers = await Promise.all(
      results
        .filter((r) => r.key.endsWith("/") && r.res.success)
        .map(async (r) => {
          const check = await reqFetchFolderContents(r.key);
          return check.success ? (check.data ?? []).length : 0;
        }),
    );
    const stuck = leftovers.reduce((a, b) => a + b, 0);
    setDeleting(false);
    const failed = results.filter((r) => !r.res.success);
    if (stuck > 0) {
      toast.error(
        `The server reported the delete as done, but ${stuck} object${stuck === 1 ? " is" : "s are"} still listed. This is a storage-server bug; nothing more was removed.`,
        { duration: 10000 },
      );
    } else if (failed.length === 0) {
      toast.success(
        `Deleted ${deleteKeys.length} item${deleteKeys.length === 1 ? "" : "s"}`,
      );
    } else {
      const reason = failed[0].res.success
        ? ""
        : `: ${failed[0].res.error_message}`;
      toast.error(
        `${failed.length} of ${deleteKeys.length} couldn't be deleted${reason}`,
      );
    }
    setDeleteKeys(null);
    selection.clear();
    reload();
  };

  const confirmAcl = async (acl: string) => {
    if (!aclKeys) return;
    setAclSaving(true);
    const res = await reqPutBulkObjectACL(aclKeys, acl);
    setAclSaving(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to update access");
      return;
    }
    const failed = res.data.filter((r) => !r.success).length;
    if (failed > 0)
      toast.error(`${failed} of ${aclKeys.length} objects couldn't be updated`);
    else
      toast.success(
        `Access updated for ${aclKeys.length} object${aclKeys.length === 1 ? "" : "s"}`,
      );
    setAclKeys(null);
    reload();
  };

  const confirmRename = async (newKey: string) => {
    if (!renameKey) return;
    setRenaming(true);
    const res = renameKey.endsWith("/")
      ? await reqRenameFolder(renameKey, newKey)
      : await reqPutRenameObject(renameKey, newKey);
    setRenaming(false);
    if (!res.success) {
      toast.error(res.error_message || "Rename failed");
      return;
    }
    toast.success(`Renamed to “${baseName(newKey)}”`);
    setRenameKey(null);
    selection.clear();
    reload();
  };

  const downloadSelected = async () => {
    const keys = selectedObjects;
    if (keys.length === 0) return;
    const t = toast.loading(
      `Downloading ${keys.length} file${keys.length === 1 ? "" : "s"}…`,
    );
    let failed = 0;
    for (const k of keys) {
      if (!(await downloadObject(k, objectByKey.get(k)?.Size))) failed += 1;
    }
    toast.dismiss(t);
    if (failed)
      toast.error(`${failed} download${failed === 1 ? "" : "s"} failed`);
    else
      toast.success(
        `Downloaded ${keys.length} file${keys.length === 1 ? "" : "s"}`,
      );
  };

  const downloadOne = async (o: ListedObject) => {
    if (!(await downloadObject(o.Key, o.Size)))
      toast.error(`Couldn't download ${baseName(o.Key)}`);
  };

  // Move objects into `dest`, keeping names. The destination is re-listed here
  // (not trusted from the dialog) because a rename onto an existing key
  // overwrites it; clashes are skipped unless `replace`. Folders aren't
  // movable — that needs openbucket-go#22.
  const confirmMove = async (dest: string, replace: boolean) => {
    if (!moveKeys) return;
    setMoving(true);
    const destList = await reqFetchObjects(dest);
    const taken = new Set(
      destList.success ? (destList.data ?? []).map((o) => baseName(o.Key)) : [],
    );
    const plan = moveKeys.filter((k) => parentPrefix(k) !== dest);
    const skipped = replace ? [] : plan.filter((k) => taken.has(baseName(k)));
    const todo = plan.filter((k) => !skipped.includes(k));

    let failed = 0;
    let next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const k = todo[next++];
        const target = dest + baseName(k);
        // openbucket-go's CopyObject refuses an existing destination
        // (ObjectAlreadyExists → 500 "Unknown error"), unlike S3. Replacing
        // means removing the target first; the source stays untouched until
        // the move itself succeeds.
        if (taken.has(baseName(k))) {
          const del = await reqDeleteObject(target);
          if (!del.success) {
            failed += 1;
            continue;
          }
        }
        const res = await reqPutRenameObject(k, target);
        if (!res.success) failed += 1;
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, todo.length) }, worker));
    setMoving(false);

    const moved = todo.length - failed;
    const where = dest ? baseName(dest) : "the bucket root";
    if (failed > 0) {
      toast.error(`Moved ${moved}, ${failed} failed`);
    } else if (moved > 0) {
      toast.success(
        `Moved ${moved} object${moved === 1 ? "" : "s"} to ${where}` +
          (skipped.length ? ` · skipped ${skipped.length} existing` : ""),
      );
    } else {
      toast(`Nothing moved — ${skipped.length} already existed in ${where}`);
    }
    setMoveKeys(null);
    selection.clear();
    reload();
  };

  // No folder Rename yet: openbucket-api's PUT /folder works, but openbucket-go
  // can't CopyObject a folder-marker key ("read …: is a directory") and leaves a
  // half-made destination behind, so every rename fails. RenameModal already
  // handles folder keys — add the item back once the storage server is fixed.
  const folderMenu = (f: string): MenuItem[] => [
    { label: "Open", icon: faFolderOpen, onSelect: () => goTo(f) },
    ...(canWrite
      ? ([
          "separator",
          {
            label: "Delete",
            icon: faTrash,
            destructive: true,
            onSelect: () => openDelete([f]),
          },
        ] as MenuItem[])
      : []),
  ];

  const objectMenu = (o: ListedObject): MenuItem[] => [
    {
      label: "Details",
      icon: faUpRightAndDownLeftFromCenter,
      onSelect: () => router.push(objectHref(o.Key)),
    },
    {
      label: "Open in new tab",
      icon: faArrowUpRightFromSquare,
      onSelect: () => openObject(o.Key),
    },
    { label: "Download", icon: faDownload, onSelect: () => downloadOne(o) },
    {
      label: "Copy link",
      icon: faLink,
      onSelect: () =>
        session && copyObjectLink(session, o.Key, o.head?.Metadata?.Acl),
    },
    {
      label: "Share link…",
      icon: faShareNodes,
      onSelect: () => setShareKey(o.Key),
    },
    ...(canWrite
      ? ([
          "separator",
          {
            label: "Change access",
            icon: faLock,
            onSelect: () => setAclKeys([o.Key]),
          },
          {
            label: "Rename",
            icon: faPen,
            onSelect: () => setRenameKey(o.Key),
          },
          {
            label: "Move to…",
            icon: faRightLeft,
            onSelect: () => setMoveKeys([o.Key]),
          },
          {
            label: "Delete",
            icon: faTrash,
            destructive: true,
            onSelect: () => openDelete([o.Key]),
          },
        ] as MenuItem[])
      : []),
  ];

  // ── Keyboard: "/" focuses search, Esc clears selection, ⌘/Ctrl+A selects all ──
  const anyModal =
    createOpen ||
    !!deleteKeys ||
    !!aclKeys ||
    !!renameKey ||
    !!overwrite ||
    !!shareKey ||
    !!moveKeys;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (anyModal) return;
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (
        e.key === "Escape" &&
        !typing &&
        selection.selectedKeys.length > 0
      ) {
        selection.clear();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "a" &&
        !typing &&
        allKeys.length > 0
      ) {
        e.preventDefault();
        selection.setAll(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyModal, selection, allKeys.length]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (authLoading || hasAPI === null) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!isLoggedIn || hasAPI === false || !session) return null;

  const folderCount = folders?.length ?? 0;
  const objectCount = objects?.length ?? 0;
  const nothingHere =
    !loading && !error && folderCount === 0 && objectCount === 0;
  const noMatches =
    !loading &&
    !nothingHere &&
    q &&
    sortedFolders.length === 0 &&
    sortedObjects.length === 0;
  const selCount = selection.selectedKeys.length;
  const currentName = crumbs.length
    ? crumbs[crumbs.length - 1].name
    : session.nickname || session.bucket;

  return (
    <div className="pb-24">
      <UploadTracker />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {/* At the root the breadcrumb would only repeat the title. */}
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-1 overflow-x-auto">
              <ol className="flex items-center gap-1 whitespace-nowrap text-sm text-muted">
                <li>
                  <Link
                    href={explorerHref("")}
                    className="rounded px-1 -mx-1 hover:text-primary hover:underline"
                  >
                    {session.nickname || session.bucket}
                  </Link>
                </li>
                {crumbs.map((c, i) => (
                  <li key={c.prefix} className="flex items-center gap-1">
                    <span aria-hidden="true" className="text-dimmed">
                      /
                    </span>
                    {i === crumbs.length - 1 ? (
                      <span aria-current="page" className="text-secondary">
                        {c.name}
                      </span>
                    ) : (
                      <Link
                        href={explorerHref(c.prefix)}
                        className="rounded px-1 -mx-1 hover:text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="truncate text-xl font-semibold text-primary">
            {currentName}
          </h1>
          <p className="mt-0.5 text-sm text-secondary">
            {loading ? (
              "Loading…"
            ) : (
              <>
                {folderCount} folder{folderCount === 1 ? "" : "s"} ·{" "}
                {objectCount} file{objectCount === 1 ? "" : "s"}
                {objectCount > 0 && <> · {formatBytes(totalSize)}</>}
                <span className="hidden md:inline">
                  {" "}
                  · {session.bucket} on {endpointHost(session.endpoint)}
                </span>
              </>
            )}
          </p>
        </div>
        {canWrite ? (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(true)}>
              <FontAwesomeIcon
                icon={faFolderPlus}
                className="mr-2 h-3.5 w-3.5"
              />
              New folder
            </Button>
            <Button
              variant="secondary"
              onClick={() => folderInputRef.current?.click()}
            >
              <FontAwesomeIcon
                icon={faFolderArrowUp}
                className="mr-2 h-3.5 w-3.5"
              />
              Upload folder
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <FontAwesomeIcon
                icon={faCloudArrowUp}
                className="mr-2 h-3.5 w-3.5"
              />
              Upload
            </Button>
          </div>
        ) : (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1 text-xs font-medium text-secondary"
            title="Your role is Viewer. Ask an admin for Editor access to upload or change files."
          >
            <FontAwesomeIcon icon={faLock} className="h-3 w-3" />
            Read-only
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {selCount > 0 ? (
          <div
            className="flex flex-1 flex-wrap items-center gap-2"
            role="toolbar"
            aria-label="Selection actions"
          >
            <span className="mr-1 text-sm font-medium text-primary">
              {selCount} selected
            </span>
            {canWrite && (
              <Button
                size="sm"
                variant="secondary"
                disabled={selectedObjects.length === 0}
                onClick={() => setAclKeys(selectedObjects)}
              >
                <FontAwesomeIcon icon={faLock} className="mr-1.5 h-3 w-3" />
                Change access
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={selectedObjects.length === 0}
              onClick={downloadSelected}
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1.5 h-3 w-3" />
              Download
            </Button>
            {canWrite && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedObjects.length === 0}
                  onClick={() => setMoveKeys(selectedObjects)}
                >
                  <FontAwesomeIcon
                    icon={faRightLeft}
                    className="mr-1.5 h-3 w-3"
                  />
                  Move
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDelete(selection.selectedKeys)}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-1.5 h-3 w-3" />
                  Delete
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={selection.clear}>
              Clear
            </Button>
          </div>
        ) : (
          <SearchInput
            ref={searchRef}
            value={query}
            onChange={setQuery}
            placeholder="Filter this folder…  ( / )"
            aria-label="Filter this folder"
            className="w-full sm:w-72"
          />
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => reload()}
            aria-label={refreshing ? "Refreshing" : "Refresh"}
            title={refreshing ? "Refreshing…" : "Refresh"}
          >
            {/* Spins during background revalidation too — the only sign a
                cached listing is being replaced. */}
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={cn(
                "h-3.5 w-3.5",
                (loading || refreshing) && "animate-spin",
              )}
            />
          </Button>
          <div
            role="group"
            aria-label="View"
            className="flex rounded-lg border border-border-strong p-0.5"
          >
            {(["list", "grid"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={format === v}
                aria-label={v === "list" ? "List view" : "Grid view"}
                title={v === "list" ? "List view" : "Grid view"}
                onClick={() => setFormat(v)}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-md transition-colors cursor-pointer",
                  format === v
                    ? "bg-surface-elevated text-primary"
                    : "text-muted hover:text-primary",
                )}
              >
                <FontAwesomeIcon
                  icon={v === "list" ? faList : faGrid2}
                  className="h-3.5 w-3.5"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-3">
          Couldn&apos;t load this folder: {error}.{" "}
          <button
            type="button"
            onClick={() => reload()}
            className="font-medium underline cursor-pointer"
          >
            Retry
          </button>
        </Alert>
      )}

      {truncatedAt && (
        <Alert variant="warning" className="mb-3">
          This folder holds more than {truncatedAt.toLocaleString()} items. Only
          the first {truncatedAt.toLocaleString()} folders and files are listed,
          so filtering, sorting and Select all cover those only.
        </Alert>
      )}

      {/* List view */}
      {format !== "grid" && (
        <Table>
          <TableHeader>
            <tr>
              <TableHead className="w-10 pr-0">
                <Checkbox
                  aria-label="Select all"
                  checked={selection.state === "all"}
                  indeterminate={selection.state === "some"}
                  disabled={allKeys.length === 0}
                  onChange={(on) => selection.setAll(on)}
                />
              </TableHead>
              <SortableHead column="name" sort={sort}>
                Name
              </SortableHead>
              <SortableHead
                column="size"
                sort={sort}
                className="hidden sm:table-cell"
              >
                Size
              </SortableHead>
              <TableHead className="hidden md:table-cell">Access</TableHead>
              <SortableHead
                column="modified"
                sort={sort}
                className="hidden lg:table-cell"
              >
                Last modified
              </SortableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div
                      className="h-4 animate-pulse rounded bg-surface-elevated"
                      style={{ width: `${40 + ((i * 17) % 45)}%` }}
                    />
                  </td>
                </tr>
              ))
            ) : nothingHere ? (
              <EmptyState
                message={
                  (prefix ? "This folder is empty." : "This bucket is empty.") +
                  (canWrite ? " Drop files anywhere to upload." : "")
                }
                action={
                  canWrite ? (
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload files
                    </Button>
                  ) : undefined
                }
              />
            ) : noMatches ? (
              <EmptyState
                message={<>Nothing in this folder matches “{query}”.</>}
              />
            ) : (
              <>
                {prefix && !q && (
                  <TableRow>
                    <TableCell className="pr-0" />
                    <TableCell className="text-secondary">
                      <Link
                        href={explorerHref(
                          crumbs.length > 1
                            ? crumbs[crumbs.length - 2].prefix
                            : "",
                        )}
                        className="flex items-center gap-2.5 hover:text-primary"
                      >
                        <FontAwesomeIcon
                          icon={faFolderOpen}
                          className="h-3.5 w-3.5 text-dimmed"
                        />
                        ..
                        <span className="sr-only">Up one folder</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="hidden md:table-cell" />
                    <TableCell className="hidden lg:table-cell" />
                    <TableCell />
                  </TableRow>
                )}
                {sortedFolders.map((f) => (
                  <TableRow key={f} selected={selection.selected.has(f)}>
                    <TableCell className="pr-0">
                      <Checkbox
                        aria-label={`Select folder ${baseName(f)}`}
                        checked={selection.selected.has(f)}
                        onChange={(_, shift) => selection.toggle(f, shift)}
                      />
                    </TableCell>
                    <TableCell className="max-w-0 w-full">
                      <Link
                        href={explorerHref(f)}
                        className="flex min-w-0 items-center gap-2.5 font-medium hover:underline"
                      >
                        <FontAwesomeIcon
                          icon={iconForKey(f)}
                          className="h-3.5 w-3.5 shrink-0 text-info"
                        />
                        <span className="truncate">{baseName(f)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted">
                      —
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted">
                      —
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted">
                      —
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Menu
                        label={`Actions for folder ${baseName(f)}`}
                        items={folderMenu(f)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {sortedObjects.map((o) => (
                  <TableRow
                    key={o.Key}
                    selected={selection.selected.has(o.Key)}
                  >
                    <TableCell className="pr-0">
                      <Checkbox
                        aria-label={`Select ${baseName(o.Key)}`}
                        checked={selection.selected.has(o.Key)}
                        onChange={(_, shift) => selection.toggle(o.Key, shift)}
                      />
                    </TableCell>
                    <TableCell className="max-w-0 w-full">
                      <Link
                        href={objectHref(o.Key)}
                        className="flex min-w-0 items-center gap-2.5 hover:underline"
                        title={baseName(o.Key)}
                      >
                        <FontAwesomeIcon
                          icon={iconForKey(o.Key, o.head?.ContentType)}
                          className="h-3.5 w-3.5 shrink-0 text-muted"
                        />
                        <span className="truncate">{baseName(o.Key)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-secondary tabular-nums">
                      {formatBytes(o.Size)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AclTag object={o} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-secondary">
                      <time
                        dateTime={o.LastModified}
                        title={formatDate(o.LastModified)}
                      >
                        {formatDate(o.LastModified, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Menu
                        label={`Actions for ${baseName(o.Key)}`}
                        items={objectMenu(o)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      )}

      {/* Grid view */}
      {format === "grid" && (
        <div>
          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-lg bg-surface-elevated"
                />
              ))}
            </div>
          ) : nothingHere || noMatches ? (
            <div className="rounded-lg border border-border bg-surface px-4 py-12 text-center text-sm text-muted">
              {noMatches ? (
                <>Nothing in this folder matches “{query}”.</>
              ) : canWrite ? (
                "This folder is empty. Drop files anywhere to upload."
              ) : (
                "This folder is empty."
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {[...sortedFolders, ...sortedObjects.map((o) => o.Key)].map(
                (key) => {
                  const isFolder = key.endsWith("/");
                  const o = objectByKey.get(key);
                  const sel = selection.selected.has(key);
                  return (
                    <li
                      key={key}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border bg-surface transition-colors",
                        sel
                          ? "border-accent ring-1 ring-accent"
                          : "border-border hover:border-border-emphasis",
                      )}
                    >
                      <Link
                        href={isFolder ? explorerHref(key) : objectHref(key)}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {isFolder ? (
                          <div className="flex aspect-[4/3] items-center justify-center bg-surface-alt">
                            <FontAwesomeIcon
                              icon={iconForKey(key)}
                              className="h-10 w-10 text-info"
                            />
                          </div>
                        ) : (
                          <ObjectThumb
                            objectKey={key}
                            contentType={o?.head?.ContentType}
                            className="aspect-[4/3]"
                          />
                        )}
                        <div className="px-3 py-2 pr-10">
                          <p
                            className="truncate text-sm font-medium text-primary"
                            title={baseName(key)}
                          >
                            {baseName(key)}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {isFolder ? "Folder" : o ? formatBytes(o.Size) : ""}
                          </p>
                        </div>
                      </Link>
                      <div
                        className={cn(
                          "absolute left-2 top-2 rounded-lg bg-surface/90 transition-opacity",
                          sel
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                        )}
                      >
                        <div className="p-3">
                          <Checkbox
                            aria-label={`Select ${isFolder ? "folder " : ""}${baseName(key)}`}
                            checked={sel}
                            onChange={(_, shift) =>
                              selection.toggle(key, shift)
                            }
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 right-1.5">
                        <Menu
                          label={`Actions for ${isFolder ? "folder " : ""}${baseName(key)}`}
                          items={
                            isFolder ? folderMenu(key) : o ? objectMenu(o) : []
                          }
                        />
                      </div>
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(e) => {
          startUpload(entriesFromFiles(Array.from(e.target.files ?? [])));
          e.target.value = "";
        }}
      />
      {/* `webkitdirectory` isn't in React's input types, so it's set on the
          element; picked files carry `webkitRelativePath` (folder/sub/a.jpg). */}
      <input
        type="file"
        ref={(el) => {
          folderInputRef.current = el;
          el?.setAttribute("webkitdirectory", "");
        }}
        multiple
        className="hidden"
        onChange={(e) => {
          startUpload(entriesFromFiles(Array.from(e.target.files ?? [])));
          e.target.value = "";
        }}
      />

      <FullscreenDropZone
        onFiles={startUpload}
        destination={prefix}
        disabled={!canWrite}
      />

      {shareKey && session && (
        <ShareLinkModal
          open
          onClose={() => setShareKey(null)}
          session={session}
          objectKey={shareKey}
          acl={objectByKey.get(shareKey)?.head?.Metadata?.Acl}
        />
      )}
      <MoveToFolderModal
        open={!!moveKeys}
        onClose={() => setMoveKeys(null)}
        keys={moveKeys ?? []}
        startPrefix={prefix}
        onConfirm={confirmMove}
        isMoving={moving}
      />

      <CreateFolderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreateFolder}
        prefix={prefix}
        existing={(folders ?? []).map(baseName)}
        isLoading={creating}
      />
      <DeleteConfirmationModal
        isOpen={!!deleteKeys}
        onClose={() => setDeleteKeys(null)}
        onConfirm={confirmDelete}
        items={deleteKeys ?? []}
        isDeleting={deleting}
        detail={
          deleteKeys?.some((k) => k.endsWith("/"))
            ? (deleteDetail ?? "Counting objects inside…")
            : undefined
        }
      />
      <ChangeAccessModal
        isOpen={!!aclKeys}
        onClose={() => setAclKeys(null)}
        onConfirm={confirmAcl}
        currentAcl={
          aclKeys?.length === 1
            ? (objectByKey.get(aclKeys[0])?.head?.Metadata?.Acl ?? "private")
            : "private"
        }
        isLoading={aclSaving}
        title={
          aclKeys && aclKeys.length > 1
            ? `Change access for ${aclKeys.length} objects`
            : "Change access"
        }
        subtitle={
          aclKeys && aclKeys.length > 1
            ? "Applies to every selected object. Folders are skipped."
            : undefined
        }
      />
      <RenameModal
        isOpen={!!renameKey}
        onClose={() => setRenameKey(null)}
        onConfirm={confirmRename}
        currentPath={renameKey ?? ""}
        isLoading={renaming}
      />
      <Modal
        open={!!overwrite}
        onClose={() => setOverwrite(null)}
        title="Replace existing files?"
        description={
          overwrite && overwrite.clashes.length === 1 ? (
            <>
              “{overwrite.clashes[0]}” already exists here. Uploading replaces
              it.
            </>
          ) : (
            <>
              {overwrite?.clashes.length} files already exist here. Uploading
              replaces them.
            </>
          )
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setOverwrite(null)}>
              Cancel
            </Button>
            {overwrite && overwrite.clashes.length < overwrite.files.length && (
              <Button
                variant="secondary"
                onClick={() => {
                  const skip = new Set(overwrite.clashes);
                  upload(
                    overwrite.files.filter((f) => !skip.has(f.path)),
                    prefix,
                    () => reload(),
                  );
                  setOverwrite(null);
                }}
              >
                Skip existing
              </Button>
            )}
            <Button
              variant="warning"
              onClick={() => {
                if (overwrite) upload(overwrite.files, prefix, () => reload());
                setOverwrite(null);
              }}
            >
              Replace
            </Button>
          </>
        }
      />
    </div>
  );
};

export default Explorer;
