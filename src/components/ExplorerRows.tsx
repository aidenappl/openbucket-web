"use client";

import { memo, MouseEvent } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Menu, MenuItem } from "@/components/ui/menu";
import { ObjectThumb, iconForKey } from "@/components/ObjectThumb";
import { ListedObject } from "@/hooks/useBucketData";
import { formatBytes } from "@/tools/formatBytes.tools";
import { formatDate } from "@/tools/formatDate.tools";
import {
  baseName,
  explorerHref,
  isPublicAcl,
  objectHref,
} from "@/tools/objectUrl.tools";
import { cn } from "@/lib/utils";

/**
 * Explorer rows. Memoised, and every handler goes through `actions` — a ref
 * the explorer refreshes on each render — so a row re-renders only when its
 * own data or selection changes.
 *
 * ⚠️ Rows used to be inline in the explorer with fresh closures and menu arrays
 * per render. Big folders render in batches (useProgressiveCount), and each
 * batch then re-rendered every row already on screen: atlas/hotels/ took
 * seconds of growing long tasks to fill in. Keep new row props primitive or
 * stable, and read handlers from `actions.current` at event time.
 */
export type RowActions = {
  folderMenu: (folder: string) => MenuItem[];
  objectMenu: (object: ListedObject) => MenuItem[];
  toggle: (key: string, shift: boolean) => void;
  /** Navigate to a folder in place (history.pushState). */
  open: (folder: string) => void;
  prefetch: (folder: string) => void;
};

export type RowActionsRef = { readonly current: RowActions };

/**
 * onClick for folder links: plain left clicks navigate in place; modified and
 * middle clicks keep the real href (new tab / window).
 */
export const folderLinkClick =
  (actions: RowActionsRef, folder: string) =>
  (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    e.preventDefault();
    actions.current.open(folder);
  };

export const AclTag = ({ object }: { object: ListedObject }) => {
  if (object.head === undefined)
    return (
      <span className="inline-block h-3 w-14 animate-pulse rounded bg-surface-elevated" />
    );
  const acl = object.head?.Metadata?.Acl;
  if (!acl) return <span className="text-muted">—</span>;
  const pub = isPublicAcl(acl);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        pub ? "text-healthy" : "text-secondary",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          pub ? "bg-healthy" : "bg-border-emphasis",
        )}
      />
      {pub ? "Public" : "Private"}
    </span>
  );
};

export const FolderRow = memo(function FolderRow({
  folder,
  selected,
  actions,
}: {
  folder: string;
  selected: boolean;
  actions: RowActionsRef;
}) {
  const name = baseName(folder);
  return (
    <TableRow selected={selected}>
      <TableCell className="pr-0">
        <Checkbox
          aria-label={`Select folder ${name}`}
          checked={selected}
          onChange={(_, shift) => actions.current.toggle(folder, shift)}
        />
      </TableCell>
      <TableCell className="max-w-0 w-full">
        <Link
          href={explorerHref(folder)}
          prefetch={false}
          onClick={folderLinkClick(actions, folder)}
          onMouseEnter={() => actions.current.prefetch(folder)}
          onFocus={() => actions.current.prefetch(folder)}
          className="flex min-w-0 items-center gap-2.5 font-medium hover:underline"
        >
          <FontAwesomeIcon
            icon={iconForKey(folder)}
            className="h-3.5 w-3.5 shrink-0 text-info"
          />
          <span className="truncate">{name}</span>
        </Link>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-muted">—</TableCell>
      <TableCell className="hidden md:table-cell text-muted">—</TableCell>
      <TableCell className="hidden lg:table-cell text-muted">—</TableCell>
      <TableCell className="py-1.5 text-right">
        <Menu
          label={`Actions for folder ${name}`}
          items={() => actions.current.folderMenu(folder)}
        />
      </TableCell>
    </TableRow>
  );
});

export const ObjectRow = memo(function ObjectRow({
  object,
  selected,
  actions,
}: {
  object: ListedObject;
  selected: boolean;
  actions: RowActionsRef;
}) {
  const name = baseName(object.Key);
  return (
    <TableRow selected={selected}>
      <TableCell className="pr-0">
        <Checkbox
          aria-label={`Select ${name}`}
          checked={selected}
          onChange={(_, shift) => actions.current.toggle(object.Key, shift)}
        />
      </TableCell>
      <TableCell className="max-w-0 w-full">
        <Link
          href={objectHref(object.Key)}
          className="flex min-w-0 items-center gap-2.5 hover:underline"
          title={name}
        >
          <FontAwesomeIcon
            icon={iconForKey(object.Key, object.head?.ContentType)}
            className="h-3.5 w-3.5 shrink-0 text-muted"
          />
          <span className="truncate">{name}</span>
        </Link>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-secondary tabular-nums">
        {formatBytes(object.Size)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <AclTag object={object} />
      </TableCell>
      <TableCell className="hidden lg:table-cell text-secondary">
        <time
          dateTime={object.LastModified}
          title={formatDate(object.LastModified)}
        >
          {formatDate(object.LastModified, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </TableCell>
      <TableCell className="py-1.5 text-right">
        <Menu
          label={`Actions for ${name}`}
          items={() => actions.current.objectMenu(object)}
        />
      </TableCell>
    </TableRow>
  );
});

/** A grid-view tile: `object` is undefined for folders. */
export const GridItem = memo(function GridItem({
  itemKey,
  object,
  selected,
  actions,
}: {
  itemKey: string;
  object: ListedObject | undefined;
  selected: boolean;
  actions: RowActionsRef;
}) {
  const isFolder = itemKey.endsWith("/");
  const name = baseName(itemKey);
  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface transition-colors",
        selected
          ? "border-accent ring-1 ring-accent"
          : "border-border hover:border-border-emphasis",
      )}
    >
      <Link
        href={isFolder ? explorerHref(itemKey) : objectHref(itemKey)}
        prefetch={isFolder ? false : undefined}
        onClick={isFolder ? folderLinkClick(actions, itemKey) : undefined}
        onMouseEnter={
          isFolder ? () => actions.current.prefetch(itemKey) : undefined
        }
        onFocus={isFolder ? () => actions.current.prefetch(itemKey) : undefined}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isFolder ? (
          <div className="flex aspect-[4/3] items-center justify-center bg-surface-alt">
            <FontAwesomeIcon
              icon={iconForKey(itemKey)}
              className="h-10 w-10 text-info"
            />
          </div>
        ) : (
          <ObjectThumb
            objectKey={itemKey}
            contentType={object?.head?.ContentType}
            className="aspect-[4/3]"
          />
        )}
        <div className="px-3 py-2 pr-10">
          <p className="truncate text-sm font-medium text-primary" title={name}>
            {name}
          </p>
          <p className="truncate text-xs text-muted">
            {isFolder ? "Folder" : object ? formatBytes(object.Size) : ""}
          </p>
        </div>
      </Link>
      <div
        className={cn(
          "absolute left-2 top-2 rounded-lg bg-surface/90 transition-opacity",
          selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <div className="p-3">
          <Checkbox
            aria-label={`Select ${isFolder ? "folder " : ""}${name}`}
            checked={selected}
            onChange={(_, shift) => actions.current.toggle(itemKey, shift)}
          />
        </div>
      </div>
      <div className="absolute bottom-1.5 right-1.5">
        <Menu
          label={`Actions for ${isFolder ? "folder " : ""}${name}`}
          items={() =>
            isFolder
              ? actions.current.folderMenu(itemKey)
              : object
                ? actions.current.objectMenu(object)
                : []
          }
        />
      </div>
    </li>
  );
});
