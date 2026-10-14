"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faLock } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChangeAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (acl: string) => void;
  currentAcl: string;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

const ACL_OPTIONS = [
  {
    value: "private",
    label: "Private",
    description: "Only signed requests can read it",
    icon: faLock,
  },
  {
    value: "public-read",
    label: "Public read",
    description: "Anyone with the URL can read it",
    icon: faGlobe,
  },
];

/** A radio group on the shared Modal. Arrow keys move between the options. */
const ChangeAccessModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentAcl,
  isLoading = false,
  title = "Change access",
  subtitle = "Choose who can read this object.",
}: ChangeAccessModalProps) => {
  const [selected, setSelected] = useState(currentAcl || "private");

  useEffect(() => {
    if (isOpen) setSelected(currentAcl || "private");
  }, [isOpen, currentAcl]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(selected)} loading={isLoading}>
            {isLoading ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div
        role="radiogroup"
        aria-label="Access"
        className="flex flex-col gap-2"
      >
        {ACL_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(option.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelected(
                    option.value === "private" ? "public-read" : "private",
                  );
                }
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors cursor-pointer",
                active
                  ? "border-accent bg-info-bg ring-1 ring-accent"
                  : "border-border-strong hover:bg-surface-alt",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  active
                    ? "bg-accent text-white"
                    : "bg-surface-elevated text-muted",
                )}
              >
                <FontAwesomeIcon icon={option.icon} className="h-3 w-3" />
              </span>
              <span>
                <span className="block text-sm font-medium text-primary">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-secondary">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default ChangeAccessModal;
