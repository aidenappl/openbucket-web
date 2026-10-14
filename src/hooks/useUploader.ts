import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import {
  addUpload,
  markCanceled,
  markCompleted,
  markError,
  updateProgress,
} from "@/store/slices/uploadSlice";
import { reqPutObjectWithProgress } from "@/services/object.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const CONCURRENCY = 4;

/** A file plus its key relative to the upload prefix (`a.jpg`, `photos/a.jpg`). */
export type UploadEntry = { file: File; path: string };

export const entriesFromFiles = (files: File[]): UploadEntry[] =>
  files.map((file) => ({
    file,
    // Set by <input webkitdirectory>; empty for plain file picks.
    path: file.webkitRelativePath || file.name,
  }));

// AbortControllers aren't serialisable, so they live beside the Redux slice
// rather than in it. Keyed by upload id.
const controllers = new Map<string, AbortController>();

export const cancelUpload = (id: string) => {
  controllers.get(id)?.abort();
};

/**
 * Starts uploads into `prefix` and reports progress through the upload slice.
 * `onSettled` runs once, after every file in the batch has finished (success,
 * failure or cancel), so the caller refreshes its listing once. Refreshing per
 * file raced the uploads still in flight: a HEAD could land before an object's
 * metadata was written, showing a fresh upload with no access level.
 */
export const useUploader = () => {
  const dispatch = useDispatch();

  return useCallback(
    (entries: UploadEntry[], prefix: string, onSettled?: () => void) => {
      const queue: (() => Promise<void>)[] = [];
      for (const { file, path } of entries) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${path} is over the 5 GB limit`);
          continue;
        }
        if (
          path.includes("..") ||
          path.includes("\\") ||
          path.startsWith("/")
        ) {
          toast.error(`${path}: invalid file name`);
          continue;
        }

        const id = uuidv4();
        const controller = new AbortController();
        controllers.set(id, controller);
        dispatch(
          addUpload({
            id,
            fileName: path,
            size: file.size,
            prefix,
            progress: 0,
            status: "uploading",
            startedAt: Date.now(),
          }),
        );

        queue.push(async () => {
          // Cancelled while still queued: never start it.
          if (controller.signal.aborted) {
            controllers.delete(id);
            dispatch(markCanceled({ id }));
            return;
          }
          const res = await reqPutObjectWithProgress({
            file,
            prefix,
            key: path,
            signal: controller.signal,
            onUploadProgress: (progress) =>
              dispatch(updateProgress({ id, progress })),
          });
          controllers.delete(id);
          if (controller.signal.aborted) {
            dispatch(markCanceled({ id }));
          } else if (res.success) {
            dispatch(markCompleted({ id }));
          } else {
            dispatch(markError({ id, error: res.error_message || res.error }));
          }
        });
      }
      if (queue.length === 0) return;

      // A dropped folder can hold hundreds of files; run a few at a time so
      // the browser and the API aren't handed them all at once.
      let next = 0;
      const worker = async () => {
        while (next < queue.length) await queue[next++]();
      };
      Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
      ).then(() => onSettled?.());
    },
    [dispatch],
  );
};
