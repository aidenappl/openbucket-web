"use client";

import React, { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUpload, faFile } from "@fortawesome/pro-solid-svg-icons";

interface DragDropUploadProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFileUpload,
  disabled = false,
  className = "",
  multiple = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dragCounter, setDragCounter] = useState(0); // Track nested drag events
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter <= 0) {
        setIsDragOver(false);
        return 0;
      }
      return newCounter;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDragCounter(0);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);

        if (multiple) {
          files.forEach((file) => onFileUpload(file));
        } else {
          onFileUpload(files[0]);
        }

        e.dataTransfer.clearData();
      }
    },
    [disabled, multiple, onFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);

        if (multiple) {
          fileArray.forEach((file) => onFileUpload(file));
        } else {
          onFileUpload(fileArray[0]);
        }
      }

      // Reset the input value so the same file can be selected again
      e.target.value = "";
    },
    [disabled, multiple, onFileUpload]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [disabled, handleClick]
  );

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 
        ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Upload files${multiple ? "" : " (single file)"}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={`
          text-4xl transition-colors duration-200
          ${isDragOver ? "text-blue-500" : "text-gray-400"}
        `}
        >
          <FontAwesomeIcon icon={isDragOver ? faFile : faCloudUpload} />
        </div>

        <div className="space-y-2">
          <p
            className={`
            text-lg font-medium transition-colors duration-200
            ${isDragOver ? "text-blue-700" : "text-gray-700"}
          `}
          >
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>

          <p
            className={`
            text-sm transition-colors duration-200
            ${isDragOver ? "text-blue-600" : "text-gray-500"}
          `}
          >
            or click to browse
          </p>

          {multiple && (
            <p className="text-xs text-gray-400">Multiple files supported</p>
          )}
        </div>
      </div>

      {isDragOver && (
        <div className="absolute inset-0 rounded-lg bg-blue-500 bg-opacity-10 pointer-events-none" />
      )}
    </div>
  );
};

export default DragDropUpload;
