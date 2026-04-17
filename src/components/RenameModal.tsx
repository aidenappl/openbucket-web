"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/pro-solid-svg-icons";
import Button from "./Button";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newFullPath: string) => void;
  currentPath: string;
  isLoading?: boolean;
}

const getExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return filename.slice(dotIndex);
};

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const parts = currentPath.split("/");
  const originalFilename = parts.pop() || "";
  const prefix = parts.length > 0 ? parts.join("/") + "/" : "";
  const originalExtension = getExtension(originalFilename);

  const [filename, setFilename] = useState(originalFilename);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const parts = currentPath.split("/");
      setFilename(parts.pop() || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentPath]);

  if (!isOpen) return null;

  const newExtension = getExtension(filename);
  const extensionChanged =
    originalExtension !== "" &&
    newExtension !== originalExtension &&
    filename.trim() !== "";

  const newFullPath = prefix + filename.trim();
  const isValid =
    filename.trim() !== "" && filename.trim() !== originalFilename;

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    if (filename.includes("..") || filename.includes("\\")) {
      setError("Filename contains invalid characters");
      return;
    }
    setError("");
    onConfirm(newFullPath);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Rename Object
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Rename the file while keeping it in the same location
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-3">
          {prefix && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400">
                Location
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 break-all">
                {prefix}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="rename-input"
              className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none"
            >
              Filename
            </label>
            <input
              ref={inputRef}
              id="rename-input"
              className="mt-1 text-sm block w-full bg-white dark:bg-gray-800 dark:text-gray-100 pl-3 py-2 pr-3 rounded-lg outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 focus:outline-blue-500 focus:outline-2"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={originalFilename}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {extensionChanged && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-amber-500 text-xs mt-0.5 shrink-0"
              />
              <p className="text-xs text-amber-800">
                File extension will change from{" "}
                <span className="font-mono font-semibold">
                  {originalExtension}
                </span>{" "}
                to{" "}
                <span className="font-mono font-semibold">
                  {newExtension || "(none)"}
                </span>
                . This may affect how the file is handled.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <Button onClick={onClose} variant="light">
            Cancel
          </Button>
          <Button onClick={handleSubmit} active={isValid && !isLoading}>
            {isLoading ? "Renaming..." : "Rename"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
