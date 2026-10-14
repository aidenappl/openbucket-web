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
    (files: File[], prefix: string, onSettled?: () => void) => {
      const pending: Promise<void>[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} is over the 5 GB limit`);
          continue;
        }
        if (file.name.includes("..") || file.name.includes("\\")) {
          toast.error(`${file.name}: invalid file name`);
          continue;
        }

        const id = uuidv4();
        const controller = new AbortController();
        controllers.set(id, controller);
        dispatch(
          addUpload({
            id,
            fileName: file.name,
            size: file.size,
            prefix,
            progress: 0,
            status: "uploading",
            startedAt: Date.now(),
          }),
        );

        const p = reqPutObjectWithProgress({
          file,
          prefix,
          signal: controller.signal,
          onUploadProgress: (progress) =>
            dispatch(updateProgress({ id, progress })),
        }).then((res) => {
          controllers.delete(id);
          if (controller.signal.aborted) {
            dispatch(markCanceled({ id }));
          } else if (res.success) {
            dispatch(markCompleted({ id }));
          } else {
            dispatch(markError({ id, error: res.error_message || res.error }));
          }
        });
        pending.push(p);
      }
      if (pending.length > 0) Promise.all(pending).then(() => onSettled?.());
    },
    [dispatch],
  );
};
