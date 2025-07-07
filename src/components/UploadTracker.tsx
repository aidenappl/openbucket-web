import { RootState } from "@/store/store";
import { useSelector } from "react-redux";

const UploadTracker = () => {
  const uploads = useSelector((state: RootState) => state.upload.uploads);

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border shadow-md rounded-md p-3">
      {uploads.map((upload) => (
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
