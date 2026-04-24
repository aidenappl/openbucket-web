"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faCheck,
  faEdit,
  faFile,
  faFileAudio,
  faFilePdf,
  faFileVideo,
  faFileCode,
  faFileLines,
  faEye,
  faLink,
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
  previewUrl: string | null;
  endpoint: string;
  bucket: string;
  isLoading: boolean;
  onBack: () => void;
  onRename: () => void;
  onMove: () => void;
  onChangeAccess: () => void;
  onPreview: () => void;
  onDelete: () => void;
}

type PreviewType = "image" | "pdf" | "video" | "audio" | "text" | "unsupported";

const getPreviewType = (contentType: string | undefined): PreviewType => {
  if (!contentType) return "unsupported";
  const ct = contentType.toLowerCase();
  if (ct.startsWith("image/")) return "image";
  if (ct === "application/pdf") return "pdf";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  if (
    ct.startsWith("text/") ||
    ct === "application/json" ||
    ct === "application/xml" ||
    ct === "application/javascript"
  )
    return "text";
  return "unsupported";
};

const getPreviewIcon = (type: PreviewType) => {
  switch (type) {
    case "pdf":
      return faFilePdf;
    case "video":
      return faFileVideo;
    case "audio":
      return faFileAudio;
    case "text":
      return faFileCode;
    default:
      return faFileLines;
  }
};

const AclBadge = ({ acl }: { acl: string | undefined }) => {
  const isPublic =
    acl === "public-read" ||
    acl === "PUBLIC-READ" ||
    acl?.toLowerCase() === "public-read";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isPublic
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800"
          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700"
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
  previewUrl,
  endpoint,
  bucket,
  isLoading,
  onBack,
  onRename,
  onMove,
  onChangeAccess,
  onPreview,
  onDelete,
}) => {
  const filename = fullPath.split("/").pop();
  const previewType = getPreviewType(object?.ContentType);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = `https://${endpoint}/${bucket}/${fullPath}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 w-full border border-gray-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between gap-10 items-center px-6 pt-5 pb-5 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex-1 min-w-0">
          <button
            className="flex items-center gap-1 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-700 transition-colors mb-3"
            onClick={onBack}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            Back
          </button>
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <FontAwesomeIcon
                icon={faFile}
                className="text-slate-500 text-sm"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 truncate leading-tight">
                  {filename}
                </h1>
                <button
                  onClick={copyLink}
                  className="text-slate-300 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                  title="Copy link"
                >
                  <FontAwesomeIcon
                    icon={copied ? faCheck : faLink}
                    className={`text-xs ${copied ? "text-green-500" : ""}`}
                  />
                </button>
              </div>
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
      <div className="flex flex-1 min-h-0">
        {/* Left: Metadata */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
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
                  <span className="font-mono text-xs leading-6 text-gray-700 dark:text-zinc-300 break-all inline-flex items-baseline gap-2">
                    {fullPath || "N/A"}
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="text-slate-300 cursor-pointer hover:text-slate-700 transition-colors shrink-0 text-[11px]"
                      onClick={onRename}
                    />
                  </span>
                </MetaRow>

                <MetaRow label="Type">
                  <span className="font-mono text-xs leading-6 text-gray-700 dark:text-zinc-300">
                    {object.ContentType || "N/A"}
                  </span>
                </MetaRow>

                <MetaRow label="Size">
                  <span className="text-gray-800 dark:text-zinc-200 leading-6">
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
                      <span className="text-gray-800 dark:text-zinc-200">
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
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                    {objectACL.Grants.map((grant, index) => (
                      <div
                        key={"grant_" + index}
                        className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-zinc-300">
                          {grant.Grantee.DisplayName || grant.Grantee.URI}
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
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

        {/* Right: Preview */}
        <div className="flex-1 border-l border-gray-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-5 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Spinner />
              <span className="text-sm">Loading preview...</span>
            </div>
          ) : !object ? (
            <div className="text-sm text-slate-400">No preview available</div>
          ) : !previewUrl ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Spinner />
              <span className="text-sm">Generating preview...</span>
            </div>
          ) : previewType === "image" ? (
            <img
              src={previewUrl}
              alt={filename}
              className="w-1/2 max-h-[500px] rounded-lg object-contain shadow-sm"
            />
          ) : previewType === "pdf" ? (
            <iframe
              src={previewUrl}
              title={filename}
              className="w-full h-[500px] rounded-lg border border-gray-200 dark:border-zinc-700"
            />
          ) : previewType === "video" ? (
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-[500px] rounded-lg shadow-sm"
            />
          ) : previewType === "audio" ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={getPreviewIcon("audio")}
                  className="text-slate-400 text-2xl"
                />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate max-w-full">
                {filename}
              </span>
              <audio src={previewUrl} controls className="w-full" />
            </div>
          ) : previewType === "text" ? (
            <iframe
              src={previewUrl}
              title={filename}
              className="w-full h-[500px] rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faFile}
                  className="text-slate-400 text-xl"
                />
              </div>
              <p className="text-sm text-center">
                Preview not available for this file type
              </p>
              <button
                onClick={onPreview}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              >
                <FontAwesomeIcon icon={faEye} className="text-xs" />
                Open in new tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectInspectPanel;
