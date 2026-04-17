"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";

interface MoveObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPath: string) => void;
  currentPath: string;
  isLoading?: boolean;
}

const formatPath = (raw: string): string => {
  // Normalize backslashes to forward slashes
  let path = raw.replace(/\\/g, "/");
  // Collapse multiple slashes
  path = path.replace(/\/+/g, "/");
  // Remove leading slash
  if (path.startsWith("/")) path = path.slice(1);
  return path;
};

const MoveObjectModal: React.FC<MoveObjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [newPath, setNewPath] = useState(currentPath);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewPath(currentPath);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentPath]);

  if (!isOpen) return null;

  const formattedPath = formatPath(newPath);
  const isValid = formattedPath.trim() !== "" && formattedPath !== currentPath;

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    if (formattedPath.includes("..")) {
      setError("Path contains invalid characters");
      return;
    }
    setError("");
    onConfirm(formattedPath);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") handleSubmit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPath(e.target.value);
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
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Move Object
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Enter the new full path for this object
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="move-input"
              className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none"
            >
              New Path
            </label>
            <input
              ref={inputRef}
              id="move-input"
              className="mt-1 text-sm font-mono block w-full bg-white dark:bg-gray-800 dark:text-gray-100 pl-3 py-2 pr-3 rounded-lg outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 focus:outline-blue-500 focus:outline-2"
              type="text"
              value={newPath}
              onChange={handleChange}
              placeholder="folder/subfolder/filename.ext"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {formattedPath !== newPath && newPath.trim() !== "" && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400">
                Formatted path
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 break-all">
                {formattedPath}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <Button onClick={onClose} variant="light">
            Cancel
          </Button>
          <Button onClick={handleSubmit} active={isValid && !isLoading}>
            {isLoading ? "Moving..." : "Move"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoveObjectModal;
