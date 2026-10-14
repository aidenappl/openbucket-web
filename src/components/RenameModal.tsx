"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the new FULL key (folder keys keep their trailing `/`). */
  onConfirm: (newFullPath: string) => void;
  /** Full key. A folder key ends in `/`. */
  currentPath: string;
  isLoading?: boolean;
}

const getExtension = (filename: string): string => {
  const dot = filename.lastIndexOf(".");
  return dot <= 0 ? "" : filename.slice(dot);
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) return "Name can't be empty.";
  if (name.includes("/"))
    return "Name can't contain “/”. Use Move to change folders.";
  if (name.includes("\\") || name.includes(".."))
    return "Name can't contain “\\” or “..”.";
  if (name.length > 255) return "Name is too long (max 255 characters).";
  return null;
};

/** Rename an object or a folder in place (same parent). */
const RenameModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
  isLoading = false,
}: RenameModalProps) => {
  const isFolder = currentPath.endsWith("/");
  const trimmed = isFolder ? currentPath.slice(0, -1) : currentPath;
  const parts = trimmed.split("/");
  const original = parts.pop() || "";
  const parent = parts.length > 0 ? parts.join("/") + "/" : "";

  const [name, setName] = useState(original);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(original);
      setTouched(false);
    }
  }, [isOpen, original]);

  // Select the stem, not the extension — the usual rename gesture.
  //
  // ⚠️ Only once the field actually holds `original`. Opening sets `name` in an
  // effect, and React writing the input's value afterwards moves the caret to
  // the end — selecting before that render landed silently did nothing, so
  // typing appended to the old name instead of replacing it.
  const selected = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      selected.current = false;
      return;
    }
    if (selected.current || name !== original) return;
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const ext = isFolder ? "" : getExtension(original);
      el.setSelectionRange(0, original.length - ext.length);
      selected.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, name, original, isFolder]);

  const error = validateName(name);
  const unchanged = name.trim() === original;
  const extChanged =
    !isFolder &&
    getExtension(original) !== "" &&
    getExtension(name.trim()) !== getExtension(original);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error || unchanged || isLoading) return;
    onConfirm(parent + name.trim() + (isFolder ? "/" : ""));
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Rename ${isFolder ? "folder" : "object"}`}
      description={
        parent ? (
          <>
            In <span className="font-mono">{parent}</span>
          </>
        ) : (
          "At the bucket root"
        )
      }
      initialFocusRef={inputRef}
      widthClass="max-w-md"
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched ? (error ?? undefined) : undefined}
          autoComplete="off"
          data-1p-ignore
        />
        {isFolder && (
          <p className="text-xs text-secondary">
            Every object inside is copied to the new name and the originals are
            deleted.
          </p>
        )}
        {extChanged && !error && (
          <Alert variant="warning">
            The extension changes from{" "}
            <span className="font-mono">{getExtension(original)}</span> to{" "}
            <span className="font-mono">
              {getExtension(name.trim()) || "(none)"}
            </span>
            .
          </Alert>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={unchanged}>
            {isLoading ? "Renaming…" : "Rename"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RenameModal;
