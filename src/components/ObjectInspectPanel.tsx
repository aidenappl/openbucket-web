"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faChevronLeft,
  faDownload,
  faFileLines,
  faLink,
  faLock,
  faPen,
  faRightLeft,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { ObjectACLResponse, ObjectHead } from "@/types";
import { formatBytes } from "@/tools/formatBytes.tools";
import { formatDate } from "@/tools/formatDate.tools";
import {
  baseName,
  explorerHref,
  isPublicAcl,
  parentPrefix,
} from "@/tools/objectUrl.tools";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { CopyButton } from "@/components/ui/copy-button";
import { iconForKey } from "@/components/ObjectThumb";
import { cn } from "@/lib/utils";

interface ObjectInspectPanelProps {
  object: ObjectHead | null;
  objectACL: ObjectACLResponse | null;
  fullPath: string;
  previewUrl: string | null;
  publicUrl: string;
  isLoading: boolean;
  notFound: boolean;
  onRename: () => void;
  onMove: () => void;
  onChangeAccess: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
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
    ["application/json", "application/xml", "application/javascript"].includes(
      ct,
    )
  )
    return "text";
  return "unsupported";
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[120px_1fr] sm:gap-6">
    <dt className="text-xs font-medium uppercase tracking-wider text-muted">
      {label}
    </dt>
    <dd className="min-w-0 text-sm text-primary">{children}</dd>
  </div>
);

const ObjectInspectPanel = ({
  object,
  objectACL,
  fullPath,
  previewUrl,
  publicUrl,
  isLoading,
  notFound,
  onRename,
  onMove,
  onChangeAccess,
  onOpen,
  onDownload,
  onCopyLink,
  onDelete,
}: ObjectInspectPanelProps) => {
  const filename = baseName(fullPath);
  const parent = parentPrefix(fullPath);
  const previewType = getPreviewType(object?.ContentType);
  const acl = object?.Metadata?.Acl;
  const isPublic = isPublicAcl(acl);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <Link
          href={explorerHref(parent)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-2.5 w-2.5" />
          {parent ? baseName(parent) : "Bucket root"}
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
              <FontAwesomeIcon
                icon={iconForKey(fullPath, object?.ContentType)}
                className="h-4 w-4 text-secondary"
              />
            </span>
            <div className="min-w-0">
              <h1
                className="truncate text-xl font-semibold text-primary"
                title={filename}
              >
                {filename}
              </h1>
              <p className="text-sm text-secondary">
                {object ? (
                  <>
                    {formatBytes(object.ContentLength || 0)} · Modified{" "}
                    {formatDate(object.LastModified)}
                  </>
                ) : isLoading ? (
                  <span className="inline-block h-3 w-48 animate-pulse rounded bg-surface-elevated align-middle" />
                ) : (
                  "Not found"
                )}
              </p>
            </div>
          </div>
          {object && (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onDownload}>
                <FontAwesomeIcon
                  icon={faDownload}
                  className="mr-2 h-3.5 w-3.5"
                />
                Download
              </Button>
              <Button variant="secondary" onClick={onOpen}>
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="mr-2 h-3.5 w-3.5"
                />
                Open
              </Button>
              <Button variant="secondary" onClick={onCopyLink}>
                <FontAwesomeIcon icon={faLink} className="mr-2 h-3.5 w-3.5" />
                Copy link
              </Button>
              <Button variant="secondary" onClick={onChangeAccess}>
                <FontAwesomeIcon icon={faLock} className="mr-2 h-3.5 w-3.5" />
                Access
              </Button>
              <Menu
                label="More actions"
                className="border border-border-strong"
                items={[
                  { label: "Rename", icon: faPen, onSelect: onRename },
                  { label: "Move", icon: faRightLeft, onSelect: onMove },
                  "separator",
                  {
                    label: "Delete",
                    icon: faTrash,
                    destructive: true,
                    onSelect: onDelete,
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {notFound ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm font-medium text-primary">
            This object doesn&apos;t exist
          </p>
          <p className="mt-1 text-sm text-secondary">
            It may have been deleted, renamed or moved.
          </p>
          <Link
            href={explorerHref(parent)}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Back to {parent ? baseName(parent) : "the bucket root"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Details */}
          <section
            aria-label="Details"
            className="rounded-lg border border-border bg-surface px-5 py-2"
          >
            {isLoading || !object ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-surface-elevated"
                    style={{ width: `${50 + i * 8}%` }}
                  />
                ))}
              </div>
            ) : (
              <dl className="divide-y divide-border">
                <Row label="Key">
                  <span className="flex items-start gap-2">
                    <span className="break-all font-mono text-xs leading-5">
                      {fullPath}
                    </span>
                    <button
                      type="button"
                      onClick={onRename}
                      aria-label="Rename"
                      className="shrink-0 rounded p-1 text-muted hover:bg-surface-elevated hover:text-primary cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                    </button>
                  </span>
                </Row>
                <Row label="Access">
                  <span className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        isPublic ? "text-healthy" : "text-secondary",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isPublic ? "bg-healthy" : "bg-border-emphasis",
                        )}
                      />
                      {isPublic ? "Public read" : acl ? "Private" : "Unknown"}
                    </span>
                    <button
                      type="button"
                      onClick={onChangeAccess}
                      className="text-xs font-medium text-accent hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </span>
                </Row>
                {isPublic && (
                  <Row label="Public URL">
                    <span className="flex items-start gap-2">
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-xs leading-5 text-accent hover:underline"
                      >
                        {publicUrl}
                      </a>
                      <CopyButton
                        text={publicUrl}
                        aria-label="Copy public URL"
                        className="shrink-0"
                      />
                    </span>
                  </Row>
                )}
                <Row label="Type">
                  <span className="font-mono text-xs">
                    {object.ContentType || "—"}
                  </span>
                </Row>
                <Row label="Size">
                  {formatBytes(object.ContentLength || 0)}{" "}
                  <span className="text-muted">
                    ({(object.ContentLength || 0).toLocaleString()} bytes)
                  </span>
                </Row>
                <Row label="Last modified">
                  {formatDate(object.LastModified)}
                </Row>
                <Row label="ETag">
                  <span className="break-all font-mono text-xs text-secondary">
                    {object.ETag?.replaceAll('"', "") || "—"}
                  </span>
                </Row>
                {object.StorageClass && (
                  <Row label="Storage class">{object.StorageClass}</Row>
                )}
                <Row label="Owner">
                  {objectACL ? (
                    <span className="flex flex-col">
                      <span>{objectACL.Owner.DisplayName || "—"}</span>
                      <span className="break-all font-mono text-xs text-muted">
                        {objectACL.Owner.ID}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-block h-3 w-32 animate-pulse rounded bg-surface-elevated" />
                  )}
                </Row>
                {objectACL?.Grants && objectACL.Grants.length > 0 && (
                  <Row label="Grants">
                    <ul className="flex flex-col gap-1.5">
                      {objectACL.Grants.map((grant, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="truncate">
                            {grant.Grantee.DisplayName ||
                              grant.Grantee.URI ||
                              grant.Grantee.ID}
                          </span>
                          <span className="shrink-0 rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-xs text-secondary">
                            {grant.Permission}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Row>
                )}
                {object.Metadata &&
                  Object.keys(object.Metadata).filter((k) => k !== "Acl")
                    .length > 0 && (
                    <Row label="Metadata">
                      <ul className="flex flex-col gap-1 font-mono text-xs">
                        {Object.entries(object.Metadata)
                          .filter(([k]) => k !== "Acl")
                          .map(([k, v]) => (
                            <li key={k} className="break-all">
                              <span className="text-muted">{k}:</span> {v}
                            </li>
                          ))}
                      </ul>
                    </Row>
                  )}
              </dl>
            )}
          </section>

          {/* Preview */}
          <section
            aria-label="Preview"
            className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-alt p-4"
          >
            {isLoading || !object || !previewUrl ? (
              <div className="h-40 w-40 animate-pulse rounded-lg bg-surface-elevated" />
            ) : previewType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={filename}
                className="max-h-[560px] max-w-full rounded-md object-contain"
              />
            ) : previewType === "pdf" || previewType === "text" ? (
              <iframe
                src={previewUrl}
                title={`Preview of ${filename}`}
                className="h-[560px] w-full rounded-md border border-border bg-surface"
              />
            ) : previewType === "video" ? (
              <video
                src={previewUrl}
                controls
                className="max-h-[560px] max-w-full rounded-md"
              />
            ) : previewType === "audio" ? (
              <audio src={previewUrl} controls className="w-full max-w-sm" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="h-10 w-10 text-dimmed"
                />
                <p className="text-sm text-secondary">
                  No preview for {object.ContentType || "this file type"}.
                </p>
                <Button variant="secondary" size="sm" onClick={onOpen}>
                  Open in new tab
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ObjectInspectPanel;
