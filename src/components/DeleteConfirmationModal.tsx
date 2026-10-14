"use client";

import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faFolder } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Full keys. Folder keys end in `/`. */
  items: string[];
  title?: string;
  isDeleting?: boolean;
  /** Extra line under the list, e.g. how many objects a folder holds. */
  detail?: ReactNode;
}

const PREVIEW_LIMIT = 6;

const displayName = (key: string) => {
  const clean = key.endsWith("/") ? key.slice(0, -1) : key;
  return clean.split("/").pop() || key;
};

/**
 * Confirm a permanent delete. Built on the shared Modal so it traps focus,
 * restores it on close, and treats Escape/backdrop as Cancel — the old one was
 * hard-coded `bg-white` (a white slab in dark mode) and confirmed on Enter from
 * anywhere on the page.
 */
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  items,
  title,
  isDeleting = false,
  detail,
}: DeleteConfirmationModalProps) => {
  const count = items.length;
  const folders = items.filter((k) => k.endsWith("/")).length;
  const noun =
    folders === count
      ? count === 1
        ? "folder"
        : "folders"
      : folders === 0
        ? count === 1
          ? "object"
          : "objects"
        : "items";

  return (
    <Modal
      open={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title={
        title ??
        `Delete ${count === 1 ? displayName(items[0] ?? "") : `${count} ${noun}`}?`
      }
      description={`This permanently removes ${count === 1 ? "it" : "them"} from the bucket. It can't be undone.`}
      widthClass="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
          >
            {isDeleting
              ? "Deleting…"
              : `Delete ${count === 1 ? noun : `${count} ${noun}`}`}
          </Button>
        </>
      }
    >
      <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {items.slice(0, PREVIEW_LIMIT).map((key) => (
          <li
            key={key}
            className="flex items-center gap-2.5 px-3 py-2 text-sm"
            title={key}
          >
            <FontAwesomeIcon
              icon={key.endsWith("/") ? faFolder : faFile}
              className="h-3 w-3 shrink-0 text-muted"
            />
            <span className="truncate text-primary">{displayName(key)}</span>
          </li>
        ))}
        {count > PREVIEW_LIMIT && (
          <li className="px-3 py-2 text-xs text-muted">
            and {count - PREVIEW_LIMIT} more
          </li>
        )}
      </ul>
      {detail && <p className="mt-3 text-xs text-secondary">{detail}</p>}
    </Modal>
  );
};

export default DeleteConfirmationModal;
