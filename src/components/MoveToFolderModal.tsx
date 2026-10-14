"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faFolder } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { reqFetchFolders } from "@/services/folder.service";
import { reqFetchObjects } from "@/services/object.service";
import { baseName, parentPrefix } from "@/tools/objectUrl.tools";
import { cn } from "@/lib/utils";

interface MoveToFolderModalProps {
  open: boolean;
  onClose: () => void;
  /** Object keys to move. Folder keys are not accepted (see the explorer). */
  keys: string[];
  /** Where browsing starts \u2014 usually the folder the user is in. */
  startPrefix: string;
  /** Destination prefix ("" = root), and whether to replace name clashes. */
  onConfirm: (destination: string, replace: boolean) => void;
  isMoving?: boolean;
}

/**
 * Pick a destination folder by browsing, then move the selected objects there,
 * keeping their file names. Name clashes at the destination are listed, and
 * skipped unless the user opts to replace them \u2014 a rename onto an existing key
 * silently overwrites it.
 */
export function MoveToFolderModal({
  open,
  onClose,
  keys,
  startPrefix,
  onConfirm,
  isMoving = false,
}: MoveToFolderModalProps) {
  const [at, setAt] = useState(startPrefix);
  const [folders, setFolders] = useState<string[] | null>(null);
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [replace, setReplace] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAt(startPrefix);
      setReplace(false);
    }
  }, [open, startPrefix]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFolders(null);
    setError(null);
    Promise.all([reqFetchFolders(at), reqFetchObjects(at)]).then(([f, o]) => {
      if (cancelled) return;
      if (!f.success || !o.success) {
        setError("Couldn't list this folder");
        setFolders([]);
        return;
      }
      setFolders(f.data ?? []);
      setExisting(new Set((o.data ?? []).map((x) => baseName(x.Key))));
    });
    return () => {
      cancelled = true;
    };
  }, [open, at]);

  const sameFolder =
    keys.length > 0 && keys.every((k) => parentPrefix(k) === at);
  const clashes = keys.filter(
    (k) => parentPrefix(k) !== at && existing.has(baseName(k)),
  );
  const crumbs = at.split("/").filter(Boolean);
  const movable = keys.filter((k) => parentPrefix(k) !== at).length;
  const willMove = replace ? movable : movable - clashes.length;

  return (
    <Modal
      open={open}
      onClose={isMoving ? () => {} : onClose}
      title={`Move ${keys.length === 1 ? baseName(keys[0] ?? "") : `${keys.length} objects`}`}
      description="Choose a destination folder. File names are kept."
      widthClass="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(at, replace)}
            loading={isMoving}
            disabled={sameFolder || folders === null || willMove === 0}
          >
            {willMove > 0
              ? `Move ${willMove === 1 ? "here" : `${willMove} here`}`
              : "Move here"}
          </Button>
        </>
      }
    >
      <nav
        aria-label="Destination"
        className="mb-2 flex flex-wrap items-center gap-1 text-sm"
      >
        <button
          type="button"
          onClick={() => setAt("")}
          className={cn(
            "rounded px-1 cursor-pointer hover:underline",
            at === "" ? "font-medium text-primary" : "text-secondary",
          )}
        >
          Bucket root
        </button>
        {crumbs.map((c, i) => {
          const p = crumbs.slice(0, i + 1).join("/") + "/";
          return (
            <span key={p} className="flex items-center gap-1">
              <FontAwesomeIcon
                icon={faChevronRight}
                className="h-2 w-2 text-dimmed"
              />
              <button
                type="button"
                onClick={() => setAt(p)}
                className={cn(
                  "rounded px-1 cursor-pointer hover:underline",
                  i === crumbs.length - 1
                    ? "font-medium text-primary"
                    : "text-secondary",
                )}
              >
                {c}
              </button>
            </span>
          );
        })}
      </nav>

      <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {folders === null ? (
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="px-3 py-2.5">
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-elevated" />
            </li>
          ))
        ) : folders.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted">
            No subfolders here.
          </li>
        ) : (
          folders.map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => setAt(f)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-primary transition-colors hover:bg-surface-alt cursor-pointer"
              >
                <FontAwesomeIcon
                  icon={faFolder}
                  className="h-3.5 w-3.5 text-info"
                />
                <span className="flex-1 truncate">{baseName(f)}</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="h-2.5 w-2.5 text-muted"
                />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-3 flex flex-col gap-2">
        {error && <Alert variant="error">{error}</Alert>}
        {sameFolder && (
          <p className="text-xs text-muted">
            {keys.length === 1 ? "It's" : "They're"} already in this folder.
          </p>
        )}
        {clashes.length > 0 && (
          <Alert variant="warning">
            {clashes.length === 1
              ? `“${baseName(clashes[0])}” already exists here.`
              : `${clashes.length} names already exist here.`}{" "}
            <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 font-medium">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Replace {clashes.length === 1 ? "it" : "them"}
            </label>
            {!replace && " (otherwise skipped)"}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
