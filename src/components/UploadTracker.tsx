import { RootState } from "@/store/store";
import { removeUpload } from "@/store/slices/uploadSlice";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef } from "react";

const UploadTracker = () => {
  const uploads = useSelector((state: RootState) => state.upload.uploads);
  const dispatch = useDispatch();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-remove completed uploads after 30 seconds (unless there are active uploads)
  useEffect(() => {
    const hasActiveUploads = uploads.some(
      (upload) => upload.status === "uploading"
    );
    const timeouts = timeoutsRef.current;

    uploads.forEach((upload) => {
      if (upload.status === "success" && upload.finishedAt) {
        const existingTimeout = timeouts.get(upload.id);

        // Clear existing timeout if it exists
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Only set timeout if no active uploads
        if (!hasActiveUploads) {
          const timeoutId = setTimeout(() => {
            dispatch(removeUpload({ id: upload.id }));
            timeouts.delete(upload.id);
          }, 3000); // 3 seconds

          timeouts.set(upload.id, timeoutId);
        }
      }
    });

    // Cleanup function
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [uploads, dispatch]);

  // Don't render if no uploads
  if (uploads.length === 0) {
    return null;
  }

  // Limit displayed uploads to the most recent 5
  const displayedUploads = uploads.slice(-5);
  const hiddenCount = uploads.length - displayedUploads.length;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border border-slate-300 shadow-md rounded-md p-3">
      {hiddenCount > 0 && (
        <div className="mb-2 text-xs text-gray-500 text-center">
          +{hiddenCount} more upload{hiddenCount > 1 ? "s" : ""} in progress
        </div>
      )}
      {displayedUploads.map((upload) => (
        <div key={upload.id} className="mb-2">
          <p className="text-sm font-medium truncate">{upload.fileName}</p>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className={`h-2 rounded ${
                upload.status === "error" ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${upload.progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400">
            {upload.status === "uploading" && (
              <>
                {upload.progress == 100
                  ? "Finalizing..."
                  : `Uploading... ${upload.progress}%`}
              </>
            )}
            {upload.status === "success" && "Completed"}
            {upload.status === "error" && `Error: ${upload.error}`}
          </p>
        </div>
      ))}
    </div>
  );
};

export default UploadTracker;
