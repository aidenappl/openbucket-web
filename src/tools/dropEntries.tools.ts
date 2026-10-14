import type { UploadEntry } from "@/hooks/useUploader";

/**
 * Turn a drop into upload entries, walking any dropped folders so their
 * structure is kept (`photos/2024/a.jpg`).
 *
 * ⚠️ Two browser rules this works around:
 *  - `DataTransferItem`s are only readable during the drop event, so every
 *    entry is captured synchronously before the first `await`.
 *  - `readEntries` returns at most 100 children per call; keep calling until it
 *    returns an empty batch or large folders are silently truncated.
 *
 * Falls back to the flat `files` list where the entries API is unavailable.
 */
export const readDropped = async (dt: DataTransfer): Promise<UploadEntry[]> => {
  const roots = Array.from(dt.items ?? [])
    .filter((i) => i.kind === "file")
    .map((i) => i.webkitGetAsEntry?.() ?? null);
  const flat = Array.from(dt.files ?? []);

  if (roots.length === 0 || roots.some((r) => r === null)) {
    return flat.map((file) => ({ file, path: file.name }));
  }

  const out: UploadEntry[] = [];
  const walk = async (
    entry: FileSystemEntry,
    parent: string,
  ): Promise<void> => {
    const path = parent ? `${parent}/${entry.name}` : entry.name;
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      out.push({ file, path });
      return;
    }
    if (!entry.isDirectory) return;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (batch.length === 0) break;
      for (const child of batch) await walk(child, path);
    }
  };

  for (const root of roots as FileSystemEntry[]) await walk(root, "");
  return out;
};
