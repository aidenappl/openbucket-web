"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateName } from "./RenameModal";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the trimmed name only; the caller joins it onto the current prefix. */
  onConfirm: (name: string) => void;
  /** Current prefix, shown so it's clear where the folder lands. */
  prefix: string;
  existing: string[];
  isLoading?: boolean;
}

const CreateFolderModal = ({
  isOpen,
  onClose,
  onConfirm,
  prefix,
  existing,
  isLoading = false,
}: CreateFolderModalProps) => {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTouched(false);
    }
  }, [isOpen]);

  const trimmed = name.trim();
  const error =
    validateName(name) ??
    (existing.includes(trimmed) ? `“${trimmed}” already exists here.` : null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error || isLoading) return;
    onConfirm(trimmed);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="New folder"
      description={
        prefix ? (
          <>
            Inside <span className="font-mono">{prefix}</span>
          </>
        ) : (
          "At the bucket root"
        )
      }
      initialFocusRef={inputRef}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          label="Folder name"
          placeholder="e.g. invoices"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched && name ? (error ?? undefined) : undefined}
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
          <Button type="submit" loading={isLoading} disabled={!trimmed}>
            {isLoading ? "Creating…" : "Create folder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFolderModal;
