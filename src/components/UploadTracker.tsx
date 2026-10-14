"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { RootState } from "@/store/index";
import { clearFinished, removeUpload } from "@/store/slices/uploadSlice";
import { cancelUpload } from "@/hooks/useUploader";
import { formatBytes } from "@/tools/formatBytes.tools";
import { cn } from "@/lib/utils";
import { UploadItem } from "@/types";

const statusText = (u: UploadItem) => {
  switch (u.status) {
    case "uploading":
      return u.progress >= 100 ? "Finalizing…" : `${u.progress}%`;
    case "success":
      return "Done";
    case "canceled":
      return "Canceled";
    case "error":
      return u.error || "Failed";
  }
};

/**
 * Bottom-right upload panel. Each in-flight file can be cancelled; finished
 * rows clear themselves once nothing is uploading, but failures stay until
 * dismissed — the old tracker had no way to dismiss them at all, so one failed
 * upload sat on screen for the rest of the session.
 */
const UploadTracker = () => {
  const uploads = useSelector((state: RootState) => state.upload.uploads);
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);

  const active = uploads.filter((u) => u.status === "uploading").length;
  const failed = uploads.filter((u) => u.status === "error").length;

  useEffect(() => {
    if (active > 0) return;
    const done = uploads.filter(
      (u) => u.status === "success" || u.status === "canceled",
    );
    if (done.length === 0) return;
    const t = setTimeout(
      () => done.forEach((u) => dispatch(removeUpload({ id: u.id }))),
      4000,
    );
    return () => clearTimeout(t);
  }, [uploads, active, dispatch]);

  if (uploads.length === 0) return null;

  const title =
    active > 0
      ? `Uploading ${active} file${active === 1 ? "" : "s"}`
      : failed > 0
        ? `${failed} upload${failed === 1 ? "" : "s"} failed`
        : "Uploads complete";

  return (
    <section
      aria-label="Uploads"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border-strong bg-surface shadow-lg"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-sm font-medium text-primary">{title}</p>
        <div className="flex items-center gap-1">
          {active === 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearFinished())}
              className="rounded px-2 py-1 text-xs text-secondary hover:bg-surface-alt hover:text-primary cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand uploads" : "Collapse uploads"}
            className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-surface-alt hover:text-primary cursor-pointer"
          >
            <FontAwesomeIcon
              icon={collapsed ? faChevronUp : faChevronDown}
              className="h-3 w-3"
            />
          </button>
        </div>
      </header>
      {!collapsed && (
        <ul className="max-h-72 divide-y divide-border overflow-y-auto">
          {uploads.map((u) => (
            <li key={u.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm text-primary"
                    title={(u.prefix ?? "") + u.fileName}
                  >
                    {u.fileName}
                  </p>
                  <p
                    className={cn(
                      "truncate text-xs",
                      u.status === "error" ? "text-destructive" : "text-muted",
                    )}
                  >
                    {u.size != null && `${formatBytes(u.size)} · `}
                    {statusText(u)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    u.status === "uploading"
                      ? cancelUpload(u.id)
                      : dispatch(removeUpload({ id: u.id }))
                  }
                  aria-label={
                    u.status === "uploading"
                      ? `Cancel upload of ${u.fileName}`
                      : `Dismiss ${u.fileName}`
                  }
                  title={u.status === "uploading" ? "Cancel" : "Dismiss"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-alt hover:text-primary cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                </button>
              </div>
              {u.status === "uploading" && (
                <div
                  className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-elevated"
                  role="progressbar"
                  aria-valuenow={u.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${u.fileName} upload progress`}
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UploadTracker;
