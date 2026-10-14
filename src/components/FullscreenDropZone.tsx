"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/pro-solid-svg-icons";
import type { UploadEntry } from "@/hooks/useUploader";
import { readDropped } from "@/tools/dropEntries.tools";

interface FullscreenDropZoneProps {
  /** Files and folders; folder contents keep their relative paths. */
  onFiles: (entries: UploadEntry[]) => void;
  /** Where dropped files land, shown in the overlay. */
  destination: string;
  disabled?: boolean;
}

/**
 * Whole-window drop target for file and folder uploads.
 *
 * The overlay is driven by an enter/leave depth counter: `dragleave` fires every
 * time the pointer crosses a child element, so hiding on `!relatedTarget` (the
 * old approach) flickered and could stick on in Safari.
 */
const FullscreenDropZone = ({
  onFiles,
  destination,
  disabled = false,
}: FullscreenDropZoneProps) => {
  const [active, setActive] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    if (disabled) return;
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);
      if (!e.dataTransfer) return;
      readDropped(e.dataTransfer).then((entries) => {
        if (entries.length > 0) onFiles(entries);
      });
    };

    document.addEventListener("dragenter", onEnter);
    document.addEventListener("dragover", onOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onEnter);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [disabled, onFiles]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-accent bg-surface p-10 text-center shadow-lg">
        <FontAwesomeIcon
          icon={faCloudArrowUp}
          className="h-10 w-10 text-accent"
        />
        <h2 className="mt-4 text-lg font-semibold text-primary">
          Drop files or folders to upload
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Into{" "}
          <span className="font-mono">{destination || "the bucket root"}</span>
        </p>
      </div>
    </div>
  );
};

export default FullscreenDropZone;
