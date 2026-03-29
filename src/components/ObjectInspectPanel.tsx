"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faEdit,
  faFile,
} from "@fortawesome/pro-solid-svg-icons";
import Skeleton from "react-loading-skeleton";
import { ObjectACLResponse, ObjectHead } from "@/types";
import { formatBytes } from "@/tools/formatBytes.tools";
import { formatDate } from "@/tools/formatDate.tools";
import Button from "./Button";
import Spinner from "./Spinner";

interface ObjectInspectPanelProps {
  object: ObjectHead | null;
  objectACL: ObjectACLResponse | null;
  fullPath: string;
  isLoading: boolean;
  onBack: () => void;
  onRename: () => void;
  onMove: () => void;
  onChangeAccess: () => void;
  onPreview: () => void;
  onDelete: () => void;
}

const AclBadge = ({ acl }: { acl: string | undefined }) => {
  const isPublic =
    acl === "public-read" ||
    acl === "PUBLIC-READ" ||
    acl?.toLowerCase() === "public-read";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isPublic
          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {isPublic ? "Public Read" : "Private"}
    </span>
  );
};

const MetaRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <>
    <span className="text-slate-400 font-medium text-sm leading-6">
      {label}
    </span>
    <div className="text-sm leading-6">{children}</div>
  </>
);

const ObjectInspectPanel: React.FC<ObjectInspectPanelProps> = ({
  object,
  objectACL,
  fullPath,
  isLoading,
  onBack,
  onRename,
  onMove,
  onChangeAccess,
  onPreview,
  onDelete,
}) => {
  const filename = fullPath.split("/").pop();

  return (
    <div className="flex flex-col bg-white w-full border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between gap-10 items-center px-6 pt-5 pb-5 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <button
            className="flex items-center gap-1 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-700 transition-colors mb-3"
            onClick={onBack}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            Back
          </button>
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <FontAwesomeIcon
                icon={faFile}
                className="text-slate-500 text-sm"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate leading-tight">
                {filename}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {object ? (
                  <>Modified {formatDate(object.LastModified)}</>
                ) : (
                  <Skeleton width={220} />
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={onChangeAccess} variant="light">
            Change Access
          </Button>
          <Button onClick={onMove} variant="light">
            Move
          </Button>
          <Button onClick={onPreview} variant="light">
            Preview
          </Button>
          <Button onClick={onDelete} hoverVariant="danger">
            Delete
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {isLoading && (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-500">
            <Spinner />
            <span className="text-sm">Loading object...</span>
          </div>
        )}
        {!isLoading && !object && (
          <div className="flex items-center justify-center h-32 text-sm text-slate-500">
            Object not found
          </div>
        )}
        {!isLoading && object && (
          <div className="flex flex-col gap-6">
            {/* Metadata grid */}
            <div className="grid grid-cols-[140px_1fr] gap-x-8 gap-y-4 items-baseline">
              <MetaRow label="Path">
                <span className="font-mono text-xs leading-6 text-gray-700 break-all inline-flex items-baseline gap-2">
                  {fullPath || "N/A"}
                  <FontAwesomeIcon
                    icon={faEdit}
                    className="text-slate-300 cursor-pointer hover:text-slate-700 transition-colors shrink-0 text-[11px]"
                    onClick={onRename}
                  />
                </span>
              </MetaRow>

              <MetaRow label="Type">
                <span className="font-mono text-xs leading-6 text-gray-700">
                  {object.ContentType || "N/A"}
                </span>
              </MetaRow>

              <MetaRow label="Size">
                <span className="text-gray-800 leading-6">
                  {formatBytes(object.ContentLength || 0)}
                </span>
              </MetaRow>

              <MetaRow label="ETag">
                <span className="font-mono text-xs leading-6 text-slate-500 break-all">
                  {object.ETag?.replaceAll('"', "") || "N/A"}
                </span>
              </MetaRow>

              <MetaRow label="Access">
                <AclBadge acl={object.Metadata?.Acl} />
              </MetaRow>

              <MetaRow label="Owner">
                {objectACL ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-800">
                      {objectACL.Owner.DisplayName}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {objectACL.Owner.ID}
                    </span>
                  </div>
                ) : (
                  <Skeleton width={140} />
                )}
              </MetaRow>
            </div>

            {/* Grants */}
            {objectACL?.Grants && objectACL.Grants.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Grants
                </p>
                <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {objectACL.Grants.map((grant, index) => (
                    <div
                      key={"grant_" + index}
                      className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700">
                        {grant.Grantee.DisplayName || grant.Grantee.URI}
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {grant.Permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectInspectPanel;
