"use client";

import React, { useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUpload, faFile } from "@fortawesome/pro-solid-svg-icons";

interface FullscreenDropZoneProps {
  isActive: boolean;
  onFileUpload: (file: File) => void;
  onDragStateChange: (isActive: boolean) => void;
  disabled?: boolean;
}

const FullscreenDropZone: React.FC<FullscreenDropZoneProps> = ({
  isActive,
  onFileUpload,
  onDragStateChange,
  disabled = false,
}) => {
  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        // Check if at least one item is a file
        const hasFiles = Array.from(e.dataTransfer.items).some(
          (item) => item.kind === "file"
        );
        if (hasFiles) {
          onDragStateChange(true);
        }
      }
    },
    [disabled, onDragStateChange]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only hide if we're leaving the window entirely
      if (!e.relatedTarget) {
        onDragStateChange(false);
      }
    },
    [onDragStateChange]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      onDragStateChange(false);

      if (disabled) return;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        files.forEach((file) => onFileUpload(file));
      }
    },
    [disabled, onFileUpload, onDragStateChange]
  );

  useEffect(() => {
    if (disabled) return;

    // Add event listeners to the entire document
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop, disabled]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div className="w-full max-w-md p-12 mx-4 bg-white border-4 border-blue-500 border-dashed shadow-2xl rounded-2xl">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="text-6xl text-blue-500 animate-bounce">
            <FontAwesomeIcon icon={faFile} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Drop files here
            </h2>
            <p className="text-gray-600">Release to upload to your bucket</p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FontAwesomeIcon icon={faCloudUpload} />
            <span>Multiple files supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenDropZone;
