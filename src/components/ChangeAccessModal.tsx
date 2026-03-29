"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faLock } from "@fortawesome/pro-solid-svg-icons";
import Button from "./Button";

interface ChangeAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (acl: string) => void;
  currentAcl: string;
  isLoading?: boolean;
}

const ACL_OPTIONS = [
  {
    value: "private",
    label: "Private",
    description: "Only you can read and write this object",
    icon: faLock,
  },
  {
    value: "public-read",
    label: "Public Read",
    description: "Anyone with the link can view this object",
    icon: faGlobe,
  },
];

const ChangeAccessModal: React.FC<ChangeAccessModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentAcl,
  isLoading = false,
}) => {
  const [selected, setSelected] = useState(currentAcl || "private");

  useEffect(() => {
    if (isOpen) setSelected(currentAcl || "private");
  }, [isOpen, currentAcl]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") onConfirm(selected);
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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Change Object Access
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Choose who can access this object
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-2.5">
          {ACL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className={`w-full text-left flex items-start gap-3.5 px-4 py-3.5 rounded-lg border transition-all ${
                selected === option.value
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                  selected === option.value
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <FontAwesomeIcon icon={option.icon} className="text-sm" />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    selected === option.value
                      ? "text-blue-900"
                      : "text-gray-800"
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button onClick={onClose} variant="light">
            Cancel
          </Button>
          <Button onClick={() => onConfirm(selected)} active={!isLoading}>
            {isLoading ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangeAccessModal;
