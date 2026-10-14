"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MoveObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPath: string) => void;
  currentPath: string;
  isLoading?: boolean;
}

/** Normalise slashes the way S3 keys expect: forward only, no doubles, no leading. */
const formatPath = (raw: string): string =>
  raw.trim().replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\//, "");

const MoveObjectModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
  isLoading = false,
}: MoveObjectModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(currentPath);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(currentPath);
      setTouched(false);
    }
  }, [isOpen, currentPath]);

  const formatted = formatPath(value);
  const error = !formatted
    ? "Path can't be empty."
    : formatted.endsWith("/")
      ? "Path must end in a file name, not “/”."
      : formatted.includes("..")
        ? "Path can't contain “..”."
        : null;
  const unchanged = formatted === currentPath;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error || unchanged || isLoading) return;
    onConfirm(formatted);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Move object"
      description="Enter the new full path from the bucket root. Missing folders are created implicitly."
      initialFocusRef={inputRef}
      widthClass="max-w-lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          label="New path"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="folder/subfolder/file.ext"
          className="font-mono"
          error={touched ? (error ?? undefined) : undefined}
          hint={
            formatted && formatted !== value.trim()
              ? `Will be saved as ${formatted}`
              : undefined
          }
          autoComplete="off"
          data-1p-ignore
        />
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
            {isLoading ? "Moving…" : "Move"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MoveObjectModal;
