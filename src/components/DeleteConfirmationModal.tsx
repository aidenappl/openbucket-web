"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faExclamationTriangle,
} from "@fortawesome/pro-solid-svg-icons";
import Button from "./Button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: string[];
  title?: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  items,
  title = "Confirm Deletion",
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const itemCount = items.length;
  const isBulkDelete = itemCount > 1;
  const showPreview = itemCount <= 5;

  // Helper function to extract display name from key/path
  const getDisplayName = (item: string): string => {
    if (!item) return item;

    // Remove trailing slash for folders
    const cleanItem = item.endsWith("/") ? item.slice(0, -1) : item;

    // Split by slash and get the last part (filename/folder name)
    const parts = cleanItem.split("/");
    const displayName = parts[parts.length - 1];

    // Return the display name or fallback to original if empty
    return displayName || item;
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isBulkDelete
                ? `You are about to delete ${itemCount} items`
                : "You are about to delete 1 item"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-gray-700 mb-4">
            {isBulkDelete
              ? "Are you sure you want to delete these items? This action cannot be undone."
              : "Are you sure you want to delete this item? This action cannot be undone."}
          </p>

          {/* Items Preview */}
          {showPreview ? (
            <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-800 mb-2">
                {isBulkDelete ? "Items to delete:" : "Item to delete:"}
              </p>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="text-red-500 text-xs flex-shrink-0"
                    />
                    <span className="truncate" title={item}>
                      {getDisplayName(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-700">
                <FontAwesomeIcon icon={faTrash} className="text-red-500 mr-2" />
                <span className="font-medium">{itemCount} items</span> will be
                permanently deleted
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-2 bg-gray-50 rounded-b-lg">
          <Button
            onClick={onClose}
            variant="light"
            className="flex-1"
            active={!isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="dark"
            hoverVariant="danger"
            className="flex-1 bg-red-600 hover:bg-red-700"
            active={!isDeleting}
          >
            {isDeleting
              ? `Deleting...`
              : `Delete ${isBulkDelete ? `${itemCount} Items` : "Item"}`}
          </Button>
        </div>
      </div>
      <div className="fixed inset-0 bg-black opacity-20" />
    </div>
  );
};

export default DeleteConfirmationModal;
